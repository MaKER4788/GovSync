import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  unit,
  detail,
  icon: Icon,
  tone = "neutral",
  footer,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  detail?: string;
  icon?: LucideIcon;
  tone?: "neutral" | "positive" | "warning" | "critical" | "info";
  footer?: React.ReactNode;
  className?: string;
}) {
  const toneClass = {
    neutral: "text-foreground",
    positive: "text-success",
    warning: "text-warning",
    critical: "text-danger",
    info: "text-info",
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
        {Icon ? <Icon className="size-4 text-muted-2" /> : null}
      </div>
      <div>
        <p className={cn("flex items-baseline gap-1.5 text-2xl font-semibold tabular", toneClass)}>
          {value}
          {unit ? <span className="text-xs font-medium text-muted-2">{unit}</span> : null}
        </p>
        {detail ? <p className="mt-1.5 text-xs text-muted">{detail}</p> : null}
      </div>
      {footer}
    </div>
  );
}

export function KeyFigure({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-2">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground tabular">{value}</p>
      {hint ? <p className="text-xs text-muted-2">{hint}</p> : null}
    </div>
  );
}

export function DefinitionRow({
  term,
  children,
  className,
}: {
  term: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-b border-border-subtle py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4",
        className,
      )}
    >
      <dt className="w-56 shrink-0 text-xs uppercase tracking-wider text-muted-2">
        {term}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}
