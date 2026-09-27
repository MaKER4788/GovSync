import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CircleAlert,
  FileStack,
  ListChecks,
  Workflow,
} from "lucide-react";

import { ApplicationRow } from "@/components/govsync/application-row";
import { DepartmentChip } from "@/components/govsync/department-chip";
import { KeyFigure, MetricCard } from "@/components/govsync/metric-card";
import {
  NotificationList,
  NotificationSummaryCard,
} from "@/components/govsync/notification-list";
import { PageHeader, SectionHeading } from "@/components/govsync/page-header";
import { SimulatedNotice } from "@/components/govsync/simulated-notice";
import { StatusBadge } from "@/components/govsync/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  activeApplications,
  applications,
  completedApplications,
  completedApprovalCount,
  openStages,
  pendingApprovalCount,
  primaryApplicationId,
} from "@/lib/data/applications";
import { departmentLabel } from "@/lib/data/departments";
import { notifications, unreadNotificationCount } from "@/lib/data/notifications";
import { platformTotals } from "@/lib/data/events";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Active applications, pending approvals, completed approvals and notifications for the demo applicant identity.",
};

export default function DashboardPage() {
  const stages = openStages();
  const primary = applications.find(
    (application) => application.id === primaryApplicationId,
  );

  return (
    <div>
      <PageHeader
        eyebrow="Citizen & business services"
        title="Dashboard"
        description="Every application filed by the demo identity, with the departments acting on each one and the approvals still open."
        crumbs={[{ label: "Platform console" }, { label: "Dashboard" }]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/workflow">
                <Workflow className="size-4" />
                Approval workflow
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/applications/${primaryApplicationId}`}>
                <FileStack className="size-4" />
                Start application
              </Link>
            </Button>
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-2">
            <span>
              Identity:{" "}
              <span className="text-foreground">
                Sundara Precision Castings Pvt. Ltd.
              </span>{" "}
              (business, linked citizen profile)
            </span>
            <span>
              District: <span className="text-foreground">Nandur</span>
            </span>
            <span className="font-mono">Ref range GS-2026-00100 &rarr; GS-2026-00199</span>
          </div>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        {/* Key figures */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active applications"
            value={activeApplications.length}
            icon={FileStack}
            detail={`${applications.length} filed in total, ${completedApplications.length} completed`}
          />
          <MetricCard
            label="Pending approvals"
            value={pendingApprovalCount()}
            icon={ListChecks}
            tone="info"
            detail="Open stages that are not held by a dependency"
          />
          <MetricCard
            label="Completed approvals"
            value={completedApprovalCount()}
            icon={CheckCircle2}
            tone="positive"
            detail="Stage decisions published to the shared record"
          />
          <MetricCard
            label="Unread notifications"
            value={unreadNotificationCount}
            icon={Bell}
            tone={unreadNotificationCount > 0 ? "warning" : "neutral"}
            detail={`${notifications.length} notices in the last 30 days`}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* Active applications */}
          <Card>
            <CardHeader>
              <SectionHeading
                title="Active applications"
                description="Applications currently in progress across departments."
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/workflow">
                      Workflow view
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="px-0 py-0">
              {activeApplications.map((application) => (
                <ApplicationRow key={application.id} application={application} />
              ))}
            </CardContent>
          </Card>

          {/* Pending approvals */}
          <Card>
            <CardHeader>
              <SectionHeading
                title="Pending approvals"
                description="Every stage that still needs a decision."
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {stages.map((stage) => (
                <Link
                  key={`${stage.applicationId}-${stage.step.id}`}
                  href={`/applications/${stage.applicationId}`}
                  className="block rounded-md border border-border-subtle bg-surface-2/40 p-3 transition-colors hover:border-border-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {stage.step.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-2">
                        {stage.applicationId} &middot; {stage.applicationTitle}
                      </p>
                    </div>
                    <StatusBadge kind="workflow" value={stage.step.state} dot />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <DepartmentChip
                      departmentId={stage.step.departmentId}
                      label={departmentLabel(stage.step.departmentId)}
                      size="sm"
                    />
                    <span className="text-[11px] text-muted-2">
                      SLA {stage.step.slaDays}d &middot; since {stage.step.startedAt}
                    </span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Completed approvals + notifications */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Completed approvals"
                description="Applications fully cleared by all involved departments."
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {completedApplications.map((application) => {
                const approvedSteps = application.steps.filter(
                  (step) => step.state === "approved",
                );
                return (
                  <div
                    key={application.id}
                    className="rounded-md border border-success/20 bg-success/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {application.title}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-2">
                          {application.id}
                        </p>
                      </div>
                      <StatusBadge kind="workflow" value="approved" />
                    </div>
                    <p className="mt-2 text-[11px] text-muted">
                      {approvedSteps.map((step) => step.title).join(" · ")}
                    </p>
                    <p className="mt-1.5 text-[11px] text-muted-2 tabular">
                      Closed {application.lastUpdated} &middot;{" "}
                      {application.elapsedDays} of {application.slaTargetDays} SLA days
                      used
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card id="notifications">
            <CardHeader>
              <SectionHeading
                title="Notifications"
                description="Status, clarification and approval notices for this identity."
                action={<NotificationSummaryCard unread={unreadNotificationCount} total={notifications.length} />}
              />
            </CardHeader>
            <CardContent className="px-0 py-0">
              <NotificationList notifications={notifications} />
            </CardContent>
          </Card>
        </div>

        {/* Platform context */}
        <Card>
          <CardHeader>
            <SectionHeading
              title="Platform context"
              description="What the interoperability layer is doing behind these applications."
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/integration">
                    Integration dashboard
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KeyFigure
                label="Departments connected"
                value={`${platformTotals.activeConnectors} simulated connectors`}
                hint="Revenue, Pollution, Labour, Fire, Municipal"
              />
              <KeyFigure
                label="Interop events (24h)"
                value={new Intl.NumberFormat("en-IN").format(platformTotals.requests)}
                hint="Requests across all department endpoints"
              />
              <KeyFigure
                label="Pending workflows"
                value={String(platformTotals.pendingWorkflows)}
                hint="Instances waiting on a departmental decision"
              />
              <KeyFigure
                label="Showcase application"
                value={primaryApplicationId}
                hint={primary ? primary.title : "Not available"}
              />
            </div>
            <div className="rounded-md border border-warning/25 bg-warning/8 p-4">
              <div className="flex items-center gap-2">
                <CircleAlert className="size-4 text-warning" />
                <p className="text-xs font-semibold uppercase tracking-wider text-warning">
                  Why a stage can read &ldquo;blocked&rdquo;
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                The fire NOC stage for {primaryApplicationId} cannot proceed until
                the Pollution Control consent reference is published. GovSync holds
                the stage instead of letting the applicant discover the gap, and
                forwards the artefact automatically once the upstream stage
                completes.
              </p>
              <SimulatedNotice variant="compact" className="mt-3" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
