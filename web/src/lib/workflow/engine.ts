import { addCalendarDays, addMinutes } from "@/lib/format";
import { departmentLabel } from "@/lib/data/departments";
import type { Activity, ApprovalAction, StageDocumentState } from "@/lib/types";
import { resolveStage, requirementId } from "@/lib/workflow/model";
import { summariseWorkflow } from "@/lib/workflow/summary";
import type {
  TransitionNotice,
  WorkflowCommand,
  WorkflowResult,
  WorkflowSnapshot,
  WorkflowStage,
} from "@/lib/workflow/types";

/**
 * The workflow engine.
 *
 * Every command is a pure function of `(snapshot, command)`. Nothing here
 * touches the network, storage or the host clock, so the same command applied
 * to the same record always produces the same stage states, the same
 * timestamps and the same activity wording. The client component holds the
 * result in React state and re-renders; the canonical `Application` records are
 * never mutated.
 *
 * The four rules the engine enforces, in one place:
 *   1. A stage cannot be decided while a dependency is unapproved.
 *   2. Deciding a stage in favour opens the next eligible stage.
 *   3. A rejected or blocked dependency prevents activation downstream.
 *   4. Outstanding applicant work moves a stage to `action-required`.
 */

/** How far the simulation clock moves per command. Fixed, so replays match. */
const CLOCK_STEP_MINUTES = 7;

/** Fixed wording for the document the demo asks for when a stage has none left. */
const DEMO_DOCUMENT = "Corrected drawing set with the access route marked";

const ACTION_DEADLINE_DAYS = 3;

function addDays(stamp: string, days: number): string {
  return addCalendarDays(stamp, days);
}

/** Re-resolves the whole graph so eligibility and dependency chips are fresh. */
function reevaluate(stages: WorkflowStage[]): WorkflowStage[] {
  return stages.map((stage) => resolveStage(stage, stages));
}

/**
 * Rule 2 and rule 3. Walks the stages in order and settles every one of them
 * against the current graph: a stage whose dependencies are all approved and
 * that is not already in flight becomes `under-review`, a stage waiting on a
 * dependency stays `pending`, and a stage whose dependency has been rejected or
 * blocked becomes `blocked`.
 */
function cascade(stages: WorkflowStage[]): WorkflowStage[] {
  const inFlight = stages.some(
    (stage) => stage.state === "under-review" || stage.state === "action-required",
  );

  // Dependency verdicts are read from the list being settled, so approving,
  // blocking or rejecting a stage is visible to everything downstream of it in
  // the same pass.
  const liveState = new Map(stages.map((stage) => [stage.id, stage.state]));

  return stages.map((stage) => {
    // A decided stage is never reopened by the cascade.
    if (stage.state === "approved" || stage.state === "rejected") return stage;
    if (stage.dependencies.length === 0) {
      return stage.state === "pending" && !inFlight
        ? { ...stage, state: "under-review" }
        : stage;
    }

    const failing = stage.dependencies.filter((dependency) => {
      if (!dependency.resolved) return false;
      const state = liveState.get(dependency.id) ?? dependency.state;
      return state === "rejected" || state === "blocked";
    });
    if (failing.length > 0) {
      return stage.state === "blocked" ? stage : { ...stage, state: "blocked" };
    }

    const unresolved = stage.dependencies.filter((dependency) => !dependency.resolved);
    if (unresolved.length > 0) {
      return stage.state === "blocked" ? stage : { ...stage, state: "blocked" };
    }

    const waiting = stage.dependencies.filter((dependency) => {
      if (!dependency.resolved) return false;
      const state = liveState.get(dependency.id) ?? dependency.state;
      return state !== "approved";
    });
    if (waiting.length > 0) {
      return stage.state === "under-review" ? { ...stage, state: "pending" } : stage;
    }

    // All dependencies approved. Open it only if nothing else is in flight, so
    // parallel lanes recorded as already open are left exactly as they are.
    if (stage.state === "pending" && !inFlight) {
      return { ...stage, state: "under-review" };
    }

    return stage;
  });
}

function activity(
  snapshot: WorkflowSnapshot,
  at: string,
  action: string,
  detail: string,
  actor: string,
  actorRole: string,
): Activity {
  return {
    id: `${snapshot.applicationId}-SIM-${at.replace(/\D/g, "")}-${action.length}`,
    at,
    actor,
    actorRole,
    action,
    detail,
  };
}

