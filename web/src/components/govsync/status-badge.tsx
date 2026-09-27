import {
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
  DocumentStatus,
  EventStatus,
  HealthState,
  Severity,
  WorkflowState,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const registry = {
  workflow: workflowStateMeta,
  health: healthMeta,
  event: eventStatusMeta,
  severity: severityMeta,
  document: documentStatusMeta,
} as const;

type RegistryKey = keyof typeof registry;

function resolve(kind: RegistryKey, value: string): StatusMeta {
  const table = registry[kind] as unknown as Record<string, StatusMeta | undefined>;
  return table[value] ?? workflowStateMeta.pending;
}

export function StatusBadge({
  kind,
  value,
  className,
  withIcon = true,
  dot = false,
}: {
  kind: RegistryKey;
  value: WorkflowState | HealthState | EventStatus | Severity | DocumentStatus;
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

export function StatusLegend({
  kind,
  className,
}: {
  kind: "workflow" | "health";
  className?: string;
}) {
  const entries: StatusMeta[] =
    kind === "workflow"
      ? workflowStateOrder.map((value) => workflowStateMeta[value])
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
