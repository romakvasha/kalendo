import { ArrowDown, ArrowUp } from "lucide-react";

import { delta as formatDelta } from "@/lib/format";
import { cn } from "@/lib/utils";

export type StatTone = "default" | "muted";

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Ratio (0.14 → "+14%") or an already formatted string ("+14%"). */
  delta?: number | string;
  deltaLabel?: React.ReactNode;
  hint?: React.ReactNode;
  /** Sparkline / donut slot, rendered hard right. */
  chart?: React.ReactNode;
  tone?: StatTone;
}

function directionOf(value: number | string): 1 | -1 | 0 {
  if (typeof value === "number") return value > 0 ? 1 : value < 0 ? -1 : 0;
  const trimmed = value.trim();
  if (trimmed.startsWith("-") || trimmed.startsWith("−")) return -1;
  if (trimmed.startsWith("+")) return 1;
  return 0;
}

export function Stat({
  label,
  value,
  delta,
  deltaLabel,
  hint,
  chart,
  tone = "default",
  className,
  ...props
}: StatProps) {
  const direction = delta === undefined ? 0 : directionOf(delta);
  const deltaText =
    delta === undefined
      ? null
      : typeof delta === "number"
        ? formatDelta(delta)
        : delta;
  const Arrow = direction >= 0 ? ArrowUp : ArrowDown;

  return (
    <div
      className={cn("flex items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "text-xs leading-4 font-medium",
            tone === "muted" ? "text-sand-500" : "text-muted",
          )}
        >
          {label}
        </p>

        <p
          className={cn(
            "tabular font-display mt-1.5 leading-none text-ink",
            tone === "muted" ? "text-2xl text-sand-700" : "text-[28px]",
          )}
        >
          {value}
        </p>

        {(deltaText || hint) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-4">
            {deltaText && (
              <span
                className={cn(
                  "tabular inline-flex items-center gap-0.5 font-semibold",
                  direction > 0
                    ? "text-success"
                    : direction < 0
                      ? "text-muted"
                      : "text-sand-500",
                )}
              >
                {direction !== 0 && <Arrow aria-hidden className="size-3.5" />}
                {deltaText}
              </span>
            )}
            {deltaLabel && <span className="text-muted">{deltaLabel}</span>}
            {hint && <span className="text-sand-500">{hint}</span>}
          </div>
        )}
      </div>

      {chart ? <div className="shrink-0">{chart}</div> : null}
    </div>
  );
}
