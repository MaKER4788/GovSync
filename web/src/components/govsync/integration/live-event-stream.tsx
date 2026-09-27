"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw, TriangleAlert } from "lucide-react";

import { SectionHeading } from "@/components/govsync/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  fetchIntegrationLog,
  type ClientResult,
  type IntegrationLog,
} from "@/lib/govsync/client";
import { cn } from "@/lib/utils";

/**
 * The live half of the logs page.
 *
 * The rest of the page is a frozen sample so the console has something to show
 * before anyone has clicked anything. This section is the opposite: it is what
 * the integration layer recorded during this server session, read through the
 * same API a departmental client would use. It is in memory, so a server restart
 * empties it, and saying so here is the point rather than a caveat.
 */
export function LiveEventStream() {
  const [result, setResult] = useState<ClientResult<IntegrationLog> | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setResult(await fetchIntegrationLog());
    setBusy(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await fetchIntegrationLog();
      if (!cancelled) setResult(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const log = result?.success ? result.data : null;

  return (
    <Card>
      <CardHeader>
        <SectionHeading
          title="Live interop session"
          description="Read through the integration layer during this server session. One entry per attempt, so a call that was retried three times appears three times against one request id."
          action={
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => void load()} disabled={busy}>
                <RefreshCw className={busy ? "animate-spin" : undefined} />
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

      <CardContent className="space-y-3">
        {result === null ? (
          <p className="text-xs text-muted">Reading the session log...</p>
        ) : !result.success ? (
          <p className="flex items-center gap-2 text-[11px] text-muted">
            <TriangleAlert className="size-3.5 text-danger" />
            {result.error.message}
          </p>
        ) : log && log.events.length > 0 ? (
          <>
            <p className="text-[11px] text-muted">
              {log.metrics.totalRequests} call{log.metrics.totalRequests === 1 ? "" : "s"} ·{" "}
              {log.metrics.successful} completed · {log.metrics.failed} failed ·{" "}
              {log.metrics.retriedRequests} retried · {log.events.length} attempts recorded
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-b border-border-subtle text-[10px] uppercase tracking-wider text-muted-2">
                    <th className="py-2 pr-3 font-medium">When</th>
                    <th className="py-2 pr-3 font-medium">Request</th>
                    <th className="py-2 pr-3 font-medium">Operation</th>
                    <th className="py-2 pr-3 font-medium">Destination</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 text-right font-medium">Try</th>
                    <th className="py-2 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {log.events.slice(0, 25).map((event) => (
                    <tr key={event.id} className="align-top">
                      <td className="py-2 pr-3 font-mono text-[10px] whitespace-nowrap text-muted-2">
                        {event.at}
                      </td>
                      <td className="py-2 pr-3 font-mono text-[10px] whitespace-nowrap text-accent">
                        {event.requestId}
                      </td>
                      <td className="py-2 pr-3 font-mono text-[10px] whitespace-nowrap text-muted">
                        {event.operation}
                      </td>
                      <td className="py-2 pr-3 text-[11px] whitespace-nowrap text-muted">
                        {event.destination}
                      </td>
                      <td
                        className={cn(
                          "py-2 pr-3 font-mono text-[10px] whitespace-nowrap",
                          event.status === "SUCCESS" ? "text-success" : "text-danger",
                        )}
                      >
                        {event.status}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono text-[10px] text-muted-2">
                        {event.attempts}
                      </td>
                      <td className="py-2 text-[11px] leading-relaxed text-muted">
                        {event.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {log.events.length > 25 ? (
              <p className="text-[11px] text-muted-2">
                Showing the 25 most recent of {log.events.length} attempts. The full
                session, including request traces and the audit log, is on the debug
                page.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-xs leading-relaxed text-muted">
            No call has been made in this server session yet. Open an application and
            approve a stage, or read a departmental status, and the entries appear
            here. This log lives in memory, so it starts empty on every server
            restart.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
