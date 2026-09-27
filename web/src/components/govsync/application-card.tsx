import { ArrowUpRight, Building2, CalendarClock, User } from "lucide-react";
import Link from "next/link";

import { DepartmentChip } from "@/components/govsync/department-chip";
import { ProgressBar } from "@/components/govsync/progress-bar";
import { ApplicationStatusBadge } from "@/components/govsync/status-badge";
import {
  applicationProgress,
  approvedCount,
  currentStageLabel,
  departmentsOf,
} from "@/lib/data/applications";
import { departmentLabel } from "@/lib/data/departments";
import { formatDate } from "@/lib/format";
import type { Application } from "@/lib/types";

/**
 * Narrow-screen presentation of one application. Carries the same fields as
 * the table row: reference, departments, current stage, progress, status,
 * last update and the link to the full record.
 */
export function ApplicationCard({ application }: { application: Application }) {
  const progress = applicationProgress(application);
  const departments = departmentsOf(application);

  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-accent">{application.id}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {application.title}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-2">
            {application.applicantKind === "business" ? (
              <Building2 className="size-3" aria-hidden="true" />
            ) : (
              <User className="size-3" aria-hidden="true" />
            )}
            {application.applicantName}
          </p>
        </div>
        <ApplicationStatusBadge value={application.state} />
      </div>

      <dl className="mt-3 space-y-2 text-xs">
        <div className="flex gap-3">
          <dt className="w-24 shrink-0 text-muted-2">Departments</dt>
          <dd className="flex flex-wrap gap-1.5">
            {departments.map((departmentId) => (
              <DepartmentChip
                key={departmentId}
                departmentId={departmentId}
                label={departmentLabel(departmentId)}
                size="sm"
              />
            ))}
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 shrink-0 text-muted-2">Current stage</dt>
          <dd className="text-foreground">{currentStageLabel(application)}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 shrink-0 text-muted-2">Last updated</dt>
          <dd className="inline-flex items-center gap-1.5 text-foreground tabular">
            <CalendarClock className="size-3.5 text-muted-2" aria-hidden="true" />
            {formatDate(application.lastUpdated)}
          </dd>
        </div>
      </dl>

      <ProgressBar
        value={progress}
        size="sm"
        className="mt-3"
        label="Overall completion"
        caption={`${approvedCount(application)} of ${application.approvals.length} stages approved`}
      />

      <Link
        href={`/applications/${application.id}`}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-foreground"
      >
        View Details
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </Link>
    </article>
  );
}
