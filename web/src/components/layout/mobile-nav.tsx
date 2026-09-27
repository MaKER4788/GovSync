"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { PortalBrand, PortalNav, PortalUtilityNav } from "@/components/layout/portal-nav";

/**
 * Narrow-screen navigation. The sidebar collapses into a single toggle that
 * opens a full-height panel. The open state is keyed to the route it was
 * opened on, so navigating closes the panel without an effect, and Escape
 * closes it too. The toggle carries its expanded state for assistive tech.
 */
export function MobileNav() {
  const pathname = usePathname();
  // Null when closed; otherwise the route the panel was opened on.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedOn(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpenedOn(open ? null : pathname)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close navigation" : "Open navigation"}
        className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-surface-2 text-muted transition-colors hover:border-border-strong hover:text-foreground"
      >
        {open ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 top-16 z-30 bg-background/70"
            onClick={() => setOpenedOn(null)}
            aria-hidden="true"
          />
          <div
            id="mobile-nav-panel"
            className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-r border-border bg-surface p-4"
          >
            <div className="mb-4">
              <PortalBrand />
            </div>
            <PortalNav onNavigate={() => setOpenedOn(null)} />
            <div className="mt-5 border-t border-border pt-4">
              <PortalUtilityNav onNavigate={() => setOpenedOn(null)} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
