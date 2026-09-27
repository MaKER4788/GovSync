import { FilePlus2, Files } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DEMO_TODAY } from "@/lib/format";

/**
 * Dashboard greeting. The identity is fixed demo data and the wording says so,
 * because there is no sign-in behind this prototype.
 */
export function DashboardHeader({
  applicantName,
  primaryHref,
  allHref,
}: {
  applicantName: string;
  primaryHref: string;
  allHref: string;
}) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            {DEMO_TODAY} &middot; Demo applicant workspace
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
            Good morning, {applicantName}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Manage your applications and track government approvals from one place.
          </p>
          <p className="text-xs text-muted-2">
            Every status below comes from the simulated record set frozen on{" "}
            {DEMO_TODAY}. No live government system is connected.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href={primaryHref}>
              <FilePlus2 className="size-4" aria-hidden="true" />
              Start New Application
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={allHref}>
              <Files className="size-4" aria-hidden="true" />
              View All Applications
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
