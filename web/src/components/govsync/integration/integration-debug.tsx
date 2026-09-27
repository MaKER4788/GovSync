"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CircleSlash,
  FileSearch,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { SectionHeading } from "@/components/govsync/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  fetchIntegrationLog,
  HEALTH_LABEL,
  type ClientResult,
  type IntegrationLog,
} from "@/lib/govsync/client";
import { cn } from "@/lib/utils";

const CONTROL_TONE: Record<string, string> = {
  enforced: "border-success/35 bg-success/10 text-success",
  placeholder: "border-warning/35 bg-warning/10 text-warning",
  "not-implemented": "border-danger/30 bg-danger/8 text-danger",
};

const EVENT_TONE: Record<string, string> = {
  SUCCESS: "text-success",
  FAILED: "text-danger",
  TIMEOUT: "text-warning",
  VALIDATION_ERROR: "text-warning",
};

const HOP_TONE: Record<string, string> = {
  OK: "text-success",
  RETRY: "text-warning",
  FAILED: "text-danger",
};

const CONTROLS = [
  { id: "counters", label: "Session counters" },
  { id: "events", label: "Integration events" },
  { id: "traces", label: "Request traces" },
  { id: "audit", label: "Audit log" },
  { id: "security", label: "Security controls" },
] as const;

type Tab = (typeof CONTROLS)[number]["id"];

/**
 * The developer view of the integration layer.
 *
 * It exists so a reviewer can see the interop path rather than take it on trust:
 * the counters the layer kept, the append-only event log, the hop-by-hop trace
 * of a call including every retry, the audit log, and an honest list of which
 * security controls are enforced, which are placeholders, and which are absent.
 */
