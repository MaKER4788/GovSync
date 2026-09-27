/**
 * GovSync domain model.
 * All records in this file describe a SIMULATED environment. No field in
 * this prototype represents a live connection to any government system.
 */

/** State of a single approval stage. */
export type WorkflowState =
  | "approved"
  | "under-review"
  | "pending"
  | "action-required"
  | "blocked"
  | "rejected";

/** State of the application as a whole, as shown to the applicant. */
export type ApplicationState =
  | "in-progress"
  | "under-review"
  | "action-required"
  | "completed";

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
  /** Short description of the simulated service this connector exposes. */
  summary: string;
}

/**
 * Who owes a document requirement.
 *
 * A department's own inputs are applicant obligations and hold the stage in
 * `action-required`. A departmental reference, for example the fire NOC number
 * forwarded by the platform, is expected to arrive on its own and must not be
 * presented to the applicant as something they owe.
 */
export type DocumentObligation = "applicant" | "department" | "platform";

export interface RequiredDocument {
  name: string;
  mandatory: boolean;
  owedBy: DocumentObligation;
  state: "received" | "pending" | "waived";
  receivedAt?: string;
  note?: string;
}

/**
 * Document state as the Phase 3 workflow presents it. `received` records map
 * to `submitted` while a stage is still open and to `verified` once the stage
 * that asked for the document has approved it.
 */
export type StageDocumentState = "submitted" | "verified" | "pending";

export interface DepartmentTrack {
  departmentId: string;
  state: WorkflowState;
  approvalId: string;
  lastUpdated: string;
  dependsOn: string[];
  documents: RequiredDocument[];
  officer: string;
  slaTargetDays: number;
  remark: string;
}

/** Something the applicant must supply before a stage can progress. */
export interface ApprovalAction {
  item: string;
  departmentId: string;
  requestedAt: string;
  /** Demonstration deadline, not a statutory one. */
  deadline: string;
  note?: string;
}

export interface Approval {
  id: string;
  order: number;
  title: string;
  departmentId: string;
  state: WorkflowState;
  /**
   * Share of this stage that is complete, 0-100. An approved stage is
   * always 100. Stages that are waiting behind a dependency still carry
   * the preparation work already done on them, which is what makes an
   * application-level percentage meaningful before the first decision.
   */
  completion: number;
  description: string;
  startedAt: string;
  completedAt?: string;
  actor: string;
  slaDays: number;
  dependsOn: string[];
  /** Fields this stage publishes into the interoperability layer. */
  outputArtifacts: string[];
  /** Set when the applicant has to act for this stage to move. */
  action?: ApprovalAction;
  remark: string;
}

/**
 * Presentation-only shape used by the marketing page's hand-written showcase
 * chain, which carries no completion figures. New code should use `Approval`.
 */
export type WorkflowStep = Omit<Approval, "completion"> & { completion?: number };

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

export interface Activity {
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
  state: ApplicationState;
  priority: "standard" | "expedited";
  dueAt: string;
  slaTargetDays: number;
  elapsedDays: number;
  summary: string;
  tracks: DepartmentTrack[];
  approvals: Approval[];
  documents: ApplicationDocument[];
  activities: Activity[];
}

export interface Notification {
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

export interface ServiceCatalogueEntry {
  id: string;
  name: string;
  description: string;
  departmentIds: string[];
  typicalStages: number;
  slaTargetDays: number;
  applicantKinds: ApplicantKind[];
}
