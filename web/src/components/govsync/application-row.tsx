import { ArrowUpRight, Building2, CalendarClock, Layers, User } from "lucide-react";
import Link from "next/link";

import { ApplicationStatusBadge } from "@/components/govsync/status-badge";
import { applicationProgress, currentStageLabel } from "@/lib/data/applications";
import { departmentsOf } from "@/lib/data/applications";
import type { Application } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Compact link row used where a full table would be too heavy. */
export function ApplicationRow({
  application,
  className,
}: {
  application: Application;
  className?: string;
}) {
  const progress = applicationProgress(application);
  const openStages = application.approvals.filter(
    (approval) => approval.state !== "approved",
  ).length;
  const departments = departmentsOf(application);

  return (
    <Link
      href={`/applications/${application.id}`}
      className={cn(
        "group block border-b border-border-subtle px-5 py-4 transition-colors last:border-b-0 hover:bg-surface-2/60",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-accent">
              {application.id}
            </span>
            <ApplicationStatusBadge value={application.state} />
            {application.priority === "expedited" ? (
              <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                Expedited
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm font-semibold text-foreground">
            {application.title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-2">
            <span className="inline-flex items-center gap-1.5">
              {application.applicantKind === "business" ? (
                <Building2 className="size-3" />
              ) : (
                <User className="size-3" />
              )}
              {application.service}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="size-3" />
              {departments.length} department{departments.length === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3" />
              Updated {application.lastUpdated}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-5 lg:w-80">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[11px] text-muted-2">
              <span>
                {currentStageLabel(application)} &middot;{" "}
                {openStages} open stage{openStages === 1 ? "" : "s"}
              </span>
              <span className="tabular">{progress}% complete</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-muted-2 transition-colors group-hover:text-accent" />
        </div>
      </div>
    </Link>
  );
}
