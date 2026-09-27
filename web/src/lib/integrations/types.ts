/**
 * SIMULATED DEPARTMENT API CONTRACT.
 *
 * Nothing in this file describes a live government system. Every connector
 * implemented against it is a local mock, and every response it produces is
 * generated in this process. The contract exists so the interoperability
 * architecture is real in shape: one interface, four implementations, and a
 * single normalisation step in the GovSync layer.
 *
 * Three layers of envelope exist and never mix:
 *
 *   1. `DepartmentEnvelope`  what a mock department speaks in its own dialect.
 *   2. `GovSyncResult`       what the integration layer returns to a caller.
 *   3. `IntegrationEvent`    the append-only record of one attempt.
 */

import type { Department, DocumentObligation, WorkflowState } from "@/lib/types";

export type { Department, WorkflowState };

/* -------------------------------------------------------------------------- */
/* Department-side vocabulary                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Status as a department states it. Deliberately a different vocabulary from
 * GovSync's `WorkflowState` so the normalisation step is demonstrable rather
 * than a pass-through.
 */
export type DepartmentStatus =
  | "APPROVED"
  | "IN_REVIEW"
  | "PENDING"
  | "ACTION_REQUIRED"
  | "BLOCKED"
  | "REJECTED";

/** The six operations every connector must expose. */
export type DepartmentOperation =
  | "GET_DEPARTMENT"
  | "SUBMIT_APPLICATION"
  | "GET_APPLICATION_STATUS"
  | "VALIDATE_APPLICATION"
  | "GET_REQUIRED_DOCUMENTS"
  | "UPDATE_APPLICATION_STATUS";

/** Every operation, used to reject anything a connector does not implement. */
export const departmentOperations: DepartmentOperation[] = [
  "GET_DEPARTMENT",
  "SUBMIT_APPLICATION",
  "GET_APPLICATION_STATUS",
  "VALIDATE_APPLICATION",
  "GET_REQUIRED_DOCUMENTS",
  "UPDATE_APPLICATION_STATUS",
];

/** Maps a departmental status onto the GovSync workflow vocabulary. */
export function normaliseStatus(status: DepartmentStatus): WorkflowState {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "IN_REVIEW":
      return "under-review";
    case "ACTION_REQUIRED":
      return "action-required";
    case "BLOCKED":
      return "blocked";
    case "REJECTED":
      return "rejected";
    case "PENDING":
      return "pending";
  }
}

/** The inverse mapping, used when GovSync pushes a decision to a department. */
export function departmentalise(state: WorkflowState): DepartmentStatus {
  switch (state) {
    case "approved":
      return "APPROVED";
    case "under-review":
      return "IN_REVIEW";
    case "action-required":
      return "ACTION_REQUIRED";
    case "blocked":
      return "BLOCKED";
    case "rejected":
      return "REJECTED";
    case "pending":
      return "PENDING";
  }
}

/* -------------------------------------------------------------------------- */
/* Error vocabulary                                                           */
/* -------------------------------------------------------------------------- */

export type IntegrationErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_REQUEST"
  | "UNKNOWN_DEPARTMENT"
  | "UNKNOWN_APPLICATION"
  | "UNSUPPORTED_OPERATION"
  | "DEPARTMENT_UNAVAILABLE"
  | "DEPARTMENT_TIMEOUT"
  | "MALFORMED_RESPONSE"
  | "INTERNAL_ERROR";

/** A fault as the integration layer reports it to a caller. */
export interface IntegrationFault {
  code: IntegrationErrorCode;
  message: string;
  detail?: string;
  /** True when repeating the identical call could plausibly succeed. */
  retryable: boolean;
  httpStatus: number;
}

const FAULT_STATUS: Record<IntegrationErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  INVALID_REQUEST: 400,
  UNKNOWN_DEPARTMENT: 404,
  UNKNOWN_APPLICATION: 404,
  UNSUPPORTED_OPERATION: 405,
  DEPARTMENT_UNAVAILABLE: 503,
  DEPARTMENT_TIMEOUT: 504,
  MALFORMED_RESPONSE: 502,
  INTERNAL_ERROR: 500,
};

const RETRYABLE: ReadonlySet<IntegrationErrorCode> = new Set([
  "DEPARTMENT_UNAVAILABLE",
  "DEPARTMENT_TIMEOUT",
  "MALFORMED_RESPONSE",
]);

export function makeFault(
  code: IntegrationErrorCode,
  message: string,
  detail?: string,
): IntegrationFault {
  return {
    code,
    message,
    ...(detail === undefined ? {} : { detail }),
    retryable: RETRYABLE.has(code),
    httpStatus: FAULT_STATUS[code],
  };
}

