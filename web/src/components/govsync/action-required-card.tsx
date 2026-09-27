import { ArrowUpRight, CalendarClock, FileCheck2, Landmark } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { RequiredAction } from "@/lib/data/approvals";
import { departmentById } from "@/lib/data/departments";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * One item the applicant has to supply. The deadline is labelled as a
 * demonstration deadline, because no statutory clock applies to mock data.
 */
export function ActionRequiredCard({
  entry,
  className,
}: {
  entry: RequiredAction;
  className?: string;
}) {
  const department = departmentById(entry.action.departmentId);

  return (
    <article
      className={cn(
        "flex flex-col justify-between gap-4 rounded-lg border border-danger/25 bg-danger/5 p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-accent"
          aria-hidden="true"
        >
          <Landmark className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-danger">
            <FileCheck2 className="size-3.5" aria-hidden="true" />
            Action required
          </p>
          <h3 className="mt-1.5 text-sm font-semibold text-foreground">
            {entry.action.item}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {department?.name ?? "Department"} &middot; {department?.code ?? "GS"}
          </p>
          <p className="mt-1 text-[11px] text-muted-2">
            {entry.applicationTitle} &middot;{" "}
            <span className="font-mono text-accent">{entry.applicationId}</span>
          </p>
          <p className="mt-1 text-[11px] text-muted-2">
            Stage: {entry.approvalTitle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-danger/20 pt-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
          <CalendarClock className="size-3.5 text-muted-2" aria-hidden="true" />
          Demo deadline {formatDate(entry.action.deadline)}
        </span>
        <Button asChild size="sm" variant="outline">
          <Link href={`/applications/${entry.applicationId}`}>
            Review
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
