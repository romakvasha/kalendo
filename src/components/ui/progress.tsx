import { clamp, cn } from "@/lib/utils";

export type ProgressTone = "brand" | "success" | "ink";
export type ProgressSize = "sm" | "md";

const TONES: Record<ProgressTone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  ink: "bg-ink",
};

const SIZES: Record<ProgressSize, string> = {
  sm: "h-1.5",
  md: "h-2.5",
};

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. */
  value: number;
  tone?: ProgressTone;
  size?: ProgressSize;
}

export function Progress({
  value,
  tone = "brand",
  size = "sm",
  className,
  ...props
}: ProgressProps) {
  const pct = clamp(Math.round(value), 0, 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-sand-200",
        SIZES[size],
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          TONES[tone],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
