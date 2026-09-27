import type { ApiCounter, EventDirection, EventStatus, ThroughputPoint } from "@/lib/types";

/**
 * SIMULATED EVENT STREAM.
 * Represents the kind of trail the platform would emit. Every row is
 * locally generated and matches no real integration.
 */

type EventRow = [
  seq: number,
  at: string,
  source: string,
  destination: string,
  eventType: string,
  direction: EventDirection,
  status: EventStatus,
  latencyMs: number,
  correlationId: string,
  applicationId: string | null,
  message: string,
];

const eventRows: EventRow[] = [
  [1041, "12 Mar 2026, 14:32:07", "GovSync Gateway", "Revenue API", "HANDSHAKE OK", "outbound", "success", 384, "cor-8f21c4", null, "OAuth token refreshed, mTLS session re-established."],
  [1040, "12 Mar 2026, 14:31:48", "Revenue API", "GovSync Engine", "VERIFIED", "inbound", "success", 402, "cor-8f21c4", "GS-2026-00142", "Parcel 118/B ownership and land use confirmed."],
  [1039, "12 Mar 2026, 14:31:47", "GovSync Engine", "Audit Ledger", "AUDIT SEALED", "internal", "success", 22, "cor-8f21c4", "GS-2026-00142", "Read event sealed with hash chain link."],
  [1038, "12 Mar 2026, 14:30:12", "Pollution API", "GovSync Engine", "EFFLUENT REPORT RECEIVED", "inbound", "success", 1870, "cor-1a94de", "GS-2026-00142", "Third-party analysis report accepted for verification."],
  [1037, "12 Mar 2026, 14:29:55", "Fire API", "GovSync Gateway", "HANDSHAKE OK", "outbound", "success", 305, "cor-77c2b0", null, "Service credentials within validity window."],
  [1036, "12 Mar 2026, 14:26:03", "GovSync Engine", "Notification Service", "NOTIFICATION SENT", "outbound", "success", 141, "cor-5bd013", "GS-2026-00142", "Inspection slot reminder queued to applicant portal and SMS."],
  [1035, "12 Mar 2026, 14:24:18", "Applicant", "GovSync Unified Interface", "PORTAL SESSION", "inbound", "success", 88, "cor-5bd013", "GS-2026-00142", "Business applicant opened the application timeline."],
  [1034, "12 Mar 2026, 14:21:47", "Municipal API", "GovSync Engine", "SANCTION RECHANGED", "inbound", "success", 890, "cor-3ab8f1", "GS-2026-00155", "Exit width in plan revision 2 differs from revision 1."],
  [1033, "12 Mar 2026, 14:19:02", "GovSync Engine", "Municipal API", "REQUEST CREATED", "outbound", "success", 742, "cor-3ab8f1", "GS-2026-00155", "Building permission review task created with plan set."],
  [1032, "12 Mar 2026, 14:15:30", "Pollution API", "GovSync Engine", "CONSENT GRANTED", "inbound", "success", 1310, "cor-9e2d77", "GS-2026-00161", "Consent reference PCB/CTO/2026/0512 published."],
  [1031, "12 Mar 2026, 14:12:09", "GovSync Engine", "Labour API", "ESTABLISHMENT VERIFIED", "outbound", "success", 540, "cor-9e2d77", "GS-2026-00161", "Entity resolution matched an existing establishment record."],
  [1030, "12 Mar 2026, 14:08:11", "Revenue API", "GovSync Engine", "DEMAND CONFIRMED", "inbound", "success", 398, "cor-6fd120", "GS-2026-00119", "Outstanding demand of INR 18,400 confirmed for FY 2025-26."],
  [1029, "12 Mar 2026, 14:05:55", "GovSync Gateway", "Pollution API", "RATE LIMITED", "outbound", "failed", 120, "cor-c4e8a5", "GS-2026-00142", "Burst limit reached; request queued for retry in 30s."],
  [1028, "12 Mar 2026, 14:05:25", "GovSync Gateway", "Pollution API", "REQUEST CREATED", "outbound", "success", 1298, "cor-c4e8a5", "GS-2026-00142", "Consent to Establish case created from verified parcel data."],
  [1027, "12 Mar 2026, 14:02:37", "GovSync Engine", "Workflow Orchestrator", "STAGE BLOCKED", "internal", "success", 18, "cor-71ab03", "GS-2026-00142", "Fire NOC blocked: upstream artefact consent.reference absent."],
  [1026, "12 Mar 2026, 13:58:02", "Municipal API", "GovSync Gateway", "MAINTENANCE WINDOW", "inbound", "success", 604, "cor-2f6690", null, "Scheduled maintenance until 15:00; requests queued and retried."],
  [1025, "12 Mar 2026, 13:54:41", "Labour API", "GovSync Engine", "INSPECTION BOOKED", "inbound", "success", 486, "cor-b30c7e", "GS-2026-00155", "Factory inspection slot reserved for 18 Mar 2026."],
  [1024, "12 Mar 2026, 13:47:19", "GovSync Engine", "Fire API", "ARTEFACT PUBLISHED", "outbound", "success", 298, "cor-4d9a80", "GS-2026-00142", "layout.validated.v1 published to downstream consumers."],
  [1023, "12 Mar 2026, 13:41:02", "Applicant", "GovSync Unified Interface", "DOCUMENT UPLOADED", "inbound", "success", 640, "cor-4d9a80", "GS-2026-00142", "Effluent analysis report received, virus scan passed."],
  [1022, "12 Mar 2026, 13:36:58", "GovSync Engine", "Audit Ledger", "AUDIT SEALED", "internal", "success", 19, "cor-4d9a80", "GS-2026-00142", "Document custody entry sealed."],
  [1021, "12 Mar 2026, 13:28:44", "Fire API", "GovSync Engine", "LAYOUT PRECHECK PASSED", "inbound", "success", 312, "cor-4d9a80", "GS-2026-00142", "Egress and equipment schedule compliant for occupancy class II."],
  [1020, "12 Mar 2026, 13:12:07", "GovSync Engine", "Revenue API", "DATA FORWARDED", "outbound", "success", 421, "cor-8f21c4", "GS-2026-00142", "Verified parcel record forwarded to the consent register."],
  [1019, "12 Mar 2026, 12:58:31", "Revenue API", "GovSync Engine", "VERIFIED", "inbound", "success", 388, "cor-8f21c4", "GS-2026-00142", "Encumbrance search returned no registered charge."],
  [1018, "12 Mar 2026, 12:44:16", "GovSync Engine", "Audit Ledger", "AUDIT SEALED", "internal", "success", 21, "cor-8f21c4", "GS-2026-00142", "Land verification decision sealed with officer reference."],
  [1017, "12 Mar 2026, 12:20:09", "Notification Service", "Applicant", "NOTIFICATION SENT", "outbound", "success", 176, "cor-5bd013", "GS-2026-00142", "Status update delivered on all three channels."],
  [1016, "12 Mar 2026, 11:58:52", "GovSync Engine", "Fire API", "DEPENDENCY UNMET", "outbound", "success", 274, "cor-71ab03", "GS-2026-00142", "Fire NOC task deferred: consent.reference not published yet."],
  [1015, "12 Mar 2026, 11:31:20", "Labour API", "GovSync Gateway", "HANDSHAKE OK", "outbound", "success", 512, "cor-b30c7e", null, "Signed payload validation passed."],
  [1014, "12 Mar 2026, 11:12:03", "Pollution API", "GovSync Engine", "SLOT CONFIRMED", "inbound", "success", 1620, "cor-c4e8a5", "GS-2026-00142", "Inspection slots open on 14 and 17 Mar 2026."],
  [1013, "12 Mar 2026, 10:47:38", "GovSync Gateway", "Municipal API", "TIMEOUT", "outbound", "failed", 30000, "cor-3ab8f1", "GS-2026-00155", "Upstream did not respond within 30s; moved to dead-letter queue."],
  [1012, "12 Mar 2026, 10:44:02", "GovSync Gateway", "Municipal API", "RETRY SCHEDULED", "outbound", "in-flight", 0, "cor-3ab8f1", "GS-2026-00155", "Retry 2 of 5 scheduled with exponential backoff."],
  [1011, "12 Mar 2026, 10:39:47", "GovSync Engine", "Schema Validator", "SCHEMA REJECTED", "internal", "failed", 34, "cor-3ab8f1", "GS-2026-00155", "field planSet.area declared as string; canonical schema requires number."],
  [1010, "12 Mar 2026, 10:21:15", "GovSync Engine", "Revenue API", "DATA FORWARDED", "outbound", "success", 415, "cor-8f21c4", "GS-2026-00142", "Applicant identity and parcel reference forwarded for verification."],
  [1009, "12 Mar 2026, 10:12:44", "Applicant", "GovSync Unified Interface", "CONSENT GRANTED", "inbound", "success", 96, "cor-8f21c4", "GS-2026-00142", "Applicant consent recorded for four departmental readers."],
  [1008, "12 Mar 2026, 10:12:31", "GovSync Unified Interface", "Workflow Orchestrator", "WORKFLOW INSTANTIATED", "internal", "success", 27, "cor-8f21c4", "GS-2026-00142", "Template MANUFACTURING-V3 started with 6 stages."],
  [1007, "12 Mar 2026, 10:12:18", "GovSync Unified Interface", "Schema Validator", "SCHEMA VALIDATED", "internal", "success", 41, "cor-8f21c4", "GS-2026-00142", "6 documents validated against canonical document schema."],
  [1006, "12 Mar 2026, 10:12:12", "Applicant", "GovSync Unified Interface", "APPLICATION SUBMITTED", "inbound", "success", 142, "cor-8f21c4", "GS-2026-00142", "Application accepted, reference GS-2026-00142 issued."],
  [1005, "12 Mar 2026, 09:58:26", "GovSync Engine", "Labour API", "ARTEFACT PUBLISHED", "outbound", "success", 505, "cor-b30c7e", "GS-2026-00155", "establishment.record.v1 published to municipal building file."],
  [1004, "12 Mar 2026, 09:31:10", "Revenue API", "GovSync Engine", "RECEIPT ISSUED", "inbound", "success", 366, "cor-6fd120", "GS-2026-00137", "Trade licence TL/ND/2025/2210 published to applicant vault."],
  [1003, "12 Mar 2026, 08:55:41", "GovSync Engine", "Fire API", "ARTEFACT PUBLISHED", "outbound", "success", 289, "cor-77c2b0", "GS-2026-00098", "noc.v1 published; renewal closed."],
  [1002, "12 Mar 2026, 08:15:03", "Pollution API", "GovSync Engine", "COMPLIANCE NOTICE", "inbound", "success", 1490, "cor-9e2d77", "GS-2026-00161", "Observation raised on an existing establishment record."],
  [1001, "12 Mar 2026, 06:04:29", "GovSync Gateway", "Identity Provider", "TOKEN ISSUED", "inbound", "success", 74, "cor-0a1f55", null, "Short-lived access token issued to the department connector."],
  [1000, "12 Mar 2026, 05:58:12", "Identity Provider", "GovSync Gateway", "TOKEN REFRESHED", "outbound", "success", 68, "cor-0a1f55", null, "Session renewed for the municipal connector."],
];

