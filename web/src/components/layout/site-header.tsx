import Link from "next/link";

import { BrandLockup } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { SimulatedNotice } from "@/components/govsync/simulated-notice";

const links = [
  { label: "Problem", href: "#problem" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Architecture", href: "/architecture" },
  { label: "Event logs", href: "/logs" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center gap-6 px-6 lg:px-10">
        <Link href="/">
          <BrandLockup />
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Sections">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <SimulatedNotice variant="compact" />
          <Button asChild size="sm">
            <Link href="/dashboard">Open demo</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
