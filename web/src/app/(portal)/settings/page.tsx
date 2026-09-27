import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  Building2,
  Info,
  KeyRound,
  Lock,
  MapPin,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

import { PageHeader, SectionHeading } from "@/components/govsync/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { connectedDepartments, SIMULATION } from "@/lib/data/departments";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Profile, notification channels and privacy settings for the demo identity. No value is persisted in this prototype.",
};

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="The identity, contact details and channel preferences this workspace runs on. This prototype stores nothing, so every control below is read-only."
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
        actions={
          <Button disabled title="Not available in this prototype">
            <Save className="size-4" aria-hidden="true" />
            Save changes
          </Button>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section aria-labelledby="identity-heading">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Identity"
                  description="A fixed demonstration identity. There is no sign-in and no real person behind it."
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 rounded-md border border-border bg-surface-2/30 p-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-surface-3 font-mono text-xs font-semibold text-accent">
                    DU
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Demo User</p>
                    <p className="mt-0.5 text-[11px] text-muted-2">
                      Demonstration identity &middot; no credentials
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    Read only
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="settings-name"
                      className="flex items-center gap-1.5 text-xs font-medium text-foreground"
                    >
                      <User className="size-3.5 text-muted-2" aria-hidden="true" />
                      Full name
                    </label>
                    <Input
                      id="settings-name"
                      defaultValue="Demo User"
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="settings-email"
                      className="flex items-center gap-1.5 text-xs font-medium text-foreground"
                    >
                      <Bell className="size-3.5 text-muted-2" aria-hidden="true" />
                      Email
                    </label>
                    <Input
                      id="settings-email"
                      defaultValue="demo.user@example.invalid"
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="settings-phone"
                      className="flex items-center gap-1.5 text-xs font-medium text-foreground"
                    >
                      <Building2 className="size-3.5 text-muted-2" aria-hidden="true" />
                      Registered entity
                    </label>
                    <Input
                      id="settings-phone"
                      defaultValue="Northbridge Foods and Beverages Pvt Ltd"
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="settings-district"
                      className="flex items-center gap-1.5 text-xs font-medium text-foreground"
                    >
                      <MapPin className="size-3.5 text-muted-2" aria-hidden="true" />
                      District
                    </label>
                    <Input id="settings-district" defaultValue="Northbridge" disabled readOnly />
                  </div>
                </div>
                <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-2">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Identifiers and phone numbers are masked in the application records
                  exactly as they would be outside this prototype. The values here are
                  placeholders and resolve to nothing.
                </p>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="privacy-heading" className="space-y-6">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Privacy and consent"
                  description="How departmental sharing is governed on the record."
                />
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-relaxed text-muted">
                <p className="flex items-start gap-2.5">
                  <Lock className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
                  Consent to share a document with the departments named on an
                  application is recorded when that application is filed. It is
                  withdrawn when the application is closed.
                </p>
                <p className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
                  A department only receives the documents its own stage requires. It is
                  never sent a document another department has not yet issued.
                </p>
                <p className="flex items-start gap-2.5">
                  <KeyRound className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
                  No credential, token or key exists anywhere in this prototype. There is
                  no session to sign out of and nothing is transmitted off the machine.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <SectionHeading
                  title="Environment"
                  description="What this build is and is not connected to."
                />
              </CardHeader>
              <CardContent>
                <dl className="space-y-2.5 text-xs">
                  {(
                    [
                      ["Environment", `${SIMULATION.environmentName} (${SIMULATION.environmentCode})`],
                      ["Connection label", SIMULATION.connectionLabel],
                      ["Data frozen", SIMULATION.frozenAt],
                      ["Connected departments", String(connectedDepartments.length)],
                    ] as const
                  ).map(([term, value]) => (
                    <div
                      key={term}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border-subtle pb-2.5 last:border-b-0 last:pb-0"
                    >
                      <dt className="text-muted-2">{term}</dt>
                      <dd className="font-mono text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-2">
                  Departmental connectors in this build are simulated.{" "}
                  <Link href="/integration" className="text-accent hover:underline">
                    Integration detail
                  </Link>{" "}
                  lists each simulated system and its capabilities.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
