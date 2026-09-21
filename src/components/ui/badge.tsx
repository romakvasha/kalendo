import { cn } from "@/lib/utils";
import { renderIcon, type IconLike } from "./icon";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warn"
  | "danger"
  | "info"
  | "ink";

export type BadgeSize = "sm" | "md";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-sand-100 text-sand-700 border-sand-200",
  brand: "bg-brand-soft text-brand-ink border-brand/15",
  success: "bg-success-soft text-success border-success/15",
  warn: "bg-warn text-warn-ink border-warn-ink/15",
  danger: "bg-danger-soft text-danger border-danger/15",
  info: "bg-cobalt-soft text-cobalt border-cobalt/15",
  ink: "bg-ink text-paper border-transparent",
};

const SIZES: Record<BadgeSize, string> = {
  sm: "h-5 gap-1 px-2 text-[11px]",
  md: "h-6.5 gap-1.5 px-2.5 text-xs",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  iconLeft?: IconLike;
}

export function Badge({
  tone = "neutral",
  size = "md",
  iconLeft,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium leading-none whitespace-nowrap",
        SIZES[size],
        TONES[tone],
        className,
      )}
      {...props}
    >
      {renderIcon(iconLeft, size === "sm" ? "size-3 shrink-0" : "size-3.5 shrink-0")}
      {children}
    </span>
  );
}
