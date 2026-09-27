import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Check, Inbox, Mail, MessageSquare } from "lucide-react";

import { KeyFigure } from "@/components/govsync/metric-card";
import { PageHeader, SectionHeading } from "@/components/govsync/page-header";
import { NotificationList } from "@/components/govsync/notification-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notifications, unreadNotificationCount } from "@/lib/data/notifications";
import type { Notification } from "@/lib/types";

export const metadata: Metadata = {
  title: "Notifications",
  description:
    "Status, action and approval notices for the demo identity, across portal, email and SMS.",
};

const bySeverity = (severity: Notification["severity"]) =>
  notifications.filter((notification) => notification.severity === severity);

const channelMeta: Record<
  Notification["channel"],
  { label: string; icon: typeof Bell }
> = {
  portal: { label: "Portal", icon: Inbox },
  email: { label: "Email", icon: Mail },
  sms: { label: "SMS", icon: MessageSquare },
};

export default function NotificationsPage() {
  const unread = notifications.filter((notification) => !notification.read);
  const read = notifications.filter((notification) => notification.read);

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Notifications"
        description="Every notice raised against your applications, newest first. Each one names the application it refers to, so nothing has to be interpreted."
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notifications" },
        ]}
        actions={
          <Button variant="secondary" disabled title="Not available in this prototype">
            <Check className="size-4" aria-hidden="true" />
            Mark all read
          </Button>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <section aria-labelledby="counts-heading">
          <h2 id="counts-heading" className="sr-only">
            Notification counts
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KeyFigure
              label="Unread"
              value={String(unreadNotificationCount)}
              hint="Not yet opened by the applicant"
            />
            <KeyFigure
              label="Actions required"
              value={String(bySeverity("error").length)}
              hint="Work only the applicant can do"
            />
            <KeyFigure
              label="Progress updates"
              value={String(bySeverity("info").length)}
              hint="A stage changed state"
            />
            <KeyFigure
              label="Approvals granted"
              value={String(bySeverity("success").length)}
              hint="A stage moved to approved"
            />
          </div>
        </section>

        <Tabs defaultValue="unread">
          <TabsList>
            <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="read">Read ({read.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="unread">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Unread"
                  description="Open an application from any notice to see the stage it refers to."
                />
              </CardHeader>
              <CardContent className="px-0 py-0">
                {unread.length > 0 ? (
                  <NotificationList notifications={unread} />
                ) : (
                  <p className="px-5 py-6 text-sm text-muted">
                    Nothing unread. Every notice has been opened.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="All notifications"
                  description="The full feed for this identity, newest first."
                />
              </CardHeader>
              <CardContent className="px-0 py-0">
                <NotificationList notifications={notifications} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="read">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Read"
                  description="Notices already opened. They stay here as the record of what was communicated and when."
                />
              </CardHeader>
              <CardContent className="px-0 py-0">
                <NotificationList notifications={read} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section aria-labelledby="channels-heading">
            <Card className="h-full">
              <CardHeader>
                <SectionHeading
                  title="Delivery channels"
                  description="Where each notice in this prototype would have been sent."
                />
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(Object.keys(channelMeta) as Notification["channel"][]).map(
                    (channel) => {
                      const meta = channelMeta[channel];
                      const count = notifications.filter(
                        (notification) => notification.channel === channel,
                      ).length;
                      const Icon = meta.icon;
                      return (
                        <li
                          key={channel}
                          className="flex items-center gap-3 rounded-md border border-border-subtle bg-surface-2/30 p-3"
                        >
                          <Icon
                            className="size-3.5 shrink-0 text-muted-2"
                            aria-hidden="true"
                          />
                          <span className="text-xs font-medium text-foreground">
                            {meta.label}
                          </span>
                          <span className="ml-auto font-mono text-xs text-muted tabular">
                            {count}
                          </span>
                        </li>
                      );
                    },
                  )}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="preferences-heading">
            <Card className="h-full">
              <CardHeader>
                <SectionHeading
                  title="Notification preferences"
                  description="Apparent controls. Nothing is persisted in this prototype and no message is actually delivered."
                />
              </CardHeader>
              <CardContent className="space-y-3">
                {(
                  [
                    ["Stage status changes", "Portal and email", true],
                    ["Action required", "Portal, email and SMS", true],
                    ["Approval granted", "Portal and email", true],
                    ["Weekly digest", "Email", false],
                  ] as const
                ).map(([label, channels, on]) => (
                  <div
                    key={label}
                    className="flex flex-wrap items-center gap-3 border-b border-border-subtle pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-foreground">
                        {label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-2">
                        {channels}
                      </span>
                    </span>
                    <span
                      className={
                        on
                          ? "inline-flex items-center gap-1.5 rounded border border-success/30 bg-success/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-success"
                          : "inline-flex items-center gap-1.5 rounded border border-border bg-surface-3 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-2"
                      }
                    >
                      {on ? "On" : "Off"}
                    </span>
                  </div>
                ))}
                <p className="text-[11px] leading-relaxed text-muted-2">
                  Channel preferences can be changed in{" "}
                  <Link href="/settings" className="text-accent hover:underline">
                    Settings
                  </Link>
                  . The switches above are illustrative and are not wired to any
                  stored preference.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
