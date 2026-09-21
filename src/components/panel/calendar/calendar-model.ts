import { DAY_END_MIN, DAY_START_MIN } from "@/lib/calendar-geometry";
import {
  addDays,
  dayMonth,
  daysInMonth,
  startOfMonth,
  startOfWeek,
  weekdayOf,
  weekdayShort,
} from "@/lib/format";
import { clamp, range } from "@/lib/utils";
import type {
  Appointment,
  CalendarBlock,
  Locale,
  Staff,
  Tenant,
} from "@/lib/types";

export type CalendarView = "day" | "days3" | "week" | "month";

export const ALL_STAFF = "all";

/** Anything shorter reads as noise rather than a bookable window. */
export const GAP_MIN_MINUTES = 20;

export const DRAG_STEP_MINUTES = 15;

export interface DayWindow {
  startMin: number;
  endMin: number;
}

export interface GridColumn {
  key: string;
  date: string;
  staff: Staff;
}

export interface DateGroup {
  date: string;
  span: number;
}

export interface ComposerSeed {
  date: string;
  staffId: string | null;
  time: string | null;
}

export interface MoveRequest {
  id: string;
  date: string;
  staffId: string;
  startMin: number;
}

export type ColumnItem =
  | {
      kind: "appointment";
      id: string;
      start: string;
      end: string;
      appointment: Appointment;
    }
  | {
      kind: "block";
      id: string;
      start: string;
      end: string;
      block: CalendarBlock;
    };

export function itemRange(item: ColumnItem): { start: string; end: string } {
  return { start: item.start, end: item.end };
}

function hhmmToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function openingOn(tenant: Tenant | undefined, isoDate: string) {
  return tenant?.openingHours.find(
    (entry) => entry.weekday === weekdayOf(isoDate),
  );
}

export function isOpenOn(tenant: Tenant | undefined, isoDate: string): boolean {
  const hours = openingOn(tenant, isoDate);
  return Boolean(hours?.open && hours.close);
}

/** Whole-hour window covering the tenant's opening hours across every visible date. */
export function windowForDates(
  tenant: Tenant | undefined,
  dates: readonly string[],
): DayWindow {
  let start = Number.POSITIVE_INFINITY;
  let end = Number.NEGATIVE_INFINITY;

  for (const date of dates) {
    const hours = openingOn(tenant, date);
    if (!hours?.open || !hours.close) continue;
    start = Math.min(start, Math.floor(hhmmToMinutes(hours.open) / 60) * 60);
    end = Math.max(end, Math.ceil(hhmmToMinutes(hours.close) / 60) * 60);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { startMin: DAY_START_MIN, endMin: DAY_END_MIN };
  }

  return {
    startMin: clamp(start, DAY_START_MIN, DAY_END_MIN),
    endMin: clamp(end, DAY_START_MIN, DAY_END_MIN),
  };
}

export function datesForView(view: CalendarView, isoDate: string): string[] {
  if (view === "days3") return range(3).map((index) => addDays(isoDate, index));
  if (view === "week") {
    const monday = startOfWeek(isoDate);
    return range(7).map((index) => addDays(monday, index));
  }
  return [isoDate];
}

export function stepForView(view: CalendarView): number {
  if (view === "days3") return 3;
  if (view === "week") return 7;
  return 1;
}

export function buildColumns(
  dates: readonly string[],
  staff: readonly Staff[],
): { columns: GridColumn[]; groups: DateGroup[] } {
  const columns: GridColumn[] = [];
  const groups: DateGroup[] = [];

  for (const date of dates) {
    for (const member of staff) {
      columns.push({ key: `${date}:${member.id}`, date, staff: member });
    }
    groups.push({ date, span: staff.length });
  }

  return { columns, groups };
}

export function visibleAppointments(
  all: readonly Appointment[],
  tenantId: string,
  dates: readonly string[],
): Appointment[] {
  const wanted = new Set(dates);
  return all.filter(
    (appointment) =>
      appointment.tenantId === tenantId &&
      appointment.status !== "cancelled" &&
      wanted.has(appointment.start.slice(0, 10)),
  );
}

export function visibleBlocks(
  all: readonly CalendarBlock[],
  tenantId: string,
  dates: readonly string[],
): CalendarBlock[] {
  const wanted = new Set(dates);
  return all.filter(
    (block) =>
      block.tenantId === tenantId && wanted.has(block.start.slice(0, 10)),
  );
}

export function itemsForColumn(
  column: GridColumn,
  appointments: readonly Appointment[],
  blocks: readonly CalendarBlock[],
): ColumnItem[] {
  const items: ColumnItem[] = [];

  for (const appointment of appointments) {
    if (appointment.staffId !== column.staff.id) continue;
    if (appointment.start.slice(0, 10) !== column.date) continue;
    items.push({
      kind: "appointment",
      id: appointment.id,
      start: appointment.start,
      end: appointment.end,
      appointment,
    });
  }

  for (const block of blocks) {
    if (block.staffId !== column.staff.id) continue;
    if (block.start.slice(0, 10) !== column.date) continue;
    items.push({
      kind: "block",
      id: block.id,
      start: block.start,
      end: block.end,
      block,
    });
  }

  return items;
}

/** "Po, 21 września" — the compact label used by the mobile toolbar and toasts. */
export function shortDateLabel(isoDate: string, locale: Locale): string {
  const weekday = weekdayShort(isoDate, locale);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${dayMonth(isoDate, locale)}`;
}

export interface MonthCell {
  date: string;
  inMonth: boolean;
}

export function monthCells(anchorISO: string): MonthCell[] {
  const first = startOfMonth(anchorISO);
  const gridStart = startOfWeek(first);
  const month = first.slice(0, 7);
  const lead = Math.max(0, (weekdayOf(first) - 1 + 7) % 7);
  const weeks = Math.ceil((lead + daysInMonth(first)) / 7);

  return range(weeks * 7).map((index) => {
    const date = addDays(gridStart, index);
    return { date, inMonth: date.slice(0, 7) === month };
  });
}
