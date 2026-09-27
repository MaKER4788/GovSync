/**
 * GovSync domain model.
 * All records in this file describe a SIMULATED environment. No field in
 * this prototype represents a live connection to any government system.
 */

export type WorkflowState = "approved" | "under-review" | "pending" | "blocked";

export type HealthState = "operational" | "degraded" | "maintenance";

export type EventStatus = "success" | "failed" | "in-flight";

export type EventDirection = "inbound" | "outbound" | "internal";

export type Severity = "info" | "success" | "warning" | "error";

export type ApplicantKind = "citizen" | "business";

export type DocumentStatus = "verified" | "awaiting-review" | "rejected";

export interface Department {
  id: string;
  name: string;
  shortName: string;
  code: string;
  authority: string;
  /** Name of the (simulated) departmental system GovSync connects to. */
  systemName: string;
  baseUrl: string;
  apiVersion: string;
  health: HealthState;
  uptimePct: number;
  p95LatencyMs: number;
  requests24h: number;
  successRatePct: number;
  lastHandshakeAt: string;
  authScheme: string;
  capabilities: string[];
  services: string[];
}

export interface RequiredDocument {
  name: string;
  mandatory: boolean;
  state: "received" | "pending" | "waived";
  receivedAt?: string;
  note?: string;
}

export interface DepartmentTrack {
  departmentId: string;
  state: WorkflowState;
  stepId: string;
  lastUpdated: string;
  dependsOn: string[];
  documents: RequiredDocument[];
  officer: string;
  slaTargetDays: number;
  remark: string;
}

export interface WorkflowStep {
  id: string;
  order: number;
  title: string;
  departmentId: string;
  state: WorkflowState;
  description: string;
  startedAt: string;
  completedAt?: string;
  actor: string;
  slaDays: number;
  dependsOn: string[];
  /** Fields this step publishes into the interoperability layer. */
  outputArtifacts: string[];
  remark: string;
}

export interface ApplicationDocument {
  id: string;
  name: string;
  category: string;
  uploadedAt: string;
  sizeKb: number;
  status: DocumentStatus;
  verifiedBy: string;
  origin: string;
}

export interface TimelineEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: string;
  action: string;
  detail: string;
}

export interface Application {
  id: string;
  title: string;
  service: string;
  applicantKind: ApplicantKind;
  applicantName: string;
  entityType: string;
  district: string;
  identifierMasked: string;
  contactMasked: string;
  filedVia: string;
  submittedAt: string;
  lastUpdated: string;
  state: WorkflowState;
  priority: "standard" | "expedited";
  dueAt: string;
  slaTargetDays: number;
  elapsedDays: number;
  summary: string;
  tracks: DepartmentTrack[];
  steps: WorkflowStep[];
  documents: ApplicationDocument[];
  timeline: TimelineEntry[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  at: string;
  severity: Severity;
  read: boolean;
  channel: "portal" | "email" | "sms";
  applicationId?: string;
}

export interface InteropEvent {
  seq: number;
  at: string;
  source: string;
  destination: string;
  eventType: string;
  direction: EventDirection;
  status: EventStatus;
  latencyMs: number;
  correlationId: string;
  applicationId?: string;
  message: string;
}

export interface ApiCounter {
  label: string;
  requests: number;
  success: number;
  failed: number;
}

export interface ThroughputPoint {
  window: string;
  requests: number;
  success: number;
  failed: number;
}

export interface ArchitectureComponent {
  name: string;
  description: string;
}

export interface ArchitectureLayer {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  description: string;
  components: ArchitectureComponent[];
  protocols: string[];
}
