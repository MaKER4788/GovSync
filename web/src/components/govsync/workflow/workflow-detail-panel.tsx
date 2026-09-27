import { Building2, Clock, FileSignature, Link2, TriangleAlert } from "lucide-react";

import { DepartmentChip } from "@/components/govsync/department-chip";
import { DefinitionRow } from "@/components/govsync/metric-card";
import { StatusBadge } from "@/components/govsync/status-badge";
import { StageDocumentList } from "@/components/govsync/workflow/stage-document-list";
import { formatStamp } from "@/lib/format";
import { workflowStateMeta } from "@/lib/status";
import type { WorkflowStage } from "@/lib/workflow/types";
import { cn } from "@/lib/utils";

/**
 * Full detail for the selected stage.
 *
 * Sticky beside the rail from `xl` upwards, and rendered inline directly under
 * the rail below that, so a phone user reaches the same information by
 * scrolling rather than by opening a drawer that can cover the content.
 */
export function WorkflowDetailPanel({
  stage,
  nextStage,
}: {
  stage: WorkflowStage | null;
  nextStage: WorkflowStage | null;
}) {
  if (!stage) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm font-medium text-foreground">No stage selected</p>
        <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-muted">
          Choose a stage in the workflow to see the department handling it, the
          documents it needs, what it is waiting on and what happens next.
        </p>
      </div>
    );
  }

  const meta = workflowStateMeta[stage.state];
  const satisfied = stage.eligibility.blocking.length === 0 &&
    stage.eligibility.failing.length === 0 &&
    stage.eligibility.unknown.length === 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">
              Stage {stage.order} of the approval chain
            </p>
            <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">
              {stage.title}
            </h3>
          </div>
          <StatusBadge kind="workflow" value={stage.state} className="self-start" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <DepartmentChip
            departmentId={stage.departmentId}
            label={stage.departmentName}
          />
          <span className="inline-flex items-center gap-1.5 rounded border border-border bg-surface-2 px-2 py-1 text-[11px] text-muted">
            <Building2 className="size-3" />
            {stage.actor}
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted">{meta.description}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{stage.description}</p>
      </div>

      {/* What is happening now */}
      <div
        className={cn(
          "rounded-lg border p-4",
          stage.eligibility.canProceed
            ? "border-success/25 bg-success/8"
            : "border-warning/25 bg-warning/8",
        )}
      >
        <p
          className={cn(
            "flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]",
            stage.eligibility.canProceed ? "text-success" : "text-warning",
          )}
        >
          {stage.eligibility.canProceed ? <meta.icon className="size-3.5" /> : <Clock className="size-3.5" />}
          Current action
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-foreground">
          {stage.action
            ? `${stage.action.item}. ${stage.action.note ?? ""} Requested ${formatStamp(
                stage.action.requestedAt,
              )}, demo deadline ${stage.action.deadline}.`
            : stage.state === "approved"
              ? `Decision recorded. This stage has published ${stage.outputArtifacts.length} artefact${
                  stage.outputArtifacts.length === 1 ? "" : "s"
                } to the shared record.`
              : stage.eligibility.message}
        </p>
      </div>

      {stage.actionRequired ? (
        <p className="flex items-start gap-2 rounded-md border border-danger/25 bg-danger/8 px-3 py-2 text-[11px] leading-relaxed text-foreground">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-danger" />
          <span>
            <span className="font-semibold text-danger">Action required. </span>
            The applicant has to supply a document before this stage can be decided.
            The demo does not accept uploads.
          </span>
        </p>
      ) : null}

      {/* Record */}
      <dl className="rounded-lg border border-border bg-surface">
        <DefinitionRow term="Responsible officer">{stage.assignee}</DefinitionRow>
        <DefinitionRow term="Started">{formatStamp(stage.startedAt)}</DefinitionRow>
        <DefinitionRow term="Completed">
          {stage.completedAt ? formatStamp(stage.completedAt) : "Not yet decided"}
        </DefinitionRow>
        <DefinitionRow term="Stage SLA">
          <span className="tabular">
            {stage.slaDays === 0 ? "Instantaneous" : `${stage.slaDays} days`}
          </span>
        </DefinitionRow>
        <DefinitionRow term="Stage completion">
          <span className="tabular">{stage.completion}%</span>
        </DefinitionRow>
        <DefinitionRow term="Departmental remark">
          <span className="text-sm leading-relaxed text-muted">{stage.remark}</span>
        </DefinitionRow>
      </dl>

      {/* Documents */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">
          Documents required at this stage
        </p>
        <StageDocumentList documents={stage.documents} className="mt-3" />
      </div>

      {/* Dependencies */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">
          Dependencies
        </p>
        {stage.dependencies.length === 0 ? (
          <p className="mt-2 text-xs text-muted-2">
            Entry stage. Nothing upstream has to clear before this one opens.
          </p>
        ) : (
          <>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              This stage opens only once every stage below is approved.
            </p>
            <ul className="mt-3 space-y-2">
              {stage.dependencies.map((dependency) => (
                <li
                  key={dependency.id}
                  className="flex flex-col gap-1.5 rounded-md border border-border-subtle bg-surface-2/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="inline-flex items-center gap-2 text-xs text-foreground">
                    <Link2 className="size-3.5 shrink-0 text-muted-2" />
                    {dependency.title}
                    <span className="text-[10px] text-muted-2">
                      {dependency.resolved
                        ? `Stage ${dependency.order}`
                        : "Not in workflow"}
                    </span>
                  </span>
                  <StatusBadge
                    kind="workflow"
                    value={dependency.state}
                    dot={dependency.resolved}
                  />
                </li>
              ))}
            </ul>
            <p
              className={cn(
                "mt-3 text-[11px] font-medium",
                satisfied ? "text-success" : "text-warning",
              )}
            >
              {satisfied
                ? "Dependency satisfied."
                : stage.eligibility.unknown.length > 0
                  ? "This stage cannot open: the record names a dependency that is not a stage in this workflow."
                  : stage.eligibility.failing.length > 0
                    ? "This stage cannot open: an upstream stage was rejected or blocked."
                    : "Waiting on an upstream stage that has not been approved yet."}
            </p>
          </>
        )}
      </div>

      {/* Artefacts and next step */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">
          <FileSignature className="size-3" />
          Artefacts published downstream
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {stage.outputArtifacts.length > 0 ? (
            stage.outputArtifacts.map((artifact) => (
              <span
                key={artifact}
                className="rounded border border-border bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-accent"
              >
                {artifact}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-2">None recorded</span>
          )}
        </div>

        <p className="mt-4 border-t border-border-subtle pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">
          What happens next
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          {nextStage
            ? `${nextStage.title} is the next stage in the chain${
                nextStage.eligibility.blocking.length > 0
                  ? `, and is waiting on ${nextStage.eligibility.blocking
                      .map((id) => stage.dependencies.find((d) => d.id === id)?.title ?? id)
                      .join(", ")}`
                  : " and is eligible to open"
              }.`
            : "This is the last stage in the chain. When it approves, the application is complete."}
        </p>
      </div>
    </div>
  );
}
