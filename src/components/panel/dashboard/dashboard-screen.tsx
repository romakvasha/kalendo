"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Download, Plus } from "lucide-react";

import { MiniBars } from "@/components/charts";
import { Button, Card, Select, Skeleton } from "@/components/ui";
import { usePanelSession } from "@/components/layout";
import { useDataState, useHydrated } from "@/lib/data";
import {
  TODAY,
  addDays,
  dayMonth,
  money,
  monthYear,
  number as formatNumber,
  weekdayDayMonth,
} from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, Tenant } from "@/lib/types";

import { AssistantCard, AssistantPanel } from "./assistant-card";
import {
  appointmentsCsv,
  availableMonths,
  baselineIn,
  boundsFor,
  downloadCsv,
  lowerMonthName,
  monthAnchor,
  monthBounds,
  percent,
  ratio,
  signed,
  statusKey,
  todayStats,
  totalsIn,
} from "./helpers";
import { NewAppointmentSheet } from "./new-appointment-sheet";
import { NextVisits } from "./next-visits";
import { QuickActions } from "./quick-actions";
import { RevenueCard } from "./revenue-card";
import { ReviewsCard } from "./reviews-card";
import { SourcesCard } from "./sources-card";
import { InvertedDelta, MetricTile } from "./stat-tiles";
import { TeamCard } from "./team-card";

export function DashboardScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <DashboardSkeleton />;
  return <Dashboard tenant={tenant} />;
}

