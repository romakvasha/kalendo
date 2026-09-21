import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PhoneFrameProps {
  /** Small ordinal shown before the tag, e.g. "01". */
  index?: string;
  /** Tag badge above the title, e.g. "Klient". */
  tag?: string;
  /** Title of the screen being presented. */
  label?: string;
  /** One-line description under the title. */
  caption?: string;
  className?: string;
  /** Classes for the screen surface itself (e.g. a different background). */
  screenClassName?: string;
  children: ReactNode;
}

export function PhoneFrame({
  index,
  tag,
  label,
  caption,
  className,
  screenClassName,
  children,
}: PhoneFrameProps) {
  const hasHeader = Boolean(index || tag || label || caption);

  return (
    <figure className={cn("flex w-full flex-col sm:w-[375px]", className)}>
      {hasHeader ? (
        <figcaption className="mb-4">
          {index || tag ? (
            <div className="mb-2 flex items-center gap-2">
              {index ? (
                <span className="tabular text-[11px] font-medium text-sand-400">{index}</span>
              ) : null}
              {tag ? (
                <span className="rounded-xs bg-sand-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-sand-600">
                  {tag}
                </span>
              ) : null}
            </div>
          ) : null}
          {label ? (
            <p className="font-display text-lg leading-tight text-ink">{label}</p>
          ) : null}
          {caption ? (
            <p className="mt-1 text-[13px] leading-snug text-muted">{caption}</p>
          ) : null}
        </figcaption>
      ) : null}

      <div
        className={cn(
          "w-full shrink-0 overflow-hidden rounded-phone border border-line bg-white shadow-phone sm:w-[375px]",
          screenClassName,
        )}
      >
        {children}
      </div>
    </figure>
  );
}
