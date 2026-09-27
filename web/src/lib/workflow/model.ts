import { departmentById, departmentLabel, departmentMark } from "@/lib/data/departments";
import { latestStamp, stampOrder } from "@/lib/format";
import type {
  Approval,
  Application,
  DepartmentTrack,
  RequiredDocument,
  StageDocumentState,
} from "@/lib/types";
import type {
  Eligibility,
  StageDocument,
  WorkflowDependency,
  WorkflowSnapshot,
  WorkflowStage,
  WorkflowWarning,
} from "@/lib/workflow/types";

/**
 * Projects an `Application` into the Phase 3 workflow model.
 *
 * This is the only place that reads the raw record set. The interactive engine
 * and every workflow component work on the projected `WorkflowStage` list, so
 * the projection is also where the edge cases are absorbed: a stage whose
 * department is not in the simulated department set, a dependency id that
 * matches nothing, duplicate stage ordering, and an application with no
 * workflow at all.
 */

/** A stage is decided once it can no longer move on its own. */
const DECIDED_STATES = new Set(["approved", "rejected", "blocked"]);

function isDecided(state: Approval["state"]): boolean {
  return DECIDED_STATES.has(state);
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Maps a stored document requirement onto the three states the workflow shows.
 * A received document is only `verified` once the stage that asked for it has
 * approved; while the stage is open it is still `submitted`. A departmental
 * reference that has not been issued is not an applicant obligation, so it
 * stays `pending` in the words used but never counts against the applicant.
 */
function documentState(
  requirement: RequiredDocument,
  stageState: Approval["state"],
): StageDocumentState {
  if (requirement.state === "waived") return "verified";
  if (requirement.state === "pending") return "pending";
  if (requirement.owedBy !== "applicant") return "submitted";
  return stageState === "approved" ? "verified" : "submitted";
}

/** Documents the applicant must supply before the stage can be decided. */
function isApplicantObligation(document: RequiredDocument): boolean {
  return (
    document.owedBy === "applicant" &&
    document.mandatory &&
    document.state === "pending"
  );
}

function toStageDocuments(
  requirements: RequiredDocument[],
  stageState: Approval["state"],
  stageId: string,
): StageDocument[] {
  return requirements.map((requirement, index) => ({
    id: `${stageId}-doc-${index + 1}`,
    name: requirement.name,
    mandatory: requirement.mandatory,
    owedBy: requirement.owedBy,
    state: documentState(requirement, stageState),
    receivedAt: requirement.receivedAt,
    note:
      requirement.state === "waived"
        ? (requirement.note ?? "Waived for this stage in the demo record.")
        : requirement.note,
  }));
}

function trackFor(
  tracks: DepartmentTrack[],
  approval: Approval,
): DepartmentTrack | undefined {
  return tracks.find(
    (track) =>
      track.approvalId === approval.id || track.departmentId === approval.departmentId,
  );
}

/** Orders by declared `order`, then title, so an unordered record still renders. */
function sortApprovals(approvals: Approval[]): Approval[] {
  return [...approvals].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Checks that need the whole approval list rather than a single stage. The
 * missing-department and unknown-dependency checks run inline while each stage
 * is projected, so only the cross-stage checks live here.
 */
function findWarnings(
  approvals: Approval[],
  stages: WorkflowStage[],
): WorkflowWarning[] {
  const warnings: WorkflowWarning[] = [];
  const seenOrders = new Set<number>();

  for (const approval of approvals) {
    if (seenOrders.has(approval.order)) {
      warnings.push({
        kind: "duplicate-order",
        stageId: approval.id,
        message: `Two stages share order ${approval.order}. Stages are listed in title order after the first duplicate.`,
      });
    }
    seenOrders.add(approval.order);
  }

  if (stages.length === 0) {
    warnings.push({
      kind: "no-stages",
      message:
        "This application has no approval stages recorded, so there is no workflow to resolve.",
    });
  }

  return warnings;
}

/**
 * The stage the applicant should look at: the first open stage, preferring one
 * that is already in flight over one still queued.
 */
function pickInitialStage(stages: WorkflowStage[]): string | null {
  const active = stages.find((stage) => stage.state === "action-required");
  if (active) return active.id;
  const inFlight = stages.find((stage) => stage.state === "under-review");
  if (inFlight) return inFlight.id;
  const open = stages.find((stage) => !isDecided(stage.state));
  return open?.id ?? stages[stages.length - 1]?.id ?? null;
}

/** Builds the serialisable snapshot a server component passes to the client. */
export function buildWorkflowSnapshot(application: Application): WorkflowSnapshot {
  const approvals = sortApprovals(application.approvals);
  const warnings: WorkflowWarning[] = [];

  const stages: WorkflowStage[] = approvals.map((approval) => {
    const department = departmentById(approval.departmentId);
    const track = trackFor(application.tracks, approval);
    const requirements = track?.documents ?? [];
    const documents = toStageDocuments(requirements, approval.state, approval.id);

    const dependencies: WorkflowDependency[] = approval.dependsOn.map((id) => {
      const target = approvals.find((candidate) => candidate.id === id);
      if (!target) {
        warnings.push({
          kind: "unknown-dependency",
          stageId: approval.id,
          message: `Stage ${approval.order} (${approval.title}) depends on "${id}", which is not a stage in this workflow.`,
        });
        return {
          id,
          title: id,
          order: Number.NaN,
          state: "pending" as const,
          resolved: false,
          departmentName: departmentLabel(id),
        };
      }
      return {
        id: target.id,
        title: target.title,
        order: target.order,
        state: target.state,
        resolved: true,
        departmentName: departmentLabel(target.departmentId),
      };
    });

    const outstandingDocuments = requirements
      .filter(isApplicantObligation)
      .map((document) => document.name);

    if (track) {
      // The track and the approval can disagree in a hand-written record. The
      // engine state on the approval wins, so record the drift once.
      if (track.state !== approval.state) {
        warnings.push({
          kind: "state-drift",
          stageId: approval.id,
          message: `Departmental track for ${departmentLabel(approval.departmentId)} reads "${track.state}" while the stage reads "${approval.state}". The stage state is used by the workflow engine.`,
        });
      }
    }

    if (!departmentById(approval.departmentId) && approval.departmentId !== "govsync") {
      warnings.push({
        kind: "missing-department",
        stageId: approval.id,
        message: `Stage ${approval.order} points at department "${approval.departmentId}", which is not in the simulated department set.`,
      });
    }

    return {
      id: approval.id,
      order: approval.order,
      title: approval.title,
      description: approval.description,
      departmentId: approval.departmentId,
      departmentName: departmentLabel(approval.departmentId),
      departmentCode: departmentMark(approval.departmentId),
      departmentKnown: Boolean(department) || approval.departmentId === "govsync",
      state: approval.state,
      completion: approval.completion,
      actor: approval.actor,
      assignee: track?.officer ?? approval.actor,
      startedAt: approval.startedAt,
      completedAt: approval.completedAt,
      slaDays: approval.slaDays,
      dependsOn: approval.dependsOn,
      dependencies,
      documents,
      action: approval.action,
      remark: approval.remark,
      outputArtifacts: approval.outputArtifacts,
      eligibility: {
        canProceed: false,
        reason: "waiting-on-dependency",
        message: "Not evaluated yet.",
        blocking: [],
        failing: [],
        unknown: [],
        outstandingDocuments,
      },
      actionRequired: approval.state === "action-required",
      decided: isDecided(approval.state),
    } satisfies WorkflowStage;
  });

  const resolved = stages.map((stage) => resolveStage(stage, stages));

  const ordered = sortStages(resolved);
  const allWarnings = [
    ...warnings,
    ...findWarnings(approvals, ordered).filter(
      (warning) =>
        !warnings.some(
          (existing) =>
            existing.kind === warning.kind && existing.message === warning.message,
        ),
    ),
  ];
  const stamps = [
    application.submittedAt,
    application.lastUpdated,
    ...application.approvals.map((approval) => approval.completedAt ?? approval.startedAt),
    ...application.activities.map((activity) => activity.at),
  ];

  return {
    applicationId: application.id,
    applicationTitle: application.title,
    clockStart: latestStamp(stamps),
    stages: ordered,
    warnings: allWarnings,
    activities: [...application.activities].sort(
      (a, b) => stampOrder(b.at) - stampOrder(a.at),
    ),
    initialStageId: pickInitialStage(ordered),
  };
}

function sortStages(stages: WorkflowStage[]): WorkflowStage[] {
  return [...stages].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

/**
 * The four workflow rules, resolved for one stage against the current graph.
 *
 *  1. A dependency that is not approved blocks activation.
 *  2. A dependency that is rejected or blocked blocks activation, permanently
 *     for as long as that upstream stage stays in that state.
 *  3. A dependency id with no matching stage blocks activation, because the
 *     engine cannot prove the upstream artefact exists.
 *  4. Applicant work keeps a stage in `action-required`, so a stage with an
 *     outstanding mandatory document cannot be approved.
 */
export function evaluateEligibility(
  stage: WorkflowStage,
  stages: WorkflowStage[],
): Eligibility {
  const blocking: string[] = [];
  const failing: string[] = [];
  const unknown: string[] = [];

  if (stage.state === "approved") {
    return {
      canProceed: false,
      reason: "approved",
      message: "Approved. The result is published to the shared record.",
      blocking: [],
      failing: [],
      unknown: [],
      outstandingDocuments: stage.eligibility.outstandingDocuments,
    };
  }

  for (const dependency of stage.dependencies) {
    if (!dependency.resolved) {
      unknown.push(dependency.id);
      continue;
    }
    // Read the dependency's state from the graph being evaluated, not from the
    // copy captured when the stage was projected, so a transition is visible to
    // every stage that depends on it.
    const live = stages.find((candidate) => candidate.id === dependency.id);
    const dependencyState = live?.state ?? dependency.state;
    if (dependencyState === "approved") continue;
    if (dependencyState === "rejected" || dependencyState === "blocked") {
      failing.push(dependency.id);
      continue;
    }
    blocking.push(dependency.id);
  }

  const outstandingDocuments = stage.documents
    .filter(
      (document) =>
        document.owedBy === "applicant" &&
        document.mandatory &&
        document.state === "pending",
    )
    .map((document) => document.name);

  const titleFor = (id: string) =>
    stages.find((candidate) => candidate.id === id)?.title ?? id;

  if (unknown.length > 0) {
    return {
      canProceed: false,
      reason: "unknown-dependency",
      message: `Waiting on an unrecognised upstream stage (${unknown
        .map(titleFor)
        .join(", ")}). The record must name a real stage before this one can open.`,
      blocking,
      failing,
      unknown,
      outstandingDocuments,
    };
  }

  if (failing.length > 0) {
    return {
      canProceed: false,
      reason: "dependency-held",
      message: `Held: ${failing
        .map(titleFor)
        .join(", ")} ${
        failing.length === 1 ? "is" : "are"
      } not approved, so this stage cannot open.`,
      blocking,
      failing,
      unknown,
      outstandingDocuments,
    };
  }

  if (blocking.length > 0) {
    const names = blocking.map(titleFor);
    return {
      canProceed: false,
      reason: "waiting-on-dependency",
      message: `Waiting for ${names.join(", ")}.`,
      blocking,
      failing,
      unknown,
      outstandingDocuments,
    };
  }

  if (outstandingDocuments.length > 0) {
    return {
      canProceed: false,
      reason: "applicant-action",
      message: `Waiting on the applicant: ${outstandingDocuments.join(", ")}.`,
      blocking,
      failing,
      unknown,
      outstandingDocuments,
    };
  }

  return {
    canProceed: true,
    reason: "eligible",
    message: "Dependency satisfied. This stage can be decided.",
    blocking,
    failing,
    unknown,
    outstandingDocuments,
  };
}

/**
 * Re-resolves one stage against the current graph: refreshes the state shown on
 * each of its dependency chips, re-evaluates eligibility, and recomputes the
 * derived applicant-action flag. Every consumer reads these fields, so running
 * this over the whole list after a transition is enough to keep the
 * visualisation, the summary and the filters consistent with one another.
 */
export function resolveStage(
  stage: WorkflowStage,
  stages: WorkflowStage[],
): WorkflowStage {
  const dependencies = stage.dependencies.map((dependency) => {
    if (!dependency.resolved) return dependency;
    const live = stages.find((candidate) => candidate.id === dependency.id);
    if (!live || live.state === dependency.state) return dependency;
    return { ...dependency, state: live.state };
  });

  const next: WorkflowStage = { ...stage, dependencies };
  const eligibility = evaluateEligibility(next, stages);
  const actionRequired =
    next.state === "action-required" || eligibility.outstandingDocuments.length > 0;

  return {
    ...next,
    eligibility,
    actionRequired,
    decided: ["approved", "rejected", "blocked"].includes(next.state),
  };
}

/** Stable, human-readable id for a generated document requirement. */
export function requirementId(stageId: string, name: string): string {
  return `${stageId}-req-${slug(name)}`;
}
