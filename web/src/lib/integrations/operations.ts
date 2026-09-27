/**
 * GOVSYNC OPERATIONS.
 *
 * The verbs the platform exposes. Each one validates, authorises, calls through
 * the integration layer and returns a normalised envelope. This is the only
 * module the route handlers talk to, and it is the only module that knows how a
 * departmental answer is turned into workflow state.
 *
 * Authority model, stated once so the demo is not misleading:
 *
 *   - The Phase 3 engine owns the workflow graph during a session.
 *   - A department owns the status of its own case.
 *   - A decision is applied locally first, then published. If the publish
 *     fails, the local state is preserved, the decision is queued for retry and
 *     sync reports the stage as still pending publication.
 *   - A sync therefore flushes the outbox, re-reads every connector, and adopts
 *     any departmental state it does not already have an explanation for.
 */

import { applicationById } from "@/lib/data/applications";
import { departmentById } from "@/lib/data/departments";
import {
  allConnectors,
  connectedConnectorIds,
  connectorFor,
  descriptorFor,
} from "@/lib/integrations/departments/registry";
import {
  callDepartment,
  callPlatform,
  MAX_ATTEMPTS,
  principalFor,
  securityControls,
} from "@/lib/integrations/service";
import { integrationStore } from "@/lib/integrations/store";
import {
  departmentalise,
  isSuccess,
  makeFault,
  normaliseStatus,
  type ApplicationSyncResult,
  type ConnectorHealth,
  type ConnectorHealthState,
  type DepartmentApplicationStatus,
  type DepartmentStatusReport,
  type FailurePlan,
  type GovSyncResult,
  type IntegrationErrorCode,
  type IntegrationEvent,
  type IntegrationFault,
  type IntegrationHop,
  type IntegrationMetrics,
  type IntegrationOperation,
  type IntegrationPrincipal,
  type IntegrationRole,
  type IntegrationStatusUpdate,
  type InjectedFailureMode,
  type StageDivergence,
  type WorkflowStageState,
  type WorkflowState,
  isGateGranted,
} from "@/lib/integrations/types";
import { applyAuthoritativeStates } from "@/lib/workflow/engine";
import { buildWorkflowSnapshot } from "@/lib/workflow/model";
import type { WorkflowStage } from "@/lib/workflow/types";
import type { Application } from "@/lib/types";

export interface DepartmentListing {
  departmentId: string;
  name: string;
  shortName: string;
  slug: string;
  systemName: string;
  baseUrl: string;
  apiVersion: string;
  operations: string[];
  disclaimer: string;
  health: ConnectorHealth;
  connected: boolean;
}

export interface ApplicationReadout {
  applicationId: string;
  title: string;
  service: string;
  applicantKind: string;
  state: string;
  submittedAt: string;
  unifiedState: WorkflowState;
  unifiedMessage: string;
  stages: {
    stageId: string;
    order: number;
    title: string;
    departmentId: string;
    departmentName: string;
    state: WorkflowState;
    dependsOn: string[];
    documents: { name: string; owedBy: string; state: string }[];
  }[];
  /** Stages on this application that have no connector in this phase. */
  unconnectedStages: { stageId: string; title: string; departmentId: string }[];
}

export interface IntegrationTrace {
  requestId: string;
  at: string;
  operation: string;
  success: boolean;
  hops: IntegrationHop[];
}

export interface IntegrationLogReadout {
  metrics: IntegrationMetrics;
  health: ConnectorHealth[];
  events: IntegrationEvent[];
  traces: IntegrationTrace[];
  audit: {
    id: string;
    at: string;
    requestId: string;
    principal: string;
    operation: string;
    outcome: string;
    detail: string;
  }[];
  failurePlans: FailurePlan[];
  maxAttempts: number;
  securityControls: { name: string; status: string; detail: string }[];
}

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                              */
/* -------------------------------------------------------------------------- */

function failure<TData>(
  requestId: string,
  operation: IntegrationOperation,
  error: IntegrationFault,
  applicationId: string | null = null,
): GovSyncResult<TData> {
  return {
    success: false,
    requestId,
    applicationId,
    department: null,
    operation,
    error,
    timestamp: integrationStore().now(),
    source: "GOVSYNC_INTEGRATION_LAYER",
    events: [],
    trace: [],
    attempts: 0,
  };
}

