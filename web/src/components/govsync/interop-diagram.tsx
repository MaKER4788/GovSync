import { ArrowRight, Landmark, Network, ServerCog, User } from "lucide-react";

import { departmentMark } from "@/lib/data/departments";
import { cn } from "@/lib/utils";

/**
 * Landing visual: Applicant -> GovSync -> departments.
 * Pure CSS/SVG, no images, no third-party marks.
 */
export function InteropDiagram({
  departments,
  className,
}: {
  departments: { id: string; shortName: string; code: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface-inset p-6 lg:p-8",
        className,
      )}
    >
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.3fr)_auto_minmax(0,1.6fr)] lg:gap-4">
        {/* Applicant */}
        <div className="flex justify-center lg:justify-end">
          <DiagramNode
            icon={User}
            title="Applicant"
            subtitle="Citizen or business entity"
            detail="Submits one form, one document set"
          />
        </div>

        <Connector />

        {/* GovSync */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-[240px]">
            <DiagramNode
              icon={Network}
              title="GovSync"
              subtitle="Unified interface"
              detail="Gateway, identity, orchestration, interoperability"
              emphasis
            />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-muted-2">
              single entry point
            </span>
          </div>
        </div>

        <Connector />

        {/* Departments */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {departments.map((department) => (
            <div
              key={department.id}
              className="rounded-md border border-border bg-surface p-3 text-center"
            >
              <span className="mx-auto mb-2 flex size-7 items-center justify-center rounded border border-primary/25 bg-primary/10">
                <Landmark className="size-3.5 text-accent" />
              </span>
              <p className="text-[11px] font-semibold leading-tight text-foreground">
                {department.shortName}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted-2">
                {departmentMark(department.id)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border-subtle pt-4 text-[11px] text-muted-2">
        <span className="inline-flex items-center gap-1.5">
          <ServerCog className="size-3" />
          Simulated department APIs &middot; no live systems connected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Network className="size-3" />
          Canonical schema, correlated and audited end to end
        </span>
      </div>
    </div>
  );
}

function DiagramNode({
  icon: Icon,
  title,
  subtitle,
  detail,
  emphasis = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  detail?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 text-center",
        emphasis
          ? "border-primary/45 bg-primary/8"
          : "border-border bg-surface",
      )}
    >
      <span
        className={cn(
          "mx-auto mb-3 flex size-9 items-center justify-center rounded border",
          emphasis
            ? "border-primary/50 bg-primary/15 text-accent"
            : "border-border bg-surface-2 text-muted",
        )}
      >
        <Icon className="size-4" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-2">
        {subtitle}
      </p>
      {detail ? (
        <p className="mt-2 text-[11px] leading-relaxed text-muted">{detail}</p>
      ) : null}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center" aria-hidden="true">
      <span className="flex w-full items-center gap-1 lg:w-8">
        <span className="h-px flex-1 bg-border-strong" />
        <ArrowRight className="size-3.5 text-accent" />
      </span>
    </div>
  );
}
