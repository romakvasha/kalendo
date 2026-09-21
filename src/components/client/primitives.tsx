"use client";

import Link from "next/link";
import { monthShort, weekdayShort } from "@/lib/format";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { dayOfMonth } from "./helpers";

export interface SectionHeadingProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  /** Opens the action in a new tab (maps, external listings). */
  actionExternal?: boolean;
  onAction?: () => void;
  className?: string;
}

export function SectionHeading({
  title,
  actionLabel,
  actionHref,
  actionExternal = false,
  onAction,
  className,
}: SectionHeadingProps) {
  const actionClass =
    "shrink-0 rounded-xs text-[13px] font-medium text-muted transition-colors hover:text-ink";

  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <h2 className="font-display text-[21px] leading-tight text-ink">{title}</h2>

      {actionLabel && actionHref && actionExternal ? (
        <a
          href={actionHref}
          target="_blank"
          rel="noreferrer"
          className={actionClass}
        >
          {actionLabel}
        </a>
      ) : actionLabel && actionHref ? (
        <Link href={actionHref} className={actionClass}>
          {actionLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <button type="button" onClick={onAction} className={actionClass}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export interface DateChipProps {
  iso: string;
  className?: string;
}

export function DateChip({ iso, className }: DateChipProps) {
  const locale = useLocale();

  return (
    <div
      className={cn(
        "flex w-13 shrink-0 flex-col items-center gap-0.5 rounded-md bg-sand-100 px-2 py-2",
        className,
      )}
    >
      <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">
        {weekdayShort(iso, locale)}
      </span>
      <span className="tabular font-display text-[21px] leading-none text-ink">
        {dayOfMonth(iso)}
      </span>
      <span className="text-[10px] text-muted uppercase">
        {monthShort(iso, locale)}
      </span>
    </div>
  );
}

/** Rows of icon-over-label actions, used on the ink cards and visit cards. */
export interface ActionTileProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  tone?: "default" | "danger";
  variant?: "ink" | "plain";
  className?: string;
}

export function ActionTile({
  icon,
  label,
  href,
  external = false,
  onClick,
  tone = "default",
  variant = "plain",
  className,
}: ActionTileProps) {
  const shared = cn(
    "flex flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium leading-none transition-colors",
    variant === "ink"
      ? "bg-paper/10 text-paper hover:bg-paper/20"
      : tone === "danger"
        ? "text-danger hover:bg-danger-soft"
        : "text-sand-700 hover:bg-sand-100 hover:text-ink",
    className,
  );

  const content = (
    <>
      <span aria-hidden className="[&_svg]:size-[18px]">
        {icon}
      </span>
      <span className="w-full truncate text-center">{label}</span>
    </>
  );

  if (href && external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={shared}
        title={label}
      >
        {content}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={shared} title={label}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={shared} title={label}>
      {content}
    </button>
  );
}
