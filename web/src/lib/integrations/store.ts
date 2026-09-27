/**
 * SIMULATED INTEGRATION STATE.
 *
 * Holds what a real integration layer would keep in a database: the status each
 * mock department currently holds, decisions GovSync still owes a department,
 * the append-only event and audit logs, and the counters the monitoring view
 * reads. All of it is in memory, lives only as long as the server process and
 * is lost on restart. That is deliberate for this phase.
 *
 * The clock is deterministic. `addMinutes` is applied to a frozen base instead
 * of reading the host clock, so two reviewers running the same clicks produce
 * identical timestamps and a production build stays reproducible.
 */

import { connectedDepartmentIds, departmentById } from "@/lib/data/departments";
import { addMinutes } from "@/lib/format";
import type {
  AuditEntry,
  ConnectorHealth,
  ConnectorHealthState,
  ConnectorMetricsRow,
  DepartmentStatus,
  FailurePlan,
  IntegrationEvent,
  IntegrationEventStatus,
  IntegrationHop,
  IntegrationOperation,
  InjectedFailureMode,
} from "@/lib/integrations/types";

/** Frozen base for every integration timestamp. Matches the demo dataset. */
export const INTEGRATION_CLOCK_BASE = "27 Sep 2026, 14:32";

/** Minutes the simulation clock advances per recorded integration call. */
const CLOCK_STEP_MINUTES = 1;

const EVENT_LIMIT = 240;
const TRACE_LIMIT = 60;
const AUDIT_LIMIT = 240;

export interface ConnectorState {
  applicationId: string;
  departmentId: string;
  stageId: string;
  status: DepartmentStatus;
  updatedAt: string;
  reference: string;
  lastRequestId: string | null;
}

/** A decision GovSync has taken but not yet managed to deliver. */
export interface QueuedPublish {
  id: string;
  applicationId: string;
  departmentId: string;
  stageId: string;
  status: DepartmentStatus;
  reason: string;
  decidedBy: string;
  queuedAt: string;
  attempts: number;
  lastError: string | null;
}

export interface TraceRecord {
  requestId: string;
  at: string;
  operation: IntegrationOperation | "unknown";
  success: boolean;
  hops: IntegrationHop[];
}

export interface MetricsTotals {
  totalRequests: number;
  successful: number;
  failed: number;
  timeouts: number;
  validationErrors: number;
  retriedRequests: number;
  pendingPublishes: number;
  activeIntegrations: number;
  lastSyncAt: string | null;
  lastSyncApplicationId: string | null;
}

export interface IntegrationStore {
  now: () => string;
  tick: () => string;
  nextId: (prefix: string) => string;

  connectorState: (
    applicationId: string,
    departmentId: string,
    stageId?: string,
  ) => ConnectorState | undefined;
  setConnectorState: (state: ConnectorState) => void;
  connectorStatesFor: (applicationId: string) => ConnectorState[];
  dropApplication: (applicationId: string) => void;

  enqueuePublish: (publish: QueuedPublish) => void;
  pendingPublishes: (applicationId?: string) => QueuedPublish[];
  removePublish: (id: string) => void;
  /** Removes any queued decision for a stage, e.g. once one is delivered. */
  clearPublishesForStage: (applicationId: string, stageId: string) => number;
  clearPublishes: (applicationId: string) => number;

  recordEvent: (event: Omit<IntegrationEvent, "id" | "seq">) => IntegrationEvent;
  events: (applicationId: string | undefined, limit: number) => IntegrationEvent[];

  recordTrace: (record: TraceRecord) => void;
  trace: (requestId: string) => IntegrationHop[];
  recentTraces: (limit: number) => TraceRecord[];
  /** Recent traces plus recent failures that have scrolled out of that window. */
  notableTraces: (limit: number, failureLimit: number) => TraceRecord[];

  recordAudit: (entry: Omit<AuditEntry, "id" | "at">) => AuditEntry;
  auditLog: (limit: number) => AuditEntry[];

  planFailure: (plan: FailurePlan) => void;
  clearFailure: (departmentId: string) => boolean;
  failurePlans: () => FailurePlan[];
  takeFailure: (departmentId: string) => InjectedFailureMode | null;
  peekFailure: (departmentId: string) => FailurePlan | undefined;

