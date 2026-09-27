import type {
  Activity,
  Approval,
  ApprovalAction,
  DepartmentTrack,
  DocumentObligation,
  StageDocumentState,
  WorkflowState,
} from "@/lib/types";

/**
 * Phase 3 workflow model.
 *
 * The engine does not store approvals. It reads the `Approval` records that
 * already sit on an application and projects them into a richer `WorkflowStage`
 * that carries everything the interactive view needs: the resolved
 * department, the applicant's document obligations, the dependency graph
 * walked one level deep, and the eligibility verdict derived from that graph.
 *
 * Everything here is plain data so a stage list can cross the server/client
 * boundary and be replayed by pure functions in the browser.
 */

/** A document the stage needs before it can decide. Never uploaded in the demo. */
export interface StageDocument {
  id: string;
  name: string;
  mandatory: boolean;
  /** Who owes it. Only applicant obligations can hold a stage. */
  owedBy: DocumentObligation;
  state: StageDocumentState;
  receivedAt?: string;
  note?: string;
}

/** One edge of the dependency graph, resolved to the stage it points at. */
export interface WorkflowDependency {
  id: string;
  title: string;
  order: number;
  state: WorkflowState;
  /** False when the recorded dependency id matches no stage in the workflow. */
  resolved: boolean;
  departmentName: string;
}

/** Why a stage is or is not allowed to start, phrased for the applicant. */
export type EligibilityReason =
  | "approved"
  | "eligible"
  | "waiting-on-dependency"
  | "dependency-held"
  | "unknown-dependency"
  | "applicant-action";

export interface Eligibility {
  /** True when every dependency is approved and the stage can be decided. */
  canProceed: boolean;
  reason: EligibilityReason;
  /** Short sentence shown under the stage. */
  message: string;
  /** Dependency ids that are not approved yet. */
  blocking: string[];
  /** Dependency ids that are rejected or blocked. */
  failing: string[];
  /** Dependency ids recorded in data but absent from the workflow. */
  unknown: string[];
  /** Mandatory documents still outstanding against this stage. */
  outstandingDocuments: string[];
}

export interface WorkflowStage {
  id: string;
  order: number;
  title: string;
  description: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  /** False when the department id is not in the simulated department set. */
  departmentKnown: boolean;
  state: WorkflowState;
  completion: number;
  actor: string;
  /** Departmental officer from the track, falling back to the recorded actor. */
  assignee: string;
  startedAt: string;
  completedAt?: string;
  slaDays: number;
  dependsOn: string[];
  dependencies: WorkflowDependency[];
  documents: StageDocument[];
  action?: ApprovalAction;
  remark: string;
  outputArtifacts: string[];
  eligibility: Eligibility;
  /**
   * True when the applicant still owes something on this stage, whether that
   * is the engine state `action-required` or a mandatory document the stage is
   * still waiting on.
   */
  actionRequired: boolean;
  /** True when the stage is decided: approved, rejected or blocked. */
  decided: boolean;
}

/** Data quality problems found while projecting an application. */
export interface WorkflowWarning {
  kind:
    | "missing-department"
    | "unknown-dependency"
    | "duplicate-order"
    | "state-drift"
    | "no-stages";
  message: string;
  stageId?: string;
}

/** The serialisable bundle a server component hands to the client engine. */
export interface WorkflowSnapshot {
  applicationId: string;
  applicationTitle: string;
  /** Starting point for the deterministic simulation clock. */
  clockStart: string;
  stages: WorkflowStage[];
  warnings: WorkflowWarning[];
  /** Activity already recorded against the application, newest first. */
  activities: Activity[];
  /** Stage the workflow opens on. */
  initialStageId: string | null;
}

export type WorkflowCommand =
  | { kind: "approve"; stageId: string }
  | { kind: "next"; stageId: string }
  | { kind: "request-document"; stageId: string }
  | { kind: "block"; stageId: string }
  | { kind: "reject"; stageId: string };

/** One recorded transition, shown to the reviewer as it happens. */
export interface TransitionNotice {
  id: string;
  at: string;
  kind: WorkflowCommand["kind"];
  tone: "applied" | "refused" | "info";
  title: string;
  detail: string;
  /** Stages the command changed, for highlighting. */
  stageIds: string[];
  /** Appended to the application activity feed. */
  activity?: Activity;
}

export interface WorkflowResult {
  stages: WorkflowStage[];
  notices: TransitionNotice[];
  /** Latest clock reading after the command. */
  clock: string;
}

/** Client-side view of one stage requirement, used by the filter bar. */
export type WorkflowFilterId =
  | "all"
  | "completed"
  | "in-review"
  | "pending"
  | "action-required"
  | "blocked"
  | "rejected";

/** Track a stage belongs to, resolved once during projection. */
export type StageTrack = DepartmentTrack;

export type StageApproval = Approval;
