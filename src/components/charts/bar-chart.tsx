import { clamp, cn, range } from "@/lib/utils";

export type BarChartTone = "brand" | "ink";

export interface BarChartDatum {
  label: string;
  value: number;
  secondary?: number;
  highlight?: boolean;
}

export interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  format?: (value: number) => string;
  tone?: BarChartTone;
  showAxis?: boolean;
  highlightLabel?: string;
  /** Legend copy — already translated by the caller. */
  primaryLabel?: string;
  secondaryLabel?: string;
  /** Show an x label every n-th bar. Defaults to 7 on long series. */
  labelEvery?: number;
  ariaLabel?: string;
  className?: string;
}

const TICK_COUNT = 3;
const MAX_STAGGER = 22;

const BAR_CLASS: Record<BarChartTone, string> = {
  brand: "bg-brand/70",
  ink: "bg-ink",
};

const SECONDARY_CLASS: Record<BarChartTone, string> = {
  brand: "bg-brand/20",
  ink: "bg-sand-200",
};

const CSS = `@keyframes kal-bar-rise{from{transform:scaleY(0)}to{transform:scaleY(1)}}
.kal-bar{transform-origin:bottom;animation:kal-bar-rise .5s cubic-bezier(.22,1,.36,1) both}
@media (prefers-reduced-motion:reduce){.kal-bar{animation:none}}`;

/** Rounds a raw step up to 1 / 2 / 2.5 / 5 × 10ⁿ so axis labels stay readable. */
function niceStep(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const factor =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
}

export function BarChart({
  data,
  height = 180,
  format,
  tone = "ink",
  showAxis = true,
  highlightLabel,
  primaryLabel,
  secondaryLabel,
  labelEvery,
  ariaLabel,
  className,
}: BarChartProps) {
  const fmt = format ?? ((value: number) => String(Math.round(value)));
  const hasSecondary = data.some((item) => typeof item.secondary === "number");
  const peak = data.reduce(
    (acc, item) => Math.max(acc, item.value || 0, item.secondary ?? 0),
    0,
  );
  const step = niceStep(peak / TICK_COUNT);
  const max = step * TICK_COUNT;
  const ticks = range(TICK_COUNT + 1).map((index) => step * index);
  const every = labelEvery ?? (data.length > 10 ? 7 : 1);
  const showLegend = hasSecondary && Boolean(primaryLabel ?? secondaryLabel);
  const hasCallout = Boolean(highlightLabel) && data.some((item) => item.highlight);

  return (
    <div
      className={cn("w-full", hasCallout ? "pt-7" : "pt-2", className)}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
    >
      <style href="kal-bar-chart" precedence="default">
        {CSS}
      </style>

      {showLegend && (
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {primaryLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-[2px]", BAR_CLASS[tone])} aria-hidden />
              {primaryLabel}
            </span>
          )}
          {secondaryLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-[2px]", SECONDARY_CLASS[tone])} aria-hidden />
              {secondaryLabel}
            </span>
          )}
        </div>
      )}

      <div className="flex items-start gap-2.5">
        {showAxis && (
          <div className="relative w-11 shrink-0" style={{ height }} aria-hidden>
            {ticks.map((tick) => (
              <span
                key={tick}
                className="tabular absolute right-0 -translate-y-1/2 text-[10px] leading-none text-muted"
                style={{ top: `${(1 - tick / max) * 100}%` }}
              >
                {fmt(tick)}
              </span>
            ))}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height }}>
            <div className="absolute inset-0" aria-hidden>
              {ticks.map((tick, index) => (
                <div
                  key={tick}
                  className={cn(
                    "absolute inset-x-0 border-t",
                    index === 0 ? "border-line-strong" : "border-dashed border-line",
                  )}
                  style={{ top: `${(1 - tick / max) * 100}%` }}
                />
              ))}
            </div>

            <div className="absolute inset-0 flex items-end gap-[2px] sm:gap-[3px]">
              {data.map((item, index) => {
                const value = Number.isFinite(item.value) ? item.value : 0;
                const secondary =
                  typeof item.secondary === "number" && Number.isFinite(item.secondary)
                    ? item.secondary
                    : null;
                const pct = clamp((value / max) * 100, value > 0 ? 1.5 : 0, 100);
                const secondaryPct =
                  secondary === null
                    ? 0
                    : clamp((secondary / max) * 100, secondary > 0 ? 1.5 : 0, 100);
                const delay = `${Math.min(index, MAX_STAGGER) * 20}ms`;

                return (
                  <div
                    key={`${item.label}-${index}`}
                    className="group relative flex h-full min-w-0 flex-1 items-end"
                  >
                    {secondary !== null && (
                      <div
                        className={cn(
                          "kal-bar absolute inset-x-0 bottom-0 rounded-t-[5px]",
                          SECONDARY_CLASS[tone],
                        )}
                        style={{ height: `${secondaryPct}%`, animationDelay: delay }}
                        aria-hidden
                      />
                    )}

                    <div
                      className={cn(
                        "kal-bar absolute inset-x-0 bottom-0 rounded-t-[5px] transition-opacity",
                        item.highlight ? "bg-brand" : BAR_CLASS[tone],
                        !item.highlight && "group-hover:opacity-80",
                      )}
                      style={{ height: `${pct}%`, animationDelay: delay }}
                      aria-hidden
                    />

                    {item.highlight && highlightLabel && (
                      <div
                        className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 -translate-y-2 rounded-full bg-ink px-2 py-1 text-[10px] leading-none font-medium whitespace-nowrap text-paper shadow-sm"
                        style={{ bottom: `${pct}%` }}
                      >
                        {highlightLabel}
                      </div>
                    )}

                    <div
                      className="tabular pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 -translate-x-1/2 rounded-md bg-ink px-1.5 py-1 text-[10px] leading-none whitespace-nowrap text-paper opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                      aria-hidden
                    >
                      {item.label} · {fmt(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mt-2 h-4" aria-hidden>
            {data.map((item, index) =>
              index % every === 0 ? (
                <span
                  key={`${item.label}-${index}`}
                  className="tabular absolute -translate-x-1/2 text-[10px] leading-4 whitespace-nowrap text-muted"
                  style={{ left: `${((index + 0.5) / Math.max(data.length, 1)) * 100}%` }}
                >
                  {item.label}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