function Dashboard({ tenant }: { tenant: Tenant }) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();
  const { account } = usePanelSession();

  const [sheetOpen, setSheetOpen] = useState(false);
  const months = useMemo(
    () => availableMonths(state, tenant.id),
    [state, tenant.id],
  );
  const [month, setMonth] = useState(months[0]);

  const ownerName = account?.name ?? tenant.ownerName;
  const firstName = ownerName.split(" ")[0];
  const full = weekdayDayMonth(TODAY, locale);

  const today = useMemo(() => todayStats(state, tenant.id), [state, tenant.id]);
  const bounds = useMemo(() => boundsFor("month", monthAnchor(month)), [month]);
  const totals = useMemo(
    () => totalsIn(state, tenant.id, bounds),
    [state, tenant.id, bounds],
  );
  const baseline = useMemo(
    () => baselineIn(state, tenant.id, bounds, totals),
    [state, tenant.id, bounds, totals],
  );

  const previousMonthLabel = lowerMonthName(addDays(bounds.from, -1), locale);
  const vsPrevious = t("panel.dashboard.vsPeriod", { period: previousMonthLabel });
  const absenceDelta =
    baseline.absences === null ? 0 : totals.absences - baseline.absences;

  function exportMonth() {
    const csv = appointmentsCsv(
      state,
      tenant.id,
      monthBounds(month),
      {
        date: t("common.date"),
        time: t("common.time"),
        client: t("common.client"),
        service: t("common.service"),
        staff: t("common.staff"),
        status: t("common.status"),
        amount: t("panel.payments.amount"),
      },
      (status: AppointmentStatus) => t(statusKey(status)),
      (id) => {
        const service = state.services.find((item) => item.id === id);
        return service ? tl(service.name) : id;
      },
    );
    downloadCsv(`${tenant.slug}-${month.slice(0, 7)}.csv`, csv);
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[30px] leading-[1.08] text-ink sm:text-[34px] lg:text-[40px]">
            {t("panel.dashboard.greeting", { name: firstName })}
          </h1>
          <p className="mt-1.5 text-[14px] text-muted lg:text-[15px]">
            {t("panel.dashboard.subtitle", {
              weekday: full.split(",")[0],
              date: dayMonth(TODAY, locale),
              count: today.visits,
            })}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <div className="w-[170px]">
            <Select
              aria-label={t("panel.reports.period")}
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              options={months.map((item) => ({
                value: item,
                label: monthYear(item, locale),
              }))}
            />
          </div>
          <Button variant="secondary" iconLeft={Download} onClick={exportMonth}>
            {t("panel.reports.exportAction")}
          </Button>
          <Button iconLeft={Plus} onClick={() => setSheetOpen(true)}>
            {t("panel.dashboard.newVisit")}
          </Button>
        </div>
      </header>

      {/* Mobile stats */}
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 lg:hidden">
        <MetricTile
          className="min-w-[6.5rem] flex-1 p-3.5"
          label={t("panel.dashboard.revenueToday")}
          value={<TileValue>{money(today.revenue, locale)}</TileValue>}
          delta={today.revenueDelta}
        />
        <MetricTile
          className="min-w-[6.5rem] flex-1 p-3.5"
          label={t("panel.dashboard.utilization")}
          value={<TileValue>{percent(today.utilization, locale)}</TileValue>}
          delta={`${signed(today.utilizationDelta, locale)} ${t("panel.reports.pp")}`}
        />
        <MetricTile
          className="min-w-[6.5rem] flex-1 p-3.5"
          label={t("panel.dashboard.newClients")}
          value={<TileValue>{formatNumber(today.newClients, locale)}</TileValue>}
          delta={signed(today.newClientsDelta, locale)}
        />
      </div>

      {/* Desktop stats */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-4">
        <MetricTile
          label={t("panel.reports.revenue")}
          value={money(totals.revenue, locale)}
          delta={ratio(totals.revenue, baseline.revenue)}
          deltaLabel={vsPrevious}
          chart={<MiniBars values={totals.revenueSeries} tone="brand" bars={14} height={30} />}
        />
        <MetricTile
          label={t("panel.reports.visits")}
          value={formatNumber(totals.visits, locale)}
          delta={ratio(totals.visits, baseline.visits)}
          deltaLabel={vsPrevious}
          chart={<MiniBars values={totals.visitSeries} tone="brand" bars={14} height={30} />}
        />
        <MetricTile
          label={t("panel.reports.scheduleUtilization")}
          value={percent(totals.utilization, locale)}
          delta={`${signed(totals.utilization - baseline.utilization, locale)} ${t("panel.reports.pp")}`}
          deltaLabel={vsPrevious}
          chart={<MiniBars values={totals.utilizationSeries} tone="brand" bars={14} height={30} />}
        />
        <MetricTile
          label={t("panel.reports.absences")}
          value={percent(totals.absences, locale, 1)}
          deltaLabel={
            baseline.absences === null ? undefined : (
              <InvertedDelta
                value={absenceDelta}
                text={`${signed(absenceDelta, locale, 1)} ${t("panel.reports.pp")}`}
              />
            )
          }
          hint={t("panel.reports.lowerIsBetter")}
          chart={<MiniBars values={totals.absenceSeries} tone="muted" bars={14} height={30} />}
        />
      </div>

      {/* Mobile quick actions + assistant */}
      <QuickActions className="lg:hidden" onNewVisit={() => setSheetOpen(true)} />
      <AssistantCard className="lg:hidden" tenantId={tenant.id} />

      {/* Desktop charts */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[1.55fr_1fr]">
        <RevenueCard tenantId={tenant.id} monthIso={month} />
        <SourcesCard tenantId={tenant.id} />
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        <AssistantPanel tenantId={tenant.id} />
        <TeamCard tenantId={tenant.id} bounds={bounds} />
        <ReviewsCard tenant={tenant} />
      </div>

      {/* Mobile agenda */}
      <NextVisits className="lg:hidden" tenantId={tenant.id} />

      <NewAppointmentSheet
        tenantId={tenant.id}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

/** The phone tiles sit three across at 375px, so the figure steps down. */
function TileValue({ children }: { children: ReactNode }) {
  return (
    <span className="block text-[21px] whitespace-nowrap sm:text-[26px]">
      {children}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-48" />
      </div>
      <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((index) => (
          <Card
            key={index}
            flat
            className={cn("p-4 lg:p-5", index === 3 && "hidden lg:block")}
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-24" />
            <Skeleton className="mt-3 h-3 w-16" />
          </Card>
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
