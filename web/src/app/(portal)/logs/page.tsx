import type { Metadata } from "next";
import {
  FileSearch,
  Hash,
  Layers,
  Radio,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import { EventLogTable } from "@/components/govsync/event-log-table";
import { KeyFigure, MetricCard } from "@/components/govsync/metric-card";
import { PageHeader, SectionHeading } from "@/components/govsync/page-header";
import { SimulatedNotice } from "@/components/govsync/simulated-notice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  eventCounters,
  interopEvents,
  platformTotals,
} from "@/lib/data/events";
import { departments } from "@/lib/data/departments";

export const metadata: Metadata = {
  title: "API & Event Logs",
  description:
    "Correlated interop event stream: request routing, verification, forwarding, notifications, failures and audit seals.",
};

const eventTypeReference = [
  {
    type: "APPLICATION SUBMITTED",
    route: "Applicant → GovSync Unified Interface",
    meaning: "A new application is accepted and a reference is issued.",
  },
  {
    type: "SCHEMA VALIDATED",
    route: "GovSync Engine → Schema Validator",
    meaning: "Payload and documents pass canonical validation before dispatch.",
  },
  {
    type: "CONSENT GRANTED",
    route: "Applicant → GovSync Engine",
    meaning: "Consent recorded for the departmental readers on the application.",
  },
  {
    type: "REQUEST CREATED",
    route: "GovSync Engine → Department API",
    meaning: "A departmental case or task is raised from the unified application.",
  },
  {
    type: "VERIFIED",
    route: "Department API → GovSync Engine",
    meaning: "A departmental record is verified and published as an artefact.",
  },
  {
    type: "DATA FORWARDED",
    route: "GovSync Engine → Department API",
    meaning: "An upstream artefact is passed to the next consumer, unaltered.",
  },
  {
    type: "ARTEFACT PUBLISHED",
    route: "Department API → GovSync Engine",
    meaning: "A clearance or record becomes visible to all downstream stages.",
  },
  {
    type: "STAGE BLOCKED",
    route: "Workflow Orchestrator → Audit Ledger",
    meaning: "A stage is held because an upstream dependency is unsatisfied.",
  },
  {
    type: "NOTIFICATION SENT",
    route: "Notification Service → Applicant",
    meaning: "Portal, email or SMS notice dispatched with a delivery receipt.",
  },
  {
    type: "AUDIT SEALED",
    route: "GovSync Engine → Audit Ledger",
    meaning: "A read or write event is sealed into the hash-chained ledger.",
  },
  {
    type: "TIMEOUT / RETRY SCHEDULED",
    route: "API Gateway → Department API",
    meaning: "Upstream did not respond; the request is replayed with backoff.",
  },
  {
    type: "MAINTENANCE WINDOW",
    route: "Department API → GovSync Gateway",
    meaning: "Connector is in a scheduled window; requests are queued for replay.",
  },
];

