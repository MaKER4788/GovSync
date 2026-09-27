import { History } from "lucide-react";
import Link from "next/link";

import type { ActivityEntry } from "@/lib/data/activities";
import { formatStamp } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Vertical activity feed. Each entry names the actor, what happened and when,
 * with the timestamp rendered relative to the frozen demo day so a reviewer
 * can see recency without reading every date.
 */
export function ActivityTimeline({
  entries,
  showApplication = false,
  className,
}: {
  entries: ActivityEntry[];
  showApplication?: boolean;
  className?: string;
}) {
  if (entries.length === 0) {
    return (
      <p className={cn("text-sm text-muted", className)}>
        No activity recorded on this record.
      </p>
    );
  }

  return (
    <ol className={cn("relative", className)}>
      {entries.map((entry, index) => (
        <li key={entry.id} className="flex gap-4 pb-5 last:pb-0">
          <div className="flex flex-col items-center">
            <span
              className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2"
              aria-hidden="true"
            >
              <History className="size-3.5 text-accent" />
            </span>
            {index < entries.length - 1 ? (
              <span className="mt-1 w-px flex-1 bg-border" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{entry.action}</p>
              <p className="font-mono text-[11px] text-muted-2 tabular">
                {formatStamp(entry.at)}
              </p>
            </div>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-2">
              {entry.actor} &middot; {entry.actorRole}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{entry.detail}</p>
            {showApplication ? (
              <Link
                href={`/applications/${entry.applicationId}`}
                className="mt-1.5 inline-block font-mono text-[11px] text-accent hover:underline"
              >
                {entry.applicationId} &middot; {entry.applicationTitle}
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
