"use client";

import { BrandProvider } from "@/components/brand/brand-provider";
import { KalendoLogo } from "@/components/brand/logo";
import { Avatar, Badge, Stat } from "@/components/ui";
import {
  appointmentsOn,
  clientById,
  dayRevenue,
  getTenant,
  NOW_TIME,
  SEED_STATE,
  servicesFor,
  staffById,
  utilizationOn,
} from "@/lib/data";
import { SERVICE_COLORS } from "@/lib/brand";
import { dayMonth, money, timeOf, TODAY, weekdayDayMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { iconFor, PANEL_MODULES } from "@/lib/nav";

const TENANT_ID = "t_aurora";

/** Simplified /panel dashboard, used as the "screenshot" inside a browser frame. */
export function PanelMock() {
  const { t, tl, locale } = useI18n();

  const tenant = getTenant(SEED_STATE, TENANT_ID);
  const today = appointmentsOn(SEED_STATE, TENANT_ID, TODAY);
  const upcoming = today
    .filter((a) => timeOf(a.start) >= NOW_TIME && a.status !== "cancelled")
    .slice(0, 3);
  const revenue = dayRevenue(SEED_STATE, TENANT_ID, TODAY);
  const utilization = utilizationOn(SEED_STATE, TENANT_ID, TODAY);

  if (!tenant) return null;

  return (
    <BrandProvider brand={tenant.brand}>
      <div className="flex min-h-[340px] bg-board">
        <aside className="hidden w-[180px] shrink-0 flex-col border-r border-line bg-white py-4 lg:flex">
          <div className="px-4">
            <KalendoLogo size="sm" />
          </div>
          <nav aria-hidden className="mt-4 flex flex-col gap-0.5 px-2">
            {PANEL_MODULES.slice(0, 7).map((module, index) => {
              const Glyph = iconFor(module.icon);
              return (
                <span
                  key={module.key}
                  className={
                    index === 0
                      ? "flex items-center gap-2.5 rounded-sm bg-sand-100 px-2.5 py-2 text-[12px] font-medium text-ink"
                      : "flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[12px] text-sand-600"
                  }
                >
                  <Glyph className="size-4 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{t(module.labelKey)}</span>
                </span>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-2.5">
            <p className="truncate text-[13px] font-semibold text-ink">
              {tenant.name}
            </p>
            <div className="flex items-center gap-2">
              <Badge tone="brand" size="sm">
                {t("panel.dashboard.waiting")}
              </Badge>
              <Avatar name={tenant.ownerName} size="xs" />
            </div>
          </div>

          <div className="p-4">
            <p className="font-display text-[19px] leading-tight text-ink">
              {t("panel.dashboard.greeting", { name: tenant.ownerName })}
            </p>
            <p className="mt-0.5 text-[12px] text-muted">
              {t("panel.dashboard.subtitle", {
                // format.ts exposes no bare weekday name; the long form starts with it.
                weekday: weekdayDayMonth(TODAY, locale).split(",")[0],
                date: dayMonth(TODAY, locale),
                count: today.length,
              })}
            </p>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5 lg:grid-cols-3">
              <div className="rounded-md border border-line bg-white p-3">
                <Stat
                  label={t("panel.dashboard.revenueToday")}
                  value={money(revenue, locale)}
                  tone="muted"
                />
              </div>
              <div className="rounded-md border border-line bg-white p-3">
                <Stat
                  label={t("panel.dashboard.visitsToday")}
                  value={today.length}
                  tone="muted"
                />
              </div>
              <div className="col-span-2 rounded-md border border-line bg-white p-3 lg:col-span-1">
                <Stat
                  label={t("panel.dashboard.utilization")}
                  value={`${utilization}%`}
                  tone="muted"
                />
              </div>
            </div>

            <div className="mt-2.5 rounded-md border border-line bg-white">
              <p className="border-b border-line px-3.5 py-2.5 text-[12px] font-semibold text-ink">
                {t("panel.dashboard.nextVisits")}
              </p>
              <ul className="divide-y divide-line">
                {upcoming.map((appointment) => {
                  const service = servicesFor(SEED_STATE, appointment.serviceIds)[0];
                  const client = clientById(SEED_STATE, appointment.clientId);
                  const staff = staffById(SEED_STATE, appointment.staffId);
                  const colors = SERVICE_COLORS[service?.color ?? "sand"];
                  return (
                    <li
                      key={appointment.id}
                      className="flex items-center gap-3 px-3.5 py-2.5"
                    >
                      <span
                        className={`tabular shrink-0 rounded-xs px-1.5 py-1 text-[11px] font-medium ${colors.bg} ${colors.ink}`}
                      >
                        {timeOf(appointment.start)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium text-ink">
                          {client?.name}
                        </p>
                        <p className="truncate text-[11px] text-muted">
                          {tl(service?.name)}
                        </p>
                      </div>
                      <span className="hidden shrink-0 text-[11px] text-sand-500 sm:inline">
                        {staff?.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </BrandProvider>
  );
}
