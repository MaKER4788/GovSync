import { Bell, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { BrandLockup } from "@/components/layout/brand";
import {
  PortalBrand,
  PortalNav,
  PortalSidebarFooter,
} from "@/components/layout/portal-nav";
import { Badge } from "@/components/ui/badge";
import { unreadNotificationCount } from "@/lib/data/notifications";
import { SIMULATION } from "@/lib/data/departments";

/**
 * Application shell for every signed-in surface (dashboard, application,
 * workflow, integration, logs, architecture).
 */
export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          <div className="lg:hidden">
            <Link href="/">
              <BrandLockup subtitle="GovSync SIH 2026" />
            </Link>
          </div>
          <div className="hidden flex-1 items-center gap-3 lg:flex">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-2" />
              <input
                type="search"
                disabled
                placeholder="Search applications, references, departments"
                aria-label="Search (not available in this prototype)"
                className="h-9 w-full cursor-not-allowed rounded-md border border-border bg-surface-inset pl-8 pr-3 text-sm text-muted-2 placeholder:text-muted-2"
              />
            </div>
            <Badge variant="secondary" className="shrink-0">
              <ShieldCheck className="size-3 text-success" />
              {SIMULATION.environmentCode}
            </Badge>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/dashboard#notifications"
              className="relative inline-flex size-9 items-center justify-center rounded-md border border-border bg-surface-2 text-muted transition-colors hover:border-border-strong hover:text-foreground"
              aria-label={`Notifications, ${unreadNotificationCount} unread`}
            >
              <Bell className="size-4" />
              {unreadNotificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-background">
                  {unreadNotificationCount}
                </span>
              ) : null}
            </Link>
            <div className="hidden items-center gap-2.5 border-l border-border pl-3 sm:flex">
              <span className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface-3 font-mono text-[11px] font-semibold text-accent">
                SP
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-medium text-foreground">
                  Sundara Precision Castings
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-muted-2">
                  Demo identity &middot; no real sign-in
                </span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col justify-between border-r border-border bg-surface p-4 lg:flex">
          <div className="space-y-6">
            <PortalBrand />
            <PortalNav />
          </div>
          <PortalSidebarFooter />
        </aside>

        <div className="min-w-0 flex-1">
          <nav
            className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-4 py-2 lg:hidden"
            aria-label="Primary mobile"
          >
            <PortalNav className="flex-row" compact />
          </nav>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
