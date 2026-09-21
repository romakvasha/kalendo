"use client";

import Link from "next/link";
import { CalendarPlus, Gift, Lock, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TILE =
  "flex flex-col items-center justify-center gap-1.5 rounded-md border px-2 py-3.5 text-center text-[12px] font-medium leading-4 " +
  "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25 focus-visible:ring-offset-1 focus-visible:ring-offset-paper";

interface ShortcutLink {
  key: string;
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

const SHORTCUTS: ShortcutLink[] = [
  { key: "block", href: "/panel/calendar", labelKey: "panel.dashboard.block", icon: Lock },
  { key: "voucher", href: "/panel/vouchers", labelKey: "panel.dashboard.sellVoucher", icon: Gift },
  { key: "sms", href: "/panel/marketing", labelKey: "panel.dashboard.sendSms", icon: Send },
];

export interface QuickActionsProps {
  onNewVisit: () => void;
  className?: string;
}

export function QuickActions({ onNewVisit, className }: QuickActionsProps) {
  const t = useT();

  return (
    <div className={cn("grid grid-cols-4 gap-2.5", className)}>
      <button
        type="button"
        onClick={onNewVisit}
        className={cn(TILE, "border-ink bg-ink text-paper shadow-xs hover:bg-sand-800")}
      >
        <CalendarPlus className="size-5" strokeWidth={1.7} aria-hidden />
        {t("panel.dashboard.newVisit")}
      </button>

      {SHORTCUTS.map(({ key, href, labelKey, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          className={cn(
            TILE,
            "border-line bg-white text-ink shadow-xs hover:border-line-strong hover:bg-sand-50",
          )}
        >
          <Icon className="size-5" strokeWidth={1.7} aria-hidden />
          {t(labelKey)}
        </Link>
      ))}
    </div>
  );
}
