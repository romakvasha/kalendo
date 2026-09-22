"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";
import { renderIcon, type IconLike } from "./icon";
import { Spinner } from "./spinner";

export type ButtonVariant =
  | "primary"
  | "brand"
  | "secondary"
  | "ghost"
  | "danger"
  | "success"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-paper shadow-xs hover:bg-sand-800 active:scale-[0.98] focus-visible:ring-ink/25",
  brand:
    "bg-brand text-brand-fg shadow-xs hover:bg-brand/90 active:scale-[0.98] focus-visible:ring-brand/30",
  secondary:
    "bg-card text-ink border border-line shadow-xs hover:bg-sand-50 hover:border-line-strong",
  ghost: "bg-transparent text-ink hover:bg-sand-100 active:bg-sand-200",
  danger:
    "bg-danger text-paper shadow-xs hover:bg-danger/90 focus-visible:ring-danger/30",
  success:
    "bg-success text-paper shadow-xs hover:bg-success/90 focus-visible:ring-success/30",
  outline:
    "bg-transparent text-ink border border-line hover:bg-sand-100 hover:border-line-strong",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-4 text-[14px]",
  lg: "h-12 px-5 text-[15px]",
};

const GAPS: Record<ButtonSize, string> = {
  sm: "gap-1.5",
  md: "gap-2",
  lg: "gap-2",
};

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: "size-4",
  md: "size-[18px]",
  lg: "size-5",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
  iconLeft?: IconLike;
  iconRight?: IconLike;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      block = false,
      iconLeft,
      iconRight,
      className,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) {
    const glyph = ICON_SIZES[size];
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "relative inline-flex select-none items-center justify-center rounded-md font-medium leading-none whitespace-nowrap",
          "transition-colors duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25 focus-visible:ring-offset-1 focus-visible:ring-offset-paper",
          "disabled:pointer-events-none disabled:opacity-45",
          SIZES[size],
          VARIANTS[variant],
          block && "w-full",
          className,
        )}
        {...props}
      >
        {loading && (
          <span className="absolute inset-0 grid place-items-center">
            <Spinner size={size === "sm" ? "xs" : "sm"} />
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center",
            GAPS[size],
            loading && "opacity-0",
          )}
        >
          {renderIcon(iconLeft, cn(glyph, "shrink-0"))}
          {children}
          {renderIcon(iconRight, cn(glyph, "shrink-0"))}
        </span>
      </button>
    );
  },
);

export type IconButtonVariant = "secondary" | "ghost" | "brand" | "danger";
export type IconButtonSize = "sm" | "md";

const ICON_BUTTON_VARIANTS: Record<IconButtonVariant, string> = {
  secondary:
    "bg-card text-ink border border-line shadow-xs hover:bg-sand-50 hover:border-line-strong",
  ghost: "bg-transparent text-sand-600 hover:bg-sand-100 hover:text-ink",
  brand: "bg-brand text-brand-fg shadow-xs hover:bg-brand/90 active:scale-[0.96]",
  danger: "bg-danger-soft text-danger hover:bg-danger hover:text-paper",
};

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  loading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      size = "md",
      variant = "ghost",
      loading = false,
      className,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "relative inline-grid place-items-center rounded-md",
          "transition-colors duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25 focus-visible:ring-offset-1 focus-visible:ring-offset-paper",
          "disabled:pointer-events-none disabled:opacity-45",
          size === "sm" ? "size-9 [&_svg]:size-4" : "size-11 [&_svg]:size-[18px]",
          ICON_BUTTON_VARIANTS[variant],
          className,
        )}
        {...props}
      >
        {loading ? <Spinner size={size === "sm" ? "xs" : "sm"} /> : children}
      </button>
    );
  },
);
