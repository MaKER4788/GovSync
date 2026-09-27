import { Circle, CircleCheck, Clock3, FileCheck2 } from "lucide-react";

import { StatusBadge } from "@/components/govsync/status-badge";
import { departmentLabel } from "@/lib/data/departments";
import type { Approval } from "@/lib/types";
import { cn } from "@/lib/utils";

/** How a stage reads to the applicant, independent of the engine state. */
export type StagePhase = "completed" | "current" | "upcoming";

const phaseLabel: Record<StagePhase, string> = {
  completed: "Completed",
  current: "Current",
  upcoming: "Upcoming",
};

const phaseClasses: Record<StagePhase, string> = {
  completed: "border-success/30 bg-success/8 text-success",
  current: "border-warning/40 bg-warning/10 text-warning",
  upcoming: "border-border bg-surface-2/50 text-muted-2",
};

const phaseIcon: Record<StagePhase, typeof Circle> = {
  completed: CircleCheck,
  current: Clock3,
  upcoming: Circle,
};

/**
 * Classifies a stage for the applicant-facing progress strip. The first stage
 * that still needs a decision is the current one; everything after it is
 * upcoming, even where preparation work has already started.
 */
export function stagePhase(approvals: Approval[], index: number): StagePhase {
  const stage = approvals[index];
  if (!stage) return "upcoming";
  if (stage.state === "approved") return "completed";
  const openIndex = approvals.findIndex((candidate) => candidate.state !== "approved");
  return index === (openIndex === -1 ? approvals.length : openIndex)
    ? "current"
    : "upcoming";
}

/**
 * Compact approval chain. Each stage is labelled Completed, Current or Upcoming
 * in text as well as colour, so the state survives a monochrome render.
 */
export function ApprovalProgress({
  approvals,
  className,
}: {
  approvals: Approval[];
  className?: string;
}) {
  return (
    <ol className={cn("grid gap-2 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {approvals.map((approval, index) => {
        const phase = stagePhase(approvals, index);
        const Icon = phase === "upcoming" && approval.action ? FileCheck2 : phaseIcon[phase];
        return (
          <li
            key={approval.id}
            className={cn(
              "relative rounded-md border px-3 py-2.5",
              phaseClasses[phase],
            )}
          >
            <div className="flex items-start gap-2.5">
              <span
                className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-current/40"
                aria-hidden="true"
              >
                <Icon className="size-3" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">
                  {phaseLabel[phase]} &middot; Step {approval.order}
                </p>
                <p className="mt-1 text-xs font-medium text-foreground">
                  {approval.title}
                </p>
                <p className="mt-1 text-[11px] text-muted-2">
                  {departmentLabel(approval.departmentId)}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <StatusBadge kind="workflow" value={approval.state} />
              <span className="text-[10px] text-muted-2 tabular">
                {approval.completion}% of stage
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
