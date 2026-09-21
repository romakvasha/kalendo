import {
  appointmentsBetween,
  appointmentsOn,
  clientById,
  clientsOf,
  dayRevenue,
  metricsRange,
  newClientsBetween,
  nextFreeWindows,
  servicesFor,
  staffById,
  utilizationOn,
  type DataState,
} from "@/lib/data";
import {
  TODAY,
  addDays,
  dayMonth,
  daysBetween,
  daysInMonth,
  minutesOf,
  monthShort,
  monthYear,
  parseLocal,
  startOfMonth,
  startOfWeek,
  timeOf,
  toISODate,
  weekdayOf,
} from "@/lib/format";
import { PANEL_MODULES } from "@/lib/nav";
import { range, sum } from "@/lib/utils";
import type {
  Appointment,
  AppointmentStatus,
  Locale,
  LocalizedText,
  PanelModule,
  PanelModuleKey,
  ServiceColor,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const INTL_TAG: Record<Locale, string> = {
  pl: "pl-PL",
  en: "en-GB",
  uk: "uk-UA",
};

export function decimal(value: number, locale: Locale, digits = 1): string {
  return new Intl.NumberFormat(INTL_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function percent(value: number, locale: Locale, digits = 0): string {
  return `${new Intl.NumberFormat(INTL_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}%`;
}

/** "+3" / "−1,2" — the caller appends the unit ("pp", "%"). */
export function signed(value: number, locale: Locale, digits = 0): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${new Intl.NumberFormat(INTL_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(value))}`;
}

export function ratio(current: number, previous: number): number {
  if (!previous) return 0;
  return (current - previous) / previous;
}

export function monthName(iso: string, locale: Locale): string {
  return monthYear(iso, locale).replace(/\s+\d{4}$/, "");
}

export function lowerMonthName(iso: string, locale: Locale): string {
  return monthName(iso, locale).toLocaleLowerCase(INTL_TAG[locale]);
}

/* ------------------------------------------------------------------ */
/* Ranges                                                              */
/* ------------------------------------------------------------------ */

export type RangeKey = "week" | "month" | "year";

export interface Bounds {
  from: string;
  to: string;
}

function dateOf(iso: string): string {
  return iso.slice(0, 10);
}

function avg(values: number[]): number {
  return values.length ? sum(values) / values.length : 0;
}

/** The last day of `monthIso` that has already happened on the demo clock. */
export function monthAnchor(monthIso: string): string {
  const last = `${monthIso.slice(0, 7)}-${`${daysInMonth(`${monthIso.slice(0, 7)}-01`)}`.padStart(2, "0")}`;
  return last < TODAY ? last : TODAY;
}

export function monthBounds(monthIso: string): Bounds {
  const month = monthIso.slice(0, 7);
  const last = daysInMonth(`${month}-01`);
  return { from: `${month}-01`, to: `${month}-${`${last}`.padStart(2, "0")}` };
}

export function boundsFor(key: RangeKey, anchor: string): Bounds {
  if (key === "week") return { from: addDays(anchor, -6), to: anchor };
  if (key === "year") return { from: `${anchor.slice(0, 4)}-01-01`, to: anchor };
  return { from: startOfMonth(anchor), to: anchor };
}

export function previousBounds(bounds: Bounds): Bounds {
  const span = daysBetween(bounds.from, bounds.to) + 1;
  return {
    from: addDays(bounds.from, -span),
    to: addDays(bounds.to, -span),
  };
}

export function recentMonths(count: number, anchor: string = TODAY): string[] {
  const base = parseLocal(startOfMonth(anchor));
  return range(count).map((index) =>
    toISODate(new Date(base.getFullYear(), base.getMonth() - index, 1)),
  );
}

/** Months the tenant actually has measured days for, newest first. */
export function availableMonths(
  state: DataState,
  tenantId: string,
  count = 6,
  anchor: string = TODAY,
): string[] {
  const months = recentMonths(count, anchor).filter((iso) => {
    const bounds = monthBounds(iso);
    return metricsRange(state, tenantId, bounds.from, bounds.to).length > 0;
  });
  return months.length ? months : [startOfMonth(anchor)];
}

export function rangeLabel(bounds: Bounds, locale: Locale): string {
  const fromDay = Number.parseInt(bounds.from.slice(8), 10);
  if (bounds.from.slice(0, 7) === bounds.to.slice(0, 7)) {
    return `${fromDay}–${dayMonth(bounds.to, locale)}`;
  }
  return `${dayMonth(bounds.from, locale)} – ${dayMonth(bounds.to, locale)}`;
}

/* ------------------------------------------------------------------ */
/* Aggregates                                                          */
/* ------------------------------------------------------------------ */

const REALIZED: AppointmentStatus[] = ["in-progress", "done"];
const BOOKED: AppointmentStatus[] = ["confirmed", "pending"];

export interface Totals {
  revenue: number;
  visits: number;
  utilization: number;
  absences: number;
  newClients: number;
  hasAppointments: boolean;
  revenueSeries: number[];
  visitSeries: number[];
  utilizationSeries: number[];
  absenceSeries: number[];
}

export function totalsIn(
  state: DataState,
  tenantId: string,
  bounds: Bounds,
): Totals {
  const metrics = metricsRange(state, tenantId, bounds.from, bounds.to);
  const openDays = metrics.filter((metric) => metric.utilization > 0);
  const appointments = appointmentsBetween(
    state,
    tenantId,
    bounds.from,
    bounds.to,
  );
  const missed = appointments.filter((item) => item.status === "no-show");

  return {
    revenue: sum(metrics.map((metric) => metric.revenue)),
    visits: sum(metrics.map((metric) => metric.appointments)),
    utilization: Math.round(avg(openDays.map((metric) => metric.utilization))),
    absences: appointments.length
      ? (missed.length / appointments.length) * 100
      : 0,
    newClients: newClientsBetween(state, tenantId, bounds.from, bounds.to),
    hasAppointments: appointments.length > 0,
    revenueSeries: metrics.map((metric) => metric.revenue),
    visitSeries: metrics.map((metric) => metric.appointments),
    utilizationSeries: metrics.map((metric) => metric.utilization),
    absenceSeries: metrics.map(
      (metric) =>
        appointments.filter(
          (item) =>
            dateOf(item.start) === metric.date &&
            (item.status === "no-show" || item.status === "cancelled"),
        ).length,
    ),
  };
}

export interface Baseline {
  revenue: number;
  visits: number;
  utilization: number;
  /** null when nothing in the data can stand in for the previous period. */
  absences: number | null;
}

function trendRatio(series: number[]): number {
  const open = series.filter((value) => value > 0);
  if (open.length < 4) return 1;
  const half = Math.ceil(open.length / 2);
  const early = avg(open.slice(0, half));
  const late = avg(open.slice(half));
  return early > 0 ? late / early : 1;
}

function absenceRate(appointments: Appointment[]): number | null {
  if (!appointments.length) return null;
  const missed = appointments.filter((item) => item.status === "no-show");
  return (missed.length / appointments.length) * 100;
}

export function baselineIn(
  state: DataState,
  tenantId: string,
  bounds: Bounds,
  current: Totals,
): Baseline {
  const previous = previousBounds(bounds);
  const metrics = metricsRange(state, tenantId, previous.from, previous.to);
  const priorAppointments = appointmentsBetween(
    state,
    tenantId,
    previous.from,
    previous.to,
  );
  const outside = state.appointments.filter(
    (item) =>
      item.tenantId === tenantId &&
      (dateOf(item.start) < bounds.from || dateOf(item.start) > bounds.to),
  );
  const absences = absenceRate(priorAppointments) ?? absenceRate(outside);

  if (metrics.length) {
    const openDays = metrics.filter((metric) => metric.utilization > 0);
    return {
      revenue: sum(metrics.map((metric) => metric.revenue)),
      visits: sum(metrics.map((metric) => metric.appointments)),
      utilization: Math.round(
        avg(openDays.map((metric) => metric.utilization)),
      ),
      absences,
    };
  }

  // The demo data only carries September, so the window's own first-half →
  // second-half trend stands in for a previous period that has no rows.
  return {
    revenue: current.revenue / trendRatio(current.revenueSeries),
    visits: current.visits / trendRatio(current.visitSeries),
    utilization: current.utilization / trendRatio(current.utilizationSeries),
    absences,
  };
}

/* ------------------------------------------------------------------ */
/* Today                                                               */
/* ------------------------------------------------------------------ */

export function previousOpenDay(
  state: DataState,
  tenantId: string,
  anchor: string = TODAY,
): string {
  for (let back = 1; back <= 10; back += 1) {
    const day = addDays(anchor, -back);
    const metric = metricsRange(state, tenantId, day, day)[0];
    if (metric && metric.revenue > 0) return day;
  }
  return addDays(anchor, -1);
}

export interface TodayStats {
  revenue: number;
  revenueDelta: number;
  utilization: number;
  utilizationDelta: number;
  newClients: number;
  newClientsDelta: number;
  visits: number;
}

export function todayStats(state: DataState, tenantId: string): TodayStats {
  const previous = previousOpenDay(state, tenantId);
  const today = metricsRange(state, tenantId, TODAY, TODAY)[0];
  const before = metricsRange(state, tenantId, previous, previous)[0];

  // Headline figures stay live so a booking made in the panel moves them;
  // the day-over-day trend comes from the measured daily metrics, which are
  // the only series that covers both days evenly.
  return {
    revenue: dayRevenue(state, tenantId, TODAY),
    revenueDelta: ratio(today?.revenue ?? 0, before?.revenue ?? 0),
    utilization: utilizationOn(state, tenantId, TODAY),
    utilizationDelta: (today?.utilization ?? 0) - (before?.utilization ?? 0),
    newClients: newClientsBetween(state, tenantId, TODAY, TODAY),
    newClientsDelta:
      newClientsBetween(state, tenantId, TODAY, TODAY) -
      newClientsBetween(state, tenantId, previous, previous),
    visits: appointmentsOn(state, tenantId, TODAY).filter(
      (item) => item.status !== "cancelled",
    ).length,
  };
}

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

export interface RevenueBar {
  label: string;
  value: number;
  secondary?: number;
  highlight?: boolean;
}

export function monthRevenueBars(
  state: DataState,
  tenantId: string,
  monthIso: string,
): RevenueBar[] {
  const month = monthIso.slice(0, 7);
  const total = daysInMonth(`${month}-01`);
  const metrics = metricsRange(
    state,
    tenantId,
    `${month}-01`,
    `${month}-${`${total}`.padStart(2, "0")}`,
  );
  const byDate = new Map(metrics.map((metric) => [metric.date, metric.revenue]));

  return range(total, 1).map((day) => {
    const iso = `${month}-${`${day}`.padStart(2, "0")}`;
    const label = `${day}`;
    if (iso < TODAY) return { label, value: byDate.get(iso) ?? 0 };

    const onDay = state.appointments.filter(
      (item) => item.tenantId === tenantId && dateOf(item.start) === iso,
    );
    const booked = sum(
      onDay.filter((item) => BOOKED.includes(item.status)).map((item) => item.total),
    );
    if (iso > TODAY) return { label, value: 0, secondary: booked };

    const realized = sum(
      onDay
        .filter((item) => REALIZED.includes(item.status))
        .map((item) => item.total),
    );
    return { label, value: realized, secondary: booked, highlight: true };
  });
}

export function bookedAhead(bars: RevenueBar[]): number {
  return sum(bars.map((bar) => bar.secondary ?? 0));
}

export function groupByWeek(bars: RevenueBar[], monthIso: string): RevenueBar[] {
  const month = monthIso.slice(0, 7);
  const order: string[] = [];
  const weeks = new Map<string, RevenueBar>();

  bars.forEach((bar, index) => {
    const iso = `${month}-${`${index + 1}`.padStart(2, "0")}`;
    const key = startOfWeek(iso);
    const existing = weeks.get(key);
    if (existing) {
      existing.value += bar.value;
      existing.secondary = (existing.secondary ?? 0) + (bar.secondary ?? 0);
      existing.highlight = existing.highlight || Boolean(bar.highlight);
      return;
    }
    order.push(key);
    weeks.set(key, {
      label: bar.label,
      value: bar.value,
      secondary: bar.secondary ?? 0,
      highlight: Boolean(bar.highlight),
    });
  });

  return order
    .map((key) => weeks.get(key))
    .filter((bar): bar is RevenueBar => bar !== undefined);
}

export function reportBars(
  state: DataState,
  tenantId: string,
  bounds: Bounds,
  locale: Locale,
): RevenueBar[] {
  const span = daysBetween(bounds.from, bounds.to) + 1;
  const metrics = metricsRange(state, tenantId, bounds.from, bounds.to);
  const byDate = new Map(metrics.map((metric) => [metric.date, metric.revenue]));

  if (span > 62) {
    const order: string[] = [];
    const totals = new Map<string, number>();
    range(span).forEach((offset) => {
      const iso = addDays(bounds.from, offset);
      const key = iso.slice(0, 7);
      if (!totals.has(key)) {
        order.push(key);
        totals.set(key, 0);
      }
      totals.set(key, (totals.get(key) ?? 0) + (byDate.get(iso) ?? 0));
    });
    return order.map((key) => ({
      label: monthShort(`${key}-01`, locale),
      value: totals.get(key) ?? 0,
      highlight: key === TODAY.slice(0, 7),
    }));
  }

  return range(span).map((offset) => {
    const iso = addDays(bounds.from, offset);
    return {
      label: `${Number.parseInt(iso.slice(8), 10)}`,
      value: byDate.get(iso) ?? dayRevenue(state, tenantId, iso),
      highlight: iso === TODAY,
    };
  });
}

export const HEAT_START_HOUR = 8;
export const HEAT_HOURS = 13;

/** Booked minutes per weekday × hour, for the report heat strip. */
export function hourHeat(
  state: DataState,
  tenantId: string,
  bounds: Bounds,
): number[][] {
  const grid = range(7).map(() => range(HEAT_HOURS).map(() => 0));

  for (const item of appointmentsBetween(state, tenantId, bounds.from, bounds.to)) {
    if (item.status === "cancelled") continue;
    const column = weekdayOf(item.start) - 1;
    const from = minutesOf(item.start);
    const to = minutesOf(item.end);
    for (let hour = 0; hour < HEAT_HOURS; hour += 1) {
      const slotFrom = (HEAT_START_HOUR + hour) * 60;
      const overlap = Math.min(to, slotFrom + 60) - Math.max(from, slotFrom);
      if (overlap > 0) grid[column][hour] += overlap;
    }
  }

  return grid;
}

export interface ServiceRank {
  id: string;
  name: LocalizedText;
  revenue: number;
  count: number;
}

export function servicesByRevenue(
  state: DataState,
  tenantId: string,
  bounds: Bounds,
): ServiceRank[] {
  const totals = new Map<string, ServiceRank>();

  for (const item of appointmentsBetween(state, tenantId, bounds.from, bounds.to)) {
    if (item.status === "cancelled" || item.status === "no-show") continue;
    for (const service of servicesFor(state, item.serviceIds)) {
      const entry = totals.get(service.id) ?? {
        id: service.id,
        name: service.name,
        revenue: 0,
        count: 0,
      };
      entry.revenue += service.price;
      entry.count += 1;
      totals.set(service.id, entry);
    }
  }

  return [...totals.values()].sort((a, b) => b.revenue - a.revenue);
}

/* ------------------------------------------------------------------ */
/* Assistant                                                           */
/* ------------------------------------------------------------------ */

export function freeWindowTimes(
  state: DataState,
  tenantId: string,
  isoDate: string,
  minMinutes = 45,
  limit = 3,
): string[] {
  const seen = new Set<string>();
  const times: string[] = [];
  for (const window of nextFreeWindows(state, tenantId, isoDate, minMinutes)) {
    const time = timeOf(window.start);
    if (seen.has(time)) continue;
    seen.add(time);
    times.push(time);
    if (times.length === limit) break;
  }
  return times;
}

export function joinTimes(times: string[], and: string): string {
  if (times.length < 2) return times.join("");
  return `${times.slice(0, -1).join(", ")} ${and} ${times[times.length - 1]}`;
}

export function regularClientCount(state: DataState, tenantId: string): number {
  return clientsOf(state, tenantId).filter((client) =>
    client.tags.includes("regular"),
  ).length;
}

/* ------------------------------------------------------------------ */
/* Labels & modules                                                    */
/* ------------------------------------------------------------------ */

export function statusKey(status: AppointmentStatus): string {
  switch (status) {
    case "pending":
      return "visits.pending";
    case "confirmed":
      return "visits.confirmed";
    case "in-progress":
      return "panel.calendar.inProgress";
    case "done":
      return "panel.calendar.done";
    case "cancelled":
      return "visits.cancelled";
    default:
      return "panel.calendar.noShow";
  }
}

export const SERVICE_DOT: Record<ServiceColor, string> = {
  peach: "bg-svc-peach-ink",
  rose: "bg-svc-rose-ink",
  violet: "bg-svc-violet-ink",
  sky: "bg-svc-sky-ink",
  mint: "bg-svc-mint-ink",
  sand: "bg-svc-sand-ink",
};

const TAB_MODULES: PanelModuleKey[] = ["dashboard", "calendar", "reports"];

/** Every module worth a tile on /panel/more, with the AI tile last. */
export function directoryModules(): PanelModule[] {
  const shown = PANEL_MODULES.filter(
    (module) => !TAB_MODULES.includes(module.key),
  );
  return [
    ...shown.filter((module) => module.key !== "ai"),
    ...shown.filter((module) => module.key === "ai"),
  ];
}

/* ------------------------------------------------------------------ */
/* CSV export                                                          */
/* ------------------------------------------------------------------ */

export interface CsvHeaders {
  date: string;
  time: string;
  client: string;
  service: string;
  staff: string;
  status: string;
  amount: string;
}

function escapeCell(value: string): string {
  return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function appointmentsCsv(
  state: DataState,
  tenantId: string,
  bounds: Bounds,
  headers: CsvHeaders,
  statusLabel: (status: AppointmentStatus) => string,
  serviceName: (id: string) => string,
): string {
  const head = [
    headers.date,
    headers.time,
    headers.client,
    headers.service,
    headers.staff,
    headers.status,
    headers.amount,
  ];

  const rows = appointmentsBetween(state, tenantId, bounds.from, bounds.to).map(
    (item) => [
      dateOf(item.start),
      timeOf(item.start),
      clientById(state, item.clientId)?.name ?? "",
      item.serviceIds.map(serviceName).join(" + "),
      staffById(state, item.staffId)?.name ?? "",
      statusLabel(item.status),
      `${item.total}`,
    ],
  );

  return [head, ...rows]
    .map((row) => row.map(escapeCell).join(";"))
    .join("\r\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
