"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, RefreshCw, TriangleAlert } from "lucide-react";

import { SectionHeading } from "@/components/govsync/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fetchHealth, HEALTH_LABEL, type ClientResult, type IntegrationMetrics } from "@/lib/govsync/client";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  connected: "border-success/35 bg-success/10 text-success",
  degraded: "border-warning/35 bg-warning/10 text-warning",
  unavailable: "border-danger/35 bg-danger/10 text-danger",
};

/**
 * Live connector health on the applicant dashboard.
 *
 * Deliberately thin. An applicant should be able to tell that a department is
 * slow without being handed a monitoring console, and the numbers here are the
 * integration layer's own session counters rather than the frozen dataset used
 * elsewhere on this page.
 */
export function IntegrationHealthPanel() {
  const [result, setResult] = useState<ClientResult<IntegrationMetrics> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await fetchHealth();
      if (!cancelled) setResult(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    setResult(await fetchHealth());
    setRefreshing(false);
  };

  return (
    <Card>
      <CardHeader>
        <SectionHeading
          title="Demo integration health"
          description="Measured by the integration layer during this server session. All four connectors are simulated."
          action={
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={refreshing}>
                <RefreshCw className={refreshing ? "animate-spin" : undefined} />
                Refresh
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/integration/debug">
                  Debug
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          }
        />
      </CardHeader>

      <CardContent>
        {result === null ? (
          <p className="text-xs text-muted">Contacting the integration layer...</p>
        ) : !result.success ? (
          <p className="flex items-center gap-2 text-[11px] leading-relaxed text-muted">
            <TriangleAlert className="size-3.5 text-danger" />
            {result.error.message}
          </p>
        ) : (
          <>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {result.data.health.map((entry) => (
                <div
                  key={entry.departmentId}
                  className="rounded border border-border-subtle bg-surface-2 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {entry.departmentName}
                    </span>
                    <span
                      className={cn(
                        "ml-auto rounded border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
                        TONE[entry.state] ?? TONE.unavailable,
                      )}
                    >
                      {HEALTH_LABEL[entry.state] ?? entry.state}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                    {entry.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
              <Activity className="size-3.5 text-muted-2" />
              <span className="text-[11px] text-muted">
                {result.data.totalRequests} call
                {result.data.totalRequests === 1 ? "" : "s"} this session ·{" "}
                {result.data.successful} completed · {result.data.failed} failed ·{" "}
                {result.data.retriedRequests} retried
              </span>
              {result.data.pendingPublishes > 0 ? (
                <Badge variant="warning" className="text-[10px]">
                  {result.data.pendingPublishes} decision
                  {result.data.pendingPublishes === 1 ? "" : "s"} awaiting delivery
                </Badge>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