  noteStatus: (departmentId: string, status: DepartmentStatus) => void;
  noteRequest: (input: {
    departmentId: string;
    outcome: IntegrationEventStatus;
    latencyMs: number;
    retried: boolean;
  }) => void;
  noteSync: (applicationId: string) => void;
  metricsRow: (departmentId: string) => ConnectorMetricsRow;
  metricsTotals: () => MetricsTotals;
  health: (departmentId: string) => ConnectorHealth;
  healthFor: (departmentIds: readonly string[]) => ConnectorHealth[];

  reset: () => void;
}

interface Counters {
  requests: number;
  success: number;
  failed: number;
  timeouts: number;
  validationErrors: number;
  retried: number;
  lastStatus: DepartmentStatus | null;
  lastRequestId: string | null;
  lastUpdatedAt: string | null;
  consecutiveFailures: number;
  healthSince: string;
}

function newCounters(at: string): Counters {
  return {
    requests: 0,
    success: 0,
    failed: 0,
    timeouts: 0,
    validationErrors: 0,
    retried: 0,
    lastStatus: null,
    lastRequestId: null,
    lastUpdatedAt: null,
    consecutiveFailures: 0,
    healthSince: at,
  };
}

/**
 * Baseline reachability per department, derived from the Phase 1/2 record so
 * the dashboard panel and the live endpoint cannot disagree.
 */
export function baselineHealth(departmentId: string): ConnectorHealthState {
  const record = departmentById(departmentId);
  if (!record) return "unavailable";
  if (record.health === "operational") return "connected";
  if (record.health === "degraded") return "degraded";
  return "unavailable";
}

