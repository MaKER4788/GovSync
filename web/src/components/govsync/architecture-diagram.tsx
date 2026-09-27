import { ArrowDown } from "lucide-react";

import type { ArchitectureLayer } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Layered reference architecture: citizen channel down to the department
 * connectors, with the platform capabilities that sit between them.
 */
export function ArchitectureDiagram({
  layers,
  className,
}: {
  layers: ArchitectureLayer[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {layers.map((layer, index) => (
        <div key={layer.id}>
          <section
            className={cn(
              "rounded-lg border bg-surface p-5",
              layer.id === "gateway" || layer.id === "orchestration"
                ? "border-primary/35"
                : "border-border",
            )}
          >
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded border border-border bg-surface-2 font-mono text-[11px] font-semibold text-accent">
                  {layer.index}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {layer.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-2">
                    {layer.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 lg:max-w-sm lg:justify-end">
                {layer.protocols.map((protocol) => (
                  <span
                    key={protocol}
                    className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted"
                  >
                    {protocol}
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted">
              {layer.description}
            </p>

            <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {layer.components.map((component) => (
                <li
                  key={component.name}
                  className="rounded-md border border-border-subtle bg-surface-2/50 p-3"
                >
                  <p className="text-xs font-medium text-foreground">
                    {component.name}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-2">
                    {component.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {index < layers.length - 1 ? (
            <div className="flex items-center justify-center py-2" aria-hidden="true">
              <span className="flex flex-col items-center gap-0.5">
                <ArrowDown className="size-4 text-accent" />
              </span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Compact top-to-bottom stack used on the landing page. */
export function ArchitectureStack({
  layers,
  className,
}: {
  layers: ArchitectureLayer[];
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {layers.map((layer, index) => (
        <li key={layer.id}>
          <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3">
            <span className="font-mono text-[10px] text-muted-2">
              {layer.index}
            </span>
            <span className="flex-1 truncate text-xs font-medium text-foreground">
              {layer.title}
            </span>
            <span className="hidden text-[11px] text-muted-2 sm:block">
              {layer.components.length} components
            </span>
          </div>
          {index < layers.length - 1 ? (
            <div className="flex h-5 items-center justify-center" aria-hidden="true">
              <span className="h-full w-px bg-border-strong" />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