/* -------------------------------------------------------------------------- */
/* Department-side envelopes and payloads                                      */
/* -------------------------------------------------------------------------- */

/** A document as a department describes it. */
export interface DepartmentDocumentRef {
  name: string;
  mandatory: boolean;
  owedBy: DocumentObligation;
  state: "received" | "pending" | "waived";
  note?: string;
}

/** One field-level check a department reports. */
export interface DepartmentCheck {
  field: string;
  label: string;
  outcome: "PASS" | "FAIL" | "WARN";
  detail: string;
}

/** Common shape of a departmental status record. */
export interface DepartmentApplicationStatus {
  applicationId: string;
  stageId: string;
  stageTitle: string;
  status: DepartmentStatus;
  updatedAt: string;
  reference: string;
  remarks: string;
  issuedArtifacts: string[];
}

export interface DepartmentProfile {
  departmentId: string;
  departmentName: string;
  systemName: string;
  baseUrl: string;
  apiVersion: string;
  operations: DepartmentOperation[];
  disclaimer: string;
}

export interface DepartmentValidation {
  applicationId: string;
  stageId: string;
  valid: boolean;
  checks: DepartmentCheck[];
  validatedAt: string;
}

export interface DepartmentDocuments {
  applicationId: string;
  stageId: string;
  documents: DepartmentDocumentRef[];
}

export interface DepartmentSubmission {
  applicationId: string;
  stageId: string;
  caseId: string;
  acceptedAt: string;
  receivedDocuments: number;
}

/** GovSync pushing a decision into a department. */
export interface DepartmentStatusUpdatePayload {
  stageId: string;
  status: DepartmentStatus;
  reason: string;
  decidedBy: string;
  recordedAt: string;
}

/** GovSync opening a case inside a department. */
export interface DepartmentSubmissionPayload {
  stageId: string;
  submittedAt: string;
  documents: DepartmentDocumentRef[];
}

/** What the integration layer hands a connector for one attempt. */
export interface ConnectorRequest<TPayload = unknown> {
  applicationId: string | null;
  payload: TPayload;
  /** Deterministic stamp assigned by the integration layer. */
  at: string;
  attempt: number;
  /** Failure mode the demo has planned for this connector, if any. */
  injected: InjectedFailureMode | null;
}

/** What a mock department returns, in its own dialect. */
export interface DepartmentEnvelope<TData> {
  success: boolean;
  /** Department slug as the department itself names it, e.g. `pollution-control`. */
  department: string;
  applicationId: string | null;
  status: DepartmentStatus | null;
  timestamp: string;
  source: "SIMULATED_DEPARTMENT_API";
  data: TData | null;
  error: IntegrationFault | null;
}

/* -------------------------------------------------------------------------- */
/* The connector contract                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The one interface all four simulated departments implement. The generic
 * parameters default to the common shape, so `DepartmentConnector` alone is
 * enough to hold every connector, while a specific service can still be typed
 * against its own payloads.
 */
export interface DepartmentConnector<
  TStatus extends DepartmentApplicationStatus = DepartmentApplicationStatus,
  TProfile extends DepartmentProfile = DepartmentProfile,
  TValidation extends DepartmentValidation = DepartmentValidation,
  TDocuments extends DepartmentDocuments = DepartmentDocuments,
  TSubmit extends DepartmentSubmission = DepartmentSubmission,
> {
  readonly departmentId: string;
  /** Slug the department publishes in its own responses. */
  readonly departmentSlug: string;
  getDepartment(): DepartmentEnvelope<TProfile>;
  submitApplication(
    request: ConnectorRequest<DepartmentSubmissionPayload>,
  ): DepartmentEnvelope<TSubmit>;
  getApplicationStatus(
    request: ConnectorRequest,
  ): DepartmentEnvelope<TStatus>;
  validateApplication(
    request: ConnectorRequest<DepartmentSubmissionPayload>,
  ): DepartmentEnvelope<TValidation>;
  getRequiredDocuments(
    request: ConnectorRequest,
  ): DepartmentEnvelope<TDocuments>;
  updateApplicationStatus(
    request: ConnectorRequest<DepartmentStatusUpdatePayload>,
  ): DepartmentEnvelope<TStatus>;
}

/* -------------------------------------------------------------------------- */
/* GovSync layer vocabulary                                                    */
/* -------------------------------------------------------------------------- */

