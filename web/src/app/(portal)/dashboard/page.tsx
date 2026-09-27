import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, FileStack, ListChecks, TriangleAlert } from "lucide-react";

import { ActionRequiredCard } from "@/components/govsync/action-required-card";
import { ActivityTimeline } from "@/components/govsync/activity-timeline";
import { ApprovalProgress } from "@/components/govsync/approval-progress";
import { ApplicationTable } from "@/components/govsync/application-table";
import { ConnectedDepartments } from "@/components/govsync/connected-departments";
import { DashboardHeader } from "@/components/govsync/dashboard-header";
import { NotificationList, NotificationSummaryCard } from "@/components/govsync/notification-list";
import { ProgressBar } from "@/components/govsync/progress-bar";
import { SectionHeading } from "@/components/govsync/page-header";
import { StatusBadge, StatusLegend } from "@/components/govsync/status-badge";
import { SummaryCard } from "@/components/govsync/summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { activitiesForApplication } from "@/lib/data/activities";
import {
  activeApplications,
  applicationById,
  applicationProgress,
  approvedCount,
  completedApplications,
  primaryApplicationId,
} from "@/lib/data/applications";
import {
  pendingApprovalCount,
  requiredActionCount,
  requiredActions,
} from "@/lib/data/approvals";
import { notifications, unreadNotificationCount } from "@/lib/data/notifications";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Active applications, pending approvals, required actions and notifications for the demo applicant identity.",
};

export default function DashboardPage() {
  const primary = applicationById(primaryApplicationId);
  const actions = requiredActions();
  const recentActivity = activitiesForApplication(primaryApplicationId).slice(0, 4);

  return (
    <div>
      <DashboardHeader
        applicantName="Demo User"
        primaryHref="/applications#start"
        allHref="/applications"
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        {/* Step 4: the four key figures */}
        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="sr-only">
            Application summary
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Active applications"
              value={activeApplications.length}
              icon={FileStack}
              detail="Filed and not yet closed, across every service."
              href="/applications"
              linkLabel="View all applications"
            />
            <SummaryCard
              label="Pending approvals"
              value={pendingApprovalCount()}
              icon={ListChecks}
              tone="info"
              detail="Stages queued behind an upstream decision."
              href="/approvals"
              linkLabel="See pending approvals"
            />
            <SummaryCard
              label="Actions required"
              value={requiredActionCount()}
              icon={TriangleAlert}
              tone={requiredActionCount() > 0 ? "danger" : "neutral"}
              detail="Items only you can supply, with a demo deadline."
              href="/approvals#actions"
              linkLabel="Review actions"
            />
            <SummaryCard
              label="Completed"
              value={completedApplications.length}
              icon={CheckCircle2}
              tone="success"
              detail="Applications closed and issued to the vault."
              href="/applications#completed"
              linkLabel="View completed"
            />
          </div>
        </section>

        {/* Step 5: active applications */}
        <section aria-labelledby="active-heading">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Active applications"
                description="Every application in progress, with the stage it is waiting on."
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/applications">
                      View All Applications
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="px-0 py-0">
              <ApplicationTable
                applications={activeApplications}
                caption="Active applications with current stage, progress and status"
              />
            </CardContent>
          </Card>
        </section>

        {/* Step 7: approval progress for the primary application */}
        {primary ? (
          <section aria-labelledby="progress-heading">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Approval progress"
                  description={`${primary.title} · ${primary.id}`}
                  action={
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/applications/${primary.id}`}>
                        Open application
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent className="space-y-5">
                <ProgressBar
                  value={applicationProgress(primary)}
                  label="Overall completion"
                  caption={`${approvedCount(primary)} of ${primary.approvals.length} stages approved · stage ${approvedCount(primary) + 1} is with ${primary.approvals[approvedCount(primary)]?.actor ?? "the departments"}`}
                />
                <ApprovalProgress approvals={primary.approvals} />
                <StatusLegend kind="workflow" className="border-t border-border-subtle pt-4" />
              </CardContent>
            </Card>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Step 8: action required */}
          <section aria-labelledby="actions-heading">
            <Card className="h-full">
              <CardHeader>
                <SectionHeading
                  title="Action Required"
                  description="The application cannot move until you respond."
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
                    Nothing is waiting on you. Every stage is with a department.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Step 9: recent activity */}
          <section aria-labelledby="activity-heading">
            <Card className="h-full">
              <CardHeader>
                <SectionHeading
                  title="Recent Activity"
                  description={
                    primary
                      ? `Latest events on ${primary.id} · ${primary.title}`
                      : "Latest events"
                  }
                  action={
                    primary ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/applications/${primary.id}`}>
                          Full activity
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </Button>
                    ) : null
                  }
                />
              </CardHeader>
              <CardContent>
                <ActivityTimeline entries={recentActivity} />
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {/* Step 10: connected departments */}
          <section aria-labelledby="departments-heading">
            <Card className="h-full">
              <CardHeader>
                <SectionHeading
                  title="Connected Departments"
                  description="The departmental systems this workspace is wired to."
                  action={
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/integration">
                        Integration detail
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent>
                <ConnectedDepartments />
              </CardContent>
            </Card>
          </section>

          {/* Notifications */}
          <section aria-labelledby="notifications-heading">
            <Card className="h-full">
              <CardHeader>
                <SectionHeading
                  title="Notifications"
                  description="Status, action and approval notices for this identity."
                  action={
                    <NotificationSummaryCard
                      unread={unreadNotificationCount}
                      total={notifications.length}
                    />
                  }
                />
              </CardHeader>
              <CardContent className="px-0 py-0">
                <NotificationList notifications={notifications.slice(0, 4)} />
                <div className="border-t border-border-subtle p-3">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/notifications">
                      <Bell className="size-3.5" aria-hidden="true" />
                      All notifications ({notifications.length})
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Status vocabulary used across the workspace */}
        <section aria-labelledby="status-heading">
          <Card>
            <CardHeader>
              <SectionHeading
                title="How statuses read"
                description="Every status is shown as an icon and a word, never colour alone."
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge kind="workflow" value="approved" />
                <StatusBadge kind="workflow" value="under-review" />
                <StatusBadge kind="workflow" value="pending" />
                <StatusBadge kind="workflow" value="action-required" />
                <StatusBadge kind="workflow" value="blocked" />
                <StatusBadge kind="application" value="completed" />
              </div>
              <StatusLegend kind="application" className="border-t border-border-subtle pt-4" />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
