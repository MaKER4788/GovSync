import type { Metadata } from "next";

import { PortalShell } from "@/components/layout/portal-shell";
import { SimulatedNotice } from "@/components/govsync/simulated-notice";

export const metadata: Metadata = {
  title: "Platform console",
  description:
    "GovSync platform console: applications, approvals, department integrations and event logs. Simulated environment.",
};

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PortalShell>
      <SimulatedNotice variant="banner" />
      {children}
    </PortalShell>
  );
}