function notice(
  partial: Omit<TransitionNotice, "id" | "at">,
  clock: string,
): TransitionNotice {
  return { ...partial, id: `TN-${clock.replace(/\D/g, "")}-${partial.kind}`, at: clock };
}

function refuse(
  snapshot: WorkflowSnapshot,
  command: WorkflowCommand,
  title: string,
  detail: string,
  stageIds: string[] = [],
): WorkflowResult {
  const clock = addMinutes(snapshot.clockStart, CLOCK_STEP_MINUTES);
  return {
    stages: snapshot.stages,
    notices: [
      notice(
        { kind: command.kind, tone: "refused", title, detail, stageIds },
        clock,
      ),
    ],
    clock,
  };
}

/** Applies one command and returns the new stage list. Never mutates input. */
export function runCommand(
  snapshot: WorkflowSnapshot,
  command: WorkflowCommand,
): WorkflowResult {
  if (snapshot.stages.length === 0) {
    return {
      stages: snapshot.stages,
      notices: [
        notice(
          {
            kind: command.kind,
            tone: "refused",
            title: "No workflow to act on",
            detail:
              "This application has no approval stages recorded, so there is nothing to transition.",
            stageIds: [],
          },
          snapshot.clockStart,
        ),
      ],
      clock: snapshot.clockStart,
    };
  }

  const clock = addMinutes(snapshot.clockStart, CLOCK_STEP_MINUTES);
  const target = snapshot.stages.find((stage) => stage.id === command.stageId);
  if (!target) {
    return refuse(
      snapshot,
      command,
      "Stage not found",
      `No stage with id "${command.stageId}" exists in this workflow, so nothing was changed.`,
    );
  }

  switch (command.kind) {
    case "approve":
      return approve(snapshot, target, clock);
    case "next":
      return advance(snapshot, target, clock);
    case "request-document":
      return requestDocument(snapshot, target, clock);
    case "block":
      return hold(snapshot, target, clock);
    case "reject":
      return reject(snapshot, target, clock);
    default:
      return refuse(
        snapshot,
        command,
        "Unsupported command",
        "This control is not part of the demo workflow.",
      );
  }
}

function approve(
  snapshot: WorkflowSnapshot,
  target: WorkflowStage,
  clock: string,
): WorkflowResult {
  if (target.state === "approved") {
    return refuse(
      snapshot,
      { kind: "approve", stageId: target.id },
      "Stage already approved",
      `${target.title} is already approved. No further transition is possible on this stage.`,
      [target.id],
    );
  }

  if (!target.eligibility.canProceed) {
    return refuse(
      snapshot,
      { kind: "approve", stageId: target.id },
      "Stage cannot be approved yet",
      target.eligibility.message,
      [target.id],
    );
  }

  const stages = cascade(
    snapshot.stages.map((stage) =>
      stage.id === target.id
        ? {
            ...stage,
            state: "approved" as const,
            completion: 100,
            completedAt: clock,
            action: undefined,
          }
        : stage,
    ),
  );
  const settled = reevaluate(stages);

  const opened = settled.find(
    (stage) =>
      stage.state === "under-review" &&
      stage.id !== target.id &&
      snapshot.stages.find((candidate) => candidate.id === stage.id)?.state ===
        "pending",
  );

  const summary = summariseWorkflow(settled);
  const entry = activity(
    snapshot,
    clock,
    `${target.title} approved`,
    `${departmentLabel(target.departmentId)} approved stage ${target.order} of ${snapshot.applicationId}.${
      opened
        ? ` ${opened.title} opened automatically because its dependencies are satisfied.`
        : ` ${summary.currentStageTitle} is the stage now in progress.`
    } Artefacts published: ${target.outputArtifacts.join(", ") || "none recorded"}.`,
    departmentLabel(target.departmentId),
    "Department",
  );

  return {
    stages: settled,
    clock,
    notices: [
      notice(
        {
          kind: "approve",
          tone: "applied",
          title: `${target.title} approved`,
          detail: opened
            ? `Approved, and ${opened.title} moved to Under Review.`
            : `Approved. ${summary.nextStageTitle} is the next stage in the chain.`,
          stageIds: opened ? [target.id, opened.id] : [target.id],
          activity: entry,
        },
        clock,
      ),
    ],
  };
}