/** Operations the integration layer adds on top of the departmental set. */
export type IntegrationOperation =
  | DepartmentOperation
  | "LIST_DEPARTMENTS"
  | "LIST_APPLICATION_APPROVALS"
  | "READ_APPLICATION"
  | "SYNC_APPLICATION"
  | "RESET_DEPARTMENT_STATE"
  | "READ_HEALTH"
  | "READ_INTEGRATION_LOG"
  | "PLAN_FAILURE";

/** How a connector looks to the platform right now. */
export type ConnectorHealthState = "connected" | "degraded" | "unavailable";

export interface ConnectorHealth {
  departmentId: string;
  departmentName: string;
  state: ConnectorHealthState;
  since: string;
  lastCheckedAt: string;
  lastRequestId: string | null;
  detail: string;
  /** Always true. Present so no view can present this as a live measurement. */
  simulated: true;
}

export type IntegrationEventStatus =
  | "SUCCESS"
  | "FAILED"
  | "TIMEOUT"
  | "VALIDATION_ERROR";

export interface IntegrationEvent {
  id: string;
  seq: number;
  at: string;
  applicationId: string | null;
  source: string;
  destination: string;
  operation: IntegrationOperation;
  status: IntegrationEventStatus;
  message: string;
  requestId: string;
  attempts: number;
  latencyMs: number;
  principal: string;
}

/** One hop in the request path, rendered by the debug view. */
export type IntegrationLayer =
  | "CLIENT"
  | "GOVSYNC_API"
  | "INTEGRATION_LAYER"
  | "CONNECTOR"
  | "DEPARTMENT_API"
  | "NORMALISED";

export type IntegrationHopStatus = "OK" | "RETRY" | "FAILED" | "SKIPPED";

export interface IntegrationHop {
  index: number;
  layer: IntegrationLayer;
  label: string;
  detail: string;
  status: IntegrationHopStatus;
  at: string;
  attempt: number;
  durationMs: number;
}

export interface GovSyncDepartmentRef {
  id: string;
  name: string;
}

export type GovSyncStatusValue = WorkflowState | ConnectorHealthState;

/** Successful response from the integration layer. */
export interface GovSyncEnvelope<TData> {
  success: true;
  requestId: string;
  applicationId: string | null;
  department: GovSyncDepartmentRef | null;
  operation: IntegrationOperation;
  status: GovSyncStatusValue | null;
  data: TData;
  timestamp: string;
  source: "GOVSYNC_INTEGRATION_LAYER";
  events: IntegrationEvent[];
  trace: IntegrationHop[];
  attempts: number;
}

/** Failed response from the integration layer. */
export interface GovSyncFailure {
  success: false;
  requestId: string;
  applicationId: string | null;
  department: GovSyncDepartmentRef | null;
  operation: IntegrationOperation;
  error: IntegrationFault;
  timestamp: string;
  source: "GOVSYNC_INTEGRATION_LAYER";
  events: IntegrationEvent[];
  trace: IntegrationHop[];
  attempts: number;
  /**
   * Delivery metadata, not a payload. Set when a failed publish was placed in
   * the outbox instead of being dropped, so a caller can tell "the department
   * refused and your decision is kept" from "the department refused and it is
   * gone". Deliberately the only extra field a failure carries.
   */
  queued?: boolean;
}

export type GovSyncResult<TData> = GovSyncEnvelope<TData> | GovSyncFailure;

/**
 * What `callPlatform` returns. Identical to a successful envelope minus the
 * payload, because the gate only issues the request id, checks authentication,
 * authorisation and the application reference, and records the audit entry. The
 * operation fills `data` in afterwards, which is why the type omits it.
 */
export type GovSyncGate = Omit<GovSyncEnvelope<never>, "data">;

export type GovSyncGateResult = GovSyncGate | GovSyncFailure;

/** Narrowing helper so callers never read `data` off a failure. */
export function isSuccess<TData>(
  result: GovSyncResult<TData>,
): result is GovSyncEnvelope<TData> {
  return result.success;
}

/** Narrowing helper for a gate result. */
export function isGateGranted(result: GovSyncGateResult): result is GovSyncGate {
  return result.success;
}

/* -------------------------------------------------------------------------- */
/* Monitoring data, shaped for the Phase 5 console                             */
/* -------------------------------------------------------------------------- */

export interface ConnectorMetricsRow {
  departmentId: string;
  departmentName: string;
  requests: number;
  success: number;
  failed: number;
  timeouts: number;
  retries: number;
  /** Decisions GovSync could not deliver and will retry on the next sync. */
  pendingPublishes: number;
  lastStatus: DepartmentStatus | null;
  lastRequestId: string | null;
  lastUpdatedAt: string | null;
  health: ConnectorHealthState;
}

