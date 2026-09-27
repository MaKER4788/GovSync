import { cn } from "@/lib/utils";

/**
 * Abstract platform mark. Deliberately not a government emblem.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/12",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-4 text-accent" fill="none">
        <path
          d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 8.4 15.6 10.6v4.8L12 17.6 8.4 15.4v-4.8L12 8.4Z"
          fill="currentColor"
          fillOpacity="0.35"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function BrandLockup({
  className,
  subtitle = "Interoperability Platform",
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <BrandMark />
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          GovSync
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-2">
          {subtitle}
        </span>
      </span>
    </span>
  );
}
