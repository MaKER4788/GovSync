import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleCheck, Clock, ListChecks, Workflow } from "lucide-react";

import { ActionRequiredCard } from "@/components/govsync/action-required-card";
import { ApprovalProgress } from "@/components/govsync/approval-progress";
import { KeyFigure } from "@/components/govsync/metric-card";
import { PageHeader, SectionHeading } from "@/components/govsync/page-header";
import { ProgressBar } from "@/components/govsync/progress-bar";
import { StatusBadge, StatusLegend } from "@/components/govsync/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  approvalsForApplication,
  openApprovals,
  pendingApprovals,
  requiredActions,
  requiredActionCount,
} from "@/lib/data/approvals";
import {
  activeApplications,
  applicationById,
  applicationProgress,
  approvedCount,
  currentApproval,
} from "@/lib/data/applications";
import { departmentLabel } from "@/lib/data/departments";
import { formatDate, formatStamp } from "@/lib/format";

export const metadata: Metadata = {
  title: "Approvals",
  description:
    "Every departmental stage that has not produced a decision, and every item the applicant has to supply.",
};

export default function ApprovalsPage() {
  const open = openApprovals();
  const pending = pendingApprovals();
  const actions = requiredActions();
  const decided = open.filter((entry) => entry.approval.state !== "pending");

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Approvals"
        description="Every stage that has not produced a decision yet, across all applications on this identity, and everything that is waiting on you."
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Approvals" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href="/workflow">
              Workflow detail
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <section aria-labelledby="counts-heading">
          <h2 id="counts-heading" className="sr-only">
            Approval counts
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <KeyFigure
              label="Pending approvals"
              value={String(pending.length)}
              hint="Queued behind an upstream decision"
            />
            <KeyFigure
              label="Stages in progress"
              value={String(decided.length)}
              hint="With a department right now"
            />
            <KeyFigure
              label="Actions required"
              value={String(requiredActionCount())}
              hint="Only the applicant can supply these"
            />
          </div>
        </section>

        {/* Action required sits above the tabs: it is the one thing on this
            page that cannot wait for the applicant to go looking. */}
        <section aria-labelledby="action-heading" id="actions" className="scroll-mt-20">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Action required"
                description="These applications cannot move until you respond. Deadlines are demonstration values, not statutory ones."
                action={
                  <span className="font-mono text-[11px] text-muted-2 tabular">
                    {actions.length} open
                  </span>
                }
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {actions.length > 0 ? (
                actions.map((entry) => (
                  <ActionRequiredCard
                    key={`${entry.applicationId}-${entry.approvalTitle}`}
                    entry={entry}
                  />
                ))
              ) : (
                <p className="text-sm text-muted">
                  Nothing is waiting on you right now. Every stage is with a
                  department.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Open stages ({open.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="open">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Open stages"
                  description="Every undecided stage, most recently touched first."
                />
              </CardHeader>
              <CardContent className="space-y-3">
                {open.map((entry) => {
                  const application = applicationById(entry.applicationId);
                  return (
                    <article
                      key={`${entry.applicationId}-${entry.approval.id}`}
                      className="rounded-lg border border-border bg-surface-2/30 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] text-accent">
                              {entry.applicationId}
                            </span>
                            <StatusBadge kind="workflow" value={entry.approval.state} />
                            {entry.approval.action ? (
                              <Badge variant="danger">Waiting on you</Badge>
                            ) : null}
                          </div>
                          <h3 className="mt-2 text-sm font-semibold text-foreground">
                            {entry.approval.title}
                          </h3>
                          <p className="mt-1 text-xs leading-relaxed text-muted">
                            {entry.applicationTitle} &middot;{" "}
                            {departmentLabel(entry.approval.departmentId)} &middot;{" "}
                            {entry.approval.actor}
                          </p>
                          <p className="mt-2 text-[11px] leading-relaxed text-muted-2">
                            {entry.approval.remark}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted tabular">
                            <Clock className="size-3.5 text-muted-2" aria-hidden="true" />
                            SLA {entry.approval.slaDays}d &middot; entered{" "}
                            {formatDate(entry.approval.startedAt)}
                          </span>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/applications/${entry.applicationId}`}>
                              Open application
                              <ArrowRight className="size-3.5" aria-hidden="true" />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {application ? (
                        <div className="mt-4 border-t border-border-subtle pt-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-2">
                            <span>
                              Stage {entry.approval.order} of{" "}
                              {application.approvals.length} &middot;{" "}
                              {approvedCount(application)} approved
                            </span>
                            <span className="tabular">
                              Application {applicationProgress(application)}% complete
                            </span>
                          </div>
                          <ProgressBar
                            value={applicationProgress(application)}
                            size="sm"
                            className="mt-2"
                            label={`${entry.applicationId} overall completion`}
                          />
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Pending stages"
                  description="Held by the workflow engine until the departments they depend on have issued."
                />
              </CardHeader>
              <CardContent className="space-y-3">
                {pending.length > 0 ? (
                  pending.map((entry) => (
                    <article
                      key={`${entry.applicationId}-${entry.approval.id}`}
                      className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-2/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {entry.approval.title}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-2">
                          {entry.applicationId} &middot; {entry.applicationTitle}
                        </p>
                        <p className="mt-2 text-[11px] leading-relaxed text-muted">
                          Waiting on{" "}
                          <span className="text-foreground">
                            {entry.approval.dependsOn.length > 0
                              ? entry.approval.dependsOn
                                  .map(
                                    (id) =>
                                      approvalsForApplication(entry.applicationId).find(
                                        (candidate) => candidate.id === id,
                                      )?.title ?? id,
                                  )
                                  .join(", ")
                              : "no upstream stage"}
                          </span>
                          . {entry.approval.remark}
                        </p>
                      </div>
                      <StatusBadge kind="workflow" value={entry.approval.state} />
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-muted">
                    Nothing is queued. Every remaining stage is with a department.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <SectionHeading
              title="How a stage leaves Action Required"
              description="The same three steps, whichever department asked."
            />
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-xs leading-relaxed text-muted">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 font-mono text-[11px] text-muted-2">01</span>
                You supply the requested item in the document vault. In this
                prototype the upload control is disabled and nothing is stored.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 font-mono text-[11px] text-muted-2">02</span>
                The owning department marks the stage as received, and the
                applicant-visible status returns to Under Review.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 font-mono text-[11px] text-muted-2">03</span>
                The stage resumes its SLA clock. A stage held for an applicant
                action does not consume the department&rsquo;s decision window.
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Per-application progress, so the same three numbers appear here too. */}
        <section aria-labelledby="progress-heading">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Progress by application"
                description="Completed, current and upcoming stages for each open application."
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {activeApplications.map((application) => {
                const current = currentApproval(application);
                return (
                  <div
                    key={application.id}
                    className="rounded-lg border border-border-subtle bg-surface-2/30 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {application.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-2">
                          {application.id} &middot;{" "}
                          {current
                            ? `Stage ${current.order}, ${departmentLabel(current.departmentId)}`
                            : "All stages decided"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={applicationProgress(application)}
                          size="sm"
                          className="w-40"
                          label={`${application.id} overall completion`}
                        />
                        <span className="font-mono text-xs text-foreground tabular">
                          {applicationProgress(application)}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <ApprovalProgress approvals={application.approvals} />
                    </div>
                    <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-2">
                      <Workflow className="size-3" aria-hidden="true" />
                      Last activity {formatStamp(application.lastUpdated)} &middot;{" "}
                      <CircleCheck
                        className="size-3 text-success"
                        aria-hidden="true"
                      />
                      {approvedCount(application)} of{" "}
                      {application.approvals.length} stages approved
                    </p>
                  </div>
                );
              })}
              <StatusLegend
                kind="workflow"
                className="border-t border-border-subtle pt-4"
              />
            </CardContent>
          </Card>
        </section>

        <p className="flex items-center gap-2 text-[11px] text-muted-2">
          <ListChecks className="size-3.5" aria-hidden="true" />
          Approvals are read from the same application records as the dashboard and
          the detail pages. Nothing here is stored separately or sent anywhere.
        </p>
      </div>
    </div>
  );
}
