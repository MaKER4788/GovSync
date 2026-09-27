import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Monogram } from "@/components/govsync/department-chip";
import { connectedDepartments, SIMULATION } from "@/lib/data/departments";
import { cn } from "@/lib/utils";

/**
 * Compact list of the departmental connectors this workspace speaks to. The
 * status is always "Connected (Demo)": there is no live link, and the label
 * says so wherever the list appears.
 */
export function ConnectedDepartments({
  className,
  columns = 4,
}: {
  className?: string;
  columns?: 2 | 4;
}) {
  return (
    <div className={className}>
      <div
        className={cn(
          "grid gap-3",
          columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4",
        )}
      >
        {connectedDepartments.map((department) => (
          <article
            key={department.id}
            className="flex items-start gap-3 rounded-md border border-border bg-surface-2/40 p-3"
          >
            <Monogram departmentId={department.id} className="size-8" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {department.name}
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 rounded border border-success/30 bg-success/8 px-1.5 py-0.5 text-[10px] font-medium text-success">
                <ShieldCheck className="size-3" aria-hidden="true" />
                {SIMULATION.connectionLabel}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning/25 bg-warning/8 px-3 py-2.5">
        <p className="text-[11px] leading-relaxed text-muted">
          <span className="font-semibold text-warning">
            {SIMULATION.connectionCaption}:
          </span>{" "}
          {SIMULATION.notConnected}
        </p>
        <Link
          href="/integration"
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-accent transition-colors hover:text-foreground"
        >
          Connector detail
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
