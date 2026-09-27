import Link from "next/link";

import { BrandLockup } from "@/components/layout/brand";
import { SIMULATION } from "@/lib/data/departments";

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Application details", href: "/applications/GS-2026-00142" },
      { label: "Approval workflow", href: "/workflow" },
    ],
  },
  {
    title: "Operations",
    links: [
      { label: "Government integration", href: "/integration" },
      { label: "API & event logs", href: "/logs" },
      { label: "Architecture", href: "/architecture" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="px-6 py-10 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]">
          <div className="space-y-3">
            <BrandLockup />
            <p className="max-w-md text-xs leading-relaxed text-muted">
              {SIMULATION.dataOrigin} Built as a Smart India Hackathon 2026
              prototype to demonstrate a unified, auditable approval workflow
              across government departments.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-2">
                {column.title}
              </p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border-subtle pt-6 text-[11px] text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {SIMULATION.environmentName} &middot; {SIMULATION.buildLabel} &middot;{" "}
            {SIMULATION.timezone}
          </p>
          <p>
            Fictional departments and references. No government system is
            connected and no departmental emblem is reproduced.
          </p>
        </div>
      </div>
    </footer>
  );
}
