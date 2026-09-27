import { workflowStateMeta } from "@/lib/status";
import type { WorkflowState } from "@/lib/types";
import type {
  WorkflowFilterId,
  WorkflowStage,
} from "@/lib/workflow/types";

/**
 * Every number the Phase 3 view shows is derived here from the stage list, so
 * the summary, the filter counts and the progress figure can never drift apart
 * and none of them can be edited independently of the workflow state.
 */

export interface WorkflowSummary {
  total: number;
  completed: number;
  inReview: number;
  pending: number;
  blocked: number;
  rejected: number;
  actionRequired: number;
  /** Mean stage completion, 0-100. Matches the application-level figure. */
  progress: number;
  currentStageId: string | null;
  currentStageTitle: string;
  nextStageTitle: string;
  /** True once every stage is approved. */
  complete: boolean;
}

/** States that mean the stage has already produced a decision or a hold. */
const CLOSED_STATES: WorkflowState[] = ["approved", "rejected", "blocked"];

function countStates(stages: WorkflowStage[], state: WorkflowState): number {
  return stages.filter((stage) => stage.state === state).length;
}

export function summariseWorkflow(stages: WorkflowStage[]): WorkflowSummary {
  if (stages.length === 0) {
    return {
      total: 0,
      completed: 0,
      inReview: 0,
      pending: 0,
      blocked: 0,
      rejected: 0,
      actionRequired: 0,
      progress: 0,
      currentStageId: null,
      currentStageTitle: "No workflow recorded",
      nextStageTitle: "Nothing to open",
      complete: false,
    };
  }

  const total = stages.reduce((sum, stage) => sum + stage.completion, 0);
  const current =
    stages.find((stage) => stage.state === "action-required") ??
    stages.find((stage) => stage.state === "under-review") ??
    stages.find((stage) => !CLOSED_STATES.includes(stage.state));

  const next = stages.find(
    (stage) => !CLOSED_STATES.includes(stage.state) && stage.id !== current?.id,
  );

  return {
    total: stages.length,
    completed: countStates(stages, "approved"),
    inReview: countStates(stages, "under-review"),
    pending: countStates(stages, "pending"),
    blocked: countStates(stages, "blocked"),
    rejected: countStates(stages, "rejected"),
    actionRequired: stages.filter((stage) => stage.actionRequired).length,
    progress: Math.round(total / stages.length),
    currentStageId: current?.id ?? null,
    currentStageTitle: current?.title ?? "All stages decided",
    nextStageTitle: next?.title ?? "Nothing left to open",
    complete: stages.every((stage) => stage.state === "approved"),
  };
}

export interface WorkflowFilterOption {
  id: WorkflowFilterId;
  label: string;
  /** Stage states this filter collects. */
  states: WorkflowState[];
  /** Also collect stages that merely owe the applicant something. */
  includeOutstandingActions: boolean;
  tone: string;
}

/** Client-side filters. Deliberately exhaustive over the engine's states. */
export const workflowFilters: WorkflowFilterOption[] = [
  {
    id: "all",
    label: "All",
    states: [],
    includeOutstandingActions: false,
    tone: "text-foreground",
  },
  {
    id: "completed",
    label: "Completed",
    states: ["approved"],
    includeOutstandingActions: false,
    tone: "text-success",
  },
  {
    id: "in-review",
    label: "In Review",
    states: ["under-review"],
    includeOutstandingActions: false,
    tone: "text-warning",
  },
  {
    id: "pending",
    label: "Pending",
    states: ["pending"],
    includeOutstandingActions: false,
    tone: "text-info",
  },
  {
    id: "action-required",
    label: "Action Required",
    states: ["action-required"],
    includeOutstandingActions: true,
    tone: "text-danger",
  },
  {
    id: "blocked",
    label: "Blocked",
    states: ["blocked"],
    includeOutstandingActions: false,
    tone: "text-danger",
  },
  {
    id: "rejected",
    label: "Rejected",
    states: ["rejected"],
    includeOutstandingActions: false,
    tone: "text-danger",
  },
];

export function filterWorkflow(
  stages: WorkflowStage[],
  filter: WorkflowFilterId,
): WorkflowStage[] {
  if (filter === "all") return stages;
  const option = workflowFilters.find((candidate) => candidate.id === filter);
  if (!option) return stages;

  return stages.filter(
    (stage) =>
      option.states.includes(stage.state) ||
      (option.includeOutstandingActions && stage.actionRequired),
  );
}

export function filterCount(
  stages: WorkflowStage[],
  filter: WorkflowFilterId,
): number {
  return filterWorkflow(stages, filter).length;
}

/** Label + icon for a state, so the workflow never relies on colour alone. */
export function describeState(state: WorkflowState): {
  label: string;
  description: string;
} {
  const meta = workflowStateMeta[state];
  return { label: meta.label, description: meta.description };
}
