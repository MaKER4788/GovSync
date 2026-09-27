import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileWarning,
  Landmark,
  Layers,
  Link2,
  ListChecks,
  Network,
  Receipt,
  ScrollText,
  ShieldCheck,
  Split,
  Workflow,
} from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ArchitectureStack } from "@/components/govsync/architecture-diagram";
import { InteropDiagram } from "@/components/govsync/interop-diagram";
import { SimulatedNotice } from "@/components/govsync/simulated-notice";
import { StatusBadge } from "@/components/govsync/status-badge";
import { WorkflowChain } from "@/components/govsync/workflow-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { primaryApplicationId } from "@/lib/data/applications";
import {
  architectureLayers,
  departments,
  SIMULATION,
} from "@/lib/data/departments";
import type { WorkflowStep } from "@/lib/types";

export const metadata: Metadata = {
  title: "Connected Government Services",
  description:
    "One application. Multiple departments. One connected workflow. GovSync is a simulated interoperability prototype for SIH 2026.",
};

const heroChain: WorkflowStep[] = [
  {
    id: "hero-1",
    order: 1,
    title: "Application Submitted",
    departmentId: "govsync",
    state: "approved",
    description: "",
    startedAt: "",
    actor: "GovSync",
    slaDays: 0,
    dependsOn: [],
    outputArtifacts: [],
    remark: "",
  },
  {
    id: "hero-2",
    order: 2,
    title: "Land Verification",
    departmentId: "rev",
    state: "approved",
    description: "",
    startedAt: "",
    actor: "Revenue",
    slaDays: 5,
    dependsOn: [],
    outputArtifacts: [],
    remark: "",
  },
  {
    id: "hero-3",
    order: 3,
    title: "Pollution Approval",
    departmentId: "pol",
    state: "under-review",
    description: "",
    startedAt: "",
    actor: "Pollution Control",
    slaDays: 10,
    dependsOn: [],
    outputArtifacts: [],
    remark: "",
  },
  {
    id: "hero-4",
    order: 4,
    title: "Fire NOC",
    departmentId: "fire",
    state: "blocked",
    description: "",
    startedAt: "",
    actor: "Fire",
    slaDays: 12,
    dependsOn: [],
    outputArtifacts: [],
    remark: "",
  },
  {
    id: "hero-5",
    order: 5,
    title: "Labour Registration",
    departmentId: "lab",
    state: "pending",
    description: "",
    startedAt: "",
    actor: "Labour",
    slaDays: 8,
    dependsOn: [],
    outputArtifacts: [],
    remark: "",
  },
  {
    id: "hero-6",
    order: 6,
    title: "Final Approval",
    departmentId: "rev",
    state: "pending",
    description: "",
    startedAt: "",
    actor: "District Office",
    slaDays: 7,
    dependsOn: [],
    outputArtifacts: [],
    remark: "",
  },
];

const problems = [
  {
    icon: FileWarning,
    title: "The same information, again and again",
    body: "A business entity re-enters ownership, site and establishment details on four separate departmental forms, with no shared record to fall back on.",
  },
  {
    icon: Split,
    title: "Four portals, four logins, four queues",
    body: "Each department runs its own system and its own status vocabulary, so an applicant cannot see the whole picture from any one place.",
  },
  {
    icon: Link2,
    title: "Approvals that do not know about each other",
    body: "Fire services open a case without the pollution consent reference, and labour registration is asked for a NOC that has not been issued yet.",
  },
  {
    icon: Receipt,
    title: "No single auditable trail",
    body: "When a stage moves, there is no correlated record showing who acted, on what evidence, and which departmental system was involved.",
  },
];

const comparison = [
  {
    dimension: "Applications",
    before: "One per department",
    after: "One consolidated application",
  },
  {
    dimension: "Documents",
    before: "Uploaded repeatedly",
    after: "Submitted once, reused under consent",
  },
  {
    dimension: "Status",
    before: "Tracked per portal",
    after: "One timeline across all stages",
  },
  {
    dimension: "Dependencies",
    before: "Discovered by the applicant",
    after: "Enforced by the workflow engine",
  },
  {
    dimension: "Audit trail",
    before: "Per department, siloed",
    after: "Correlated, immutable ledger",
  },
];

const howItWorks = [
  {
    icon: ClipboardCheck,
    step: "01",
    title: "Submit once",
    body: "A single form and one verified document set enter GovSync. Nothing is re-asked later.",
  },
  {
    icon: Layers,
    step: "02",
    title: "Validate and map",
    body: "Payloads are validated against canonical schemas and mapped into each department's native format.",
  },
  {
    icon: Workflow,
    step: "03",
    title: "Orchestrate approvals",
    body: "The workflow engine sequences departmental stages, holds downstream work on unmet dependencies and clocks SLAs.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Publish one outcome",
    body: "Results are consolidated into a single approval, sealed in an audit ledger and pushed to the applicant's vault.",
  },
];

const capabilities = [
  {
    icon: Network,
    name: "API Gateway",
    body: "One controlled entry point with quotas, schema validation and protocol adapters.",
  },
  {
    icon: ShieldCheck,
    name: "Identity & Access",
    body: "Verified applicants and least-privilege departmental roles with a consent ledger.",
  },
  {
    icon: Workflow,
    name: "Workflow Engine",
    body: "Versioned process templates, dependency resolution, SLA clocks and escalation.",
  },
  {
    icon: ListChecks,
    name: "Data Validation",
    body: "Field, cross-field and cross-department consistency rules before anything is dispatched.",
  },
  {
    icon: ScrollText,
    name: "Audit Logs",
    body: "Append-only, hash-chained record of every read, write and approval decision.",
  },
  {
    icon: Receipt,
    name: "Notification Service",
    body: "Portal, email and SMS delivery with receipts, so no stage change goes unnoticed.",
  },
  {
    icon: Landmark,
    name: "Department Connectors",
    body: "One adapter per department, each speaking that department's native protocol.",
  },
  {
    icon: Building2,
    name: "Document Custody",
    body: "Verified artefacts held once with per-department access control and retention policy.",
  },
];