function advance(
  snapshot: WorkflowSnapshot,
  target: WorkflowStage,
  clock: string,
): WorkflowResult {
  if (target.state === "approved") {
    const next = snapshot.stages
      .filter((stage) => stage.order > target.order && stage.state === "pending")
      .sort((a, b) => a.order - b.order)[0];

    if (!next) {
      return refuse(
        snapshot,
        { kind: "next", stageId: target.id },
        "No later stage to open",
        `${target.title} is approved and every later stage is already decided.`,
        [target.id],
      );
    }

    const stages = reevaluate(
      cascade(
        snapshot.stages.map((stage) =>
          stage.id === next.id ? { ...stage, state: "under-review" as const } : stage,
        ),
      ),
    );

    return {
      stages,
      clock,
      notices: [
        notice(
          {
            kind: "next",
            tone: "applied",
            title: `${next.title} moved to Under Review`,
            detail: `Handed over from ${target.title}. ${next.eligibility.message}`,
            stageIds: [target.id, next.id],
            activity: activity(
              snapshot,
              clock,
              `${next.title} opened`,
              `Workflow hand-off from ${target.title}. ${next.eligibility.message}`,
              "GovSync",
              "Platform",
            ),
          },
          clock,
        ),
      ],
    };
  }

  if (!target.eligibility.canProceed) {
    return refuse(
      snapshot,
      { kind: "next", stageId: target.id },
      "Hand-over blocked",
      target.eligibility.message,
      [target.id],
    );
  }

  if (target.state === "under-review") {
    return approve(snapshot, target, clock);
  }

  return refuse(
    snapshot,
    { kind: "next", stageId: target.id },
    "Stage is not in review",
    `${target.title} is ${target.state.replace("-", " ")}. Use Approve Current Step to record a decision on it.`,
    [target.id],
  );
}

/** Rule 4: outstanding applicant work moves the stage to `action-required`. */
function requestDocument(
  snapshot: WorkflowSnapshot,
  target: WorkflowStage,
  clock: string,
): WorkflowResult {
  if (target.state === "approved") {
    return refuse(
      snapshot,
      { kind: "request-document", stageId: target.id },
      "Stage already closed",
      `${target.title} is approved, so no further document can be requested on it.`,
      [target.id],
    );
  }

  const openIndex = target.documents.findIndex(
    (document) =>
      document.owedBy === "applicant" &&
      document.mandatory &&
      document.state === "pending",
  );

  const requested =
    openIndex === -1 ? DEMO_DOCUMENT : (target.documents[openIndex]?.name ?? DEMO_DOCUMENT);

  const documents =
    openIndex === -1
      ? [
          ...target.documents,
          {
            id: requirementId(target.id, DEMO_DOCUMENT),
            name: DEMO_DOCUMENT,
            mandatory: true,
            owedBy: "applicant" as const,
            state: "pending" as StageDocumentState,
            note: `Requested by the demo on ${clock.split(", ")[1] ?? clock}. No upload is possible in this prototype.`,
          },
        ]
      : target.documents.map((document, index) =>
          index === openIndex ? { ...document, state: "pending" as StageDocumentState } : document,
        );

  const action: ApprovalAction = {
    item: `Provide ${requested.charAt(0).toLowerCase()}${requested.slice(1)}`,
    departmentId: target.departmentId,
    requestedAt: clock,
    deadline: addDays(clock, ACTION_DEADLINE_DAYS),
    note: "Demo request. The applicant cannot upload anything in this prototype.",
  };

  const stages = cascade(
    snapshot.stages.map((stage) =>
      stage.id === target.id
        ? { ...stage, state: "action-required" as const, documents, action }
        : stage,
    ),
  );
  const settled = reevaluate(stages);
  const held = settled.filter(
    (stage) => stage.state === "blocked" && stage.id !== target.id,
  );

  return {
    stages: settled,
    clock,
    notices: [
      notice(
        {
          kind: "request-document",
          tone: "applied",
          title: `Document requested on ${target.title}`,
          detail: `${requested} is now outstanding. The stage is Action Required until the applicant responds${
            held.length > 0
              ? `, and ${held.map((stage) => stage.title).join(", ")} ${
                  held.length === 1 ? "is" : "are"
                } held behind it.`
              : "."
          }`,
          stageIds: [target.id, ...held.map((stage) => stage.id)],
          activity: activity(
            snapshot,
            clock,
            "Document requested from applicant",
            `${departmentLabel(target.departmentId)} asked the applicant for ${requested}. Demo deadline ${action.deadline}.`,
            departmentLabel(target.departmentId),
            "Department",
          ),
        },
        clock,
      ),
    ],
  };
}

