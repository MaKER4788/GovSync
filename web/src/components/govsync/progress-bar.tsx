import { cn } from "@/lib/utils";

/**
 * Accessible completion bar. Rendered as a plain element rather than a client
 * component: the value is always visible as text next to the bar, so the
 * control never depends on colour or on a JavaScript measurement.
 */
export function ProgressBar({
  value,
  label,
  caption,
  tone = "primary",
  size = "md",
  className,
}: {
  value: number;
  label: string;
  caption?: string;
  tone?: "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const fill = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];
  const height = size === "sm" ? "h-1" : "h-1.5";

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-3 text-[11px] text-muted-2">
        <span className="truncate">{label}</span>
        <span className="shrink-0 font-medium text-foreground tabular">
          {clamped}%
        </span>
      </div>
      <div
        className={cn("mt-1.5 w-full overflow-hidden rounded-full bg-surface-3", height)}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        aria-valuetext={`${clamped} percent${caption ? `, ${caption}` : ""}`}
      >
        <div className={cn("h-full rounded-full", fill)} style={{ width: `${clamped}%` }} />
      </div>
      {caption ? <p className="mt-1.5 text-[11px] text-muted-2">{caption}</p> : null}
    </div>
  );
}