export interface IntegrationMetrics {
  windowLabel: string;
  totalRequests: number;
  successful: number;
  failed: number;
  timeouts: number;
  validationErrors: number;
  retriedRequests: number;
  activeIntegrations: number;
  lastSyncAt: string | null;
  lastSyncApplicationId: string | null;
  pendingPublishes: number;
  byDepartment: ConnectorMetricsRow[];
  recentEvents: IntegrationEvent[];
  health: ConnectorHealth[];
}

/* -------------------------------------------------------------------------- */
/* Controlled failure simulation                                               */
/* -------------------------------------------------------------------------- */

export type InjectedFailureMode =
  | "unavailable"
  | "timeout"
  | "malformed"
  | "validation";

export interface FailurePlan {
  departmentId: string;
  departmentName: string;
  mode: InjectedFailureMode;
  /** Logical calls the plan covers. One call means all of its attempts fail. */
  calls: number;
  plannedAt: string;
  note: string;
}

/* -------------------------------------------------------------------------- */
/* Security abstractions                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A placeholder caller. No credential is presented, verified or stored: the
 * prototype asserts only that the integration layer has one place where
 * identity and scope are decided, so a real deployment has somewhere to put a
 * real token check.
 */
export type IntegrationRole =
  | "APPLICANT"
  | "DEPARTMENT_OFFICER"
  | "PLATFORM_OPERATOR"
  | "ANONYMOUS";

export interface IntegrationPrincipal {
  subject: string;
  role: IntegrationRole;
  scopes: string[];
  authenticated: boolean;
  disclaimer: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  requestId: string;
  principal: string;
  role: IntegrationRole;
  operation: IntegrationOperation;
  departmentId: string | null;
  applicationId: string | null;
  outcome: "ALLOWED" | "DENIED" | "COMPLETED";
  detail: string;
}

/** Declarative statement of what the layer does and does not enforce. */
export interface SecurityControl {
  name: string;
  status: "enforced" | "placeholder" | "not-implemented";
  detail: string;
}

/* -------------------------------------------------------------------------- */
/* Connector view over a Phase 1/2 department record                           */
/* -------------------------------------------------------------------------- */

/** What the integration layer exposes for one stage, per department. */
export interface DepartmentStatusReport {
  departmentId: string;
  departmentName: string;
  systemName: string;
  stageId: string;
  stageTitle: string;
  stageOrder: number;
  /** As the department states it, in the department's own vocabulary. */
  departmentStatus: DepartmentStatus | null;
  /** After normalisation onto the workflow vocabulary. */
  normalisedState: WorkflowState | null;
  outcome: "synchronized" | "failed" | "pending-publish" | "not-connected";
  requestId: string;
  attempts: number;
  updatedAt: string | null;
  reference: string | null;
  message: string;
  error: IntegrationFault | null;
}

/** A decision made in GovSync that has to reach a department. */
export interface IntegrationStatusUpdate {
  applicationId: string;
  departmentId: string;
  stageId: string;
  status: DepartmentStatus;
  reason: string;
  decidedBy: string;
  recordedAt: string;
}

export interface ApplicationSyncResult {
  applicationId: string;
  requestedAt: string;
  completedAt: string;
  requestId: string;
  departments: DepartmentStatusReport[];
  /** GovSync's own read of the whole chain, not a department's view. */
  unifiedState: WorkflowState;
  unifiedMessage: string;
  pendingPublishes: number;
  /**
   * Stages where the department and the GovSync record disagree, identified by
   * stage so the client can adopt each one without guessing from a title.
   */
  diverged: StageDivergence[];
  /** The state of every stage after departmental truth was applied. */
  stages: WorkflowStageState[];
  events: IntegrationEvent[];
  trace: IntegrationHop[];
}

/** One stage where a department's own record disagrees with GovSync's. */
export interface StageDivergence {
  stageId: string;
  stageTitle: string;
  departmentId: string;
  departmentName: string;
  /** What the GovSync record says, in workflow terms. */
  recordedStatus: WorkflowState;
  /** What the department says, in its own vocabulary. */
  departmentStatus: string;
  /** The departmental value mapped back into workflow terms. */
  normalisedState: WorkflowState;
}

/** A stage's state after reconciliation, in the shape a client needs to adopt it. */
export interface WorkflowStageState {
  id: string;
  departmentId: string;
  title: string;
  order: number;
  state: WorkflowState;
  /** True when the connector is what put it in this state, not GovSync. */
  authoritative: boolean;
}
