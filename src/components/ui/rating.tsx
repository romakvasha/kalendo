import { Star } from "lucide-react";

import { clamp, cn } from "@/lib/utils";

export type RatingSize = "sm" | "md";

const SIZES: Record<RatingSize, { star: string; text: string; gap: string }> = {
  sm: { star: "size-3.5", text: "text-[12px]", gap: "gap-0.5" },
  md: { star: "size-4", text: "text-[13px]", gap: "gap-1" },
};

const ONE_DECIMAL = new Intl.NumberFormat("pl-PL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export interface RatingProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 0–5, fractions render as partially filled stars. */
  value: number;
  count?: number;
  size?: RatingSize;
  showValue?: boolean;
}

export function Rating({
  value,
  count,
  size = "sm",
  showValue = false,
  className,
  ...props
}: RatingProps) {
  const score = clamp(value, 0, 5);
  const sizing = SIZES[size];

  return (
    <span
      className={cn("inline-flex items-center", sizing.gap, className)}
      {...props}
    >
      <span aria-hidden className={cn("inline-flex items-center", sizing.gap)}>
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = clamp((score - index) * 100, 0, 100);
          return (
            <span key={index} className="relative inline-flex">
              <Star
                className={cn(sizing.star, "text-sand-300")}
                fill="currentColor"
                strokeWidth={0}
              />
              {fill > 0 && (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${fill}%` }}
                >
                  <Star
                    className={cn(sizing.star, "text-ink")}
                    fill="currentColor"
                    strokeWidth={0}
                  />
                </span>
              )}
            </span>
          );
        })}
      </span>

      {(showValue || count !== undefined) && (
        <span className={cn("tabular ml-1 font-medium", sizing.text)}>
          {showValue && <span className="text-ink">{ONE_DECIMAL.format(score)}</span>}
          {count !== undefined && (
            <span className={cn("text-muted", showValue && "ml-1")}>
              ({count})
            </span>
          )}
        </span>
      )}
    </span>
  );
}
