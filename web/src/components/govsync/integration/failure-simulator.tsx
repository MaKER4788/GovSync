"use client";

import { useCallback, useState } from "react";
import { CircleSlash, PlugZap, TriangleAlert } from "lucide-react";

import { SectionHeading } from "@/components/govsync/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { simulateFailure, type ClientResult, type FailurePlanResult } from "@/lib/govsync/client";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "unavailable", label: "Service unavailable", hint: "503 on every attempt. Retryable." },
  { id: "timeout", label: "Request timeout", hint: "504 on every attempt. Retryable." },
  { id: "malformed", label: "Malformed response", hint: "502. A payload that cannot be read. Retryable." },
  { id: "validation", label: "Validation error", hint: "400. Not retryable, so GovSync stops at once." },
] as const;

const DEPARTMENTS = [
  { id: "rev", name: "Revenue Department" },
  { id: "pol", name: "State Pollution Control Board" },
  { id: "fire", name: "Fire & Rescue Services" },
  { id: "lab", name: "Labour Department" },
] as const;

/**
 * Controlled failure injection.
 *
 * A plan is consumed by whole logical calls, so a plan for one call still fails
 * all three attempts inside it. That is deliberate: it is the only way to make
 * the retry sequence visible on a system that must not really sleep.
 */
export function FailureSimulator({ className }: { className?: string }) {
  const [departmentId, setDepartmentId] = useState<string>("fire");
  const [mode, setMode] = useState<string>("unavailable");
  const [calls, setCalls] = useState<number>(1);
  const [result, setResult] = useState<ClientResult<FailurePlanResult> | null>(null);
  const [busy, setBusy] = useState(false);

  const plan = useCallback(async () => {
    setBusy(true);
    setResult(await simulateFailure({ departmentId, mode, calls }));
    setBusy(false);
  }, [calls, departmentId, mode]);

  const clear = useCallback(async () => {
    setBusy(true);
    setResult(await simulateFailure({ departmentId: "none", mode, calls: 1 }));
    setBusy(false);
  }, [mode]);

  const plans = result?.success ? result.data.plans : [];

  return (
    <Card className={className}>
      <CardHeader>
        <SectionHeading
          title="Simulate a departmental failure"
          description="Plan a fault for one connector, then trigger it with any workflow decision, a status read or a synchronisation. Nothing here reaches a real service."
        />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Department">
            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface-2 px-2.5 text-xs text-foreground"
            >
              {DEPARTMENTS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
              <option value="none">None, clear every failure</option>
            </select>
          </Field>

          <Field label="Mode">
            <select
              value={mode}
              disabled={departmentId === "none"}
              onChange={(event) => setMode(event.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface-2 px-2.5 text-xs text-foreground disabled:opacity-50"
            >
              {MODES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={`Calls to fail: ${calls}`}>
          <input
            type="range"
            min={1}
            max={5}
            value={calls}
            disabled={departmentId === "none"}
            onChange={(event) => setCalls(Number(event.target.value))}
            className="w-full accent-primary"
          />
        </Field>

        <p className="text-[11px] leading-relaxed text-muted-2">
          {departmentId === "none"
            ? "Clearing removes every planned failure and returns all four connectors to health."
            : (MODES.find((entry) => entry.id === mode)?.hint ??
              "The next calls to this connector fail, including every retry inside them.")}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => void plan()}
            disabled={busy || departmentId === "none"}
          >
            <PlugZap />
            {busy ? "Working" : "Plan failure"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void clear()} disabled={busy}>
            <CircleSlash />
            Clear all
          </Button>
        </div>

        {result && !result.success ? (
          <p className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger/8 p-3 text-[11px] leading-relaxed text-muted">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-danger" />
            {result.error.message}
          </p>
        ) : null}

        {plans.length > 0 ? (
          <div className="space-y-2 border-t border-border-subtle pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">
              Failures in force ({plans.length})
            </p>
            {plans.map((entry) => (
              <div
                key={entry.departmentId}
                className="rounded border border-warning/25 bg-warning/8 px-2.5 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning" className="font-mono text-[10px]">
                    {entry.mode}
                  </Badge>
                  <span className="text-[11px] font-medium text-foreground">
                    {entry.departmentName}
                  </span>
                  <span className="text-[11px] text-muted">
                    next {entry.calls} call{entry.calls === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{entry.note}</p>
              </div>
            ))}
          </div>
        ) : null}

        {result?.success ? (
          <p className="text-[11px] leading-relaxed text-muted">{result.data.message}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">
        {label}
      </span>
      <div className={cn("block")}>{children}</div>
    </label>
  );
}
