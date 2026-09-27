import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CircleDot,
  GitBranch,
  Lock,
  Route,
  Timer,
  Workflow,
} from "lucide-react";

import { DepartmentChip } from "@/components/govsync/department-chip";
import { KeyFigure } from "@/components/govsync/metric-card";
import { PageHeader, SectionHeading } from "@/components/govsync/page-header";
import { StatusBadge, StatusLegend } from "@/components/govsync/status-badge";
import {
  WorkflowChain,
  WorkflowStepper,
} from "@/components/govsync/workflow-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { openApprovals } from "@/lib/data/approvals";
import {
  applicationById,
  primaryApplicationId,
} from "@/lib/data/applications";
import { departmentLabel } from "@/lib/data/departments";
import { workflowStateMeta } from "@/lib/status";

export const metadata: Metadata = {
  title: "Unified Approval Workflow",
  description:
    "Dependency-resolved approval chain across Revenue, Pollution Control, Labour and Fire for a single application reference.",
};

export default function WorkflowPage() {
  const application = applicationById(primaryApplicationId);
  const stages = openApprovals();

  if (!application) return null;

  const approvals = application.approvals;
  const approved = approvals.filter((approval) => approval.state === "approved");
  const inFlight = approvals.filter(
    (approval) => approval.state === "under-review" || approval.state === "blocked",
  );
  const queued = approvals.filter((approval) => approval.state === "pending");

  return (
    <div>
      <PageHeader
        eyebrow="Workflow orchestration"
        title="Unified Approval Workflow"
        description="One submitted application, decomposed into a governed sequence of departmental approvals. Dependencies are resolved by the platform, not by the applicant."
        crumbs={[{ label: "Platform console" }, { label: "Approval workflow" }]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/architecture">Platform layers</Link>
            </Button>
            <Button asChild>
              <Link href={`/applications/${primaryApplicationId}`}>
                Open application
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        {/* Chain overview */}
        <Card>
          <CardHeader>
            <SectionHeading
              title="Stage sequence"
              description="Application Submitted → Land Verification → Pollution Approval → Fire NOC → Labour Registration → Final Approval"
              action={
                <span className="font-mono text-[11px] text-muted-2">
                  {application.id}
                </span>
              }
            />
          </CardHeader>
          <CardContent className="space-y-5">
            <WorkflowChain approvals={approvals} />
            <StatusLegend kind="workflow" className="border-t border-border-subtle pt-4" />
            <div className="grid gap-4 border-t border-border-subtle pt-4 sm:grid-cols-2 xl:grid-cols-4">
              <KeyFigure
                label="Total stages"
                value={String(approvals.length)}
                hint="Across four departments"
              />
              <KeyFigure
                label="Approved"
                value={String(approved.length)}
                hint="Artefacts published downstream"
              />
              <KeyFigure
                label="In flight"
                value={String(inFlight.length)}
                hint="Being decided or held"
              />
              <KeyFigure
                label="Queued"
                value={String(queued.length)}
                hint="Waiting on an upstream artefact"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          {/* Detailed stepper */}
          <Card>
            <CardHeader>
              <SectionHeading
                title="Stage detail and dependencies"
                description="Each stage records its upstream dependencies, the artefacts it publishes and the departmental remark behind its current state."
              />
            </CardHeader>
            <CardContent>
              <WorkflowStepper approvals={approvals} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Dependency rules */}
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Dependency rules"
                  description="Why the sequence is ordered the way it is."
                />
              </CardHeader>
              <CardContent className="space-y-3">
                {approvals
                  .filter((approval) => approval.dependsOn.length > 0)
                  .map((approval) => (
                    <div
                      key={approval.id}
                      className="rounded-md border border-border-subtle bg-surface-2/40 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-2">
                          Stage {approval.order}
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {approval.title}
                        </span>
                        <StatusBadge kind="workflow" value={approval.state} dot />
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {approval.dependsOn.map((dependencyId) => {
                          const dependency = approvals.find(
                            (candidate) => candidate.id === dependencyId,
                          );
                          if (!dependency) return null;
                          const dependencyMeta = workflowStateMeta[dependency.state];
                          return (
                            <div
                              key={dependency.id}
                              className="flex items-start gap-2 text-[11px] leading-relaxed"
                            >
                              <GitBranch className="mt-0.5 size-3 shrink-0 text-muted-2" />
                              <span className="text-muted">
                                requires{" "}
                                <span className="text-foreground">
                                  {dependency.title}
                                </span>{" "}
                                to be approved
                                {dependencyMeta.label !== "Approved" ? (
                                  <span className={dependencyMeta.text}>
                                    {" "}
                                    &mdash; currently {dependencyMeta.label.toLowerCase()}
                                  </span>
                                ) : (
                                  <span className="text-success"> &mdash; satisfied</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* What the engine does */}
            <Card>
              <CardHeader>
                <SectionHeading title="What the engine enforces" />
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-relaxed text-muted">
                <p className="flex items-start gap-2.5">
                  <Lock className="mt-0.5 size-3.5 shrink-0 text-accent" />
                  A downstream department is never asked for a document that an
                  upstream department has not yet issued. The requirement is
                  recorded as pending and the stage is held.
                </p>
                <p className="flex items-start gap-2.5">
                  <Timer className="mt-0.5 size-3.5 shrink-0 text-accent" />
                  Each stage carries its own SLA clock. A held stage does not
                  consume the department&rsquo;s decision window, and the applicant
                  sees a projected unblock date instead of a silent wait.
                </p>
                <p className="flex items-start gap-2.5">
                  <Route className="mt-0.5 size-3.5 shrink-0 text-accent" />
                  Artefacts published by a completed stage are forwarded to every
                  downstream consumer through the interoperability layer, so no
                  department re-verifies a fact another department has confirmed.
                </p>
                <p className="flex items-start gap-2.5">
                  <CircleDot className="mt-0.5 size-3.5 shrink-0 text-accent" />
                  Every transition is sealed in the audit ledger with actor,
                  evidence reference and timestamp, and is reproducible from the
                  event log.
                </p>
              </CardContent>
            </Card>

            {/* All open stages across the platform */}
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Open stages on the grid"
                  description="Every application currently awaiting a departmental decision."
                />
              </CardHeader>
              <CardContent className="space-y-2">
                {stages.map((stage) => (
                  <Link
                    key={`${stage.applicationId}-${stage.approval.id}`}
                    href={`/applications/${stage.applicationId}`}
                    className="flex items-center gap-3 rounded-md border border-border-subtle p-2.5 transition-colors hover:border-border-strong"
                  >
                    <Workflow className="size-3.5 shrink-0 text-muted-2" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {stage.approval.title}
                      </p>
                      <p className="truncate text-[11px] text-muted-2">
                        {stage.applicationId} &middot;{" "}
                        {departmentLabel(stage.approval.departmentId)}
                      </p>
                    </div>
                    <StatusBadge kind="workflow" value={stage.approval.state} dot />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Parallel lanes view */}
        <Card>
          <CardHeader>
            <SectionHeading
              title="Department lanes"
              description="The same application, viewed as one lane per department, with the hand-off points between them."
            />
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-4">
            {application.tracks.map((track) => {
              const approval = approvals.find(
                (candidate) => candidate.id === track.approvalId,
              );
              return (
                <div
                  key={track.departmentId}
                  className="rounded-lg border border-border bg-surface-2/30 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <DepartmentChip
                      departmentId={track.departmentId}
                      label={departmentLabel(track.departmentId)}
                      size="sm"
                    />
                    <StatusBadge kind="workflow" value={track.state} dot />
                  </div>
                  <p className="mt-3 text-xs font-medium text-foreground">
                    {approval?.title ?? "Stage"}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-2">
                    {track.remark}
                  </p>
                  <div className="mt-3 border-t border-border-subtle pt-3 text-[11px] text-muted">
                    <p>
                      Documents:{" "}
                      <span className="tabular text-foreground">
                        {track.documents.filter((document) => document.state === "received")
                          .length}
                        /{track.documents.length}
                      </span>
                    </p>
                    <p className="mt-1">
                      Stage SLA:{" "}
                      <span className="tabular text-foreground">
                        {track.slaTargetDays} days
                      </span>
                    </p>
                    <p className="mt-1">Updated {track.lastUpdated}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
