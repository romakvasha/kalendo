import { cn } from "@/lib/utils";

export type TooltipSide = "top" | "bottom";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipSide;
  className?: string;
}

/** CSS-only popover: shows on hover and on keyboard focus of the trigger. */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-sm bg-ink px-2 py-1.5",
          "max-w-56 text-center text-[11px] leading-4 font-medium text-paper shadow-md",
          "opacity-0 transition-opacity duration-150 ease-out",
          "group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        {content}
      </span>
    </span>
  );
}
