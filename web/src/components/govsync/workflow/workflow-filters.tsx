import { Filter } from "lucide-react";

import { filterCount, workflowFilters } from "@/lib/workflow/summary";
import type { WorkflowFilterId, WorkflowStage } from "@/lib/workflow/types";
import { cn } from "@/lib/utils";

/**
 * Client-side stage filters.
 *
 * Filtering only changes what is listed. The counts are derived from the same
 * stage list as the summary, and the selected filter is announced so a screen
 * reader user knows the list has been narrowed.
 */
export function WorkflowFilters({
  stages,
  active,
  onChange,
  className,
}: {
  stages: WorkflowStage[];
  active: WorkflowFilterId;
  onChange: (filter: WorkflowFilterId) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">
        <Filter className="size-3" />
        Filter stages
      </p>
      <div
        role="group"
        aria-label="Filter workflow stages by state"
        className="flex flex-wrap gap-1.5"
      >
        {workflowFilters.map((option) => {
          const count = filterCount(stages, option.id);
          const isActive = option.id === active;
          const isEmpty = count === 0;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                isActive
                  ? "border-primary/60 bg-primary/15 text-primary-foreground"
                  : "border-border bg-surface-2/40 text-muted hover:border-border-strong hover:text-foreground",
                isEmpty && !isActive && "opacity-50",
              )}
            >
              <span>{option.label}</span>
              <span
                className={cn(
                  "rounded px-1 font-mono text-[10px] tabular",
                  isActive ? "bg-primary/25" : "bg-surface-3",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
