/**
 * THE GOVSYNC INTEGRATION LAYER.
 *
 * Every path from the portal to a simulated department goes through
 * `callDepartment`, in this order:
 *
 *   1. issue a request id
 *   2. authenticate the caller
 *   3. authorise the operation against the caller's scopes
 *   4. validate the request: application exists, department exists, operation supported
 *   5. resolve the connector for the department
 *   6. call the connector, retrying a retryable fault up to the attempt limit
 *   7. normalise the departmental envelope into one GovSync envelope
 *   8. record an integration event, an audit entry and the connector counters
 *
 * The frontend never touches a department service directly. No step here
 * contacts a live system: every connector behind these calls is a local mock.
 */

import { applicationById } from "@/lib/data/applications";
import { departmentById } from "@/lib/data/departments";
import { connectorFor } from "@/lib/integrations/departments/registry";
import { latencyFor } from "@/lib/integrations/departments/shared";
import { integrationStore } from "@/lib/integrations/store";
import {
  departmentOperations,
  makeFault,
  normaliseStatus,
  type AuditEntry,
  type ConnectorRequest,
  type DepartmentConnector,
  type DepartmentEnvelope,
  type DepartmentOperation,
  type GovSyncDepartmentRef,
  type GovSyncFailure,
  type GovSyncGateResult,
  type GovSyncResult,
  type IntegrationEvent,
  type IntegrationEventStatus,
  type IntegrationFault,
  type IntegrationHop,
  type IntegrationLayer,
  type IntegrationOperation,
  type IntegrationPrincipal,
  type IntegrationRole,
  type InjectedFailureMode,
  type SecurityControl,
} from "@/lib/integrations/types";

/** Attempts allowed for one logical call before GovSync gives up. */
export const MAX_ATTEMPTS = 3;

/** Backoff GovSync *would* wait between attempts. Recorded, not slept on. */
export const RETRY_BACKOFF_MS: Record<number, number> = { 1: 400, 2: 1200 };

/** Connectors GovSync knows about, used in the wording of a refusal. */
const KNOWN_CONNECTORS = "rev, pol, lab, fire";

const LAYER_LATENCY_MS: Record<IntegrationLayer, number> = {
  CLIENT: 0,
  GOVSYNC_API: 1,
  INTEGRATION_LAYER: 2,
  CONNECTOR: 3,
  DEPARTMENT_API: 0,
  NORMALISED: 1,
};

const LAYER_LABEL: Record<IntegrationLayer, string> = {
  CLIENT: "Portal client",
  GOVSYNC_API: "GovSync API gateway",
  INTEGRATION_LAYER: "GovSync integration layer",
  CONNECTOR: "Department connector",
  DEPARTMENT_API: "Simulated department API",
  NORMALISED: "Normalisation and audit",
};

/* -------------------------------------------------------------------------- */
/* Identity and scopes                                                         */
/* -------------------------------------------------------------------------- */

const DEMO_DISCLAIMER =
  "Placeholder identity. No credential is presented, verified or stored, and no real authentication is performed.";

function scopesFor(role: IntegrationRole): string[] {
  switch (role) {
    case "APPLICANT":
      return ["application:read"];
    case "DEPARTMENT_OFFICER":
      return ["application:read", "department:pol:read", "department:pol:write"];
    case "PLATFORM_OPERATOR":
      return [
        "application:read",
        "application:write",
        "department:rev:read",
        "department:rev:write",
        "department:pol:read",
        "department:pol:write",
        "department:lab:read",
        "department:lab:write",
        "department:fire:read",
        "department:fire:write",
        "platform:monitor",
        "platform:simulate",
      ];
    case "ANONYMOUS":
      return [];
  }
}

export function principalFor(role: IntegrationRole): IntegrationPrincipal {
  const subject =
    role === "ANONYMOUS"
      ? "unidentified caller"
      : role === "APPLICANT"
        ? "Demo User (applicant)"
        : role === "DEPARTMENT_OFFICER"
          ? "Sr. Environmental Officer, State PCB (simulated)"
          : "Demo Reviewer (platform operator)";
  return {
    subject,
    role,
    scopes: scopesFor(role),
    authenticated: role !== "ANONYMOUS",
    disclaimer: DEMO_DISCLAIMER,
  };
}

