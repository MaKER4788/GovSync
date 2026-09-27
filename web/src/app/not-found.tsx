import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
        404 &middot; Simulated grid
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        Record not found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        No application with that reference exists in the prototype dataset. All
        records here are locally generated mock data.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Landing page</Link>
        </Button>
      </div>
    </div>
  );
}