export const interopEvents = eventRows.map(
  ([seq, at, source, destination, eventType, direction, status, latencyMs, correlationId, applicationId, message]) => ({
    seq,
    at,
    source,
    destination,
    eventType,
    direction,
    status,
    latencyMs,
    correlationId,
    applicationId: applicationId ?? undefined,
    message,
  }),
);

export const eventCounters: ApiCounter[] = [
  { label: "Revenue", requests: 18420, success: 18364, failed: 56 },
  { label: "Pollution Control", requests: 9260, success: 8721, failed: 539 },
  { label: "Labour", requests: 7130, success: 7089, failed: 41 },
  { label: "Fire", requests: 4980, success: 4938, failed: 42 },
  { label: "Municipal", requests: 6410, success: 6209, failed: 201 },
];

export const platformTotals = {
  windowLabel: "Last 24 hours",
  requests: eventCounters.reduce((sum, counter) => sum + counter.requests, 0),
  success: eventCounters.reduce((sum, counter) => sum + counter.success, 0),
  failed: eventCounters.reduce((sum, counter) => sum + counter.failed, 0),
  pendingWorkflows: 24,
  activeConnectors: 5,
  averageLatencyMs: 764,
  schemaValidationPassRate: 98.4,
};

export const throughputSeries: ThroughputPoint[] = [
  { window: "00:00", requests: 1840, success: 1832, failed: 8 },
  { window: "02:00", requests: 1180, success: 1177, failed: 3 },
  { window: "04:00", requests: 760, success: 757, failed: 3 },
  { window: "06:00", requests: 1490, success: 1483, failed: 7 },
  { window: "08:00", requests: 3260, success: 3241, failed: 19 },
  { window: "10:00", requests: 5480, success: 5440, failed: 40 },
  { window: "12:00", requests: 6120, success: 6071, failed: 49 },
  { window: "14:00", requests: 4320, success: 4298, failed: 22 },
  { window: "16:00", requests: 4980, success: 4951, failed: 29 },
  { window: "18:00", requests: 5610, success: 5588, failed: 22 },
  { window: "20:00", requests: 4390, success: 4372, failed: 18 },
  { window: "22:00", requests: 2350, success: 2342, failed: 8 },
];

export const eventTypeOptions = Array.from(
  new Set(interopEvents.map((event) => event.eventType)),
).sort();
