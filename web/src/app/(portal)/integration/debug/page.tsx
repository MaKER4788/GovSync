import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Gauge } from "lucide-react";

import { IntegrationDebug } from "@/components/govsync/integration/integration-debug";
import { PageHeader } from "@/components/govsync/page-header";
import { SimulatedNotice } from "@/components/govsync/simulated-notice";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Integration Debug | GovSync",
  description:
    "Developer view of the GovSync integration layer: session counters, append-only integration events, hop-by-hop request traces including retries, the audit log, and an honest statement of which security controls are implemented.",
};

export default function IntegrationDebugPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Platform operations"
        title="Integration debug"
        description="What the integration layer actually did, read from the same in-memory state the API serves. Nothing on this page is reconstructed or hard-coded."
        crumbs={[
          { label: "Platform console" },
          { label: "Government integration", href: "/integration" },
          { label: "Debug" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href="/integration">
              <ArrowLeft className="size-4" />
              Back to integration
            </Link>
          </Button>
        }
        meta={
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-2">
            <Gauge className="size-3.5" />
            In-memory, lost on restart
          </span>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <SimulatedNotice />
        <IntegrationDebug />
      </div>
    </div>
  );
}
