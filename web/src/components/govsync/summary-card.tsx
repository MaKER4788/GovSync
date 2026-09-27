import { ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * One of the four key figures at the top of the dashboard. The number is
 * always derived from the shared record set, and the supporting line says
 * what it counts so the figure cannot be read as an unexplained statistic.
 */
export function SummaryCard({
  label,
  value,
  icon: Icon,
  detail,
  href,
  linkLabel = "Open",
  tone = "neutral",
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  detail: string;
  href?: string;
  linkLabel?: string;
  tone?: "neutral" | "info" | "warning" | "danger" | "success";
  className?: string;
}) {
  const valueTone = {
    neutral: "text-foreground",
    info: "text-info",
    warning: "text-warning",
    danger: "text-danger",
    success: "text-success",
  }[tone];

  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-4 rounded-lg border border-border bg-surface p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-2">
          {label}
        </p>
        <Icon className="size-4 shrink-0 text-muted-2" aria-hidden="true" />
      </div>
      <div>
        <p
          className={cn(
            "flex items-baseline gap-1.5 text-2xl font-semibold tabular",
            valueTone,
          )}
        >
          {value}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{detail}</p>
        {href ? (
          <Link
            href={href}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-accent transition-colors hover:text-foreground"
          >
            {linkLabel}
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
