import { clamp, cn } from "@/lib/utils";

export type MiniBarsTone = "brand" | "ink" | "success" | "muted";

export interface MiniBarsProps {
  values: number[];
  tone?: MiniBarsTone;
  height?: number;
  /** How many trailing values to draw. */
  bars?: number;
  className?: string;
}

const BASE_CLASS: Record<MiniBarsTone, string> = {
  brand: "bg-brand/25",
  ink: "bg-sand-300",
  success: "bg-success/20",
  muted: "bg-sand-200",
};

const LAST_CLASS: Record<MiniBarsTone, string> = {
  brand: "bg-brand",
  ink: "bg-ink",
  success: "bg-success",
  muted: "bg-sand-500",
};

export function MiniBars({
  values,
  tone = "ink",
  height = 28,
  bars = 12,
  className,
}: MiniBarsProps) {
  const clean = values.filter((value) => Number.isFinite(value));
  const shown = clean.slice(-bars);

  if (shown.length === 0) return null;

  const peak = shown.reduce((acc, value) => Math.max(acc, value), 0) || 1;
  const lastIndex = shown.length - 1;

  return (
    <div
      className={cn("flex shrink-0 items-end gap-[3px]", className)}
      style={{ height }}
      aria-hidden
    >
      {shown.map((value, index) => (
        <div
          key={index}
          className={cn(
            "min-h-[2px] w-[3px] rounded-[2px]",
            index === lastIndex ? LAST_CLASS[tone] : BASE_CLASS[tone],
          )}
          style={{ height: `${clamp((value / peak) * 100, 0, 100)}%` }}
        />
      ))}
    </div>
  );
}