const scopeIn = [
  "Frontend prototype with realistic mock department data",
  "Unified workflow, dependency and status modelling",
  "Integration, event log and architecture surfaces",
  "Design system and reusable components",
];

const scopeOut = [
  "Live connections to any government system",
  "Real authentication, signing or identity verification",
  "Real applicant, business or departmental records",
  "Backend services, persistence or departmental write-back",
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="grid-backdrop pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              {SIMULATION.environmentName} &middot; {SIMULATION.buildLabel}
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-balance text-foreground lg:text-5xl">
              Connected Government Services
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted lg:text-xl">
              One application. Multiple departments. One connected workflow.
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
              Government services are split across departmental platforms. GovSync
              demonstrates what changes when those departments are joined by a
              secure interoperability layer and exposed through a single
              submission, tracking and approval surface.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Start Application
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/architecture">View Architecture</Link>
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-2">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3" />
                Authentication and departmental integrations are out of scope for
                this prototype
              </span>
            </div>

            <div className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
              <InteropDiagram
                departments={departments
                  .filter((department) =>
                    ["rev", "pol", "lab", "fire"].includes(department.id),
                  )
                  .map(({ id, shortName, code }) => ({ id, shortName, code }))}
              />

              <Card className="h-full">
                <CardHeader>
                  <CardTitle>One application, four clearances</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs leading-relaxed text-muted">
                    Reference{" "}
                    <span className="font-mono text-accent">
                      {primaryApplicationId}
                    </span>{" "}
                    &middot; Manufacturing Unit Approval. The same reference, the
                    same document set and the same timeline across Revenue,
                    Pollution Control, Labour and Fire.
                  </p>
                  <WorkflowChain steps={heroChain} />
                  <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
                    <StatusBadge kind="workflow" value="approved" />
                    <StatusBadge kind="workflow" value="under-review" />
                    <StatusBadge kind="workflow" value="pending" />
                    <StatusBadge kind="workflow" value="blocked" />
                  </div>
                  <Button asChild variant="secondary" size="sm" className="w-full">
                    <Link href={`/applications/${primaryApplicationId}`}>
                      Open application
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section id="problem" className="border-b border-border bg-surface">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                The problem
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
                Services are fragmented. Consequences are not.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                A single manufacturing unit has to satisfy revenue, pollution,
                labour and fire requirements. Each department owns a separate
                platform, a separate login and a separate queue. The applicant
                absorbs the integration cost in the form of repeated forms,
                repeated visits and no reliable answer to a single question: where
                is my application right now?
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {problems.map((problem) => (
                <Card key={problem.title} className="h-full">
                  <CardContent className="space-y-3">
                    <problem.icon className="size-5 text-accent" />
                    <h3 className="text-sm font-semibold text-foreground">
                      {problem.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted">
                      {problem.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 overflow-hidden rounded-lg border border-border bg-background">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] border-b border-border bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wider">
                <div className="px-4 py-3 text-muted-2">Dimension</div>
                <div className="border-l border-border px-4 py-3 text-danger">
                  Fragmented today
                </div>
                <div className="border-l border-border px-4 py-3 text-success">
                  With GovSync
                </div>
              </div>
              {comparison.map((row) => (
                <div
                  key={row.dimension}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] border-b border-border-subtle text-sm last:border-b-0"
                >
                  <div className="px-4 py-3 text-foreground">{row.dimension}</div>
                  <div className="border-l border-border-subtle px-4 py-3 text-muted">
                    {row.before}
                  </div>
                  <div className="border-l border-border-subtle px-4 py-3 text-muted">
                    {row.after}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-b border-border">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                How it works
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
                A single entry point with a governed path behind it
              </h2>
            </div>

            <ol className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {howItWorks.map((item) => (
                <li
                  key={item.step}
                  className="rounded-lg border border-border bg-surface p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-accent">
                      {item.step}
                    </span>
                    <item.icon className="size-4 text-muted" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Capabilities */}
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                  Platform capabilities
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
                  The interoperability layer, component by component
                </h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/architecture">
                  Full architecture
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <div className="grid gap-3 sm:grid-cols-2">
                {capabilities.map((capability) => (
                  <div
                    key={capability.name}
                    className="flex gap-3 rounded-lg border border-border bg-background p-4"
                  >
                    <capability.icon className="mt-0.5 size-4 shrink-0 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {capability.name}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {capability.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-border bg-background p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-2">
                  Request path
                </p>
                <ArchitectureStack layers={architectureLayers} className="mt-4" />
                <p className="mt-4 text-[11px] leading-relaxed text-muted-2">
                  Seven layers, from the applicant surface down to the department
                  connectors. Full detail on the architecture page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Scope */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-success">
                    In scope for this step
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {scopeIn.map((item) => (
                      <li key={item} className="flex gap-2.5 text-xs text-muted">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-warning">
                    Deliberately not implemented
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {scopeOut.map((item) => (
                      <li key={item} className="flex gap-2.5 text-xs text-muted">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <SimulatedNotice className="mt-6" />

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Start Application
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/workflow">See the approval workflow</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/integration">Department integrations</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
