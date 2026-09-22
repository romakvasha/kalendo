"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { KalendoLogo } from "@/components/brand/logo";
import { AlertsSheet, useAlertCount } from "@/components/client/alerts-sheet";
import { Avatar } from "@/components/ui";
import { useHydrated, useKalendo } from "@/lib/data";
import { CLIENT_TABS, iconFor, isActivePath } from "@/lib/nav";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Desktop-only chrome for the client app; below lg the bottom tab bar takes over. */
export function ClientHeader({ className }: { className?: string }) {
  const t = useT();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const account = useKalendo((state) => state.account);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alerts = useAlertCount();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 hidden border-b border-line bg-card/85 backdrop-blur lg:block",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1080px] items-center gap-8 px-6">
        <Link href="/app" aria-label="Kalendo" className="shrink-0">
          <KalendoLogo size="sm" wordmark />
        </Link>

        <nav aria-label={t("nav.home")} className="flex items-center gap-1">
          {CLIENT_TABS.map((tab) => {
            const Icon = iconFor(tab.icon);
            const active = isActivePath(pathname, tab.href, tab.exact);
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-[14px] transition-colors",
                  active
                    ? "bg-sand-100 font-medium text-ink"
                    : "text-muted hover:bg-sand-50 hover:text-ink",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {t(tab.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="relative">
            <button
              type="button"
              aria-label={t("a11y.notifications")}
              onClick={() => setAlertsOpen(true)}
              className="grid size-10 place-items-center rounded-md text-muted transition-colors hover:bg-sand-100 hover:text-ink"
            >
              <Bell className="size-5" aria-hidden />
            </button>
            {alerts > 0 ? (
              <span
                aria-hidden
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-card"
              />
            ) : null}
          </span>

          <Link
            href="/app/profile"
            aria-label={t("nav.profile")}
            className="rounded-full transition-transform hover:scale-105"
          >
            {hydrated && account ? (
              <Avatar name={account.name} size="md" />
            ) : (
              <span className="block size-10 rounded-full bg-sand-100" />
            )}
          </Link>
        </div>
      </div>

      <AlertsSheet open={alertsOpen} onOpenChange={setAlertsOpen} />
    </header>
  );
}
