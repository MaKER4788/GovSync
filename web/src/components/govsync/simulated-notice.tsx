import { Info, TriangleAlert } from "lucide-react";

import { SIMULATION } from "@/lib/data/departments";
import { cn } from "@/lib/utils";

/**
 * Persistent disclosure that every figure in this prototype is simulated.
 * Required by the demo guidelines: no claim of live government connectivity.
 */
export function SimulatedNotice({
  variant = "inline",
  className,
}: {
  variant?: "inline" | "banner" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-warning",
          className,
        )}
      >
        <TriangleAlert className="size-3" />
        Simulated
      </span>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 border-b border-warning/25 bg-warning/8 px-4 py-2.5 text-xs text-warning sm:px-6",
          className,
        )}
      >
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
        <p className="leading-relaxed">
          <span className="font-semibold uppercase tracking-wider">
            Prototype environment.
          </span>{" "}
          <span className="text-warning/85">
            {SIMULATION.notConnected} {SIMULATION.dataOrigin}
          </span>
        </p>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "flex items-start gap-3 rounded-lg border border-warning/25 bg-warning/8 px-4 py-3",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-warning" />
      <div className="space-y-1 text-xs leading-relaxed">
        <p className="font-semibold uppercase tracking-wider text-warning">
          {SIMULATION.environmentName} &middot; {SIMULATION.environmentCode}
        </p>
        <p className="text-muted">{SIMULATION.notConnected}</p>
      </div>
    </aside>
  );
}
