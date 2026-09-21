import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type PhotoTone = "brand" | "neutral";

const TONES: Record<PhotoTone, string> = {
  brand: "bg-linear-to-br from-brand-soft via-sand-50 to-sand-100",
  neutral: "bg-linear-to-br from-sand-50 via-sand-100 to-sand-200",
};

export interface PhotoPlaceholderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  className?: string;
  tone?: PhotoTone;
}

/** Stands in for photography the tenant has not uploaded yet. */
export function PhotoPlaceholder({
  label,
  tone = "neutral",
  className,
  ...props
}: PhotoPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative isolate grid min-h-24 place-items-center overflow-hidden rounded-xl border border-line",
        TONES[tone],
        className,
      )}
      {...props}
    >
      <ImageIcon
        aria-hidden
        strokeWidth={1.25}
        className="size-7 text-sand-400"
      />
      {label ? (
        <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-sand-700 shadow-xs backdrop-blur-sm">
          {label}
        </span>
      ) : null}
    </div>
  );
}
