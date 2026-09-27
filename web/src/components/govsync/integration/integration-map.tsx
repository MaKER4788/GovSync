"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, PlugZap, RefreshCw, TriangleAlert } from "lucide-react";

import { SectionHeading } from "@/components/govsync/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  fetchDepartments,
  HEALTH_LABEL,
  type ClientResult,
  type DepartmentListing,
} from "@/lib/govsync/client";
import type { ConnectorHealth } from "@/lib/integrations/types";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  connected: "border-success/35 bg-success/10 text-success",
  degraded: "border-warning/35 bg-warning/10 text-warning",
  unavailable: "border-danger/35 bg-danger/10 text-danger",
  "not-connected": "border-border bg-surface-3 text-muted",
};

function StateBadge({ state }: { state: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        TONE[state] ?? TONE["not-connected"],
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          state === "connected"
            ? "bg-success"
            : state === "degraded"
              ? "bg-warning"
              : "bg-danger",
        )}
      />
      {HEALTH_LABEL[state] ?? state}
    </span>
  );
}

/**
 * The connector registry, read live from `/api/govsync/departments`.
 *
 * Every row is a simulated department. The base URL is shown because the
 * interoperability story depends on it being visible, and it is shown with the
 * disclaimer beside it so nobody can read the page as a claim of a live link.
 */
export function IntegrationMap({
  className,
  applicationId,
}: {
  className?: string;
  applicationId?: string;
}) {
  const [result, setResult] = useState<ClientResult<DepartmentListing[]> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const next = await fetchDepartments();
    setResult(next);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await fetchDepartments();
      if (!cancelled) setResult(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const listings = result?.success ? result.data : [];

  return (
    <Card className={className}>
      <CardHeader>
        <SectionHeading
          title="Department connectors"
          description="One contract, four simulated implementations. Health below is measured per connector during this server session."
          action={
            <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={refreshing}>
              <RefreshCw className={refreshing ? "animate-spin" : undefined} />
              {refreshing ? "Reading" : "Refresh"}
            </Button>
          }
        />
      </CardHeader>

      <CardContent className="space-y-3">
        {result === null ? (
          <p className="text-xs text-muted">Contacting the GovSync integration layer...</p>
        ) : !result.success ? (
          <div className="rounded-lg border border-danger/25 bg-danger/8 p-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-danger">
              <TriangleAlert className="size-3.5" />
              {result.error.code}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              {result.error.message}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {listings.map((listing) => (
                <ConnectorCard
                  key={listing.departmentId}
                  listing={listing}
                  health={listing.health}
                  applicationId={applicationId}
                />
              ))}
            </div>
            <p className="flex items-start gap-2 border-t border-border-subtle pt-3 text-[11px] leading-relaxed text-muted-2">
              <Activity className="mt-0.5 size-3.5 shrink-0" />
              No connector below talks to a live system. Each base URL is a description of
              where a real integration would point, answered in-process by a mock
              implementation of the same contract.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ConnectorCard({
  listing,
  health,
  applicationId,
}: {
  listing: DepartmentListing;
  health: ConnectorHealth | null;
  applicationId?: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-2 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground">{listing.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-2">{listing.systemName}</p>
        </div>
        <StateBadge state={health?.state ?? "not-connected"} />
      </div>

      <dl className="mt-3 space-y-1.5 font-mono text-[10px] text-muted">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-muted-2">connector</dt>
          <dd className="min-w-0 break-all">{listing.slug}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-muted-2">base</dt>
          <dd className="min-w-0 break-all">{listing.baseUrl}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-muted-2">version</dt>
          <dd className="min-w-0 break-all">{listing.apiVersion}</dd>
        </div>
        {applicationId ? (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted-2">request</dt>
            <dd className="min-w-0 break-all">{health?.lastRequestId ?? "not called yet"}</dd>
          </div>
        ) : null}
      </dl>

      {health ? (
        <p className="mt-2.5 text-[11px] leading-relaxed text-muted">{health.detail}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {listing.operations.map((operation) => (
          <Badge key={operation} variant="outline" className="font-mono text-[10px]">
            {operation}
          </Badge>
        ))}
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-2">
        <PlugZap className="mt-0.5 size-3 shrink-0" />
        {listing.disclaimer}
      </p>
    </div>
  );
}