/** What the integration layer enforces, and what it deliberately does not. */
export const securityControls: SecurityControl[] = [
  {
    name: "Request id",
    status: "enforced",
    detail:
      "Every call is issued a request id before validation and every event, audit entry and trace hop carries it.",
  },
  {
    name: "Request validation",
    status: "enforced",
    detail:
      "Application existence, department existence, operation support and payload shape are checked before a connector is called.",
  },
  {
    name: "Authorization",
    status: "enforced",
    detail:
      "Operations require a scope, and a caller without it is refused before any department service is reached.",
  },
  {
    name: "Audit logging",
    status: "enforced",
    detail:
      "Allowed, denied and completed calls are appended to an in-memory audit log with the principal and outcome.",
  },
  {
    name: "Authentication",
    status: "placeholder",
    detail: `A principal is chosen by the demo, not proven. ${DEMO_DISCLAIMER} A deployment would verify a token here.`,
  },
  {
    name: "Transport security",
    status: "placeholder",
    detail:
      "The connectors describe OAuth and mTLS in their profiles, but no TLS session, certificate or token is created or validated in this prototype.",
  },
  {
    name: "Rate limiting and quotas",
    status: "not-implemented",
    detail:
      "Not implemented. The gateway describes quotas in the architecture pages, but this prototype applies no throttle.",
  },
  {
    name: "Data protection and retention",
    status: "not-implemented",
    detail:
      "Not implemented. No encryption at rest or in transit, no key management and no retention policy exist here.",
  },
];

/* -------------------------------------------------------------------------- */
/* Call plumbing                                                               */
/* -------------------------------------------------------------------------- */

export interface DepartmentCall {
  operation: DepartmentOperation;
  principal: IntegrationPrincipal;
  applicationId?: string | null;
  departmentId: string;
  payload?: unknown;
}

interface TraceBuilder {
  hops: IntegrationHop[];
  at: () => string;
  add: (
    layer: IntegrationLayer,
    detail: string,
    status: IntegrationHop["status"],
    attempt: number,
    durationMs?: number,
  ) => IntegrationHop;
}

function createTrace(at: () => string): TraceBuilder {
  const hops: IntegrationHop[] = [];
  return {
    hops,
    at,
    add(layer, detail, status, attempt, durationMs) {
      const hop: IntegrationHop = {
        index: hops.length + 1,
        layer,
        label: LAYER_LABEL[layer],
        detail,
        status,
        at: at(),
        attempt,
        durationMs: durationMs ?? LAYER_LATENCY_MS[layer],
      };
      hops.push(hop);
      return hop;
    },
  };
}

const METHOD_BY_OPERATION: Record<
  DepartmentOperation,
  (connector: DepartmentConnector, request: ConnectorRequest) => DepartmentEnvelope<unknown>
> = {
  GET_DEPARTMENT: (connector) => connector.getDepartment(),
  SUBMIT_APPLICATION: (connector, request) =>
    connector.submitApplication(request as ConnectorRequest<never>),
  GET_APPLICATION_STATUS: (connector, request) => connector.getApplicationStatus(request),
  VALIDATE_APPLICATION: (connector, request) =>
    connector.validateApplication(request as ConnectorRequest<never>),
  GET_REQUIRED_DOCUMENTS: (connector, request) => connector.getRequiredDocuments(request),
  UPDATE_APPLICATION_STATUS: (connector, request) =>
    connector.updateApplicationStatus(request as ConnectorRequest<never>),
};

const REQUIRED_SCOPE: Record<DepartmentOperation, "read" | "write"> = {
  GET_DEPARTMENT: "read",
  SUBMIT_APPLICATION: "write",
  GET_APPLICATION_STATUS: "read",
  VALIDATE_APPLICATION: "read",
  GET_REQUIRED_DOCUMENTS: "read",
  UPDATE_APPLICATION_STATUS: "write",
};

const EVENT_STATUS_BY_CODE: Record<string, IntegrationEventStatus> = {
  DEPARTMENT_TIMEOUT: "TIMEOUT",
  INVALID_REQUEST: "VALIDATION_ERROR",
  UNAUTHENTICATED: "VALIDATION_ERROR",
  FORBIDDEN: "VALIDATION_ERROR",
};

function eventStatusFor(fault: IntegrationFault | null): IntegrationEventStatus {
  if (!fault) return "SUCCESS";
  return EVENT_STATUS_BY_CODE[fault.code] ?? "FAILED";
}

