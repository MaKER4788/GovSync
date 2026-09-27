import {
  Ban,
  CircleCheck,
  CircleDashed,
  Clock3,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type {
  DocumentStatus,
  EventStatus,
  HealthState,
  Severity,
  WorkflowState,
} from "@/lib/types";

export interface StatusMeta {
  label: string;
  description: string;
  icon: LucideIcon;
  /** Border + background + text classes for chips and cards. */
  chip: string;
  /** Text colour token for the state. */
  text: string;
  /** Solid dot colour token. */
  dot: string;
}

export const workflowStateMeta: Record<WorkflowState, StatusMeta> = {
  approved: {
    label: "Approved",
    description: "Stage completed; the result is published to the shared record.",
    icon: CircleCheck,
    chip: "border-success/35 bg-success/10 text-success",
    text: "text-success",
    dot: "bg-success",
  },
  "under-review": {
    label: "Under Review",
    description: "A departmental officer is actively examining the record.",
    icon: Clock3,
    chip: "border-warning/35 bg-warning/10 text-warning",
    text: "text-warning",
    dot: "bg-warning",
  },
  pending: {
    label: "Pending",
    description: "Queued, waiting on an upstream stage to publish its result.",
    icon: CircleDashed,
    chip: "border-info/30 bg-info/10 text-info",
    text: "text-info",
    dot: "bg-info",
  },
  blocked: {
    label: "Blocked",
    description: "Held by workflow policy until a dependency is satisfied.",
    icon: Ban,
    chip: "border-danger/35 bg-danger/10 text-danger",
    text: "text-danger",
    dot: "bg-danger",
  },
};

export const healthMeta: Record<HealthState, StatusMeta> = {
  operational: {
    label: "Operational",
    description: "Connector healthy, all simulated endpoints within SLA.",
    icon: CircleCheck,
    chip: "border-success/35 bg-success/10 text-success",
    text: "text-success",
    dot: "bg-success",
  },
  degraded: {
    label: "Degraded",
    description: "Latency elevated. Requests are queued and retried, not failed.",
    icon: Clock3,
    chip: "border-warning/35 bg-warning/10 text-warning",
    text: "text-warning",
    dot: "bg-warning",
  },
  maintenance: {
    label: "Maintenance",
    description: "Scheduled window in progress. New requests queued for replay.",
    icon: Wrench,
    chip: "border-info/30 bg-info/10 text-info",
    text: "text-info",
    dot: "bg-info",
  },
};

export const eventStatusMeta: Record<EventStatus, StatusMeta> = {
  success: {
    label: "Success",
    description: "Handled by the receiving system.",
    icon: CircleCheck,
    chip: "border-success/35 bg-success/10 text-success",
    text: "text-success",
    dot: "bg-success",
  },
  failed: {
    label: "Failed",
    description: "Rejected or timed out; retry or dead-letter handling applies.",
    icon: Ban,
    chip: "border-danger/35 bg-danger/10 text-danger",
    text: "text-danger",
    dot: "bg-danger",
  },
  "in-flight": {
    label: "In Flight",
    description: "Queued for retry with backoff.",
    icon: CircleDashed,
    chip: "border-info/30 bg-info/10 text-info",
    text: "text-info",
    dot: "bg-info",
  },
};

export const severityMeta: Record<Severity, StatusMeta> = {
  info: {
    label: "Information",
    description: "Status update.",
    icon: CircleDashed,
    chip: "border-info/30 bg-info/10 text-info",
    text: "text-info",
    dot: "bg-info",
  },
  success: {
    label: "Completed",
    description: "Stage completed successfully.",
    icon: CircleCheck,
    chip: "border-success/35 bg-success/10 text-success",
    text: "text-success",
    dot: "bg-success",
  },
  warning: {
    label: "Attention",
    description: "Stage held; the applicant has been informed.",
    icon: Clock3,
    chip: "border-warning/35 bg-warning/10 text-warning",
    text: "text-warning",
    dot: "bg-warning",
  },
  error: {
    label: "Action Required",
    description: "Applicant input is needed to continue.",
    icon: Ban,
    chip: "border-danger/35 bg-danger/10 text-danger",
    text: "text-danger",
    dot: "bg-danger",
  },
};

export const documentStatusMeta: Record<DocumentStatus, StatusMeta> = {
  verified: {
    label: "Verified",
    description: "Accepted by the reviewing department and sealed in the audit ledger.",
    icon: CircleCheck,
    chip: "border-success/35 bg-success/10 text-success",
    text: "text-success",
    dot: "bg-success",
  },
  "awaiting-review": {
    label: "Awaiting Review",
    description: "Submitted once and queued with the department for verification.",
    icon: Clock3,
    chip: "border-warning/35 bg-warning/10 text-warning",
    text: "text-warning",
    dot: "bg-warning",
  },
  rejected: {
    label: "Rejected",
    description: "Did not meet departmental criteria; a correction was requested.",
    icon: Ban,
    chip: "border-danger/35 bg-danger/10 text-danger",
    text: "text-danger",
    dot: "bg-danger",
  },
};

export const workflowStateOrder: WorkflowState[] = [
  "approved",
  "under-review",
  "pending",
  "blocked",
];

export const healthStateOrder: HealthState[] = [
  "operational",
  "degraded",
  "maintenance",
];
