import { ArrowRight, Clock, FileSignature, Link2, Timer } from "lucide-react";

import { DepartmentChip } from "@/components/govsync/department-chip";
import { StatusBadge } from "@/components/govsync/status-badge";
import { departmentById, departmentLabel } from "@/lib/data/departments";
import type { WorkflowStep } from "@/lib/types";
import { workflowStateMeta } from "@/lib/status";
import { cn } from "@/lib/utils";

/**
 * Vertical workflow stepper. Renders the governance chain of an
 * application, including the artefacts each stage publishes and the
 * upstream stages it depends on.
 */
export function WorkflowStepper({
  steps,
  className,
  dense = false,
}: {
  steps: WorkflowStep[];
  className?: string;
  dense?: boolean;
}) {
  return (
    <ol className={cn("relative", className)}>
      {steps.map((step, index) => {
        const meta = workflowStateMeta[step.state];
        const isLast = index === steps.length - 1;
        const dependencies = step.dependsOn
          .map((id) => steps.find((candidate) => candidate.id === id))
          .filter((candidate): candidate is WorkflowStep => Boolean(candidate));

        return (
          <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold",
                  meta.chip,
                )}
              >
                {step.state === "approved" ? (
                  <meta.icon className="size-4" />
                ) : (
                  step.order
                )}
              </span>
              {!isLast ? (
                <span
                  className={cn(
                    "mt-1 w-px flex-1",
                    step.state === "approved" ? "bg-success/40" : "bg-border",
                  )}
                />
              ) : null}
            </div>

            <div
              className={cn(
                "min-w-0 flex-1 rounded-lg border bg-surface-2/40",
                dense ? "p-3" : "p-4",
                step.state === "blocked"
                  ? "border-danger/25"
                  : step.state === "under-review"
                    ? "border-warning/20"
                    : "border-border",
              )}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                    <span className="tabular">Step {step.order}</span>
                    <span className="text-muted-2">/</span>
                    {step.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <DepartmentChip
                      departmentId={step.departmentId}
                      label={departmentLabel(step.departmentId)}
                      size="sm"
                    />
                    <StatusBadge kind="workflow" value={step.state} />
                  </div>
                </div>
                <div className="shrink-0 text-xs text-muted-2 sm:text-right">
                  <p className="tabular">{step.completedAt ?? step.startedAt}</p>
                  <p className="mt-0.5">
                    {step.completedAt ? "Completed" : "Started"} &middot; SLA{" "}
                    {step.slaDays === 0 ? "instant" : `${step.slaDays}d`}
                  </p>
                </div>
              </div>

              {!dense ? (
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {step.description}
                </p>
              ) : null}

              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2 text-xs">
                  <FileSignature className="mt-0.5 size-3.5 shrink-0 text-muted-2" />
                  <div>
                    <dt className="text-muted-2">Artefacts published</dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {step.outputArtifacts.length > 0 ? (
                        step.outputArtifacts.map((artifact) => (
                          <span
                            key={artifact}
                            className="rounded border border-border bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-accent"
                          >
                            {artifact}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-2">None</span>
                      )}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <Link2 className="mt-0.5 size-3.5 shrink-0 text-muted-2" />
                  <div>
                    <dt className="text-muted-2">Depends on</dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {dependencies.length > 0 ? (
                        dependencies.map((dependency) => (
                          <span
                            key={dependency.id}
                            className="inline-flex items-center gap-1 rounded border border-border bg-surface-3 px-1.5 py-0.5 text-[10px] text-muted"
                          >
                            {dependency.state === "approved" ? null : (
                              <Timer className="size-2.5" />
                            )}
                            {dependency.title}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-2">Entry stage</span>
                      )}
                    </dd>
                  </div>
                </div>
              </dl>

              <p className="mt-3 flex items-start gap-2 border-t border-border-subtle pt-3 text-xs leading-relaxed text-muted">
                <Clock className="mt-0.5 size-3.5 shrink-0 text-muted-2" />
                {step.remark}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact horizontal chain used above the fold on detail pages. */
export function WorkflowChain({ steps }: { steps: WorkflowStep[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {steps.map((step, index) => {
        const meta = workflowStateMeta[step.state];
        const department = departmentById(step.departmentId);
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                meta.chip,
              )}
            >
              <meta.icon className="size-3.5" />
              <span className="font-medium">{step.title}</span>
              <span className="font-mono text-[10px] opacity-70">
                {department?.code ?? "GS"}
              </span>
            </span>
            {index < steps.length - 1 ? (
              <ArrowRight className="size-3.5 text-muted-2" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
