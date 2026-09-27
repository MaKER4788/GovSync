/**
 * TYPED BROWSER CLIENT FOR THE GOVSYNC API.
 *
 * The only place in the frontend that calls `fetch`. Every call goes to a
 * `/api/govsync` route, never to a department service: the portal has no idea a
 * departmental dialect exists, which is the point of the integration layer.
 *
 * Two rules hold everywhere this is used:
 *
 *   - A departmental failure is never thrown. It arrives as a `GovSyncResult`
 *     with `success: false`, because the caller has to be able to show that the
 *     workflow state survived.
 *   - Nothing here retries. The integration layer already retried three times;
 *     a browser-side retry would hide the very thing the demo exists to show.
 */

import type {
  ApplicationSyncResult,
  ConnectorHealth,
  DepartmentApplicationStatus,
  DepartmentStatus,
  DepartmentStatusReport,
  GovSyncResult,
  IntegrationFault,
  IntegrationHop,
  IntegrationMetrics,
  IntegrationRole,
  WorkflowState,
} from "@/lib/integrations/types";

export type {
  ApplicationSyncResult,
  DepartmentStatus,
  DepartmentStatusReport,
  IntegrationMetrics,
} from "@/lib/integrations/types";

/** Shown when the portal itself cannot be reached, as opposed to a fault in it. */
export interface TransportFault {
  code: "TRANSPORT_ERROR";
  message: string;
  detail?: string;
  retryable: true;
  httpStatus: 0;
}

export type ClientResult<TData> = GovSyncResult<TData> | TransportFailure;

/** True when a failure envelope says the decision was kept in the outbox. A
 *  transport failure never reaches the server, so there is nothing queued. */
export function wasQueued(result: ClientResult<unknown>): boolean {
  return result.success === false && "queued" in result && result.queued === true;
}

interface TransportFailure {
  success: false;
  requestId: "n/a";
  applicationId: string | null;
  department: null;
  operation: "UNKNOWN";
  error: TransportFault;
  timestamp: "";
  source: "GOVSYNC_INTEGRATION_LAYER";
  events: [];
  trace: [];
  attempts: 0;
}

function transportFailure(message: string, detail?: string): TransportFailure {
  return {
    success: false,
    requestId: "n/a",
    applicationId: null,
    department: null,
    operation: "UNKNOWN",
    error: {
      code: "TRANSPORT_ERROR",
      message,
      ...(detail === undefined ? {} : { detail }),
      retryable: true,
      httpStatus: 0,
    },
    timestamp: "",
    source: "GOVSYNC_INTEGRATION_LAYER",
    events: [],
    trace: [],
    attempts: 0,
  };
}

async function call<TData>(
  path: string,
  init: RequestInit & { role: IntegrationRole },
): Promise<ClientResult<TData>> {
  const { role, ...options } = init;
  try {
    const response = await fetch(path, {
      ...options,
      headers: {
        "content-type": "application/json",
        "x-govsync-role": role,
        ...(options.headers ?? {}),
      },
      cache: "no-store",
    });
    return (await response.json()) as GovSyncResult<TData>;
  } catch (error) {
    return transportFailure(
      "The GovSync API could not be reached from the browser.",
      error instanceof Error ? error.message : "Unknown transport error.",
    );
  }
}

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

export interface IntegrationLog {
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
  failurePlans: {
    departmentId: string;
    departmentName: string;
    mode: string;
    calls: number;
    plannedAt: string;
    note: string;
  }[];
  maxAttempts: number;
  securityControls: { name: string; status: string; detail: string }[];
}

type IntegrationEvent = NonNullable<IntegrationMetrics["recentEvents"]>[number];

