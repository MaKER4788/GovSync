import { BellRing } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/govsync/status-badge";
import type { NotificationItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NotificationList({
  notifications,
  className,
}: {
  notifications: NotificationItem[];
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-border-subtle", className)}>
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className="flex gap-3 px-5 py-4 transition-colors hover:bg-surface-2/50"
        >
          <span
            className={cn(
              "mt-1.5 size-1.5 shrink-0 rounded-full",
              notification.read ? "bg-border-strong" : "bg-accent",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                {notification.title}
              </p>
              {!notification.read ? (
                <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                  New
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {notification.message}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-2">
              <span className="tabular">{notification.at}</span>
              <span className="uppercase tracking-wider">{notification.channel}</span>
              {notification.applicationId ? (
                <Link
                  href={`/applications/${notification.applicationId}`}
                  className="font-mono text-accent hover:underline"
                >
                  {notification.applicationId}
                </Link>
              ) : null}
              <StatusBadge
                kind="severity"
                value={notification.severity}
                withIcon={false}
                dot
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function NotificationSummaryCard({
  unread,
  total,
}: {
  unread: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <BellRing className="size-4 text-accent" />
      <div>
        <p className="text-sm font-semibold text-foreground tabular">
          {unread} unread of {total}
        </p>
        <p className="text-xs text-muted-2">Portal, email and SMS delivery</p>
      </div>
    </div>
  );
}