function normalise<TData>(
  envelope: DepartmentEnvelope<TData>,
  operation: DepartmentOperation,
): TData | IntegrationFault {
  if (!envelope.success) {
    return (
      envelope.error ??
      makeFault("INTERNAL_ERROR", "The department connector returned no error detail.")
    );
  }
  if (envelope.data === null || envelope.data === undefined) {
    return makeFault(
      "MALFORMED_RESPONSE",
      "The department response could not be read.",
      `${envelope.department} answered ${operation} without a usable payload.`,
    );
  }
  if (operation === "GET_APPLICATION_STATUS" && envelope.status === null) {
    return makeFault(
      "MALFORMED_RESPONSE",
      "The department response carried no status.",
      `${envelope.department} answered ${operation} without a status field.`,
    );
  }
  return envelope.data;
}

/**
 * Calls one simulated department, with retry, normalisation, event recording and
 * a hop-by-hop trace attached to the result.
 */
export function callDepartment<TData>(call: DepartmentCall): GovSyncResult<TData> {
  const store = integrationStore();
  const requestId = store.nextId("req");
  const at = () => store.now();
  const trace = createTrace(at);
  const events: IntegrationEvent[] = [];
  const applicationId = call.applicationId ?? null;
  const departmentRecord = departmentById(call.departmentId);
  const department: GovSyncDepartmentRef | null = departmentRecord
    ? { id: departmentRecord.id, name: departmentRecord.shortName }
    : { id: call.departmentId, name: call.departmentId };

  const finish = (
    fault: IntegrationFault,
    attempts: number,
    outcome: AuditEntry["outcome"],
  ): GovSyncFailure => {
    store.recordTrace({
      requestId,
      at: at(),
      operation: call.operation,
      success: false,
      hops: trace.hops,
    });
    store.recordAudit({
      requestId,
      principal: call.principal.subject,
      role: call.principal.role,
      operation: call.operation,
      departmentId: call.departmentId,
      applicationId,
      outcome,
      detail: fault.message,
    });
    return {
      success: false,
      requestId,
      applicationId,
      department,
      operation: call.operation,
      error: fault,
      timestamp: at(),
      source: "GOVSYNC_INTEGRATION_LAYER",
      events,
      trace: trace.hops,
      attempts,
    };
  };

  trace.add("GOVSYNC_API", `Request ${requestId} accepted for ${call.operation}.`, "OK", 0);

  if (!call.principal.authenticated) {
    const fault = makeFault(
      "UNAUTHENTICATED",
      "This prototype requires a named principal before a department is contacted.",
      "No credential is checked. The demo simply refuses an unidentified caller.",
    );
    trace.add(
      "INTEGRATION_LAYER",
      `Refused: caller "${call.principal.subject}" is not authenticated.`,
      "FAILED",
      0,
    );
    return finish(fault, 0, "DENIED");
  }

  const requiredScope = `department:${call.departmentId}:${REQUIRED_SCOPE[call.operation]}`;
  if (!call.principal.scopes.includes(requiredScope)) {
    const fault = makeFault(
      "FORBIDDEN",
      `This caller is not allowed to ${REQUIRED_SCOPE[call.operation]} ${department.name}.`,
      `Required scope "${requiredScope}" is not held by ${call.principal.subject}.`,
    );
    trace.add("INTEGRATION_LAYER", `Refused: scope "${requiredScope}" not granted.`, "FAILED", 0);
    return finish(fault, 0, "DENIED");
  }
  trace.add("INTEGRATION_LAYER", `Authorised. Scope "${requiredScope}" granted.`, "OK", 0);

  if (!departmentOperations.includes(call.operation)) {
    const fault = makeFault(
      "UNSUPPORTED_OPERATION",
      `${call.operation} is not a departmental operation.`,
    );
    trace.add("INTEGRATION_LAYER", "Refused: unsupported operation.", "FAILED", 0);
    return finish(fault, 0, "DENIED");
  }

  if (applicationId && !applicationById(applicationId)) {
    const fault = makeFault(
      "UNKNOWN_APPLICATION",
      `No application with reference ${applicationId} exists in this prototype.`,
      "The reference is well formed but matches no record.",
    );
    trace.add("INTEGRATION_LAYER", "Refused: unknown application reference.", "FAILED", 0);
    return finish(fault, 0, "DENIED");
  }

  const connector = connectorFor(call.departmentId);
  if (!connector) {
    const fault = makeFault(
      "UNKNOWN_DEPARTMENT",
      `No connector is configured for "${call.departmentId}".`,
      `Known connectors: ${KNOWN_CONNECTORS}.`,
    );
    trace.add("INTEGRATION_LAYER", "Refused: no connector for this department.", "FAILED", 0);
    return finish(fault, 0, "DENIED");
  }

  // A planned failure covers the whole logical call, so every attempt inside it
  // fails. That is what makes the retry sequence visible to the reviewer.
  const injected: InjectedFailureMode | null = store.takeFailure(call.departmentId);
  const latency = latencyFor(call.departmentId);
  const destination = department.name;
  let lastFault: IntegrationFault = makeFault("INTERNAL_ERROR", "No attempt was made.");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const attemptAt = store.tick();
    trace.add(
      "INTEGRATION_LAYER",
      `Attempt ${attempt} of ${MAX_ATTEMPTS} through the ${connector.departmentSlug} connector${
        injected ? `, with a simulated ${injected} response` : ""
      }.`,
      "OK",
      attempt,
    );
    trace.add("CONNECTOR", `Opened a session to ${connector.departmentSlug}.`, "OK", attempt);

    const request: ConnectorRequest = {
      applicationId,
      payload: call.payload ?? null,
      at: attemptAt,
      attempt,
      injected,
    };

    let envelope: DepartmentEnvelope<unknown>;
    try {
      envelope = METHOD_BY_OPERATION[call.operation](connector, request);
    } catch (error) {
      envelope = {
        success: false,
        department: connector.departmentSlug,
        applicationId,
        status: null,
        timestamp: attemptAt,
        source: "SIMULATED_DEPARTMENT_API",
        data: null,
        error: makeFault(
          "INTERNAL_ERROR",
          "The department connector threw while handling the request.",
          error instanceof Error ? error.message : "Unknown connector error.",
        ),
      };
    }

    const status = eventStatusFor(envelope.error);
    store.noteRequest({
      departmentId: call.departmentId,
      outcome: status,
      latencyMs: latency,
      retried: attempt > 1,
    });

    const event = store.recordEvent({
      at: attemptAt,
      applicationId,
      source: "GovSync Integration Layer",
      destination: `${destination} API (simulated)`,
      operation: call.operation,
      status,
      message:
        status === "SUCCESS"
          ? `${call.operation} answered by ${connector.departmentSlug}.`
          : (envelope.error?.message ?? "The connector returned no error detail."),
      requestId,
      attempts: attempt,
      latencyMs: latency,
      principal: call.principal.subject,
    });
    events.push(event);

    const resolved = normalise(envelope, call.operation);

    if (resolved === null || typeof resolved !== "object" || "code" in resolved) {
      lastFault = resolved as IntegrationFault;
      trace.add(
        "DEPARTMENT_API",
        `${connector.departmentSlug} did not answer usefully. ${lastFault.message}`,
        lastFault.retryable && attempt < MAX_ATTEMPTS ? "RETRY" : "FAILED",
        attempt,
        latency,
      );

      if (lastFault.retryable && attempt < MAX_ATTEMPTS) {
        trace.add(
          "INTEGRATION_LAYER",
          `Retryable fault. Retrying (attempt ${attempt + 1} of ${MAX_ATTEMPTS}) after a planned ${
            RETRY_BACKOFF_MS[attempt] ?? 0
          } ms backoff.`,
          "RETRY",
          attempt,
        );
        continue;
      }

      if (attempt >= MAX_ATTEMPTS) {
        trace.add(
          "INTEGRATION_LAYER",
          `Retry budget exhausted. ${lastFault.code} is final for this call. The workflow state is preserved.`,
          "FAILED",
          attempt,
        );
      }
      return finish(lastFault, attempt, "COMPLETED");
    }

    trace.add(
      "DEPARTMENT_API",
      `${connector.departmentSlug} answered ${call.operation} in ${latency} ms.`,
      "OK",
      attempt,
      latency,
    );
    const statusText = envelope.status ?? "no status";
    trace.add(
      "NORMALISED",
      `Normalised ${statusText} onto the GovSync vocabulary and sealed the audit entry.`,
      "OK",
      attempt,
    );
    if (envelope.status) {
      store.noteStatus(call.departmentId, envelope.status);
    }

    store.recordTrace({
      requestId,
      at: attemptAt,
      operation: call.operation,
      success: true,
      hops: trace.hops,
    });
    store.recordAudit({
      requestId,
      principal: call.principal.subject,
      role: call.principal.role,
      operation: call.operation,
      departmentId: call.departmentId,
      applicationId,
      outcome: "COMPLETED",
      detail: `${call.operation} completed after ${attempt} attempt${attempt === 1 ? "" : "s"}.`,
    });

    return {
      success: true,
      requestId,
      applicationId,
      department,
      operation: call.operation,
      status: envelope.status ? normaliseStatus(envelope.status) : null,
      data: resolved as TData,
      timestamp: attemptAt,
      source: "GOVSYNC_INTEGRATION_LAYER",
      events,
      trace: trace.hops,
      attempts: attempt,
    };
  }

  return finish(lastFault, MAX_ATTEMPTS, "COMPLETED");
}