export interface IntegrationTrace {
  requestId: string;
  at: string;
  operation: string;
  success: boolean;
  hops: IntegrationHop[];
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export function fetchDepartments(
  role: IntegrationRole = "PLATFORM_OPERATOR",
): Promise<ClientResult<DepartmentListing[]>> {
  return call<DepartmentListing[]>("/api/govsync/departments", { method: "GET", role });
}

export function fetchApprovals(
  applicationId: string,
  role: IntegrationRole = "PLATFORM_OPERATOR",
): Promise<ClientResult<DepartmentStatusReport[]>> {
  return call<DepartmentStatusReport[]>(
    `/api/govsync/applications/${encodeURIComponent(applicationId)}/approvals`,
    { method: "GET", role },
  );
}

export function fetchDepartmentStatus(
  departmentId: string,
  applicationId: string,
  role: IntegrationRole = "PLATFORM_OPERATOR",
): Promise<ClientResult<DepartmentStatusReport>> {
  return call<DepartmentStatusReport>(
    `/api/govsync/departments/${encodeURIComponent(departmentId)}/status/${encodeURIComponent(applicationId)}`,
    { method: "GET", role },
  );
}

export function fetchHealth(
  role: IntegrationRole = "PLATFORM_OPERATOR",
): Promise<ClientResult<IntegrationMetrics>> {
  return call<IntegrationMetrics>("/api/govsync/health", { method: "GET", role });
}

export function fetchIntegrationLog(
  applicationId?: string,
  role: IntegrationRole = "PLATFORM_OPERATOR",
): Promise<ClientResult<IntegrationLog>> {
  const query = applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : "";
  return call<IntegrationLog>(`/api/govsync/integration/events${query}`, { method: "GET", role });
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                      */
/* -------------------------------------------------------------------------- */

export function publishDecision(input: {
  departmentId: string;
  applicationId: string;
  stageId: string;
  status: DepartmentStatus;
  reason: string;
  decidedBy: string;
}): Promise<ClientResult<PublishResult>> {
  return call<PublishResult>(
    `/api/govsync/departments/${encodeURIComponent(input.departmentId)}/applications`,
    { method: "POST", role: "PLATFORM_OPERATOR", body: JSON.stringify({ action: "submit", ...input }) },
  );
}

export function syncApplication(
  applicationId: string,
  role: IntegrationRole = "PLATFORM_OPERATOR",
): Promise<ClientResult<ApplicationSyncResult>> {
  return call<ApplicationSyncResult>(
    `/api/govsync/workflow/${encodeURIComponent(applicationId)}/sync`,
    { method: "POST", role, body: JSON.stringify({ mode: "sync" }) },
  );
}

export function resetIntegration(
  applicationId: string,
  role: IntegrationRole = "PLATFORM_OPERATOR",
): Promise<ClientResult<ResetResult>> {
  return call<ResetResult>(
    `/api/govsync/workflow/${encodeURIComponent(applicationId)}/sync`,
    { method: "POST", role, body: JSON.stringify({ mode: "reset" }) },
  );
}

export function simulateFailure(input: {
  departmentId: string;
  mode: string;
  calls: number;
}): Promise<ClientResult<FailurePlanResult>> {
  return call<FailurePlanResult>("/api/govsync/integration/simulate", {
    method: "POST",
    role: "PLATFORM_OPERATOR",
    body: JSON.stringify(input),
  });
}

/* -------------------------------------------------------------------------- */
/* Result shapes the client cares about                                        */
/* -------------------------------------------------------------------------- */

export interface PublishResult {
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

export interface ResetResult {
  applicationId: string;
  clearedPublishes: number;
  clearedConnectorState: number;
  message: string;
}

export interface FailurePlanResult {
  plans: IntegrationLog["failurePlans"];
  message: string;
  health: ConnectorHealth[];
}

/* -------------------------------------------------------------------------- */
/* Presentation helpers                                                        */
/* -------------------------------------------------------------------------- */

export function faultText(result: ClientResult<unknown>): string {
  if (result.success) return "";
  return result.error.message;
}

export function isTransportFault(
  result: ClientResult<unknown>,
): result is TransportFailure {
  return !result.success && result.error.code === "TRANSPORT_ERROR";
}

/** Workflow state to the vocabulary a department speaks. */
export const DEPARTMENT_STATUS_FOR: Record<WorkflowState, DepartmentStatus> = {
  approved: "APPROVED",
  "under-review": "IN_REVIEW",
  pending: "PENDING",
  "action-required": "ACTION_REQUIRED",
  blocked: "BLOCKED",
  rejected: "REJECTED",
};

/** Human wording for a connector health state. */
export const HEALTH_LABEL: Record<string, string> = {
  connected: "Connected (Demo)",
  degraded: "Degraded (Demo)",
  unavailable: "Unavailable (Demo)",
  operational: "Connected (Demo)",
  maintenance: "Maintenance (Demo)",
};

export type { DepartmentApplicationStatus };
