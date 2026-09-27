"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, RotateCcw, TriangleAlert, Unplug } from "lucide-react";

import { SectionHeading } from "@/components/govsync/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  fetchApprovals,
  resetIntegration,
  syncApplication,
  type ClientResult,
  type DepartmentStatusReport,
} from "@/lib/govsync/client";
import type { WorkflowStageState, WorkflowState } from "@/lib/integrations/types";
import { cn } from "@/lib/utils";

const STATE_TONE: Record<string, string> = {
  approved: "border-success/35 bg-success/10 text-success",
  "under-review": "border-info/30 bg-info/10 text-info",
  "action-required": "border-warning/35 bg-warning/10 text-warning",
  blocked: "border-danger/35 bg-danger/10 text-danger",
  rejected: "border-danger/35 bg-danger/10 text-danger",
  pending: "border-border bg-surface-3 text-muted",
};

const OUTCOME_NOTE: Record<DepartmentStatusReport["outcome"], string> = {
  synchronized: "In step with GovSync",
  "pending-publish": "A decision is still queued for this stage",
  failed: "The connector did not answer",
  "not-connected": "No connector in this phase",
};

function StatePill({ state }: { state: WorkflowState | null }) {
  if (!state) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
        STATE_TONE[state] ?? STATE_TONE.pending,
      )}
    >
      {state}
    </span>
  );
}

/**
 * Departmental status for one application, read live through the connectors.
 *
 * Two things this panel exists to show:
 *
 *   - what each department calls its own state, next to the GovSync word it
 *     normalises to, so the translation is visible rather than asserted;
 *   - that a departmental failure never moves the workflow. The stage list in
 *     the engine keeps the decision, this panel shows the fault, and the next
 *     synchronisation delivers what was owed.
 *
 * When a synchronisation does reconcile, the reconciled stage states are handed
 * back through `onReconciled` so the workflow graph above adopts departmental
 * truth rather than merely reporting that it disagrees. Nothing is adopted from a
 * plain re-read: a read is a report, a sync is a decision.
 */
export function DepartmentStatusPanel({
  applicationId,
  onReconciled,
  className,
}: {
  applicationId: string;
  onReconciled?: (stages: WorkflowStageState[], at: string) => void;
  className?: string;
}) {
  const [result, setResult] = useState<ClientResult<DepartmentStatusReport[]> | null>(null);
  const [busy, setBusy] = useState<"sync" | "reset" | "read" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = useCallback(
    async (which: "sync" | "reset" | "read") => {
      setBusy(which);
      setMessage(null);
      if (which === "reset") {
        const outcome = await resetIntegration(applicationId);
        setResult(null);
        setMessage(outcome.success ? outcome.data.message : outcome.error.message);
      } else if (which === "sync") {
        const outcome = await syncApplication(applicationId);
        setResult(await fetchApprovals(applicationId));
        if (outcome.success) {
          onReconciled?.(outcome.data.stages, outcome.data.completedAt);
          setMessage(
            outcome.data.diverged.length > 0
              ? `Synchronised ${outcome.data.departments.length} stages and adopted the departmental record for ${outcome.data.diverged.length}: ${outcome.data.diverged
                  .map((entry) => entry.stageTitle)
                  .join(", ")}.`
              : `Synchronised ${outcome.data.departments.length} stages. Every connector agrees with GovSync.`,
          );
        } else {
          setMessage(outcome.error.message);
        }
      } else {
        setResult(await fetchApprovals(applicationId));
      }
      setBusy(null);
    },
    [applicationId, onReconciled],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await fetchApprovals(applicationId);
      if (!cancelled) setResult(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const reports = result?.success ? result.data : [];
  const failed = reports.filter((report) => report.outcome === "failed").length;
  const owed = reports.filter((report) => report.outcome === "pending-publish").length;

  return (
    <Card className={className}>
      <CardHeader>
        <SectionHeading
          title="Departmental status"
          description="Each row was read back through that department's connector. The left value is the department's own vocabulary; the right value is the GovSync word it normalises to."
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void run("read")}
                disabled={busy !== null}
              >
                <RefreshCw className={busy === "read" ? "animate-spin" : undefined} />
                Re-read
              </Button>
              <Button
                size="sm"
                onClick={() => void run("sync")}
                disabled={busy !== null}
              >
                <RotateCcw className={busy === "sync" ? "animate-spin" : undefined} />
                {busy === "sync" ? "Syncing" : "Sync now"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void run("reset")}
                disabled={busy !== null}
              >
                Reset
              </Button>
            </div>
          }
        />
      </CardHeader>

      <CardContent className="space-y-3">
        {result === null ? (
          <p className="text-xs text-muted">Reading every connector...</p>
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
            {failed > 0 || owed > 0 ? (
              <p className="rounded-lg border border-warning/25 bg-warning/8 p-3 text-[11px] leading-relaxed text-muted">
                {failed > 0 ? (
                  <>
                    <span className="font-semibold text-warning">
                      {failed} connector{failed === 1 ? "" : "s"} did not answer.
                    </span>{" "}
                    The workflow state above is unchanged: GovSync holds the decision and
                    publishes it when the connector recovers.
                  </>
                ) : null}
                {failed > 0 && owed > 0 ? " " : null}
                {owed > 0 ? (
                  <>
                    <span className="font-semibold text-warning">
                      {owed} decision{owed === 1 ? "" : "s"} queued.
                    </span>{" "}
                    Sync now will deliver them.
                  </>
                ) : null}
              </p>
            ) : null}

            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={`${report.stageId}-${report.departmentId}`}
                  className="rounded border border-border-subtle bg-surface-2 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {report.stageTitle}
                    </span>
                    <span className="text-[10px] text-muted-2">
                      {report.departmentId}
                    </span>
                    <span className="ml-auto flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-muted">
                        {report.departmentStatus ?? (report.outcome === "not-connected" ? "n/a" : "no answer")}
                      </span>
                      <span className="text-[10px] text-muted-2">to</span>
                      <StatePill state={report.normalisedState} />
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={report.outcome === "failed" ? "danger" : "outline"}
                      className="text-[10px]"
                    >
                      {OUTCOME_NOTE[report.outcome]}
                    </Badge>
                    {report.outcome === "not-connected" ? (
                      <Unplug className="size-3 text-muted-2" />
                    ) : (
                      <span className="font-mono text-[10px] text-muted-2">
                        {report.requestId}
                        {report.attempts > 1 ? ` · ${report.attempts} attempts` : ""}
                        {report.reference ? ` · ${report.reference}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                    {report.message}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {message ? (
          <p className="border-t border-border-subtle pt-3 text-[11px] leading-relaxed text-muted">
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
