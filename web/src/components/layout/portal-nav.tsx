"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Monogram } from "@/components/govsync/department-chip";
import { BrandLockup } from "@/components/layout/brand";
import {
  isActivePath,
  portalNavGroups,
  utilityNav,
  type NavItem,
} from "@/lib/navigation";
import { connectedDepartments, SIMULATION } from "@/lib/data/departments";
import { cn } from "@/lib/utils";

/**
 * Portal navigation: the services an applicant uses, the connected
 * departments, the platform surfaces and the secondary items.
 */
export function PortalNav({
  className,
  compact = false,
  onNavigate,
}: {
  className?: string;
  /** Collapses the descriptions, used in the narrow horizontal bar. */
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {portalNavGroups[0]?.items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} compact onNavigate={onNavigate} />
        ))}
      </div>
    );
  }

  return (
    <nav className={cn("flex flex-col", className)} aria-label="Primary">
      {portalNavGroups.map((group, index) => (
        <div key={group.id} className={cn(index > 0 && "mt-5 border-t border-border pt-5")}>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">
            {group.label}
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  showDescription
                />
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mt-5 border-t border-border pt-5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">
          Connected Departments
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {connectedDepartments.map((department) => (
            <li
              key={department.id}
              className="flex items-center gap-2.5 rounded-md border border-transparent px-3 py-2"
            >
              <Monogram departmentId={department.id} className="size-6" />
              <span className="min-w-0 flex-1 truncate text-xs text-muted">
                {department.shortName}
              </span>
              <span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
              <span className="sr-only">{SIMULATION.connectionLabel}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 px-3 text-[10px] leading-relaxed text-muted-2">
          {SIMULATION.connectionLabel}. Simulated connectors, not live systems.
        </p>
      </div>
    </nav>
  );
}

function NavLink({
  item,
  pathname,
  compact = false,
  showDescription = false,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  compact?: boolean;
  showDescription?: boolean;
  onNavigate?: () => void;
}) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "group flex rounded-md border px-3 py-2 transition-colors",
        compact && "border-transparent py-1.5",
        active
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-transparent text-muted hover:border-border hover:bg-surface-2 hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          compact && "mt-0.5",
          active ? "text-accent" : "text-muted-2 group-hover:text-muted",
        )}
        aria-hidden="true"
      />
      <span className={cn("min-w-0", compact ? "ml-2" : "ml-3")}>
        <span className="block text-sm font-medium">{item.label}</span>
        {showDescription ? (
          <span className="mt-0.5 block text-[11px] leading-snug text-muted-2">
            {item.description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/** Secondary items, rendered at the bottom of the sidebar. */
export function PortalUtilityNav({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Secondary">
      {utilityNav.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          pathname={pathname}
          showDescription
          onNavigate={onNavigate}
        />
      ))}
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