function unknownApplication(requestId: string, operation: IntegrationOperation, id: string) {
  return failure<never>(
    requestId,
    operation,
    makeFault("UNKNOWN_APPLICATION", `No application with reference ${id} exists.`),
    id,
  );
}

/**
 * GovSync's own reading of a whole chain, derived from stage states rather than
 * from any single department. The Phase 3 engine stays the only place workflow
 * rules live; this only summarises what the engine has already settled.
 */
function unifiedFrom(stages: WorkflowStage[]): { state: WorkflowState; message: string } {
  if (stages.length === 0) {
    return { state: "pending", message: "No workflow is recorded for this application." };
  }
  if (stages.every((stage) => stage.state === "approved")) {
    return {
      state: "approved",
      message: `All ${stages.length} departments have approved this application.`,
    };
  }
  const action = stages.find((stage) => stage.state === "action-required");
  if (action) {
    return {
      state: "action-required",
      message: `${action.title} cannot move on: it is waiting on the applicant.`,
    };
  }
  const rejected = stages.find((stage) => stage.state === "rejected");
  if (rejected) {
    return {
      state: "rejected",
      message: `${rejected.departmentName} rejected ${rejected.title}.`,
    };
  }
  const blocked = stages.find((stage) => stage.state === "blocked");
  if (blocked) {
    return {
      state: "blocked",
      message: `${blocked.departmentName} has held ${blocked.title} pending another check.`,
    };
  }
  const inReview = stages.find((stage) => stage.state === "under-review");
  if (inReview) {
    return {
      state: "under-review",
      message: `${inReview.departmentName} is reviewing ${inReview.title}.`,
    };
  }
  const queued = stages.filter((stage) => stage.state === "pending").length;
  return {
    state: "pending",
    message: `${queued} stage${queued === 1 ? "" : "s"} waiting for a dependency to clear.`,
  };
}

