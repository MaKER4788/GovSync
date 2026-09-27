import {
  Ban,
  CircleCheck,
  CircleSlash,
  FastForward,
  FileCheck2,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SIMULATION } from "@/lib/data/departments";
import { formatStamp } from "@/lib/format";
import type { TransitionNotice, WorkflowCommand } from "@/lib/workflow/types";
import { cn } from "@/lib/utils";

/**
 * Demo simulation controls.
 *
 * These buttons are the only interactive surface in the prototype. They call
 * pure engine functions in the browser and re-render; nothing is submitted,
 * uploaded or persisted, and the surrounding record set is untouched. The
 * SIMULATION MODE marker is shown next to them on every screen size so a stage
 * transition can never be mistaken for a real departmental decision.
 */
export function DemoControls({
  stageTitle,
  canProceed,
  onCommand,
  onReset,
  disabled,
  clock,
  notice,
  transitionCount,
  className,
}: {
  stageTitle: string;
  canProceed: boolean;
  onCommand: (command: WorkflowCommand["kind"]) => void;
  onReset: () => void;
  disabled: boolean;
  clock: string;
  notice: TransitionNotice | null;
  transitionCount: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning/8 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-warning">
          <TriangleAlert className="size-3.5" />
          Simulation mode
        </p>
        <p className="text-[11px] leading-relaxed text-muted">
          No government system is contacted. Changes apply to this browser view
          only and are cleared when the page reloads.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">
          Acting on {stageTitle}
        </p>
        <p className="mt-1 text-[11px] text-muted-2">
          {canProceed
            ? "Dependencies are satisfied, so this stage can be decided."
            : "This stage is not currently eligible. Approve and hand-over will be refused, and the reason is shown below."}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => onCommand("approve")}
            disabled={disabled}
            title="Record a departmental approval for the selected stage"
          >
            <CircleCheck className="size-4" />
            Approve Current Step
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onCommand("next")}
            disabled={disabled}
            title="Close the selected stage and open the next eligible one"
          >
            <FastForward className="size-4" />
            Move to Next Step
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onCommand("request-document")}
            disabled={disabled}
            title="Ask the applicant for a document and hold the stage"
          >
            <FileCheck2 className="size-4" />
            Request Document
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCommand("block")}
            disabled={disabled}
            title="Hold the stage by workflow policy"
          >
            <Ban className="size-4" />
            Block Step
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCommand("reject")}
            disabled={disabled}
            title="Decide the stage against the application"
          >
            <CircleSlash className="size-4" />
            Reject Step
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onReset}
            disabled={transitionCount === 0}
            title="Return every stage to the recorded state"
          >
            <RotateCcw className="size-4" />
            Reset Demo
          </Button>
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border-subtle pt-3 text-[10px] text-muted-2 tabular">
          <span>Simulation clock {formatStamp(clock)}</span>
          <span>
            {transitionCount} simulated transition{transitionCount === 1 ? "" : "s"} this
            session
          </span>
          <span>{SIMULATION.environmentName}</span>
        </p>
      </div>

      {notice ? (
        <div
          className={cn(
            "rounded-md border px-3 py-2.5",
            notice.tone === "applied"
              ? "border-success/25 bg-success/8"
              : notice.tone === "refused"
                ? "border-warning/30 bg-warning/8"
                : "border-border-subtle bg-surface-2/40",
          )}
          role="status"
          aria-live="polite"
        >
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.14em]",
              notice.tone === "applied"
                ? "text-success"
                : notice.tone === "refused"
                  ? "text-warning"
                  : "text-muted-2",
            )}
          >
            {notice.tone === "applied"
              ? "Transition applied"
              : notice.tone === "refused"
                ? "Transition refused"
                : "No change"}
          </p>
          <p className="mt-1 text-xs font-medium text-foreground">{notice.title}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
            {notice.detail}
          </p>
          <p className="mt-1.5 text-[10px] text-muted-2 tabular">
            Recorded at {formatStamp(notice.at)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
