import { ArrowUpRight, Building2, CalendarClock, User } from "lucide-react";
import Link from "next/link";

import { ApplicationCard } from "@/components/govsync/application-card";
import { DepartmentChip } from "@/components/govsync/department-chip";
import { ProgressBar } from "@/components/govsync/progress-bar";
import { ApplicationStatusBadge } from "@/components/govsync/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  applicationProgress,
  approvedCount,
  currentStageLabel,
  departmentsOf,
} from "@/lib/data/applications";
import { departmentLabel } from "@/lib/data/departments";
import { formatDate } from "@/lib/format";
import type { Application } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Active and archived applications in one tabular view. The same data is
 * rendered as cards below the lg breakpoint so the reference, stage, progress
 * and status stay readable on a phone without horizontal scrolling.
 */
export function ApplicationTable({
  applications,
  caption,
  className,
}: {
  applications: Application[];
  caption: string;
  className?: string;
}) {
  if (applications.length === 0) {
    return (
      <p className={cn("px-5 py-6 text-sm text-muted", className)}>
        No applications match this view.
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="hidden lg:block">
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Application</TableHead>
              <TableHead scope="col">Departments</TableHead>
              <TableHead scope="col">Current stage</TableHead>
              <TableHead scope="col" className="w-56">
                Progress
              </TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col">Last updated</TableHead>
              <TableHead scope="col" className="text-right">
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => {
              const progress = applicationProgress(application);
              return (
                <TableRow key={application.id}>
                  <TableCell>
                    <span className="block text-sm font-medium text-foreground">
                      {application.title}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-2">
                      <span className="font-mono text-accent">{application.id}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span>
                        {application.applicantKind === "business" ? (
                          <Building2 className="mr-1 inline size-3" aria-hidden="true" />
                        ) : (
                          <User className="mr-1 inline size-3" aria-hidden="true" />
                        )}
                        {application.applicantName}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-wrap gap-1.5">
                      {departmentsOf(application).map((departmentId) => (
                        <DepartmentChip
                          key={departmentId}
                          departmentId={departmentId}
                          label={departmentLabel(departmentId)}
                          size="sm"
                        />
                      ))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm text-foreground">
                      {currentStageLabel(application)}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-2">
                      {application.state === "completed"
                        ? `All ${application.approvals.length} stages approved`
                        : `Stage ${approvedCount(application) + 1} of ${application.approvals.length}`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ProgressBar
                      value={progress}
                      size="sm"
                      label="Overall completion"
                      caption={`${approvedCount(application)} of ${application.approvals.length} stages approved`}
                    />
                  </TableCell>
                  <TableCell>
                    <ApplicationStatusBadge value={application.state} />
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted tabular">
                      <CalendarClock className="size-3.5 text-muted-2" aria-hidden="true" />
                      {formatDate(application.lastUpdated)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/applications/${application.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-foreground"
                    >
                      View Details
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border-subtle lg:hidden">
        {applications.map((application) => (
          <li key={application.id}>
            <ApplicationCard application={application} />
          </li>
        ))}
      </ul>
    </div>
  );
}