function hold(
  snapshot: WorkflowSnapshot,
  target: WorkflowStage,
  clock: string,
): WorkflowResult {
  if (target.state === "blocked") {
    return refuse(
      snapshot,
      { kind: "block", stageId: target.id },
      "Stage already blocked",
      `${target.title} is already blocked. Reset the demo to return it to review.`,
      [target.id],
    );
  }

  if (target.state === "approved") {
    return refuse(
      snapshot,
      { kind: "block", stageId: target.id },
      "Stage already approved",
      `${target.title} is approved and cannot be blocked.`,
      [target.id],
    );
  }

  const stages = cascade(
    snapshot.stages.map((stage) =>
      stage.id === target.id ? { ...stage, state: "blocked" as const } : stage,
    ),
  );
  const settled = reevaluate(stages);
  const held = settled.filter(
    (stage) => stage.state === "blocked" && stage.id !== target.id,
  );

  return {
    stages: settled,
    clock,
    notices: [
      notice(
        {
          kind: "block",
          tone: "applied",
          title: `${target.title} blocked`,
          detail: `Held by workflow policy.${
            held.length > 0
              ? ` ${held.map((stage) => stage.title).join(", ")} cannot open until this stage clears.`
              : " No downstream stage depends on it."
          }`,
          stageIds: [target.id, ...held.map((stage) => stage.id)],
          activity: activity(
            snapshot,
            clock,
            "Stage blocked by policy",
            `${target.title} was held. ${
              held.length > 0
                ? `${held.map((stage) => stage.title).join(", ")} remain blocked behind it.`
                : "No downstream stage depends on it."
            }`,
            "GovSync",
            "Platform",
          ),
        },
        clock,
      ),
    ],
  };
}

function reject(
  snapshot: WorkflowSnapshot,
  target: WorkflowStage,
  clock: string,
): WorkflowResult {
  if (target.state === "rejected") {
    return refuse(
      snapshot,
      { kind: "reject", stageId: target.id },
      "Stage already rejected",
      `${target.title} has already been decided against.`,
      [target.id],
    );
  }

  if (target.state === "approved") {
    return refuse(
      snapshot,
      { kind: "reject", stageId: target.id },
      "Stage already approved",
      `${target.title} is approved. A decision cannot be reversed in this prototype.`,
      [target.id],
    );
  }

  const stages = cascade(
    snapshot.stages.map((stage) =>
      stage.id === target.id ? { ...stage, state: "rejected" as const } : stage,
    ),
  );
  const settled = reevaluate(stages);
  const held = settled.filter(
    (stage) => stage.state === "blocked" && stage.id !== target.id,
  );

  return {
    stages: settled,
    clock,
    notices: [
      notice(
        {
          kind: "reject",
          tone: "applied",
          title: `${target.title} rejected`,
          detail: `Decided against in the demo. ${
            held.length > 0
              ? `${held.map((stage) => stage.title).join(", ")} ${
                  held.length === 1 ? "is" : "are"
                } blocked and cannot open until a correction is filed.`
              : "No downstream stage depends on it."
          }`,
          stageIds: [target.id, ...held.map((stage) => stage.id)],
          activity: activity(
            snapshot,
            clock,
            "Stage rejected",
            `${target.title} was decided against. A correction would be requested rather than the application being closed in a live deployment.`,
            departmentLabel(target.departmentId),
            "Department",
          ),
        },
        clock,
      ),
    ],
  };
}

/** Human sentence for a dependency chip. */
export function dependencySentence(
  stage: WorkflowStage,
  id: string,
): string {
  const dependency = stage.dependencies.find((candidate) => candidate.id === id);
  if (!dependency) return `Unrecognised stage ${id}`;
  if (!dependency.resolved) {
    return `Waiting for an unrecognised stage recorded as ${id}`;
  }
  if (dependency.state === "approved") return "Dependency satisfied";
  if (dependency.state === "rejected") return `${dependency.title} was rejected`;
  if (dependency.state === "blocked") return `${dependency.title} is blocked`;
  return `Waiting for ${dependency.title}`;
}

/** The stage that follows the selected one, for the detail panel's next step. */
export function nextStageOf(
  stages: WorkflowStage[],
  stageId: string,
): WorkflowStage | null {
  const current = stages.find((stage) => stage.id === stageId);
  if (!current) return null;
  return (
    stages
      .filter((stage) => stage.order > current.order)
      .sort((a, b) => a.order - b.order)[0] ?? null
  );
}
