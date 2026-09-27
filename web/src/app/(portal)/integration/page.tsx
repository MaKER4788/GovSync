import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleX,
  Clock3,
  Fingerprint,
  ListChecks,
  Network,
  PlugZap,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import { ThroughputChart, TransactionOutcomeChart, LatencyBars } from "@/components/govsync/charts";
import {
  DepartmentCard,
  DepartmentStatRow,
} from "@/components/govsync/department-card";
import { KeyFigure, MetricCard } from "@/components/govsync/metric-card";
import { PageHeader, SectionHeading } from "@/components/govsync/page-header";
import { SimulatedNotice } from "@/components/govsync/simulated-notice";
import { StatusBadge, StatusLegend } from "@/components/govsync/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { departments, SIMULATION } from "@/lib/data/departments";
import {
  eventCounters,
  interopEvents,
  platformTotals,
  throughputSeries,
} from "@/lib/data/events";

export const metadata: Metadata = {
  title: "Government Integration Dashboard",
  description:
    "Connected departments, API health, request volume, successful and failed transactions and pending workflows across simulated department connectors.",
};

export default function IntegrationPage() {
  const counterByLabel = (label: string) =>
    eventCounters.find((counter) => counter.label === label);
  const latencyData = departments.map((department) => ({
    label: department.code,
    value: department.p95LatencyMs,
  }));
  const degraded = departments.filter(
    (department) => department.health !== "operational",
  );
  const latestEvents = interopEvents.slice(0, 10);

  return (
    <div>
      <PageHeader
        eyebrow="Platform operations"
        title="Government Integration Dashboard"
        description="Department connectors, API health and transaction volume on the interoperability grid. Every endpoint below is simulated for this prototype."
        crumbs={[{ label: "Platform console" }, { label: "Government integration" }]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/architecture">
                <Network className="size-4" />
                Architecture
              </Link>
            </Button>
            <Button asChild>
              <Link href="/logs">
                <Activity className="size-4" />
                Event logs
              </Link>
            </Button>
          </>
        }
        meta={<StatusLegend kind="health" />}
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <SimulatedNotice />

        {/* Headline metrics */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Departments connected"
            value={platformTotals.activeConnectors}
            icon={PlugZap}
            tone="info"
            detail="Revenue, Pollution, Labour, Fire, Municipal"
          />
          <MetricCard
            label="API requests"
            value={new Intl.NumberFormat("en-IN").format(platformTotals.requests)}
            unit="24h"
            icon={Activity}
            detail="Across all department endpoints"
          />
          <MetricCard
            label="Successful"
            value={new Intl.NumberFormat("en-IN").format(platformTotals.success)}
            unit="24h"
            icon={CheckCircle2}
            tone="positive"
            detail={`${((platformTotals.success / platformTotals.requests) * 100).toFixed(2)}% of requests`}
          />
          <MetricCard
            label="Failed"
            value={new Intl.NumberFormat("en-IN").format(platformTotals.failed)}
            unit="24h"
            icon={CircleX}
            tone="critical"
            detail="Retried, dead-lettered or rejected"
          />
          <MetricCard
            label="Pending workflows"
            value={platformTotals.pendingWorkflows}
            icon={Workflow}
            tone="warning"
            detail="Awaiting a departmental decision"
          />
        </section>

        {/* Department cards */}
        <section>
          <SectionHeading
            title="Connected departments"
            description="One connector per department, each speaking that department's simulated native protocol."
            className="mb-3"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {departments.map((department) => (
              <DepartmentCard
                key={department.id}
                department={department}
                counter={counterByLabel(department.shortName)}
              />
            ))}
          </div>
        </section>

        {/* Charts */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Interop request throughput"
                description="Two-hour windows across the last 24 hours, with failed transactions overlaid."
              />
            </CardHeader>
            <CardContent>
              <ThroughputChart data={throughputSeries} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionHeading
                title="p95 latency by connector"
                description="Elevated latency is queued and retried rather than failed."
              />
            </CardHeader>
            <CardContent>
              <LatencyBars data={latencyData} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Transaction outcomes"
                description="Successful and failed transactions per department connector over the last 24 hours."
              />
            </CardHeader>
            <CardContent>
              <TransactionOutcomeChart data={eventCounters} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Connector health"
                  description="Traffic, success rate and failures per department."
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-3 border-b border-border-subtle pb-2 text-[10px] uppercase tracking-wider text-muted-2">
                  <span>Connector</span>
                  <span className="text-right">Requests</span>
                  <span className="w-16 text-right">Success</span>
                  <span className="w-12 text-right">Failed</span>
                </div>
                {departments.map((department) => (
                  <DepartmentStatRow
                    key={department.id}
                    department={department}
                    counter={counterByLabel(department.shortName)}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <SectionHeading
                  title="Attention required"
                  description="Connectors not reporting a fully healthy state."
                />
              </CardHeader>
              <CardContent className="space-y-3">
                {degraded.map((department) => (
                  <div
                    key={department.id}
                    className="rounded-md border border-border-subtle bg-surface-2/40 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {department.shortName}
                      </span>
                      <StatusBadge kind="health" value={department.health} dot />
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                      {department.health === "degraded"
                        ? `p95 latency ${department.p95LatencyMs} ms with ${department.successRatePct.toFixed(1)}% success. Requests are queued and replayed; the applicant is not blocked.`
                        : `Scheduled maintenance window in progress until 15:00 IST. Inbound requests are queued for replay (last handshake ${department.lastHandshakeAt}).`}
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] text-muted-2">
                      {department.baseUrl}
                    </p>
                  </div>
                ))}
                <div className="grid gap-3 rounded-md border border-border-subtle p-3 sm:grid-cols-3">
                  <KeyFigure
                    label="Avg latency"
                    value={`${platformTotals.averageLatencyMs} ms`}
                    hint="Weighted across connectors"
                  />
                  <KeyFigure
                    label="Schema pass rate"
                    value={`${platformTotals.schemaValidationPassRate.toFixed(1)}%`}
                    hint="Before dispatch to a department"
                  />
                  <KeyFigure
                    label="Connectors"
                    value={String(platformTotals.activeConnectors)}
                    hint="No connector is offline"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Connector contracts + recent events */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Connector contracts"
                description="How each simulated department system is addressed."
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {departments.map((department) => (
                <div
                  key={department.id}
                  className="rounded-md border border-border-subtle p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground">
                      {department.name}
                    </p>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded border border-success/30 bg-success/8 px-1.5 py-0.5 text-[10px] font-medium text-success">
                        <ShieldCheck className="size-2.5" aria-hidden="true" />
                        {SIMULATION.connectionLabel}
                      </span>
                      <Badge variant="secondary" className="font-mono">
                        {department.apiVersion}
                      </Badge>
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-[10px] text-muted-2">
                    {department.baseUrl}
                  </p>
                  <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-muted">
                    <Fingerprint className="mt-0.5 size-3 shrink-0 text-muted-2" />
                    {department.authScheme}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-2">
                    {department.systemName}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionHeading
                title="Latest platform events"
                description="Most recent entries from the interop event stream."
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/logs">
                      Full log
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                }
              />
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border-subtle">
                {latestEvents.map((event) => (
                  <li key={event.seq} className="flex flex-col gap-1.5 py-3 first:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-accent">
                        {event.eventType}
                      </span>
                      <StatusBadge kind="event" value={event.status} dot />
                      <span className="font-mono text-[10px] text-muted-2">
                        {event.correlationId}
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] text-muted-2 tabular">
                        <Clock3 className="size-2.5" />
                        {event.at.replace(", ", " · ")}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      <span className="text-foreground">{event.source}</span> &rarr;{" "}
                      <span className="text-foreground">{event.destination}</span>{" "}
                      &middot; {event.message}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <p className="flex flex-wrap items-center gap-2 text-[11px] text-muted-2">
          <ListChecks className="size-3.5" />
          {SIMULATION.connectionNote}. Figures are generated locally for
          demonstration and are not measurements of any live department system.
        </p>
      </div>
    </div>
  );
}
