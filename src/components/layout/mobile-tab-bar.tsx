"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLIENT_TABS, PANEL_TABS, iconFor, isActivePath, type NavTab } from "@/lib/nav";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface MobileTabBarProps {
  variant: "client" | "panel";
  className?: string;
}

export function MobileTabBar({ variant, className }: MobileTabBarProps) {
  const t = useT();
  const pathname = usePathname() ?? "";
  const tabs: NavTab[] = variant === "panel" ? PANEL_TABS : CLIENT_TABS;
  const isPanel = variant === "panel";

  return (
    <nav
      aria-label={t(isPanel ? "nav.panel" : "common.menu")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-safe backdrop-blur-md",
        className,
      )}
    >
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => {
          const Icon = iconFor(tab.icon);
          const active = isActivePath(pathname, tab.href, tab.exact);

          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 transition-colors",
                  active ? "text-ink" : "text-sand-500 hover:text-sand-700",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-11 items-center justify-center rounded-md transition-colors",
                    isPanel && active && "bg-brand-soft text-brand-ink",
                  )}
                >
                  <Icon
                    className="size-[19px]"
                    strokeWidth={active ? 2.1 : 1.7}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className={cn(
                    "text-[10px] leading-none tracking-tight",
                    active && "font-medium",
                  )}
                >
                  {t(tab.labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
