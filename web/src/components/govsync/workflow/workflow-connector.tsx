import {
  ArrowDown,
  CircleCheck,
  CircleDashed,
  GitBranch,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { workflowStateMeta } from "@/lib/status";
import type { WorkflowStage } from "@/lib/workflow/types";
import { cn } from "@/lib/utils";

/**
 * The connector drawn between two workflow stages.
 *
 * It carries the dependency reasoning, not just a line: a reviewer can see why
 * stage 4 has not opened, and whether the reason is an upstream stage still
 * working, an upstream stage that failed, or a dependency the record names but
 * the workflow does not contain. The connector is part of the vertical rail at
 * every breakpoint, so the reason is never hidden behind a hover on mobile.
 */

type Tone = "open" | "waiting" | "held" | "invalid";

const toneMeta: Record<
  Tone,
  { line: string; icon: LucideIcon; text: string; border: string; background: string }
> = {
  open: {
    line: "bg-success/45",
    icon: CircleCheck,
    text: "text-success",
    border: "border-success/25",
    background: "bg-success/8",
  },
  waiting: {
    line: "bg-border",
    icon: CircleDashed,
    text: "text-muted-2",
    border: "border-border-subtle",
    background: "bg-surface-2/40",
  },
  held: {
    line: "bg-danger/40",
    icon: TriangleAlert,
    text: "text-danger",
    border: "border-danger/25",
    background: "bg-danger/8",
  },
  invalid: {
    line: "bg-danger/40",
    icon: GitBranch,
    text: "text-danger",
    border: "border-danger/25",
    background: "bg-danger/8",
  },
};

function toneFor(stage: WorkflowStage): Tone {
  if (stage.dependencies.length === 0) return "open";
  if (stage.eligibility.unknown.length > 0) return "invalid";
  if (stage.eligibility.failing.length > 0) return "held";
  if (stage.state === "approved") return "open";
  if (stage.eligibility.blocking.length > 0) return "waiting";
  return "open";
}

export function WorkflowConnector({
  stage,
  previousTitle,
}: {
  stage: WorkflowStage;
  previousTitle: string | null;
}) {
  const tone = toneFor(stage);
  const meta = toneMeta[tone];
  const Icon = meta.icon;

  const reason =
    stage.dependencies.length === 0
      ? "Entry stage. No upstream dependency."
      : stage.eligibility.message;

  return (
    <div className="flex gap-4">
      <div className="flex w-8 shrink-0 flex-col items-center">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full border bg-surface",
            tone === "waiting"
              ? "border-border"
              : tone === "open"
                ? "border-success/35"
                : "border-danger/35",
          )}
        >
          <ArrowDown className={cn("size-3.5", meta.text)} />
        </span>
        <span className={cn("w-px flex-1 min-h-8", meta.line)} />
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 pb-6",
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-1 rounded-md border px-3 py-2",
            meta.border,
            meta.background,
          )}
        >
          <p
            className={cn(
              "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
              meta.text,
            )}
          >
            <Icon className="size-3" />
            {stage.dependencies.length === 0
              ? "Dependency"
              : tone === "invalid"
                ? "Invalid dependency"
                : tone === "held"
                  ? "Dependency held"
                  : tone === "open"
                    ? "Dependency satisfied"
                    : "Waiting on upstream stage"}
          </p>
          <p className="text-[11px] leading-relaxed text-muted">{reason}</p>

          {stage.dependencies.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {stage.dependencies.map((dependency) => {
                const dependencyTone = dependency.resolved
                  ? workflowStateMeta[dependency.state]
                  : workflowStateMeta.blocked;

                return (
                  <li key={dependency.id}>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded border border-border bg-surface-3 px-1.5 py-0.5 text-[10px]",
                        dependency.resolved ? dependencyTone.text : "text-danger",
                      )}
                    >
                      {dependency.resolved ? (
                        <dependencyTone.icon className="size-2.5" />
                      ) : (
                        <TriangleAlert className="size-2.5" />
                      )}
                      <span className="text-foreground">{dependency.title}</span>
                      <span className="text-muted-2">
                        {dependency.resolved
                          ? dependencyTone.label
                          : "not in workflow"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {previousTitle ? (
            <p className="text-[10px] text-muted-2">
              Hand-off from {previousTitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
