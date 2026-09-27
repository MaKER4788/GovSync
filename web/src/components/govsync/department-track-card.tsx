import {
  CalendarClock,
  FileText,
  Landmark,
  ShieldCheck,
  UserCog,
} from "lucide-react";

import { Monogram } from "@/components/govsync/department-chip";
import { StatusBadge } from "@/components/govsync/status-badge";
import { departmentById, departmentLabel } from "@/lib/data/departments";
import type { DepartmentTrack, WorkflowStep } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Per-department view of one application: status, required documents,
 * last update and upstream dependencies.
 */
export function DepartmentTrackCard({
  track,
  step,
  steps,
}: {
  track: DepartmentTrack;
  step?: WorkflowStep;
  steps: WorkflowStep[];
}) {
  const department = departmentById(track.departmentId);
  const received = track.documents.filter((doc) => doc.state === "received").length;
  const pending = track.documents.filter((doc) => doc.state === "pending").length;

  return (
    <article
      className={cn(
        "flex flex-col rounded-lg border bg-surface",
        track.state === "blocked" && "border-danger/25",
        track.state === "under-review" && "border-warning/20",
        track.state === "approved" && "border-success/20",
        track.state === "pending" && "border-border",
      )}
    >
      <header className="flex items-start gap-3 border-b border-border-subtle p-4">
        <Monogram departmentId={track.departmentId} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            {department?.shortName ?? departmentLabel(track.departmentId)}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-2">
            <UserCog className="size-3" />
            {track.officer}
          </p>
        </div>
        <StatusBadge kind="workflow" value={track.state} />
      </header>

      <div className="grid grid-cols-2 gap-px bg-border-subtle text-xs">
        <div className="bg-surface px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-2">
            Documents
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground tabular">
            {received} of {track.documents.length} received
          </p>
        </div>
        <div className="bg-surface px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-2">
            Stage SLA
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground tabular">
            {track.slaTargetDays} days
          </p>
        </div>
      </div>

      <div className="space-y-2 border-b border-border-subtle p-4">
        <p className="flex items-center gap-2 text-[11px] text-muted-2">
          <CalendarClock className="size-3.5" />
          Last updated {track.lastUpdated}
        </p>
        <p className="flex items-center gap-2 text-[11px] text-muted-2">
          <Landmark className="size-3.5" />
          System: {department?.systemName ?? "GovSync platform"}
        </p>
        {step && step.dependsOn.length > 0 ? (
          <p className="flex items-start gap-2 text-[11px] text-muted-2">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Depends on{" "}
              {step.dependsOn
                .map((id) => steps.find((candidate) => candidate.id === id)?.title)
                .filter((title): title is string => Boolean(title))
                .join(", ")}
            </span>
          </p>
        ) : null}
      </div>

      <ul className="divide-y divide-border-subtle">
        {track.documents.map((document) => (
          <li key={document.name} className="flex items-start gap-2.5 px-4 py-2.5">
            <FileText
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                document.state === "received"
                  ? "text-success"
                  : document.state === "waived"
                    ? "text-muted-2"
                    : "text-warning",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground">
                {document.name}
                {document.mandatory ? null : (
                  <span className="ml-1.5 text-[10px] text-muted-2">(optional)</span>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-2">
                {document.state === "received"
                  ? `Received ${document.receivedAt ?? ""}`
                  : document.state === "waived"
                    ? "Waived by department"
                    : "Awaiting: forwarded automatically by GovSync when the upstream stage completes"}
                {document.note ? ` — ${document.note}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {pending > 0 ? (
        <footer className="border-t border-border-subtle bg-warning/5 px-4 py-2.5 text-[11px] text-warning">
          {pending} document{pending === 1 ? "" : "s"} outstanding with this department
        </footer>
      ) : (
        <footer className="border-t border-border-subtle bg-success/5 px-4 py-2.5 text-[11px] text-success">
          Document set complete
        </footer>
      )}

      <p className="border-t border-border-subtle px-4 py-3 text-xs leading-relaxed text-muted">
        {track.remark}
      </p>
    </article>
  );
}
