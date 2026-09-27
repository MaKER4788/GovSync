import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Layers, Timer, Users } from "lucide-react";

import { ApplicationTable } from "@/components/govsync/application-table";
import { PageHeader, SectionHeading } from "@/components/govsync/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  activeApplications,
  applications,
  completedApplications,
} from "@/lib/data/applications";
import { departmentLabel, serviceCatalogue } from "@/lib/data/departments";
import type { ApplicantKind } from "@/lib/types";

export const metadata: Metadata = {
  title: "Applications",
  description:
    "Every application filed by the demo identity, plus the catalogue of services an application can be started for.",
};

const applicantKindLabel: Record<ApplicantKind, string> = {
  citizen: "Citizen",
  business: "Business",
};

export default function ApplicationsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Applications"
        description="Everything this identity has filed, in one list, with the stage each one is waiting on. Completed applications stay here for reference."
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Applications" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard">
              Back to dashboard
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <section aria-labelledby="active-heading">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Active applications"
                description={`${activeApplications.length} applications filed and not yet closed.`}
                action={
                  <span className="font-mono text-[11px] text-muted-2 tabular">
                    {activeApplications.length}
                  </span>
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

        <section aria-labelledby="completed-heading" id="completed" className="scroll-mt-20">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Completed applications"
                description={`${completedApplications.length} closed applications, kept for the record.`}
                action={
                  <span className="font-mono text-[11px] text-muted-2 tabular">
                    {completedApplications.length}
                  </span>
                }
              />
            </CardHeader>
            <CardContent className="px-0 py-0">
              <ApplicationTable
                applications={completedApplications}
                caption="Completed applications with issuing department and completion date"
              />
            </CardContent>
          </Card>
        </section>

        {/* Start New Application: an intake placeholder, deliberately not a form. */}
        <section aria-labelledby="start-heading" id="start" className="scroll-mt-20">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Start a new application"
                description="Choose a service to see which departments would be involved. Filing is not available in this prototype: nothing is submitted, and no record is created."
              />
            </CardHeader>
            <CardContent>
              <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {serviceCatalogue.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex h-full flex-col rounded-lg border border-border bg-surface-2/30 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {entry.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded border border-border bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                        <Layers className="size-2.5" aria-hidden="true" />
                        {entry.typicalStages} stages
                      </span>
                    </div>
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">
                      {entry.description}
                    </p>

                    <dl className="mt-3 space-y-1.5 text-[11px] text-muted-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-3 shrink-0" aria-hidden="true" />
                        <dt className="sr-only">Departments</dt>
                        <dd className="min-w-0 truncate">
                          {entry.departmentIds
                            .map((id) => departmentLabel(id))
                            .join(" \u00b7 ")}
                        </dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="size-3 shrink-0" aria-hidden="true" />
                        <dt className="sr-only">Target time</dt>
                        <dd className="tabular">
                          {entry.slaTargetDays} day target once filed
                        </dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="size-3 shrink-0" aria-hidden="true" />
                        <dt className="sr-only">Who can apply</dt>
                        <dd>
                          {entry.applicantKinds
                            .map((kind) => applicantKindLabel[kind])
                            .join(" or ")}
                        </dd>
                      </div>
                    </dl>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      disabled
                      title="Filing is not available in this prototype"
                    >
                      Start application
                    </Button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-muted-2">
                {applications.length} applications are recorded for this identity in
                the prototype dataset. Every reference, department and deadline on
                this page is fictional.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
