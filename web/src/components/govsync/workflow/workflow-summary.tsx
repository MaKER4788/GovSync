import {
  Ban,
  CircleCheck,
  CircleDashed,
  CircleSlash,
  Clock3,
  FileCheck2,
} from "lucide-react";

import { workflowStateMeta } from "@/lib/status";
import type { WorkflowState } from "@/lib/types";
import type { WorkflowSummary } from "@/lib/workflow/summary";
import { cn } from "@/lib/utils";

/**
 * Derived workflow summary.
 *
 * Every figure comes from `summariseWorkflow`, which reads the stage list. The
 * counts include the state the engine actually used, so approving a stage
 * moves one number and nothing here can be set independently.
 */
export function WorkflowSummaryBar({
  summary,
  className,
}: {
  summary: WorkflowSummary;
  className?: string;
}) {
  const tiles: { label: string; value: number; icon: typeof Clock3; tone: string }[] = [
    { label: "Completed", value: summary.completed, icon: CircleCheck, tone: "text-success" },
    { label: "In review", value: summary.inReview, icon: Clock3, tone: "text-warning" },
    { label: "Pending", value: summary.pending, icon: CircleDashed, tone: "text-info" },
    {
      label: "Action required",
      value: summary.actionRequired,
      icon: FileCheck2,
      tone: "text-danger",
    },
    { label: "Blocked", value: summary.blocked, icon: Ban, tone: "text-danger" },
    { label: "Rejected", value: summary.rejected, icon: CircleSlash, tone: "text-danger" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="flex items-center gap-2.5 rounded-md border border-border bg-surface-2/40 px-3 py-2.5"
          >
            <tile.icon className={cn("size-4 shrink-0", tile.tone)} aria-hidden="true" />
            <div className="min-w-0">
              <p className={cn("text-lg font-semibold leading-none tabular", tile.tone)}>
                {tile.value}
              </p>
              <p className="mt-1 truncate text-[10px] uppercase tracking-[0.12em] text-muted-2">
                {tile.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-border bg-surface-2/40 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="text-muted-2">
            {summary.completed} of {summary.total} stages complete
          </span>
          <span className="font-semibold text-foreground tabular">
            {summary.progress}%
          </span>
        </div>
        <div
          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-valuenow={summary.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Workflow completion"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${summary.progress}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-2">
          In progress: <span className="text-foreground">{summary.currentStageTitle}</span>
          {" · "}
          Next: <span className="text-foreground">{summary.nextStageTitle}</span>
        </p>
      </div>
    </div>
  );
}

/** Compact legend, so the state vocabulary is readable without a tooltip. */
export function WorkflowStateLegend({ className }: { className?: string }) {
  const states: WorkflowState[] = [
    "approved",
    "under-review",
    "pending",
    "action-required",
    "blocked",
    "rejected",
  ];

  return (
    <ul className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      {states.map((state) => {
        const meta = workflowStateMeta[state];
        const Icon = meta.icon;
        return (
          <li key={state} className="flex items-center gap-1.5">
            <Icon className={cn("size-3.5", meta.text)} aria-hidden="true" />
            <span className="text-[11px] font-medium text-foreground">{meta.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