function unifiedFor(application: Application): { state: WorkflowState; message: string } {
  return unifiedFrom(buildWorkflowSnapshot(application).stages);
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export function readDepartments(role: IntegrationRole): GovSyncResult<DepartmentListing[]> {
  const principal = principalFor(role);
  const gate = callPlatform({ operation: "LIST_DEPARTMENTS", principal });
  if (!isGateGranted(gate)) return gate;

  const store = integrationStore();
  const listings: DepartmentListing[] = connectedConnectorIds.flatMap((departmentId) => {
    const descriptor = descriptorFor(departmentId);
    if (!descriptor) return [];
    const profile = connectorFor(departmentId)?.getDepartment().data ?? null;
    return [
      {
        departmentId,
        name: descriptor.departmentName,
        shortName: descriptor.shortName,
        slug: descriptor.slug,
        systemName: descriptor.systemName,
        baseUrl: descriptor.baseUrl,
        apiVersion: descriptor.apiVersion,
        operations: profile?.operations ?? [],
        disclaimer: profile?.disclaimer ?? "Simulated service.",
        health: store.health(departmentId),
        connected: true,
      },
    ];
  });

  return { ...gate, data: listings };
}

export function readApplication(
  applicationId: string,
  role: IntegrationRole,
): GovSyncResult<ApplicationReadout> {
  const principal = principalFor(role);
  const gate = callPlatform({ operation: "READ_APPLICATION", principal, applicationId });
  if (!isGateGranted(gate)) return gate;

  const application = applicationById(applicationId);
  if (!application) return unknownApplication(gate.requestId, "READ_APPLICATION", applicationId);

  const snapshot = buildWorkflowSnapshot(application);
  const unified = unifiedFrom(snapshot.stages);

  const readout: ApplicationReadout = {
    applicationId: application.id,
    title: application.title,
    service: application.service,
    applicantKind: application.applicantKind,
    state: application.state,
    submittedAt: application.submittedAt,
    unifiedState: unified.state,
    unifiedMessage: unified.message,
    stages: snapshot.stages.map((stage) => ({
      stageId: stage.id,
      order: stage.order,
      title: stage.title,
      departmentId: stage.departmentId,
      departmentName: stage.departmentName,
      state: stage.state,
      dependsOn: stage.dependsOn,
      documents: stage.documents.map((document) => ({
        name: document.name,
        owedBy: document.owedBy,
        state: document.state,
      })),
    })),
    unconnectedStages: snapshot.stages
      .filter((stage) => !connectorFor(stage.departmentId))
      .map((stage) => ({
        stageId: stage.id,
        title: stage.title,
        departmentId: stage.departmentId,
      })),
  };

  return { ...gate, data: readout, status: unified.state };
}

/**
 * Every departmental answer for one application, read back through each
 * connector rather than from the record set.
 */
export function readApprovals(
  applicationId: string,
  role: IntegrationRole,
): GovSyncResult<DepartmentStatusReport[]> {
  const principal = principalFor(role);
  const gate = callPlatform({
    operation: "LIST_APPLICATION_APPROVALS",
    principal,
    applicationId,
  });
  if (!isGateGranted(gate)) return gate;

  const application = applicationById(applicationId);
  if (!application) {
    return unknownApplication(gate.requestId, "LIST_APPLICATION_APPROVALS", applicationId);
  }

  const reports = application.approvals.map((approval) =>
    readOne(principal, application, approval.id, approval.departmentId, approval.title, approval.order),
  );
  const involved = new Set(reports.map((report) => report.requestId));
  const unified = unifiedFor(application);

  return {
    ...gate,
    data: reports,
    status: unified.state,
    events: integrationStore()
      .events(applicationId, 60)
      .filter((event) => involved.has(event.requestId)),
  };
}

function readOne(
  principal: IntegrationPrincipal,
  application: Application,
  stageId: string,
  departmentId: string,
  stageTitle: string,
  stageOrder: number,
): DepartmentStatusReport {
  const record = departmentById(departmentId);
  const departmentName = record?.shortName ?? departmentId;
  const base = {
    departmentId,
    departmentName,
    systemName: record?.systemName ?? "not connected",
    stageId,
    stageTitle,
    stageOrder,
  };

  if (!connectorFor(departmentId)) {
    return {
      ...base,
      departmentStatus: null,
      normalisedState: null,
      outcome: "not-connected",
      requestId: "n/a",
      attempts: 0,
      updatedAt: null,
      reference: null,
      message: `No connector is configured for ${departmentName} in this phase, so GovSync is reading the recorded state only.`,
      error: null,
    };
  }

  const result = callDepartment<DepartmentApplicationStatus>({
    operation: "GET_APPLICATION_STATUS",
    principal,
    applicationId: application.id,
    departmentId,
    payload: { stageId },
  });

  if (!isSuccess(result)) {
    return {
      ...base,
      departmentStatus: null,
      normalisedState: null,
      outcome: "failed",
      requestId: result.requestId,
      attempts: result.attempts,
      updatedAt: null,
      reference: null,
      message: result.error.message,
      error: result.error,
    };
  }

  const data = result.data;
  // Stage, not department. An application can hold two Revenue stages, and one
  // of them owing a write must not make the other look unsynchronised.
  const queued = integrationStore()
    .pendingPublishes(application.id)
    .find((publish) => publish.stageId === stageId);

  return {
    ...base,
    departmentStatus: data.status,
    normalisedState: normaliseStatus(data.status),
    outcome: queued ? "pending-publish" : "synchronized",
    requestId: result.requestId,
    attempts: result.attempts,
    updatedAt: data.updatedAt,
    reference: data.reference,
    message: queued
      ? `${departmentName} answered, but a decision is still queued for delivery.`
      : data.remarks,
    error: null,
  };
}

/**
 * One stage, as one department states it. This is the endpoint a departmental
 * client would call to check a single case.
 */
export function readDepartmentStatus(
  applicationId: string,
  departmentId: string,
  role: IntegrationRole,
): GovSyncResult<DepartmentStatusReport> {
  const principal = principalFor(role);
  const gate = callPlatform({
    operation: "LIST_APPLICATION_APPROVALS",
    principal,
    applicationId,
  });
  if (!isGateGranted(gate)) return gate;

  const application = applicationById(applicationId);
  if (!application) {
    return unknownApplication(gate.requestId, "LIST_APPLICATION_APPROVALS", applicationId);
  }

  const approval = application.approvals.find(
    (candidate) => candidate.departmentId === departmentId,
  );
  if (!approval) {
    return failure<DepartmentStatusReport>(
      gate.requestId,
      "LIST_APPLICATION_APPROVALS",
      makeFault(
        "UNKNOWN_DEPARTMENT",
        `${departmentId} is not a stage on application ${applicationId}.`,
        `Stages on this application: ${application.approvals
          .map((candidate) => candidate.departmentId)
          .join(", ")}.`,
      ),
      applicationId,
    );
  }

  const report = readOne(
    principal,
    application,
    approval.id,
    approval.departmentId,
    approval.title,
    approval.order,
  );
  const unified = unifiedFor(application);

  return {
    ...gate,
    data: report,
    status: report.normalisedState ?? unified.state,
    events: integrationStore()
      .events(applicationId, 30)
      .filter((event) => event.requestId === report.requestId),
  };
}

/* -------------------------------------------------------------------------- */
/* Publishing a decision                                                       */
/* -------------------------------------------------------------------------- */

/** Failures a later attempt could plausibly fix. Anything else is a decision the
 *  department will never accept, so queueing it would only grow the outbox. */
const RETRYABLE_FAILURES: ReadonlySet<IntegrationErrorCode> = new Set<IntegrationErrorCode>([
  "DEPARTMENT_UNAVAILABLE",
  "DEPARTMENT_TIMEOUT",
  "MALFORMED_RESPONSE",
  "INTERNAL_ERROR",
]);

export interface PublishOutcome {
  stageId: string;
  departmentId: string;
  departmentName: string;
  delivered: boolean;
  requestId: string;
  attempts: number;
  departmentStatus: string | null;
  message: string;
  error: IntegrationFault | null;
  queued: boolean;
}

/**
 * Pushes one workflow decision into a department. On failure the local workflow
 * is left alone and the decision is queued, so nothing is lost and the next sync
 * can deliver it.
 */
export function publishDecision(
  input: IntegrationStatusUpdate,
  role: IntegrationRole,
): GovSyncResult<PublishOutcome> {
  const principal = principalFor(role);
  const record = departmentById(input.departmentId);
  const departmentName = record?.shortName ?? input.departmentId;

  const application = applicationById(input.applicationId);
  const requestId = integrationStore().nextId("req");
  if (!application) {
    return unknownApplication(requestId, "UPDATE_APPLICATION_STATUS", input.applicationId);
  }
  const approval = application.approvals.find(
    (candidate) => candidate.id === input.stageId && candidate.departmentId === input.departmentId,
  );
  if (!approval) {
    return failure<PublishOutcome>(
      requestId,
      "UPDATE_APPLICATION_STATUS",
      makeFault(
        "INVALID_REQUEST",
        `Stage "${input.stageId}" is not a ${departmentName} stage on ${input.applicationId}.`,
        `Stages on this application: ${application.approvals
          .map((candidate) => `${candidate.id} (${candidate.departmentId})`)
          .join(", ")}.`,
      ),
      input.applicationId,
    );
  }

  const result = callDepartment<DepartmentApplicationStatus>({
    operation: "UPDATE_APPLICATION_STATUS",
    principal,
    applicationId: input.applicationId,
    departmentId: input.departmentId,
    payload: {
      stageId: input.stageId,
      status: input.status,
      reason: input.reason,
      decidedBy: input.decidedBy,
      recordedAt: input.recordedAt,
    },
  });

  const store = integrationStore();

  if (!isSuccess(result)) {
    // A fault worth retrying later is queued so the decision is not lost. A
    // caller who is not allowed to make it, or who sent nonsense, is neither
    // queued nor silently dropped: the fault is returned and the decision stays
    // where the reviewer put it.
    if (RETRYABLE_FAILURES.has(result.error.code)) {
      store.enqueuePublish({
        id: store.nextId("q"),
        applicationId: input.applicationId,
        departmentId: input.departmentId,
        stageId: input.stageId,
        status: input.status,
        reason: input.reason,
        decidedBy: input.decidedBy,
        queuedAt: result.timestamp,
        attempts: result.attempts,
        lastError: result.error.code,
      });
    }
  } else {
    // The department has it now, so any earlier refusal for the same stage is
    // settled. Leaving it would double-deliver on the next sync and misreport
    // the decision as still queued.
    store.clearPublishesForStage(input.applicationId, input.stageId);
  }

  const queued = store
    .pendingPublishes(input.applicationId)
    .some(
      (publish) =>
        publish.departmentId === input.departmentId && publish.stageId === input.stageId,
    );

  const outcome: PublishOutcome = {
    stageId: input.stageId,
    departmentId: input.departmentId,
    departmentName,
    delivered: isSuccess(result),
    requestId: result.requestId,
    attempts: result.attempts,
    departmentStatus: isSuccess(result) ? result.data.status : null,
    message: isSuccess(result)
      ? `${departmentName} recorded ${result.data.status} at ${result.timestamp}.`
      : `${result.error.message} The workflow state is preserved and the decision is queued for the next synchronisation.`,
    error: isSuccess(result) ? null : result.error,
    queued,
  };

  const envelope = isSuccess(result)
    ? {
        ...result,
        data: outcome,
        status: result.status,
      }
    : { ...result, queued };

  return envelope;
}

/* -------------------------------------------------------------------------- */
/* Synchronisation                                                             */
/* -------------------------------------------------------------------------- */

export function syncApplication(
  applicationId: string,
  role: IntegrationRole,
): GovSyncResult<ApplicationSyncResult> {
  const principal = principalFor(role);
  const requestedAt = integrationStore().now();
  const gate = callPlatform({ operation: "SYNC_APPLICATION", principal, applicationId });
  if (!isGateGranted(gate)) return gate;

  const application = applicationById(applicationId);
  if (!application) return unknownApplication(gate.requestId, "SYNC_APPLICATION", applicationId);

  const store = integrationStore();
  const events: IntegrationEvent[] = [];
  const trace: IntegrationHop[] = [];
  let hopIndex = 0;

  const absorb = (hops: IntegrationHop[], departmentId: string) => {
    const name = departmentById(departmentId)?.shortName ?? departmentId;
    for (const hop of hops) {
      hopIndex += 1;
      trace.push({ ...hop, index: hopIndex, detail: `${name}: ${hop.detail}` });
    }
  };

  for (const hop of gate.trace) {
    hopIndex += 1;
    trace.push({ ...hop, index: hopIndex });
  }

  // Step 1: deliver anything still owed, so a read cannot race a queued write.
  for (const queued of store.pendingPublishes(applicationId)) {
    const delivery = publishDecision(
      {
        applicationId: queued.applicationId,
        departmentId: queued.departmentId,
        stageId: queued.stageId,
        status: queued.status,
        reason: queued.reason,
        decidedBy: queued.decidedBy,
        recordedAt: queued.queuedAt,
      },
      role,
    );
    absorb(delivery.trace, queued.departmentId);
    if (delivery.success) store.removePublish(queued.id);
  }

  // Step 2: re-read every connector.
  const reports = application.approvals.map((approval) =>
    readOne(
      principal,
      application,
      approval.id,
      approval.departmentId,
      approval.title,
      approval.order,
    ),
  );
  for (const report of reports) {
    absorb(store.trace(report.requestId), report.departmentId);
  }

  // Step 3: collect the events belonging to the calls this sync made.
  const involved = new Set(reports.map((report) => report.requestId));
  events.push(
    ...store.events(applicationId, 60).filter((event) => involved.has(event.requestId)),
  );

  // Step 4: adopt departmental truth, except where GovSync still owes a write.
  // Both the queue check and the record below are keyed by stage, so two stages
  // in one department reconcile independently.
  const owed = new Set(store.pendingPublishes(applicationId).map((entry) => entry.stageId));
  const authoritative: Record<string, WorkflowState> = {};
  const diverged: StageDivergence[] = [];

  for (const report of reports) {
    if (!report.normalisedState || !report.stageId) continue;
    if (owed.has(report.stageId)) continue;
    const approval = application.approvals.find((candidate) => candidate.id === report.stageId);
    if (!approval) continue;
    if (departmentalise(approval.state) !== report.departmentStatus) {
      diverged.push({
        stageId: report.stageId,
        stageTitle: report.stageTitle,
        departmentId: report.departmentId,
        departmentName: departmentById(report.departmentId)?.shortName ?? report.departmentId,
        recordedStatus: approval.state,
        departmentStatus: report.departmentStatus ?? "unknown",
        normalisedState: report.normalisedState,
      });
    }
    authoritative[report.stageId] = report.normalisedState;
  }

  // Step 5: settle the graph with the Phase 3 engine, then summarise.
  const snapshot = buildWorkflowSnapshot(application);
  const completedAt = store.now();
  const reconciled = applyAuthoritativeStates(snapshot, authoritative, completedAt);
  const unified = unifiedFrom(reconciled.stages);
  const pendingPublishes = store.pendingPublishes(applicationId);
  store.noteSync(applicationId);

  // Hand the client the reconciled graph so it can adopt departmental truth
  // instead of only being told that a disagreement exists.
  const stages: WorkflowStageState[] = reconciled.stages.map((stage) => ({
    id: stage.id,
    departmentId: stage.departmentId,
    title: stage.title,
    order: stage.order,
    state: stage.state,
    authoritative: stage.id in authoritative,
  }));

  const data: ApplicationSyncResult = {
    applicationId,
    requestedAt,
    completedAt,
    requestId: gate.requestId,
    departments: reports,
    unifiedState: unified.state,
    unifiedMessage: unified.message,
    pendingPublishes: pendingPublishes.length,
    diverged,
    stages,
    events: events.sort((a, b) => a.seq - b.seq),
    trace,
  };

  return { ...gate, data, status: unified.state, timestamp: completedAt, trace };
}

/* -------------------------------------------------------------------------- */
/* Reset                                                                       */
/* -------------------------------------------------------------------------- */

export interface ResetOutcome {
  applicationId: string;
  clearedPublishes: number;
  clearedConnectorState: number;
  message: string;
}

export function resetDepartmentState(
  applicationId: string,
  role: IntegrationRole,
): GovSyncResult<ResetOutcome> {
  const principal = principalFor(role);
  const gate = callPlatform({
    operation: "RESET_DEPARTMENT_STATE",
    principal,
    applicationId,
  });
  if (!isGateGranted(gate)) return gate;

  const application = applicationById(applicationId);
  if (!application) {
    return unknownApplication(gate.requestId, "RESET_DEPARTMENT_STATE", applicationId);
  }

  const store = integrationStore();
  const clearedPublishes = store.clearPublishes(applicationId);
  const held = store.connectorStatesFor(applicationId).length;
  store.dropApplication(applicationId);

  const data: ResetOutcome = {
    applicationId,
    clearedPublishes,
    clearedConnectorState: held,
    message: `Reset complete. ${clearedPublishes} queued decision${
      clearedPublishes === 1 ? "" : "s"
    } discarded and ${held} departmental record${held === 1 ? "" : "s"} returned to the frozen dataset.`,
  };

  return { ...gate, data };
}

/* -------------------------------------------------------------------------- */
/* Monitoring                                                                  */
/* -------------------------------------------------------------------------- */

function metricsFor(): IntegrationMetrics {
  const store = integrationStore();
  const totals = store.metricsTotals();
  return {
    windowLabel: "This server session",
    totalRequests: totals.totalRequests,
    successful: totals.successful,
    failed: totals.failed,
    timeouts: totals.timeouts,
    validationErrors: totals.validationErrors,
    retriedRequests: totals.retriedRequests,
    activeIntegrations: totals.activeIntegrations,
    lastSyncAt: totals.lastSyncAt,
    lastSyncApplicationId: totals.lastSyncApplicationId,
    pendingPublishes: totals.pendingPublishes,
    byDepartment: connectedConnectorIds.map((id) => store.metricsRow(id)),
    recentEvents: store.events(undefined, 25),
    health: store.healthFor(connectedConnectorIds),
  };
}

export function readHealth(role: IntegrationRole): GovSyncResult<IntegrationMetrics> {
  const principal = principalFor(role);
  const gate = callPlatform({ operation: "READ_HEALTH", principal });
  if (!isGateGranted(gate)) return gate;

  const data = metricsFor();
  const state: ConnectorHealthState = data.health.some(
    (entry) => entry.state === "unavailable",
  )
    ? "unavailable"
    : data.health.some((entry) => entry.state === "degraded")
      ? "degraded"
      : "connected";

  return { ...gate, data, status: state };
}

export function readIntegrationLog(
  role: IntegrationRole,
  applicationId?: string,
): GovSyncResult<IntegrationLogReadout> {
  const principal = principalFor(role);
  const gate = callPlatform({
    operation: "READ_INTEGRATION_LOG",
    principal,
    applicationId: applicationId ?? null,
  });
  if (!isGateGranted(gate)) return gate;

  const store = integrationStore();
  const data: IntegrationLogReadout = {
    metrics: metricsFor(),
    health: store.healthFor(connectedConnectorIds),
    events: store.events(applicationId, 40),
    traces: store.notableTraces(10, 5).map((record) => ({
      requestId: record.requestId,
      at: record.at,
      operation: record.operation,
      success: record.success,
      hops: record.hops,
    })),
    audit: store.auditLog(30).map((entry) => ({
      id: entry.id,
      at: entry.at,
      requestId: entry.requestId,
      principal: entry.principal,
      operation: entry.operation,
      outcome: entry.outcome,
      detail: entry.detail,
    })),
    failurePlans: store.failurePlans(),
    maxAttempts: MAX_ATTEMPTS,
    securityControls: securityControls.map((control) => ({ ...control })),
  };

  return { ...gate, data };
}

/* -------------------------------------------------------------------------- */
/* Controlled failure planning                                                 */
/* -------------------------------------------------------------------------- */

export interface FailurePlanRequest {
  departmentId: string;
  mode: InjectedFailureMode;
  calls: number;
}

export interface FailurePlanOutcome {
  plans: FailurePlan[];
  message: string;
  health: ConnectorHealth[];
}

const MODE_NOTES: Record<InjectedFailureMode, string> = {
  unavailable: "Service unavailable",
  timeout: "Request timeout",
  malformed: "Malformed response",
  validation: "Validation error",
};

export function planFailure(
  request: FailurePlanRequest,
  role: IntegrationRole,
): GovSyncResult<FailurePlanOutcome> {
  const principal = principalFor(role);
  const gate = callPlatform({
    operation: "PLAN_FAILURE",
    principal,
    departmentId: request.departmentId,
  });
  if (!isGateGranted(gate)) return gate;

  const store = integrationStore();
  const record = request.departmentId === "none" ? null : departmentById(request.departmentId);

  if (request.departmentId === "none") {
    const removed = allConnectors().filter((connector) =>
      store.clearFailure(connector.departmentId),
    ).length;
    const data: FailurePlanOutcome = {
      plans: store.failurePlans(),
      message:
        removed === 0
          ? "No simulated failure was in place."
          : `Cleared ${removed} simulated failure${removed === 1 ? "" : "s"}. Every connector is healthy again.`,
      health: store.healthFor(connectedConnectorIds),
    };
    return { ...gate, data, status: "connected" };
  }

  if (!record || !connectorFor(request.departmentId)) {
    return failure<FailurePlanOutcome>(
      gate.requestId,
      "PLAN_FAILURE",
      makeFault(
        "UNKNOWN_DEPARTMENT",
        `No connector is configured for "${request.departmentId}".`,
        "Choose one of the four simulated departments, or none to clear every failure.",
      ),
    );
  }

  const calls = Math.max(1, Math.min(5, Math.trunc(request.calls) || 1));
  const plan: FailurePlan = {
    departmentId: request.departmentId,
    departmentName: record.shortName,
    mode: request.mode,
    calls,
    plannedAt: store.now(),
    note: `${MODE_NOTES[request.mode]}. The next ${calls} call${
      calls === 1 ? "" : "s"
    } to ${record.shortName} will fail, including every retry inside each call.`,
  };
  store.planFailure(plan);

  const data: FailurePlanOutcome = {
    plans: store.failurePlans(),
    message: plan.note,
    health: store.healthFor(connectedConnectorIds),
  };

  return { ...gate, data, status: "unavailable" };
}
