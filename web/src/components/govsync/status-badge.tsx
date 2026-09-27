import {
  applicationStateMeta,
  applicationStateOrder,
  documentStatusMeta,
  eventStatusMeta,
  healthMeta,
  healthStateOrder,
  severityMeta,
  workflowStateMeta,
  workflowStateOrder,
  type StatusMeta,
} from "@/lib/status";
import type {
  ApplicationState,
  DocumentStatus,
  EventStatus,
  HealthState,
  Severity,
  WorkflowState,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const registry = {
  workflow: workflowStateMeta,
  application: applicationStateMeta,
  health: healthMeta,
  event: eventStatusMeta,
  severity: severityMeta,
  document: documentStatusMeta,
} as const;

type RegistryKey = keyof typeof registry;

type StatusValue =
  | WorkflowState
  | ApplicationState
  | HealthState
  | EventStatus
  | Severity
  | DocumentStatus;

function resolve(kind: RegistryKey, value: string): StatusMeta {
  const table = registry[kind] as unknown as Record<string, StatusMeta | undefined>;
  return table[value] ?? workflowStateMeta.pending;
}

/**
 * Every status is shown as an icon plus a word. Colour is only ever a
 * reinforcement, so the state is still readable in monochrome.
 */
export function StatusBadge({
  kind,
  value,
  className,
  withIcon = true,
  dot = false,
}: {
  kind: RegistryKey;
  value: StatusValue;
  className?: string;
  withIcon?: boolean;
  dot?: boolean;
}) {
  const meta = resolve(kind, value);
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap",
        meta.chip,
        className,
      )}
    >
      {dot ? (
        <span className={cn("size-1.5 rounded-full", meta.dot)} />
      ) : withIcon ? (
        <Icon className="size-3" />
      ) : null}
      {meta.label}
    </span>
  );
}

/** Application-level status, for the applicant's own view of a case. */
export function ApplicationStatusBadge({
  value,
  className,
}: {
  value: ApplicationState;
  className?: string;
}) {
  return (
    <StatusBadge kind="application" value={value} className={className} />
  );
}

export function StatusLegend({
  kind,
  className,
}: {
  kind: "workflow" | "health" | "application";
  className?: string;
}) {
  const entries: StatusMeta[] =
    kind === "workflow"
      ? workflowStateOrder.map((value) => workflowStateMeta[value])
      : kind === "application"
        ? applicationStateOrder.map((value) => applicationStateMeta[value])
        : healthStateOrder.map((value) => healthMeta[value]);

  return (
    <ul className={cn("flex flex-wrap items-center gap-x-6 gap-y-3", className)}>
      {entries.map((meta) => {
        const Icon = meta.icon;
        return (
          <li key={meta.label} className="flex items-center gap-2">
            <Icon className={cn("size-3.5", meta.text)} />
            <span className="text-xs font-medium text-foreground">{meta.label}</span>
            <span className="hidden text-xs text-muted-2 xl:inline">
              {meta.description}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
