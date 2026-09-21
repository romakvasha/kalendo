import { cn } from "@/lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  /** Small centred caption sitting on the rule. */
  label?: React.ReactNode;
}

export function Divider({
  orientation = "horizontal",
  label,
  className,
  ...props
}: DividerProps) {
  if (label) {
    return (
      <div
        className={cn("flex items-center gap-3", className)}
        role="separator"
        {...props}
      >
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-medium text-sand-500">{label}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === "vertical" ? "w-px self-stretch" : "h-px w-full",
        "bg-line",
        className,
      )}
      {...props}
    />
  );
}

export interface KeyValueProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
}

export function KeyValue({
  label,
  value,
  className,
  ...props
}: KeyValueProps) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-2 text-[14px]",
        className,
      )}
      {...props}
    >
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 text-right font-medium text-ink">{value}</span>
    </div>
  );
}
