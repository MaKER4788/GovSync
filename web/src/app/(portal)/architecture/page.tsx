import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  FileSignature,
  Landmark,
  Network,
  ServerCog,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import { ArchitectureDiagram, ArchitectureStack } from "@/components/govsync/architecture-diagram";
import { InteropDiagram } from "@/components/govsync/interop-diagram";
import { PageHeader, SectionHeading } from "@/components/govsync/page-header";
import { SimulatedNotice } from "@/components/govsync/simulated-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  architectureLayers,
  departments,
  GOVSYNC_NODE_ID,
  SIMULATION,
} from "@/lib/data/departments";

export const metadata: Metadata = {
  title: "Architecture",
  description:
    "GovSync platform architecture: unified interface, API gateway, authentication and authorization, workflow orchestration, interoperability layer, platform services and department connectors.",
};

const flow = [
  {
    icon: Landmark,
    title: "Citizen / Business",
    body: "One submission surface for individuals and business entities, with a document vault that does not require re-uploads.",
  },
  {
    icon: Boxes,
    title: "GovSync Unified Interface",
    body: "Service catalogue, application intake, single tracking reference and status notifications.",
  },
  {
    icon: ServerCog,
    title: "API Gateway",
    body: "Terminates all traffic, applies quotas and routing policy, and adapts REST, SOAP and event-bus protocols into a canonical envelope.",
  },
  {
    icon: ShieldCheck,
    title: "Authentication & Authorization",
    body: "Federated identity for applicants and departmental officers, with consent, delegation and least-privilege scopes per stage.",
  },
  {
    icon: Workflow,
    title: "Workflow Orchestration",
    body: "Versioned process templates, dependency resolution, SLA clocks, escalation and a decision journal per transition.",
  },
  {
    icon: Network,
    title: "Interoperability Layer",
    body: "Schema registry, field-level data validation, entity resolution and per-department mapping into native formats.",
  },
  {
    icon: FileSignature,
    title: "Department APIs",
    body: "Revenue, Pollution Control, Labour, Fire and Municipal systems, each reached through its own connector.",
  },
];

const designPrinciples = [
  {
    title: "One reference, one record",
    body: "An application is a single object. Departments act on their own scope of it rather than owning a copy of the applicant's story.",
  },
  {
    title: "Verify once, reuse under consent",
    body: "A fact confirmed by one department is published as an artefact and consumed by the next, with the applicant's consent recorded.",
  },
  {
    title: "Dependencies enforced centrally",
    body: "The platform holds a stage rather than letting an applicant discover a missing input, and forwards the artefact automatically when it exists.",
  },
  {
    title: "Every decision is reproducible",
    body: "State changes are sealed in an append-only ledger with correlation ids, so any approval can be reconstructed end to end.",
  },
  {
    title: "Departments keep their autonomy",
    body: "A department's rules, queues and systems are unchanged. The connector handles translation, not policy.",
  },
  {
    title: "Failure is visible, not silent",
    body: "Timeouts, schema rejections and maintenance windows are recorded, retried and surfaced, rather than appearing as an indefinite wait.",
  },
];

