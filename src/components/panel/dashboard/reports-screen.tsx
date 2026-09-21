"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download } from "lucide-react";

import { BarChart, ShareBars } from "@/components/charts";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Segmented,
  Select,
  Skeleton,
} from "@/components/ui";
import { usePanelSession } from "@/components/layout";
import { sourceBreakdown, useDataState, useHydrated } from "@/lib/data";
import {
  delta as formatDelta,
  money,
  monthYear,
  number as formatNumber,
} from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { AppointmentStatus, BookingSource, Tenant } from "@/lib/types";

import {
  appointmentsCsv,
  availableMonths,
  baselineIn,
  boundsFor,
  downloadCsv,
  monthAnchor,
  percent,
  previousBounds,
  rangeLabel,
  ratio,
  reportBars,
  signed,
  statusKey,
  totalsIn,
  type RangeKey,
} from "./helpers";
import { HourHeatmap, ServiceRanking } from "./reports-extras";
import { InvertedDelta, MetricTile } from "./stat-tiles";
import { TeamCard } from "./team-card";

function sourceKey(source: BookingSource | "widget"): string {
  return source === "walk-in" ? "walkIn" : source;
}

export function ReportsScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <ReportsSkeleton />;
  return <Reports tenant={tenant} />;
}

function Reports({ tenant }: { tenant: Tenant }) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();

  const months = useMemo(
    () => availableMonths(state, tenant.id),
    [state, tenant.id],
  );
  const [month, setMonth] = useState(months[0]);
  const [range, setRange] = useState<RangeKey>("month");

  const bounds = useMemo(
    () => boundsFor(range, monthAnchor(month)),
    [range, month],
  );
  const totals = useMemo(
    () => totalsIn(state, tenant.id, bounds),
    [state, tenant.id, bounds],
  );
  const baseline = useMemo(
    () => baselineIn(state, tenant.id, bounds, totals),
    [state, tenant.id, bounds, totals],
  );
  const bars = useMemo(
    () => reportBars(state, tenant.id, bounds, locale),
    [state, tenant.id, bounds, locale],
  );
  const breakdown = useMemo(
    () => sourceBreakdown(state, tenant.id),
    [state, tenant.id],
  );

  const revenueDelta = ratio(totals.revenue, baseline.revenue);
  const utilizationDelta = totals.utilization - baseline.utilization;
  const absenceDelta =
    baseline.absences === null ? 0 : totals.absences - baseline.absences;
  const previousLabel = rangeLabel(previousBounds(bounds), locale);
  const highlight = bars.find((bar) => bar.highlight);

  const axis = (value: number) =>
    value >= 1000
      ? `${formatNumber(Math.round(value / 100) / 10, locale)} ${t("panel.reports.thousandShort")}`
      : formatNumber(value, locale);

  function exportRange() {
    const csv = appointmentsCsv(
      state,
      tenant.id,
      bounds,
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
    downloadCsv(`${tenant.slug}-${bounds.from}-${bounds.to}.csv`, csv);
  }

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <header className="flex items-start justify-between gap-3">
        <h1 className="font-display text-[32px] leading-[1.05] text-ink lg:text-[40px]">
          {t("panel.reports.title")}
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <div className="w-[142px] lg:w-[170px]">
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
          <Button
            variant="secondary"
            iconLeft={Download}
            onClick={exportRange}
            className="hidden lg:inline-flex"
          >
            {t("panel.reports.exportAction")}
          </Button>
        </div>
      </header>

      <Segmented
        block
        value={range}
        onChange={(value) => setRange(value as RangeKey)}
        options={[
          { value: "week", label: t("panel.reports.week") },
          { value: "month", label: t("panel.reports.month") },
          { value: "year", label: t("panel.reports.year") },
        ]}
      />

      <Card className="p-5">
        <p className="text-[14px] text-muted">
          {`${t("panel.reports.revenue")} · ${rangeLabel(bounds, locale)}`}
        </p>
        <p className="tabular font-display mt-1 text-[40px] leading-none text-ink lg:text-[52px]">
          {money(totals.revenue, locale)}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <Badge
            tone={revenueDelta < 0 ? "neutral" : "success"}
            iconLeft={revenueDelta < 0 ? ArrowDown : ArrowUp}
          >
            <span className="tabular">{formatDelta(revenueDelta, locale)}</span>
          </Badge>
          <span className="text-[13px] text-muted">
            {t("panel.dashboard.vsPeriod", { period: previousLabel })}
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <h2 className="text-[14px] font-medium text-sand-700">
            {`${t("panel.reports.dailyRevenue")}, zł`}
          </h2>
          {highlight ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink">
              <span aria-hidden className="size-2.5 rounded-[3px] bg-brand" />
              {`${t("common.today")}: ${money(highlight.value, locale)}`}
            </span>
          ) : null}
        </div>

        <BarChart
          data={bars}
          height={180}
          tone="brand"
          format={axis}
          labelEvery={bars.length > 10 ? 7 : 1}
          ariaLabel={t("panel.reports.dailyRevenue")}
          className="mt-1"
        />
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        <MetricTile
          label={t("panel.reports.scheduleUtilization")}
          value={percent(totals.utilization, locale)}
          delta={`${signed(utilizationDelta, locale)} ${t("panel.reports.pp")}`}
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
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t("panel.reports.sources")}</CardTitle>
        </CardHeader>
        <CardBody className="pt-4">
          <ShareBars
            items={breakdown.map((item) => ({
              label: t(`panel.reports.sourceNames.${sourceKey(item.source)}`),
              value: item.share,
            }))}
          />
        </CardBody>
      </Card>

      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        <TeamCard tenantId={tenant.id} bounds={bounds} />
        <ServiceRanking tenantId={tenant.id} bounds={bounds} />
      </div>

      <HourHeatmap
        tenantId={tenant.id}
        bounds={bounds}
        className="hidden lg:block"
      />

    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy>
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-full rounded-full" />
      <Card className="p-5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-10 w-56" />
        <Skeleton className="mt-6 h-44 w-full" />
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((index) => (
          <Card key={index} flat className="p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-20" />
          </Card>
        ))}
      </div>
    </div>
  );
}
