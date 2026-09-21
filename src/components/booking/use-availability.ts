"use client";

import { useMemo } from "react";

import { slotsFor, useDataState } from "@/lib/data";
import { TODAY, addDays, daysInMonth, startOfMonth, weekdayOf } from "@/lib/format";

export interface DayAvailability {
  /** ISO date, "2026-09-24". */
  date: string;
  day: number;
  /** Belongs to the month being shown rather than a padding cell. */
  inMonth: boolean;
  past: boolean;
  free: number;
  /** Only a couple of windows left. */
  scarce: boolean;
}

/** Availability for a list of days, computed against real bookings. */
export function useDayAvailability(
  tenantId: string,
  serviceIds: string[],
  staffId: string | null,
  dates: string[],
): Map<string, number> {
  const state = useDataState();
  const serviceKey = serviceIds.join(",");
  const dateKey = dates.join(",");

  return useMemo(() => {
    const ids = serviceKey ? serviceKey.split(",") : [];
    const out = new Map<string, number>();
    for (const date of dateKey ? dateKey.split(",") : []) {
      const free = slotsFor(state, tenantId, ids, staffId, date).filter(
        (slot) => slot.available,
      ).length;
      out.set(date, free);
    }
    return out;
  }, [state, tenantId, serviceKey, staffId, dateKey]);
}

/** Six-week grid for `monthISO`, Monday first, with padding cells. */
export function monthGrid(monthISO: string): string[] {
  const first = startOfMonth(monthISO);
  const lead = weekdayOf(first) - 1;
  const total = daysInMonth(first);
  const cells = Math.ceil((lead + total) / 7) * 7;
  return Array.from({ length: cells }, (_, index) => addDays(first, index - lead));
}

export function weekStrip(anchorISO: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(anchorISO, index));
}

export function toDayAvailability(
  date: string,
  monthISO: string,
  free: number,
): DayAvailability {
  return {
    date,
    day: Number(date.slice(8, 10)),
    inMonth: date.slice(0, 7) === monthISO.slice(0, 7),
    past: date < TODAY,
    free,
    scarce: free > 0 && free <= 3,
  };
}
