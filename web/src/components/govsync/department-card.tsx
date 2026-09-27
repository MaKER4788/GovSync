import { Activity, CircleGauge, Clock3, Layers, Radio } from "lucide-react";

import { Monogram } from "@/components/govsync/department-chip";
import { StatusBadge } from "@/components/govsync/status-badge";
import type { ApiCounter, Department } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DepartmentCard({
  department,
  counter,
  className,
}: {
  department: Department;
  counter?: ApiCounter;
  className?: string;
}) {
  const failureRate =
    counter && counter.requests > 0
      ? ((counter.failed / counter.requests) * 100).toFixed(2)
      : "0.00";

  return (
    <article
      className={cn(
        "flex flex-col rounded-lg border border-border bg-surface transition-colors hover:border-border-strong",
        className,
      )}
    >
      <div className="flex items-start gap-3 border-b border-border-subtle p-4">
        <Monogram departmentId={department.id} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {department.shortName}
          </h3>
          <p className="mt-0.5 truncate text-[11px] text-muted-2">
            {department.authority}
          </p>
        </div>
        <StatusBadge kind="health" value={department.health} dot />
      </div>

      <dl className="grid grid-cols-2 gap-px bg-border-subtle text-xs">
        <Cell label="Requests 24h" value={formatNumber(counter?.requests ?? department.requests24h)} />
        <Cell label="Success" value={`${(counter ? (counter.success / counter.requests) * 100 : department.successRatePct).toFixed(2)}%`} />
        <Cell label="Failed" value={counter ? counter.failed : "—"} tone={counter && counter.failed > 100 ? "critical" : "neutral"} />
        <Cell label="p95 latency" value={`${department.p95LatencyMs} ms`} tone={department.p95LatencyMs > 1500 ? "warning" : "neutral"} />
      </dl>

      <div className="space-y-2 border-t border-border-subtle p-4 text-xs">
        <p className="flex items-center gap-2 text-muted">
          <Radio className="size-3.5 text-muted-2" />
          <span className="truncate font-mono text-[11px]">{department.baseUrl}</span>
        </p>
        <p className="flex items-center gap-2 text-muted">
          <Clock3 className="size-3.5 text-muted-2" />
          Last handshake {department.lastHandshakeAt}
        </p>
        <p className="flex items-center gap-2 text-muted">
          <CircleGauge className="size-3.5 text-muted-2" />
          Uptime {department.uptimePct.toFixed(2)}% &middot; failure rate{" "}
          {failureRate}%
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-border-subtle p-4">
        {department.capabilities.slice(0, 3).map((capability) => (
          <span
            key={capability}
            className="inline-flex items-center gap-1 rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted"
          >
            <Layers className="size-2.5 text-muted-2" />
            {capability}
          </span>
        ))}
      </div>
    </article>
  );
}

export function DepartmentStatRow({
  department,
  counter,
}: {
  department: Department;
  counter?: ApiCounter;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border-subtle py-3 last:border-b-0">
      <Activity className="size-3.5 shrink-0 text-muted-2" />
      <span className="min-w-0 flex-1 truncate text-xs text-foreground">
        {department.shortName}
      </span>
      <span className="tabular text-xs text-muted">
        {formatNumber(counter?.requests ?? department.requests24h)}
      </span>
      <span className="tabular w-16 text-right text-xs text-success">
        {counter ? `${((counter.success / counter.requests) * 100).toFixed(1)}%` : "-"}
      </span>
      <span className="tabular w-12 text-right text-xs text-danger">
        {counter ? counter.failed : "-"}
      </span>
    </div>
  );
}

function Cell({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "warning" | "critical";
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="text-[10px] uppercase tracking-wider text-muted-2">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-sm font-semibold tabular",
          tone === "critical" && "text-danger",
          tone === "warning" && "text-warning",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}
