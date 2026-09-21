"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui";
import { KalendoLogo, TenantLogo } from "@/components/brand/logo";
import { PANEL_GROUPS, iconFor, isActivePath, panelModulesInGroup } from "@/lib/nav";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Account, Tenant } from "@/lib/types";

export interface PanelSidebarProps {
  tenant?: Tenant;
  account?: Account;
  className?: string;
}

export function PanelSidebar({ tenant, account, className }: PanelSidebarProps) {
  const t = useT();
  const pathname = usePathname() ?? "";

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-white lg:flex",
        className,
      )}
    >
      <div className="px-4 pt-5 pb-3">
        <Link href="/panel" className="inline-flex rounded-sm" aria-label="Kalendo">
          <KalendoLogo size="sm" />
        </Link>
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md border border-line px-2.5 py-2 text-left transition-colors hover:bg-sand-50"
        >
          {tenant ? <TenantLogo tenant={tenant} size="sm" /> : null}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-ink">
              {tenant?.name ?? "Kalendo"}
            </span>
            {tenant ? (
              <span className="block truncate text-[11px] text-muted">
                {tenant.locations.length > 1
                  ? tenant.locations.map((location) => location.name).join(" · ")
                  : tenant.city}
              </span>
            ) : null}
          </span>
          <ChevronRight className="size-4 shrink-0 text-sand-400" aria-hidden="true" />
        </button>
      </div>

      <nav
        aria-label={t("nav.panel")}
        className="thin-scrollbar flex-1 overflow-y-auto px-3 pb-2"
      >
        {PANEL_GROUPS.map((group, groupIndex) => (
          <div key={group} className={groupIndex === 0 ? "" : "mt-5"}>
            {groupIndex === 0 ? null : (
              <p className="px-2.5 pb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-sand-400">
                {t(`nav.groups.${group}`)}
              </p>
            )}
            <ul className="space-y-0.5">
              {panelModulesInGroup(group).map((module) => {
                const Icon = iconFor(module.icon);
                const active = isActivePath(
                  pathname,
                  module.href,
                  module.href === "/panel",
                );

                return (
                  <li key={module.key}>
                    <Link
                      href={module.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-md py-2 pl-2.5 pr-2 text-[13px] transition-colors",
                        active
                          ? "bg-sand-100 font-medium text-ink"
                          : "text-sand-700 hover:bg-sand-50 hover:text-ink",
                      )}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand"
                        />
                      ) : null}
                      <Icon
                        className="size-[17px] shrink-0"
                        strokeWidth={active ? 2 : 1.7}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">{t(module.labelKey)}</span>
                      {module.badge ? (
                        <span className="tabular inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-semibold text-brand-fg">
                          {module.badge}
                        </span>
                      ) : null}
                      {module.isNew ? (
                        <span className="rounded-xs bg-success-soft px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-success">
                          {t("panel.modules.newBadge")}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-2 border-t border-line px-3 py-3">
        {tenant ? (
          <Link
            href={`/b/${tenant.slug}`}
            target="_blank"
            className="block rounded-md border border-line bg-sand-50 px-2.5 py-2 transition-colors hover:bg-sand-100"
          >
            <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-sand-500">
              {t("settings.bookingPage")}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-ink">
              <span className="truncate">{tenant.slug}.kalendo.pl</span>
              <ExternalLink className="size-3.5 shrink-0 text-sand-400" aria-hidden="true" />
            </span>
          </Link>
        ) : null}

        {account ? (
          <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
            <Avatar name={account.name} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">
                {account.name}
              </span>
              {tenant ? (
                <span className="block truncate text-[11px] capitalize text-muted">
                  Kalendo {tenant.plan}
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
