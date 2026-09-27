import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Download,
  Layers,
  User,
} from "lucide-react";

import { ActivityTimeline } from "@/components/govsync/activity-timeline";
import { ApplicationRow } from "@/components/govsync/application-row";
import { DepartmentTrackCard } from "@/components/govsync/department-track-card";
import { DefinitionRow, KeyFigure } from "@/components/govsync/metric-card";
import { PageHeader, SectionHeading } from "@/components/govsync/page-header";
import { StatusBadge, StatusLegend } from "@/components/govsync/status-badge";
import { UnifiedWorkflow } from "@/components/govsync/workflow/unified-workflow";
import { WorkflowChain } from "@/components/govsync/workflow-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activitiesForApplication } from "@/lib/data/activities";
import {
  applicationById,
  applicationProgress,
  applications,
} from "@/lib/data/applications";
import { SIMULATION } from "@/lib/data/departments";
import { interopEvents } from "@/lib/data/events";
import { formatDate, formatStamp } from "@/lib/format";
import { buildWorkflowSnapshot } from "@/lib/workflow/model";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return applications.map((application) => ({ id: application.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const application = applicationById(id);

  return {
    title: application ? `${application.id} · ${application.title}` : "Application",
    description: application
      ? `Unified approval status for ${application.title}, across Revenue, Pollution Control, Labour and Fire. Simulated data.`
      : "Application not found in the simulated dataset.",
  };
}

export default async function ApplicationDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const application = applicationById(id);

  if (!application) notFound();

  const progress = applicationProgress(application);
  const approvals = application.approvals;
  const relatedEvents = interopEvents
    .filter((event) => event.applicationId === application.id)
    .slice(0, 8);
  const otherApplications = applications.filter(
    (candidate) => candidate.id !== application.id,
  );
  const applicationActivities = activitiesForApplication(application.id);
  const workflowSnapshot = buildWorkflowSnapshot(application);

  return (
    <div>
      <PageHeader
        eyebrow={application.service}
        title={application.title}
        description={application.summary}
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Applications", href: "/applications" },
          { label: application.id },
        ]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/workflow">
                <Layers className="size-4" />
                Workflow view
              </Link>
            </Button>
            <Button variant="secondary" disabled title="Not available in this prototype">
              <Download className="size-4" />
              Download summary
            </Button>
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="font-mono">
              {application.id}
            </Badge>
            <StatusBadge kind="application" value={application.state} />
            {application.priority === "expedited" ? (
              <Badge variant="info">Expedited</Badge>
            ) : null}
            <span className="text-xs text-muted-2">
              Submitted {formatDate(application.submittedAt)} &middot; last updated{" "}
              {formatStamp(application.lastUpdated)}
            </span>
          </div>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        {/* Summary strip */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Workflow chain"
                description={`${approvals.length} stages, ${application.tracks.length} departments, one application reference.`}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <WorkflowChain approvals={approvals} />
              <div className="flex flex-col gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-2">
                    <span>Overall completion</span>
                    <span className="tabular">{progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-2 tabular">
                  SLA {application.elapsedDays} of {application.slaTargetDays} days used
                </p>
              </div>
              <StatusLegend kind="workflow" className="border-t border-border-subtle pt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionHeading title="Applicant and reference" />
            </CardHeader>
            <CardContent>
              <dl>
                <DefinitionRow term="Reference">
                  <span className="font-mono">{application.id}</span>
                </DefinitionRow>
                <DefinitionRow term="Filed by">
                  <span className="inline-flex items-center gap-2">
                    {application.applicantKind === "business" ? (
                      <Building2 className="size-3.5 text-muted-2" />
                    ) : (
                      <User className="size-3.5 text-muted-2" />
                    )}
                    {application.applicantName}
                  </span>
                </DefinitionRow>
                <DefinitionRow term="Entity type">{application.entityType}</DefinitionRow>
                <DefinitionRow term="Identifier">
                  <span className="font-mono text-xs">{application.identifierMasked}</span>
                </DefinitionRow>
                <DefinitionRow term="Contact">
                  <span className="font-mono text-xs">{application.contactMasked}</span>
                </DefinitionRow>
                <DefinitionRow term="District">{application.district}</DefinitionRow>
                <DefinitionRow term="Channel">{application.filedVia}</DefinitionRow>
                <DefinitionRow term="Due by">
                  <span className="tabular">{formatDate(application.dueAt)}</span>
                </DefinitionRow>
              </dl>
            </CardContent>
          </Card>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="workflow">
          <TabsList>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="departments">
              Departments ({application.tracks.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              Documents ({application.documents.length})
            </TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="events">Interop events</TabsTrigger>
          </TabsList>

          <TabsContent value="workflow">
            <div className="space-y-6">
              <UnifiedWorkflow snapshot={workflowSnapshot} />

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <SectionHeading title="SLA position" />
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <KeyFigure
                      label="Target"
                      value={`${application.slaTargetDays} days`}
                      hint="From submission to final approval"
                    />
                    <KeyFigure
                      label="Elapsed"
                      value={`${application.elapsedDays} days`}
                      hint={`Due ${formatDate(application.dueAt)}`}
                    />
                    <KeyFigure
                      label="Stages complete"
                      value={`${approvals.filter((approval) => approval.state === "approved").length} of ${approvals.length}`}
                      hint="Published to the shared record"
                    />
                    <KeyFigure
                      label="Priority"
                      value={
                        application.priority === "expedited" ? "Expedited" : "Standard"
                      }
                      hint="Routing and escalation band"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <SectionHeading
                      title="Recent interop events"
                      description="Sampled from the platform event stream."
                      action={
                        <Button asChild variant="ghost" size="sm">
                          <Link href="/logs">
                            All logs
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </Button>
                      }
                    />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {relatedEvents.length > 0 ? (
                      relatedEvents.map((event) => (
                        <div
                          key={event.seq}
                          className="flex items-start justify-between gap-3 border-b border-border-subtle pb-2 last:border-b-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-mono text-[11px] text-accent">
                              {event.eventType}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-muted-2">
                              {event.source} &rarr; {event.destination}
                            </p>
                          </div>
                          <span className="shrink-0 font-mono text-[10px] text-muted-2 tabular">
                            {event.at.replace(", ", " · ")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted">
                        No sampled events reference this application.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="departments">
            <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
              {application.tracks.map((track) => (
                <DepartmentTrackCard
                  key={track.departmentId}
                  track={track}
                  approval={approvals.find(
                    (candidate) => candidate.id === track.approvalId,
                  )}
                  approvals={approvals}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Document set"
                  description="Submitted once by the applicant and shared across departments under the recorded consent."
                />
              </CardHeader>
              <CardContent className="space-y-3">
                {application.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-2 rounded-md border border-border-subtle bg-surface-2/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {document.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-2">
                        <span className="font-mono">{document.id}</span> &middot;{" "}
                        {document.category} &middot; {document.sizeKb.toLocaleString("en-IN")} KB
                        &middot; {document.origin}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <StatusBadge kind="document" value={document.status} />
                      <span className="text-[11px] text-muted-2">
                        {document.verifiedBy}
                      </span>
                    </div>
                  </div>
                ))}
                <p className="border-t border-border-subtle pt-3 text-[11px] text-muted-2">
                  Submitted {application.documents.length} times in total, verified by{" "}
                  {new Set(application.documents.map((document) => document.verifiedBy)).size}{" "}
                  departmental reviewers. No duplicate uploads were requested.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" id="activity">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Application timeline"
                  description="Every state transition, with the actor that caused it. Timestamps are relative to the frozen demo day."
                />
              </CardHeader>
              <CardContent>
                <ActivityTimeline entries={applicationActivities} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Interop events for this application"
                  description="Sampled platform event trail with correlation identifiers."
                />
              </CardHeader>
              <CardContent>
                {relatedEvents.length > 0 ? (
                  <ul className="divide-y divide-border-subtle">
                    {relatedEvents.map((event) => (
                      <li key={event.seq} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] text-accent">
                            {event.eventType}
                          </span>
                          <StatusBadge kind="event" value={event.status} dot />
                          <span className="font-mono text-[10px] text-muted-2">
                            {event.correlationId}
                          </span>
                          <span className="ml-auto font-mono text-[10px] text-muted-2 tabular">
                            {event.at}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted">
                          <span className="text-foreground">{event.source}</span> &rarr;{" "}
                          <span className="text-foreground">{event.destination}</span>{" "}
                          &middot; {event.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted">
                    No sampled events reference this application.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Other applications */}
        <section>
          <SectionHeading
            title="Other applications on this identity"
            description="Same applicant, same document vault, separate references."
            className="mb-3"
          />
          <Card>
            <CardContent className="px-0 py-0">
              {otherApplications.map((candidate) => (
                <ApplicationRow key={candidate.id} application={candidate} />
              ))}
            </CardContent>
          </Card>
        </section>

        <p className="flex items-center gap-2 text-[11px] text-muted-2">
          <CalendarClock className="size-3.5" />
          Data frozen at {SIMULATION.frozenAt}. All departmental references on
          this page are fictional.
        </p>
      </div>
    </div>
  );
}
