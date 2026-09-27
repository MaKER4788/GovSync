"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActivePath, portalNav } from "@/lib/navigation";
import { SIMULATION } from "@/lib/data/departments";
import { BrandLockup } from "@/components/layout/brand";
import { cn } from "@/lib/utils";

export function PortalNav({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Primary">
      {portalNav.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-start gap-3 rounded-md border px-3 py-2.5 transition-colors",
              active
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-transparent text-muted hover:border-border hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                active ? "text-accent" : "text-muted-2 group-hover:text-muted",
              )}
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{item.label}</span>
              {compact ? null : (
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-2">
                  {item.description}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalSidebarFooter() {
  return (
    <div className="space-y-3 rounded-md border border-warning/25 bg-warning/8 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-warning">
        Simulation only
      </p>
      <p className="text-[11px] leading-relaxed text-muted">
        {SIMULATION.environmentName} ({SIMULATION.environmentCode}). Department APIs are
        mocked for this prototype.
      </p>
      <p className="font-mono text-[10px] text-muted-2">
        Data frozen {SIMULATION.frozenAt}
      </p>
    </div>
  );
}

export function PortalBrand() {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <BrandLockup />
    </Link>
  );
}
