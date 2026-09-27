"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Filter, Search } from "lucide-react";

import { StatusBadge } from "@/components/govsync/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EventStatus, InteropEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | EventStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "in-flight", label: "In flight" },
];

export function EventLogTable({
  events,
  className,
  initialLimit = 16,
}: {
  events: InteropEvent[];
  className?: string;
  initialLimit?: number;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [limit, setLimit] = useState(initialLimit);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesStatus = status === "all" || event.status === status;
      if (!matchesStatus) return false;
      if (!needle) return true;
      return [
        event.source,
        event.destination,
        event.eventType,
        event.message,
        event.correlationId,
        event.applicationId ?? "",
      ].some((field) => field.toLowerCase().includes(needle));
    });
  }, [events, query, status]);

  const visible = filtered.slice(0, limit);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-col gap-3 border-b border-border-subtle px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search source, event or correlation id"
            className="pl-8"
            aria-label="Search events"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-2">
            <Filter className="size-3" />
            Status
          </span>
          {STATUS_FILTERS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={status === option.value ? "secondary" : "ghost"}
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Seq</TableHead>
            <TableHead className="w-44">Timestamp</TableHead>
            <TableHead>Route</TableHead>
            <TableHead className="w-48">Event</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-24 text-right">Latency</TableHead>
            <TableHead className="w-40">Correlation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((event) => (
            <TableRow key={event.seq}>
              <TableCell className="font-mono text-[11px] text-muted-2 tabular">
                {event.seq}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted tabular">
                {event.at.replace(", ", " · ")}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-foreground">{event.source}</span>
                  <span className="text-muted-2">&rarr;</span>
                  <span className="text-muted">{event.destination}</span>
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-2">
                  {event.message}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-[11px] text-accent">
                  {event.eventType}
                </span>
                {event.applicationId ? (
                  <span className="mt-0.5 block font-mono text-[10px] text-muted-2">
                    {event.applicationId}
                  </span>
                ) : null}
              </TableCell>
              <TableCell>
                <StatusBadge kind="event" value={event.status} dot />
              </TableCell>
              <TableCell className="text-right font-mono text-[11px] text-muted tabular">
                {event.latencyMs > 0 ? `${event.latencyMs} ms` : "-"}
              </TableCell>
              <TableCell className="font-mono text-[11px] text-muted-2">
                {event.correlationId}
              </TableCell>
            </TableRow>
          ))}
          {visible.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-sm text-muted"
              >
                No events match the current filters.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-4 border-t border-border-subtle px-5 py-3 text-xs text-muted-2">
        <span className="tabular">
          Showing {visible.length} of {filtered.length} matching events ({events.length}{" "}
          in the sampled stream)
        </span>
        {limit < filtered.length ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLimit((current) => current + 20)}
          >
            <ArrowDownUp className="size-3" />
            Load more
          </Button>
        ) : null}
      </div>
    </div>
  );
}
