import { ChevronRight, FileCheck2, UserCheck } from "lucide-react";

import { DepartmentChip } from "@/components/govsync/department-chip";
import { StatusBadge } from "@/components/govsync/status-badge";
import { formatStamp } from "@/lib/format";
import { workflowStateMeta } from "@/lib/status";
import type { WorkflowStage } from "@/lib/workflow/types";
import { cn } from "@/lib/utils";

/**
 * One stage in the vertical workflow rail.
 *
 * Rendered as a button so a stage can be opened on any device, including a
 * phone, without a hover affordance. Every state is carried by an icon and a
 * word as well as colour, and the outstanding-document requirement is called
 * out separately from the engine state so a stage that is Under Review while
 * owing the applicant a document cannot be misread.
 */
export function WorkflowNode({
  stage,
  selected,
  changed,
  onSelect,
}: {
  stage: WorkflowStage;
  selected: boolean;
  /** Set for one render after a command touches this stage. */
  changed: boolean;
  onSelect: (stageId: string) => void;
}) {
  const meta = workflowStateMeta[stage.state];
  const Icon = meta.icon;
  const documentsDone = stage.documents.filter(
    (document) => document.state !== "pending",
  ).length;
  const isOpen = stage.state === "under-review" || stage.state === "action-required";

  return (
    <div className="flex gap-4">
      <div className="flex w-8 shrink-0 flex-col items-center">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold",
            meta.chip,
            isOpen && "ring-4 ring-primary/10",
            changed && "ring-4 ring-accent/25",
          )}
          aria-hidden="true"
        >
          {stage.state === "approved" ? <Icon className="size-4" /> : stage.order}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onSelect(stage.id)}
        aria-current={selected ? "step" : undefined}
        aria-label={`Stage ${stage.order}, ${stage.title}, ${meta.label}`}
        className={cn(
          "min-w-0 flex-1 rounded-lg border bg-surface-2/40 p-4 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          selected ? "border-primary/60 bg-primary/8" : "border-border",
          changed && "border-accent/50",
        )}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-2 tabular">
                Stage {stage.order}
              </span>
              {stage.title}
              {!stage.departmentKnown ? (
                <span className="rounded border border-danger/35 bg-danger/10 px-1.5 py-0.5 text-[10px] font-medium text-danger">
                  Department not in demo set
                </span>
              ) : null}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge kind="workflow" value={stage.state} />
              <DepartmentChip
                departmentId={stage.departmentId}
                label={stage.departmentName}
                size="sm"
              />
            </div>
          </div>

          <div className="shrink-0 text-[11px] text-muted-2 sm:text-right">
            <p className="tabular">
              {stage.completedAt
                ? `Completed ${formatStamp(stage.completedAt)}`
                : `Started ${formatStamp(stage.startedAt)}`}
            </p>
            <p className="mt-0.5">
              SLA {stage.slaDays === 0 ? "instant" : `${stage.slaDays}d`} &middot;{" "}
              <span className="tabular">{stage.completion}% of stage</span>
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted">{stage.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle pt-3 text-[11px] text-muted-2">
          <span className="inline-flex items-center gap-1.5">
            <UserCheck className="size-3.5" />
            <span className="text-foreground">{stage.assignee}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 tabular">
            <FileCheck2 className="size-3.5" />
            Documents <span className="text-foreground">{documentsDone}/{stage.documents.length}</span>
          </span>
        </div>

        {stage.actionRequired ? (
          <p className="mt-3 flex items-start gap-2 rounded-md border border-danger/25 bg-danger/8 px-3 py-2 text-[11px] leading-relaxed text-foreground">
            <FileCheck2 className="mt-0.5 size-3.5 shrink-0 text-danger" />
            <span>
              <span className="font-semibold text-danger">
                Action required.
              </span>{" "}
              {stage.action
                ? `${stage.action.item}, requested by ${stage.departmentName} on ${formatStamp(
                    stage.action.requestedAt,
                  )}. Demo deadline ${stage.action.deadline}.`
                : stage.eligibility.outstandingDocuments.length > 0
                  ? `Outstanding: ${stage.eligibility.outstandingDocuments.join(", ")}.`
                  : "The applicant has to respond before this stage can move."}
            </span>
          </p>
        ) : null}

        <p className="mt-3 flex items-center justify-between gap-2 text-[11px] font-medium text-accent">
          <span>View stage detail</span>
          <ChevronRight className="size-3.5" />
        </p>
      </button>
    </div>
  );
}