/* -------------------------------------------------------------------------- */
/* Non-departmental operations                                                 */
/* -------------------------------------------------------------------------- */

export interface PlatformCall {
  operation: IntegrationOperation;
  principal: IntegrationPrincipal;
  applicationId?: string | null;
  departmentId?: string;
}

const PLATFORM_SCOPE: Record<string, string> = {
  LIST_DEPARTMENTS: "application:read",
  LIST_APPLICATION_APPROVALS: "application:read",
  READ_APPLICATION: "application:read",
  SYNC_APPLICATION: "application:read",
  READ_HEALTH: "platform:monitor",
  READ_INTEGRATION_LOG: "platform:monitor",
  PLAN_FAILURE: "platform:simulate",
  RESET_DEPARTMENT_STATE: "application:write",
};

/**
 * Wraps a non-departmental operation in the same envelope, so a caller cannot
 * tell from the response shape whether a department was involved. It exists to
 * carry the request id, the authorisation check and the audit entry, not to
 * return data: the caller fills the envelope in afterwards.
 */
export function callPlatform(call: PlatformCall): GovSyncGateResult {
  const store = integrationStore();
  const requestId = store.nextId("req");
  const trace = createTrace(() => store.now());
  const applicationId = call.applicationId ?? null;
  const department: GovSyncDepartmentRef | null = call.departmentId
    ? {
        id: call.departmentId,
        name: departmentById(call.departmentId)?.shortName ?? call.departmentId,
      }
    : null;

  const refuse = (fault: IntegrationFault, outcome: AuditEntry["outcome"]): GovSyncFailure => {
    store.recordTrace({
      requestId,
      at: store.now(),
      operation: call.operation,
      success: false,
      hops: trace.hops,
    });
    store.recordAudit({
      requestId,
      principal: call.principal.subject,
      role: call.principal.role,
      operation: call.operation,
      departmentId: call.departmentId ?? null,
      applicationId,
      outcome,
      detail: fault.message,
    });
    return {
      success: false,
      requestId,
      applicationId,
      department,
      operation: call.operation,
      error: fault,
      timestamp: store.now(),
      source: "GOVSYNC_INTEGRATION_LAYER",
      events: [],
      trace: trace.hops,
      attempts: 0,
    };
  };

  trace.add("GOVSYNC_API", `Request ${requestId} accepted for ${call.operation}.`, "OK", 0);

  if (!call.principal.authenticated) {
    trace.add("INTEGRATION_LAYER", "Refused: caller is not authenticated.", "FAILED", 0);
    return refuse(
      makeFault(
        "UNAUTHENTICATED",
        "This prototype requires a named principal before the platform answers.",
      ),
      "DENIED",
    );
  }

  const requiredScope = PLATFORM_SCOPE[call.operation];
  if (!requiredScope || !call.principal.scopes.includes(requiredScope)) {
    trace.add(
      "INTEGRATION_LAYER",
      `Refused: scope "${requiredScope ?? "unknown"}" not granted.`,
      "FAILED",
      0,
    );
    return refuse(
      makeFault(
        "FORBIDDEN",
        `This caller may not perform ${call.operation}.`,
        `Required scope "${requiredScope ?? "unknown"}" is not held by ${call.principal.subject}.`,
      ),
      "DENIED",
    );
  }

  if (applicationId && !applicationById(applicationId)) {
    trace.add("INTEGRATION_LAYER", "Refused: unknown application reference.", "FAILED", 0);
    return refuse(
      makeFault("UNKNOWN_APPLICATION", `No application with reference ${applicationId} exists.`),
      "DENIED",
    );
  }

  trace.add("INTEGRATION_LAYER", `Authorised. Scope "${requiredScope}" granted.`, "OK", 0);

  store.recordTrace({
    requestId,
    at: store.now(),
    operation: call.operation,
    success: true,
    hops: trace.hops,
  });
  store.recordAudit({
    requestId,
    principal: call.principal.subject,
    role: call.principal.role,
    operation: call.operation,
    departmentId: call.departmentId ?? null,
    applicationId,
    outcome: "COMPLETED",
    detail: `${call.operation} accepted by the integration layer.`,
  });

  return {
    success: true,
    requestId,
    applicationId,
    department,
    operation: call.operation,
    status: null,
    timestamp: store.now(),
    source: "GOVSYNC_INTEGRATION_LAYER",
    events: [],
    trace: trace.hops,
    attempts: 0,
  };
}
