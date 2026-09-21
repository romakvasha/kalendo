import { minutesOf } from "./format";
import { clamp } from "./utils";

/* ---------------------------------------------------------------- */
/* Grid constants                                                    */
/* ---------------------------------------------------------------- */

/** Pixels per hour on the day grid. */
export const HOUR_HEIGHT = 96;

export const DAY_START_MIN = 7 * 60;
export const DAY_END_MIN = 20 * 60;

/** Even a 5-minute block stays readable. */
export const MIN_BLOCK_HEIGHT = 24;

/** Zero-length items still occupy a sliver of a column. */
export const MIN_BLOCK_MINUTES = 10;

const PX_PER_MIN = HOUR_HEIGHT / 60;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/* ---------------------------------------------------------------- */
/* Positioning                                                       */
/* ---------------------------------------------------------------- */

export function yFor(minutes: number, startMin: number = DAY_START_MIN): number {
  if (!Number.isFinite(minutes)) return 0;
  return round((minutes - startMin) * PX_PER_MIN);
}

export function heightFor(durationMin: number): number {
  if (!Number.isFinite(durationMin)) return MIN_BLOCK_HEIGHT;
  return Math.max(round(durationMin * PX_PER_MIN), MIN_BLOCK_HEIGHT);
}

/** Total pixel height of the day column. */
export function dayHeight(
  startMin: number = DAY_START_MIN,
  endMin: number = DAY_END_MIN,
): number {
  return Math.max(0, round((endMin - startMin) * PX_PER_MIN));
}

/** Inverse of `yFor` — used when turning a click on the grid into a time. */
export function minutesFromY(y: number, startMin: number = DAY_START_MIN): number {
  return startMin + y / PX_PER_MIN;
}

export function snapMinutes(minutes: number, step = 15): number {
  return Math.round(minutes / step) * step;
}

/** 450 -> "07:30" */
export function timeLabel(minutes: number): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export interface HourLabel {
  minutes: number;
  label: string;
}

/** One entry per hour row: 07:00 … 19:00 for a 07:00–20:00 day. */
export function hourLabels(
  startMin: number = DAY_START_MIN,
  endMin: number = DAY_END_MIN,
): HourLabel[] {
  const out: HourLabel[] = [];
  for (let minutes = Math.ceil(startMin / 60) * 60; minutes < endMin; minutes += 60) {
    out.push({ minutes, label: timeLabel(minutes) });
  }
  return out;
}

/** Pixel offset of the "now" indicator, or null when it is off the grid. */
export function nowLine(
  nowISO: string,
  startMin: number = DAY_START_MIN,
  endMin: number = DAY_END_MIN,
): number | null {
  const minutes = minutesOf(nowISO);
  if (!Number.isFinite(minutes) || minutes < startMin || minutes > endMin) return null;
  return yFor(minutes, startMin);
}

/* ---------------------------------------------------------------- */
/* Overlap layout                                                    */
/* ---------------------------------------------------------------- */

/** Anything with local wall-clock ISO bounds — Appointment and CalendarBlock both fit. */
export interface TimeRange {
  start: string;
  end: string;
}

export interface LaidOut<T> {
  item: T;
  /** 0-based column inside its overlap cluster. */
  column: number;
  /** Columns the cluster needs — width is 100 / columns percent. */
  columns: number;
  top: number;
  height: number;
}

interface Placed<T> {
  item: T;
  index: number;
  from: number;
  to: number;
  column: number;
}

function toPlaced<T>(
  items: readonly T[],
  getRange: (item: T) => TimeRange,
  startMin: number,
  endMin: number,
): Placed<T>[] {
  return items.map((item, index) => {
    const range = getRange(item);
    const rawFrom = minutesOf(range.start);
    const rawTo = minutesOf(range.end);
    const from = clamp(Number.isFinite(rawFrom) ? rawFrom : startMin, startMin, endMin);
    const to = clamp(Number.isFinite(rawTo) ? rawTo : from, from, endMin);
    return { item, index, from, to, column: 0 };
  });
}

/**
 * Standard calendar overlap layout: cluster mutually overlapping items, give
 * each the first free column in its cluster, and report the cluster width.
 * Returned in start order so later blocks paint above earlier ones.
 */
export function layoutDay<T>(
  items: readonly T[],
  getRange: (item: T) => TimeRange,
  startMin: number = DAY_START_MIN,
  endMin: number = DAY_END_MIN,
): LaidOut<T>[] {
  const placed = toPlaced(items, getRange, startMin, endMin);

  placed.sort(
    (a, b) =>
      a.from - b.from || b.to - b.from - (a.to - a.from) || a.index - b.index,
  );

  const result: LaidOut<T>[] = [];
  const columnEnds: number[] = [];
  let cluster: Placed<T>[] = [];
  let clusterEnd = Number.NEGATIVE_INFINITY;

  const flush = () => {
    if (cluster.length === 0) return;
    const columns = Math.max(columnEnds.length, 1);
    for (const entry of cluster) {
      result.push({
        item: entry.item,
        column: entry.column,
        columns,
        top: yFor(entry.from, startMin),
        height: heightFor(Math.max(entry.to - entry.from, 0)),
      });
    }
    cluster = [];
    columnEnds.length = 0;
    clusterEnd = Number.NEGATIVE_INFINITY;
  };

  for (const entry of placed) {
    const occupiedEnd = Math.max(entry.to, entry.from + MIN_BLOCK_MINUTES);
    if (entry.from >= clusterEnd) flush();

    let column = columnEnds.findIndex((end) => end <= entry.from);
    if (column === -1) {
      columnEnds.push(occupiedEnd);
      column = columnEnds.length - 1;
    } else {
      columnEnds[column] = occupiedEnd;
    }

    entry.column = column;
    cluster.push(entry);
    clusterEnd = Math.max(clusterEnd, occupiedEnd);
  }
  flush();

  return result;
}

/* ---------------------------------------------------------------- */
/* Free windows                                                      */
/* ---------------------------------------------------------------- */

export interface FreeGap {
  startMin: number;
  minutes: number;
}

/** The empty windows between blocks — rendered as "+ Wolne · 60 min". */
export function freeGaps<T>(
  items: readonly T[],
  getRange: (item: T) => TimeRange,
  startMin: number = DAY_START_MIN,
  endMin: number = DAY_END_MIN,
  minMinutes = 15,
): FreeGap[] {
  const busy = toPlaced(items, getRange, startMin, endMin)
    .filter((entry) => entry.to > entry.from)
    .sort((a, b) => a.from - b.from);

  const gaps: FreeGap[] = [];
  let cursor = startMin;

  for (const block of busy) {
    if (block.from - cursor >= minMinutes) {
      gaps.push({ startMin: cursor, minutes: block.from - cursor });
    }
    cursor = Math.max(cursor, block.to);
  }
  if (endMin - cursor >= minMinutes) {
    gaps.push({ startMin: cursor, minutes: endMin - cursor });
  }

  return gaps;
}

export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return minutesOf(a.start) < minutesOf(b.end) && minutesOf(b.start) < minutesOf(a.end);
}