export default function LogsPage() {
  const failedCount = interopEvents.filter(
    (event) => event.status === "failed",
  ).length;
  const inFlightCount = interopEvents.filter(
    (event) => event.status === "in-flight",
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Observability"
        title="API & Event Logs"
        description="Correlated record of every message crossing the interoperability layer: who sent it, which simulated department received it, what happened and how long it took."
        crumbs={[{ label: "Platform console" }, { label: "API & event logs" }]}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              SIM-NIC-01
            </Badge>
            <Badge variant="secondary" className="font-mono">
              42 events sampled
            </Badge>
            <span className="text-xs text-muted-2">
              Frozen at 12 Mar 2026, 14:32 IST &middot; correlation ids are
              illustrative
            </span>
          </div>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Events sampled"
            value={interopEvents.length}
            icon={ScrollText}
            detail="Most recent entries from the stream"
          />
          <MetricCard
            label="Failed transactions"
            value={failedCount}
            icon={ShieldCheck}
            tone="critical"
            detail={`${platformTotals.failed.toLocaleString("en-IN")} failures across 24h`}
          />
          <MetricCard
            label="In flight"
            value={inFlightCount}
            icon={Radio}
            tone="info"
            detail="Queued with retry and backoff"
          />
          <MetricCard
            label="Average latency"
            value={`${platformTotals.averageLatencyMs} ms`}
            icon={Hash}
            detail="Weighted across all connectors"
          />
        </section>

        <SimulatedNotice />

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Interop event stream"
                description="Revenue API → VERIFIED · GovSync Engine → DATA FORWARDED · Pollution API → REQUEST CREATED · Applicant → NOTIFICATION SENT"
                action={
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-2">
                    <FileSearch className="size-3" />
                    Filterable and searchable
                  </span>
                }
              />
            </CardHeader>
            <CardContent className="px-0 py-0">
              <EventLogTable events={interopEvents} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Event type reference"
                  description="What each message class means on the grid."
                />
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {eventTypeReference.map((entry) => (
                    <li
                      key={entry.type}
                      className="rounded-md border border-border-subtle bg-surface-2/40 p-3"
                    >
                      <p className="font-mono text-[11px] text-accent">
                        {entry.type}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-2">{entry.route}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">
                        {entry.meaning}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <SectionHeading
                  title="24h volume by connector"
                  description="Requests, successes and failures per endpoint."
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-3 border-b border-border-subtle pb-2 text-[10px] uppercase tracking-wider text-muted-2">
                  <span>Endpoint</span>
                  <span className="text-right">Requests</span>
                  <span className="w-14 text-right">Success</span>
                  <span className="w-12 text-right">Failed</span>
                </div>
                {eventCounters.map((counter) => {
                  const department = departments.find(
                    (candidate) => candidate.shortName === counter.label,
                  );
                  return (
                    <div
                      key={counter.label}
                      className="flex items-center gap-3 border-b border-border-subtle py-2.5 last:border-b-0"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                        {counter.label}
                      </span>
                      <span className="tabular w-20 text-right text-xs text-muted">
                        {counter.requests.toLocaleString("en-IN")}
                      </span>
                      <span className="tabular w-14 text-right text-xs text-success">
                        {((counter.success / counter.requests) * 100).toFixed(1)}%
                      </span>
                      <span className="tabular w-12 text-right text-xs text-danger">
                        {counter.failed}
                      </span>
                      <span className="hidden font-mono text-[10px] text-muted-2 lg:inline">
                        {department?.apiVersion}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <SectionHeading
                  title="Audit guarantees"
                  description="Properties the platform would guarantee for every entry."
                />
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs leading-relaxed text-muted">
                <p className="flex items-start gap-2.5">
                  <Hash className="mt-0.5 size-3.5 shrink-0 text-accent" />
                  Every event carries a correlation id, schema version, timestamp
                  and payload hash, so a decision can be traced to the exact
                  message that caused it.
                </p>
                <p className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" />
                  Audit entries are append-only and hash chained. Nothing in the
                  log can be edited or removed after it is written.
                </p>
                <p className="flex items-start gap-2.5">
                  <Layers className="mt-0.5 size-3.5 shrink-0 text-accent" />
                  Logs are partitioned by department connector, application
                  reference and actor, so departmental teams see their own scope
                  without exposing other departments&rsquo; data.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <SectionHeading
              title="Audit trail"
              description="Who acted on this application, when, and on what evidence."
            />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KeyFigure
              label="Ledger entries"
              value="1,204"
              hint="For the showcase application and its dependencies"
            />
            <KeyFigure
              label="Distinct actors"
              value="9"
              hint="Applicant, platform engine and four departments"
            />
            <KeyFigure
              label="Schema rejections"
              value="1"
              hint="Retried after mapping correction, no data loss"
            />
            <KeyFigure
              label="Retention"
              value="7 years"
              hint="Simulated retention policy for approval records"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
