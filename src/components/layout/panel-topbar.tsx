"use client";

import type { ReactNode } from "react";
import { Bell } from "lucide-react";
import { Avatar } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { TopBarTenantSwitcher } from "./tenant-switcher";
import type { Account, Tenant } from "@/lib/types";

export interface PanelTopBarProps {
  tenant?: Tenant;
  account?: Account;
  /** Replaces the centre of the bar on a sub-page. */
  title?: string;
  /** Replaces the default bell + avatar cluster. */
  action?: ReactNode;
  notificationCount?: number;
  className?: string;
}

export function PanelTopBar({
  tenant,
  account,
  title,
  action,
  notificationCount = 3,
  className,
}: PanelTopBarProps) {
  const t = useT();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-line bg-card/85 pt-safe backdrop-blur-md lg:hidden",
        className,
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        <TopBarTenantSwitcher tenant={tenant} showName={!title} />

        {title ? (
          <h1 className="min-w-0 flex-1 truncate text-center text-sm font-medium text-ink">
            {title}
          </h1>
        ) : null}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {action ?? (
            <>
              <span className="relative">
                <button
                  type="button"
                  aria-label={t("a11y.notifications")}
                  className="flex size-9 items-center justify-center rounded-md text-sand-700 transition-colors hover:bg-sand-100 hover:text-ink"
                >
                  <Bell className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
                </button>
                {notificationCount > 0 ? (
                  <span className="tabular pointer-events-none absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-paper">
                    {notificationCount}
                  </span>
                ) : null}
              </span>
              {account ? <Avatar name={account.name} size="sm" /> : null}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
