"use client";

import { cn } from "@/lib/utils";
import { renderIcon, type IconLike } from "./icon";

/* ------------------------------------------------------------------ */
/* Tabs — underline                                                    */
/* ------------------------------------------------------------------ */

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export interface TabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  tabs: TabItem[];
  value: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, value, onChange, className, ...props }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "no-scrollbar flex items-stretch gap-6 overflow-x-auto border-b border-line",
        className,
      )}
      {...props}
    >
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative shrink-0 pb-3 text-[14px] font-medium whitespace-nowrap",
              "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
              active ? "text-ink" : "text-muted hover:text-sand-700",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "tabular ml-1.5 text-[11px] font-semibold",
                  active ? "text-sand-500" : "text-sand-400",
                )}
              >
                {tab.count}
              </span>
            )}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-opacity duration-150",
                active ? "bg-ink opacity-100" : "opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented — pill switcher                                           */
/* ------------------------------------------------------------------ */

export interface SegmentedOption {
  value: string;
  label: string;
}

export type SegmentedSize = "sm" | "md";

export interface SegmentedProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  size?: SegmentedSize;
  block?: boolean;
}

const SEGMENT_SIZES: Record<SegmentedSize, { track: string; item: string }> = {
  sm: { track: "h-8 p-0.5", item: "px-2.5 text-[12px]" },
  md: { track: "h-10 p-1", item: "px-3.5 text-[13px]" },
};

export function Segmented({
  options,
  value,
  onChange,
  size = "md",
  block = false,
  className,
  ...props
}: SegmentedProps) {
  const sizing = SEGMENT_SIZES[size];
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex items-stretch rounded-full bg-sand-100",
        sizing.track,
        block && "flex w-full",
        className,
      )}
      {...props}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap",
              "transition-all duration-200 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25",
              sizing.item,
              block && "flex-1",
              active
                ? "bg-white text-ink shadow-xs"
                : "text-muted hover:text-sand-700",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chip / ChipRow — filter pills                                       */
/* ------------------------------------------------------------------ */

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  iconLeft?: IconLike;
}

export function Chip({
  active = false,
  iconLeft,
  className,
  children,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium whitespace-nowrap",
        "transition-colors duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25 focus-visible:ring-offset-1 focus-visible:ring-offset-paper",
        "disabled:pointer-events-none disabled:opacity-45",
        active
          ? "border-ink bg-ink text-paper"
          : "border-line bg-white text-sand-700 hover:border-line-strong hover:bg-sand-50",
        className,
      )}
      {...props}
    >
      {renderIcon(iconLeft, "size-4 shrink-0")}
      {children}
    </button>
  );
}

export interface ChipRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lets the row scroll past a 16px parent gutter on mobile. */
  bleed?: boolean;
}

export function ChipRow({
  bleed = false,
  className,
  children,
  ...props
}: ChipRowProps) {
  return (
    <div
      className={cn(
        "no-scrollbar flex items-center gap-2 overflow-x-auto",
        bleed && "-mx-4 px-4 sm:mx-0 sm:px-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
