import { Building2, Landmark, User } from "lucide-react";

import { departmentMark } from "@/lib/data/departments";
import { cn } from "@/lib/utils";

/**
 * Neutral department identity chip. Monograms are used in place of any
 * departmental emblem, as required for the prototype.
 */
export function DepartmentChip({
  departmentId,
  label,
  className,
  size = "md",
}: {
  departmentId: string;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon =
    departmentId === "govsync" ? User : departmentId === "mun" ? Building2 : Landmark;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded border border-border bg-surface-2 text-foreground",
        size === "sm" && "px-1.5 py-0.5 text-[10px]",
        size === "md" && "px-2 py-1 text-[11px]",
        size === "lg" && "px-2.5 py-1.5 text-xs",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-sm border border-primary/30 bg-primary/10 text-accent",
          size === "sm" && "size-4",
          size === "md" && "size-5",
          size === "lg" && "size-6",
        )}
      >
        <Icon className={size === "sm" ? "size-2.5" : "size-3"} />
      </span>
      <span className="font-medium">{label}</span>
      <span className="font-mono text-[10px] text-muted-2">
        {departmentMark(departmentId)}
      </span>
    </span>
  );
}

export function Monogram({
  departmentId,
  className,
}: {
  departmentId: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 font-mono text-[11px] font-semibold tracking-wide text-accent",
        className,
      )}
    >
      {departmentMark(departmentId)}
    </span>
  );
}