function createStore(): IntegrationStore {
  let clockMinutes = 0;
  let sequence = 0;
  let eventSeq = 0;
  let lastSyncAt: string | null = null;
  let lastSyncApplicationId: string | null = null;

  const states = new Map<string, ConnectorState>();
  const publishes: QueuedPublish[] = [];
  const events: IntegrationEvent[] = [];
  const traces: TraceRecord[] = [];
  const audit: AuditEntry[] = [];
  const failures = new Map<string, FailurePlan>();
  const counters = new Map<string, Counters>();

  const now = () => addMinutes(INTEGRATION_CLOCK_BASE, clockMinutes);

  const tick = () => {
    clockMinutes += CLOCK_STEP_MINUTES;
    return now();
  };

  const nextId = (prefix: string) => {
    sequence += 1;
    return `${prefix}_${String(sequence).padStart(4, "0")}`;
  };

  const countersFor = (departmentId: string) => {
    const existing = counters.get(departmentId);
    if (existing) return existing;
    const created = newCounters(now());
    counters.set(departmentId, created);
    return created;
  };

  const trim = <T,>(list: T[], limit: number) => {
    if (list.length > limit) list.splice(0, list.length - limit);
  };

  const pendingFor = (departmentId: string) =>
    publishes.filter((publish) => publish.departmentId === departmentId).length;

  const healthState = (departmentId: string): ConnectorHealthState => {
    const entry = countersFor(departmentId);
    if (entry.consecutiveFailures === 0) return baselineHealth(departmentId);
    return entry.consecutiveFailures === 1 ? "degraded" : "unavailable";
  };

  const healthDetail = (departmentId: string, entry: Counters) => {
    const baseline = baselineHealth(departmentId);
    if (entry.requests === 0) {
      return "Derived from the simulated department record. No call has been made in this session.";
    }
    if (entry.consecutiveFailures === 0) {
      return baseline === "connected"
        ? "The most recent call completed and the connector answered inside its simulated budget."
        : `The most recent call completed. The connector is still shown as ${baseline} because the simulated department record carries that state.`;
    }
    if (entry.consecutiveFailures === 1) {
      return "The most recent call failed. GovSync retried before giving up, so the workflow was preserved.";
    }
    return `${entry.consecutiveFailures} consecutive calls failed. Requests to this connector are being held for a later attempt.`;
  };

  const store: IntegrationStore = {
    now,
    tick,
    nextId,

    connectorState: (applicationId, departmentId, stageId) => {
      if (stageId) return states.get(`${applicationId}:${stageId}`);
      // A department can own more than one stage. Without a stage, prefer the
      // most recent record for that department on this application.
      const matches = [...states.values()].filter(
        (state) => state.applicationId === applicationId && state.departmentId === departmentId,
      );
      return matches.at(-1);
    },

    setConnectorState: (state) => {
      states.set(`${state.applicationId}:${state.stageId || state.departmentId}`, state);
    },

    connectorStatesFor: (applicationId) =>
      [...states.values()].filter((state) => state.applicationId === applicationId),

    dropApplication: (applicationId) => {
      for (const key of [...states.keys()]) {
        if (key.startsWith(`${applicationId}:`)) states.delete(key);
      }
    },

    enqueuePublish: (publish) => {
      const existing = publishes.find(
        (candidate) =>
          candidate.applicationId === publish.applicationId &&
          candidate.departmentId === publish.departmentId &&
          candidate.stageId === publish.stageId,
      );
      if (existing) {
        existing.status = publish.status;
        existing.reason = publish.reason;
        existing.attempts += 1;
        existing.lastError = publish.lastError;
        return;
      }
      publishes.push(publish);
    },

    pendingPublishes: (applicationId) =>
      applicationId
        ? publishes.filter((publish) => publish.applicationId === applicationId)
        : [...publishes],

    removePublish: (id) => {
      const index = publishes.findIndex((publish) => publish.id === id);
      if (index === -1) return;
      publishes.splice(index, 1);
    },

    /**
     * Drops the queued decision for a stage once the department has actually
     * accepted it. Without this an earlier refusal would leave its copy behind,
     * the next sync would deliver it a second time, and a caller reading
     * `queued` would be told a delivered decision is still waiting.
     */
    clearPublishesForStage: (applicationId, stageId) => {
      let removed = 0;
      for (let index = publishes.length - 1; index >= 0; index -= 1) {
        const publish = publishes[index];
        if (publish?.applicationId === applicationId && publish.stageId === stageId) {
          publishes.splice(index, 1);
          removed += 1;
        }
      }
      return removed;
    },

    clearPublishes: (applicationId) => {
      let removed = 0;
      for (let index = publishes.length - 1; index >= 0; index -= 1) {
        const publish = publishes[index];
        if (publish?.applicationId === applicationId) {
          publishes.splice(index, 1);
          removed += 1;
        }
      }
      return removed;
    },

    recordEvent: (event) => {
      eventSeq += 1;
      const stored: IntegrationEvent = {
        ...event,
        id: `evt_${String(eventSeq).padStart(5, "0")}`,
        seq: eventSeq,
      };
      events.push(stored);
      trim(events, EVENT_LIMIT);
      return stored;
    },

    events: (applicationId, limit) => {
      const filtered =
        applicationId === undefined
          ? events
          : events.filter(
              (event) =>
                event.applicationId === null || event.applicationId === applicationId,
            );
      return filtered.slice(-limit).reverse();
    },

    recordTrace: (record) => {
      traces.push(record);
      trim(traces, TRACE_LIMIT);
    },

    trace: (requestId) =>
      traces.find((entry) => entry.requestId === requestId)?.hops ?? [],

          recentTraces: (limit) => traces.slice(-limit).reverse(),

          /**
           * Traces for the monitoring page: the most recent ones, plus the most
           * recent failures that have since scrolled out of that window. Without
           * this a burst of healthy reads hides the one refused write an operator
           * most needs to see.
           */
          notableTraces: (limit, failureLimit) => {
            const recent = traces.slice(-limit).reverse();
            const recentIds = new Set(recent.map((entry) => entry.requestId));
            const failures = traces
              .filter((entry) => !entry.success && !recentIds.has(entry.requestId))
              .slice(-failureLimit)
              .reverse();
            return [...recent, ...failures];
          },

    recordAudit: (entry) => {
      const stored: AuditEntry = {
        ...entry,
        id: `aud_${nextId("a")}`,
        at: now(),
      };
      audit.push(stored);
      trim(audit, AUDIT_LIMIT);
      return stored;
    },

    auditLog: (limit) => audit.slice(-limit).reverse(),

    planFailure: (plan) => {
      failures.set(plan.departmentId, plan);
    },

    clearFailure: (departmentId) => failures.delete(departmentId),

    failurePlans: () => [...failures.values()],

    takeFailure: (departmentId) => {
      const plan = failures.get(departmentId);
      if (!plan) return null;
      if (plan.calls <= 1) failures.delete(departmentId);
      else failures.set(departmentId, { ...plan, calls: plan.calls - 1 });
      return plan.mode;
    },

    peekFailure: (departmentId) => failures.get(departmentId),

    noteStatus: (departmentId, status) => {
      const entry = countersFor(departmentId);
      entry.lastStatus = status;
    },

    noteRequest: ({ departmentId, outcome, retried }) => {
      const entry = countersFor(departmentId);
      entry.requests += 1;
      entry.lastRequestId = nextId("req");
      entry.lastUpdatedAt = now();
      if (retried) entry.retried += 1;
      if (outcome === "SUCCESS") {
        entry.success += 1;
        entry.consecutiveFailures = 0;
      } else {
        entry.failed += 1;
        entry.consecutiveFailures += 1;
        if (outcome === "TIMEOUT") entry.timeouts += 1;
        if (outcome === "VALIDATION_ERROR") entry.validationErrors += 1;
      }
      entry.healthSince = now();
    },

    noteSync: (applicationId) => {
      lastSyncAt = now();
      lastSyncApplicationId = applicationId;
    },

    metricsRow: (departmentId) => {
      const entry = countersFor(departmentId);
      const record = departmentById(departmentId);
      return {
        departmentId,
        departmentName: record?.shortName ?? departmentId,
        requests: entry.requests,
        success: entry.success,
        failed: entry.failed,
        timeouts: entry.timeouts,
        retries: entry.retried,
        pendingPublishes: pendingFor(departmentId),
        lastStatus: entry.lastStatus,
        lastRequestId: entry.lastRequestId,
        lastUpdatedAt: entry.lastUpdatedAt,
        health: failures.has(departmentId) ? "unavailable" : healthState(departmentId),
      };
    },

    metricsTotals: () => {
      const ids = connectedDepartmentIds;
      const rows = ids.map((id) => countersFor(id));
      return {
        totalRequests: rows.reduce((sum, row) => sum + row.requests, 0),
        successful: rows.reduce((sum, row) => sum + row.success, 0),
        failed: rows.reduce((sum, row) => sum + row.failed, 0),
        timeouts: rows.reduce((sum, row) => sum + row.timeouts, 0),
        validationErrors: rows.reduce((sum, row) => sum + row.validationErrors, 0),
        retriedRequests: rows.reduce((sum, row) => sum + row.retried, 0),
        pendingPublishes: publishes.length,
        activeIntegrations: ids.filter((id) => !failures.has(id)).length,
        lastSyncAt,
        lastSyncApplicationId,
      };
    },

    health: (departmentId) => {
      const entry = countersFor(departmentId);
      const record = departmentById(departmentId);
      const planned = failures.get(departmentId);
      return {
        departmentId,
        departmentName: record?.shortName ?? departmentId,
        state: planned ? "unavailable" : healthState(departmentId),
        since: entry.healthSince,
        lastCheckedAt: now(),
        lastRequestId: entry.lastRequestId,
        detail: planned
          ? `A failure is simulated. The next ${planned.calls} call${
              planned.calls === 1 ? "" : "s"
            } will fail with ${planned.mode}.`
          : healthDetail(departmentId, entry),
        simulated: true as const,
      };
    },

    healthFor: (departmentIds) =>
      departmentIds.map((departmentId) => store.health(departmentId)),

    reset: () => {
      clockMinutes = 0;
      sequence = 0;
      eventSeq = 0;
      lastSyncAt = null;
      lastSyncApplicationId = null;
      states.clear();
      publishes.length = 0;
      events.length = 0;
      traces.length = 0;
      audit.length = 0;
      failures.clear();
      counters.clear();
    },
  };

  return store;
}

interface StoreHost {
  __govsyncIntegrationStore?: IntegrationStore;
}

const host = globalThis as unknown as StoreHost;

const store: IntegrationStore = host.__govsyncIntegrationStore ?? createStore();

if (process.env.NODE_ENV !== "production") {
  host.__govsyncIntegrationStore = store;
}

export function integrationStore(): IntegrationStore {
  return store;
}
