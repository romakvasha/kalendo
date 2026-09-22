"use client";

import { BellOff } from "lucide-react";
import { Badge, EmptyState, Sheet } from "@/components/ui";
import { getTenant, upcomingForClient, useDataState, useHydrated } from "@/lib/data";
import { timeOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { relativeDayLabel } from "./helpers";
import { useClientAccount } from "./session";

/**
 * Shared by the phone's in-page bell and the desktop header, so notifications
 * are reachable from every client screen rather than only from Discover.
 */
export function AlertsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const { t, locale } = useI18n();
  const state = useDataState();
  const account = useClientAccount();
  const upcoming = upcomingForClient(state, account.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("a11y.notifications")}>
      {upcoming.length ? (
        <ul className="space-y-2">
          {upcoming.slice(0, 6).map((item) => {
            const tenant = getTenant(state, item.tenantId);
            return (
              <li key={item.id} className="surface-flat flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">
                    {tenant?.name}
                  </p>
                  <p className="text-[12px] text-muted">
                    {relativeDayLabel(t, locale, item.start)} ·{" "}
                    <span className="tabular">{timeOf(item.start)}</span>
                  </p>
                </div>
                <Badge size="sm" tone={item.status === "pending" ? "warn" : "success"}>
                  {item.status === "pending"
                    ? t("visits.pending")
                    : t("visits.confirmed")}
                </Badge>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState compact icon={BellOff} title={t("discover.notificationsEmpty")} />
      )}
    </Sheet>
  );
}

/** Count of visits still awaiting the company's confirmation. */
export function useAlertCount(): number {
  const state = useDataState();
  const account = useClientAccount();
  const hydrated = useHydrated();
  if (!hydrated) return 0;
  return upcomingForClient(state, account.id).filter(
    (item) => item.status === "pending",
  ).length;
}