export default function ArchitecturePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Reference design"
        title="Platform Architecture"
        description="How GovSync joins fragmented departmental systems: from the applicant surface, through the interoperability layer, to the department connectors."
        crumbs={[{ label: "Platform console" }, { label: "Architecture" }]}
        actions={
          <Button asChild variant="outline">
            <Link href="/integration">
              <Network className="size-4" />
              Live integration view
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-2">
            <span>Logical layers, not physical deployment.</span>
            <span className="font-mono">{SIMULATION.environmentCode}</span>
            <span className="font-mono">{SIMULATION.timezone}</span>
          </div>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <SimulatedNotice />

        {/* Linear flow */}
        <Card>
          <CardHeader>
            <SectionHeading
              title="Request path"
              description="A single submission traverses these layers in order before a departmental decision is published back to the applicant."
            />
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {flow.map((layer, index) => (
                <li key={layer.title}>
                  <div className="flex items-start gap-4 rounded-lg border border-border bg-surface-2/40 p-4">
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                      <layer.icon className="size-4 text-accent" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-mono text-[11px] text-muted-2">
                          L{String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground">
                          {layer.title}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted">
                        {layer.body}
                      </p>
                    </div>
                  </div>
                  {index < flow.length - 1 ? (
                    <div className="flex h-5 items-center pl-8" aria-hidden="true">
                      <span className="h-full w-px bg-border-strong" />
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          {/* Layer detail */}
          <div>
            <SectionHeading
              title="Layer detail"
              description="Components and protocols at each layer of the platform."
              className="mb-3"
            />
            <ArchitectureDiagram layers={architectureLayers} />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Layer index"
                  description="Quick reference for the seven layers."
                />
              </CardHeader>
              <CardContent>
                <ArchitectureStack layers={architectureLayers} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <SectionHeading title="Where each capability lives" />
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-xs leading-relaxed text-muted">
                  <li className="flex items-start gap-2.5">
                    <ServerCog className="mt-0.5 size-3.5 shrink-0 text-accent" />
                    <span>
                      <span className="text-foreground">API Gateway</span> is the
                      only ingress point. Department endpoints are never called
                      directly by a client.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" />
                    <span>
                      <span className="text-foreground">
                        Identity &amp; access
                      </span>{" "}
                      sits behind the gateway and before the workflow engine, so
                      no stage runs without an authorised actor.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Workflow className="mt-0.5 size-3.5 shrink-0 text-accent" />
                    <span>
                      <span className="text-foreground">
                        The workflow engine
                      </span>{" "}
                      decides what happens next; the interoperability layer decides
                      what data is allowed to travel.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Network className="mt-0.5 size-3.5 shrink-0 text-accent" />
                    <span>
                      <span className="text-foreground">Connectors</span> are
                      per-department and independently versioned, so one department
                      can upgrade without a platform release.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <SectionHeading
                  title="Department connectors"
                  description="Simulated endpoints, one per department."
                />
              </CardHeader>
              <CardContent className="space-y-2">
                {departments.map((department) => (
                  <div
                    key={department.id}
                    className="rounded-md border border-border-subtle p-2.5"
                  >
                    <p className="text-xs font-medium text-foreground">
                      {department.shortName}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-muted-2">
                      {department.systemName}
                    </p>
                  </div>
                ))}
                <p className="pt-1 text-[11px] leading-relaxed text-muted-2">
                  {GOVSYNC_NODE_ID.toUpperCase()} is the platform node. No
                  departmental emblem, seal or identifier is reproduced in this
                  prototype.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Interop diagram reuse */}
        <InteropDiagram
          departments={departments.map(({ id, shortName, code }) => ({
            id,
            shortName,
            code,
          }))}
        />

        {/* Design principles */}
        <section>
          <SectionHeading
            title="Design principles"
            description="The constraints that keep the integration honest for departments and applicants."
            className="mb-3"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {designPrinciples.map((principle) => (
              <Card key={principle.title}>
                <CardContent className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    {principle.title}
                  </p>
                  <p className="text-xs leading-relaxed text-muted">
                    {principle.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card>
          <CardHeader>
            <SectionHeading
              title="Production considerations"
              description="What a real deployment would add on top of this reference design."
            />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Certification",
                body: "Signed departmental agreements, PKI issuance and consent re-validation per release.",
              },
              {
                title: "Data residency",
                body: "Departmental data classes held in defined zones, with jurisdiction-specific retention.",
              },
              {
                title: "Resilience",
                body: "Multi-zone gateway, connector failover and replay of queued messages after an outage.",
              },
              {
                title: "Observability",
                body: "Per-stage SLIs, alerting on connector health and audit export to departmental systems.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-md border border-border-subtle bg-surface-2/40 p-3"
              >
                <p className="text-xs font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