export function IntegrationDebug() {
  const [result, setResult] = useState<ClientResult<IntegrationLog> | null>(null);
  const [tab, setTab] = useState<Tab>("counters");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    const next = await fetchIntegrationLog();
    setResult(next);
    setBusy(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await fetchIntegrationLog();
      if (!cancelled) setResult(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (result === null) {
    return (
      <Card>
        <CardHeader>
          <SectionHeading
            title="Integration debug"
            description="Reading the integration layer..."
          />
        </CardHeader>
      </Card>
    );
  }

  if (!result.success) {
    return (
      <Card>
        <CardHeader>
          <SectionHeading
            title="Integration debug"
            description="The debug view could not be loaded."
          />
        </CardHeader>
        <CardContent>
          <p className="flex items-center gap-2 text-[11px] font-semibold text-danger">
            <TriangleAlert className="size-3.5" />
            {result.error.code}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            {result.error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  const log = result.data;
  const metrics = log.metrics;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <SectionHeading
            title="Integration debug"
            description="Everything below is in memory, in this server process, and is lost on restart. It is measured from the calls the portal has actually made."
            action={
              <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>
                <RefreshCw className={busy ? "animate-spin" : undefined} />
                {busy ? "Reading" : "Refresh"}
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {CONTROLS.map((control) => (
              <button
                key={control.id}
                type="button"
                onClick={() => setTab(control.id)}
                className={cn(
                  "rounded border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  tab === control.id
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border bg-transparent text-muted hover:border-border-strong",
                )}
              >
                {control.label}
                <span className="ml-1.5 text-muted-2 tabular">
                  {control.id === "counters"
                    ? metrics.totalRequests
                    : control.id === "events"
                      ? log.events.length
                      : control.id === "traces"
                        ? log.traces.length
                        : control.id === "audit"
                          ? log.audit.length
                          : log.securityControls.length}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {tab === "counters" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Session counters"
                description={`Attempt budget per logical call: ${log.maxAttempts}.`}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <Figure label="Attempts" value={metrics.totalRequests} />
                <Figure label="Succeeded" value={metrics.successful} />
                <Figure label="Failed" value={metrics.failed} />
                <Figure label="Timeouts" value={metrics.timeouts} />
                <Figure label="Validation errors" value={metrics.validationErrors} />
                <Figure label="Retried" value={metrics.retriedRequests} />
              </div>
              <dl className="space-y-1.5 border-t border-border-subtle pt-3 text-[11px]">
                <Row label="Window" value={metrics.windowLabel} />
                <Row label="Queued decisions" value={String(metrics.pendingPublishes)} />
                <Row label="Last sync" value={metrics.lastSyncAt ?? "never"} />
                <Row
                  label="Last sync application"
                  value={metrics.lastSyncApplicationId ?? "none"}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionHeading
                title="Per connector"
                description="Counted per connector, so a single failing department is visible without hiding the other three."
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-3 border-b border-border-subtle pb-2 text-[10px] uppercase tracking-wider text-muted-2">
                <span>Connector</span>
                <span className="text-right">Calls</span>
                <span className="text-right">Failed</span>
                <span className="text-right">Queued</span>
              </div>
              {metrics.byDepartment.map((row) => (
                <div
                  key={row.departmentId}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-3 border-b border-border-subtle py-2 last:border-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs text-foreground">
                      {row.departmentName}
                    </span>
                    <span className="block text-[10px] text-muted-2">
                      {HEALTH_LABEL[row.health] ?? row.health}
                      {row.lastStatus ? ` · last ${row.lastStatus}` : ""}
                    </span>
                  </span>
                  <span className="text-right text-[11px] tabular text-muted">
                    {row.requests}
                  </span>
                  <span
                    className={cn(
                      "text-right text-[11px] tabular",
                      row.failed > 0 ? "text-danger" : "text-muted",
                    )}
                  >
                    {row.failed}
                  </span>
                  <span
                    className={cn(
                      "text-right text-[11px] tabular",
                      row.pendingPublishes > 0 ? "text-warning" : "text-muted",
                    )}
                  >
                    {row.pendingPublishes}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "events" ? (
        <Card>
          <CardHeader>
            <SectionHeading
              title="Integration events"
              description="Append-only. One entry per attempt, not per call, so a retried call shows three attempts against one request id."
            />
          </CardHeader>
          <CardContent>
            {log.events.length === 0 ? (
              <p className="text-xs text-muted">
                No call has been made in this server session. Open an application and
                approve a stage, or read a departmental status.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-border-subtle text-[10px] uppercase tracking-wider text-muted-2">
                      <th className="py-2 pr-3 font-medium">When</th>
                      <th className="py-2 pr-3 font-medium">Request</th>
                      <th className="py-2 pr-3 font-medium">Operation</th>
                      <th className="py-2 pr-3 font-medium">Destination</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 text-right font-medium">Try</th>
                      <th className="py-2 font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {log.events.map((event) => (
                      <tr key={event.id} className="align-top">
                        <td className="py-2 pr-3 font-mono text-[10px] whitespace-nowrap text-muted-2">
                          {event.at}
                        </td>
                        <td className="py-2 pr-3 font-mono text-[10px] whitespace-nowrap text-accent">
                          {event.requestId}
                        </td>
                        <td className="py-2 pr-3 font-mono text-[10px] whitespace-nowrap text-muted">
                          {event.operation}
                        </td>
                        <td className="py-2 pr-3 text-[11px] text-muted">
                          {event.destination}
                        </td>
                        <td
                          className={cn(
                            "py-2 pr-3 font-mono text-[10px] whitespace-nowrap",
                            EVENT_TONE[event.status] ?? "text-muted",
                          )}
                        >
                          {event.status}
                        </td>
                        <td className="py-2 pr-3 text-right text-[11px] tabular text-muted">
                          {event.attempts}
                        </td>
                        <td className="py-2 text-[11px] leading-relaxed text-muted">
                          {event.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "traces" ? (
        <Card>
          <CardHeader>
            <SectionHeading
              title="Request traces"
              description="Each hop the request crossed, in order. Retry hops appear as their own entries so the backoff is visible."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {log.traces.length === 0 ? (
              <p className="text-xs text-muted">No trace recorded yet.</p>
            ) : (
              log.traces.map((trace) => (
                <div key={trace.requestId} className="rounded border border-border-subtle">
                  <p className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface-2 px-3 py-2">
                    <FileSearch className="size-3.5 text-muted-2" />
                    <span className="font-mono text-[10px] text-accent">
                      {trace.requestId}
                    </span>
                    <span className="font-mono text-[10px] text-muted">
                      {trace.operation}
                    </span>
                    <Badge
                      variant={trace.success ? "success" : "danger"}
                      className="text-[10px]"
                    >
                      {trace.success ? "completed" : "failed"}
                    </Badge>
                    <span className="ml-auto text-[10px] text-muted-2">
                      {trace.hops.length} hops · {trace.at}
                    </span>
                  </p>
                  <ol className="divide-y divide-border-subtle">
                    {trace.hops.map((hop) => (
                      <li
                        key={`${hop.index}-${hop.layer}-${hop.attempt}`}
                        className="flex flex-wrap items-baseline gap-2 px-3 py-1.5"
                      >
                        <span className="w-5 shrink-0 font-mono text-[10px] text-muted-2 tabular">
                          {hop.index}
                        </span>
                        <span
                          className={cn(
                            "w-12 shrink-0 font-mono text-[10px]",
                            HOP_TONE[hop.status] ?? "text-muted",
                          )}
                        >
                          {hop.status}
                        </span>
                        <span className="w-32 shrink-0 text-[10px] text-muted">
                          {hop.label}
                        </span>
                        <span className="min-w-0 flex-1 text-[11px] leading-relaxed text-muted">
                          {hop.detail}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-2 tabular">
                          {hop.attempt > 0 ? `try ${hop.attempt} · ` : ""}
                          {hop.durationMs} ms
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "audit" ? (
        <Card>
          <CardHeader>
            <SectionHeading
              title="Audit log"
              description="Every call the layer authorised, refused or completed, with the principal it acted for."
            />
          </CardHeader>
          <CardContent>
            {log.audit.length === 0 ? (
              <p className="text-xs text-muted">No audit entry yet.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {log.audit.map((entry) => (
                  <li key={entry.id} className="py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <ScrollText className="size-3 text-muted-2" />
                      <span className="font-mono text-[10px] text-accent">
                        {entry.requestId}
                      </span>
                      <Badge
                        variant={
                          entry.outcome === "DENIED"
                            ? "danger"
                            : entry.outcome === "ALLOWED"
                              ? "warning"
                              : "success"
                        }
                        className="text-[10px]"
                      >
                        {entry.outcome}
                      </Badge>
                      <span className="font-mono text-[10px] text-muted">
                        {entry.operation}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-muted-2">
                        {entry.at}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">
                      <span className="text-foreground">{entry.principal}</span> ·{" "}
                      {entry.detail}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "security" ? (
        <Card>
          <CardHeader>
            <SectionHeading
              title="Security controls"
              description="Stated as implemented, not as intended. A control that does not exist is listed as absent rather than omitted."
            />
          </CardHeader>
          <CardContent className="space-y-2.5">
            {log.securityControls.map((control) => (
              <div
                key={control.name}
                className="rounded border border-border-subtle bg-surface-2 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ShieldCheck className="size-3.5 text-muted-2" />
                  <span className="text-xs font-medium text-foreground">
                    {control.name}
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded border px-1.5 py-0.5 text-[10px] font-medium",
                      CONTROL_TONE[control.status] ?? CONTROL_TONE.placeholder,
                    )}
                  >
                    {control.status === "enforced"
                      ? "enforced"
                      : control.status === "placeholder"
                        ? "placeholder"
                        : "not implemented"}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                  {control.detail}
                </p>
              </div>
            ))}
            {log.failurePlans.length > 0 ? (
              <div className="rounded border border-warning/25 bg-warning/8 p-3">
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-warning">
                  <CircleSlash className="size-3.5" />
                  Failures in force ({log.failurePlans.length})
                </p>
                <ul className="mt-1.5 space-y-1">
                  {log.failurePlans.map((plan) => (
                    <li key={plan.departmentId} className="text-[11px] text-muted">
                      <span className="font-medium text-foreground">
                        {plan.departmentName}
                      </span>{" "}
                      · <span className="font-mono">{plan.mode}</span> · next{" "}
                      {plan.calls} call{plan.calls === 1 ? "" : "s"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <p className="flex flex-wrap items-center gap-2 text-[11px] text-muted-2">
        <ArrowRight className="size-3.5" />
        Every figure here comes from the in-process mock connectors. Clearing this
        requires a server restart, which is itself a limitation worth stating.
      </p>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border-subtle bg-surface-2 px-2.5 py-2">
      <p className="text-lg font-semibold tabular text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-2">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-40 shrink-0 text-muted-2">{label}</dt>
      <dd className="min-w-0 break-words font-mono text-[10px] text-muted">{value}</dd>
    </div>
  );
}
