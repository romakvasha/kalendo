import type { ReactNode } from "react";
import { clamp, cn } from "@/lib/utils";

export interface ShareBarsItem {
  label: string;
  value: number;
  icon?: ReactNode;
}

export interface ShareBarsProps {
  items: ShareBarsItem[];
  format?: (value: number) => string;
  className?: string;
}

const CSS = `@keyframes kal-share-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.kal-share{transform-origin:left center;animation:kal-share-grow .6s cubic-bezier(.22,1,.36,1) both}
@media (prefers-reduced-motion:reduce){.kal-share{animation:none}}`;

export function ShareBars({ items, format, className }: ShareBarsProps) {
  const fmt = format ?? ((value: number) => `${Math.round(value)}%`);
  const peak = items.reduce((acc, item) => Math.max(acc, item.value || 0), 0) || 1;

  if (items.length === 0) return null;

  return (
    <>
      <style href="kal-share-bars" precedence="default">
        {CSS}
      </style>
      <ul className={cn("flex flex-col gap-3.5", className)}>
        {items.map((item, index) => {
          const value = Number.isFinite(item.value) ? item.value : 0;
          const pct = clamp((value / peak) * 100, value > 0 ? 3 : 0, 100);

          return (
            <li key={`${item.label}-${index}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                  {item.icon && (
                    <span
                      className="flex size-5 shrink-0 items-center justify-center text-muted [&_svg]:size-4"
                      aria-hidden
                    >
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="tabular shrink-0 text-sm font-medium text-ink">{fmt(value)}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sand-100">
                <div
                  className="kal-share h-full rounded-full bg-brand"
                  style={{ width: `${pct}%`, animationDelay: `${index * 70}ms` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
