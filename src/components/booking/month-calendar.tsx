"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { IconButton, Skeleton } from "@/components/ui";
import { useHydrated } from "@/lib/data";
import { TODAY, addDays, monthYear, startOfMonth, weekdayHeaders, weekdayShort } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  monthGrid,
  toDayAvailability,
  useDayAvailability,
  weekStrip,
} from "./use-availability";

/* ------------------------------------------------------------------ */
/* Month grid — the desktop booking rail                               */
/* ------------------------------------------------------------------ */

export interface MonthCalendarProps {
  tenantId: string;
  serviceIds: string[];
  staffId: string | null;
  month: string;
  onMonthChange: (monthISO: string) => void;
  value: string | null;
  onChange: (isoDate: string) => void;
}

export function MonthCalendar({
  tenantId,
  serviceIds,
  staffId,
  month,
  onMonthChange,
  value,
  onChange,
}: MonthCalendarProps) {
  const { t, locale } = useI18n();
  const hydrated = useHydrated();
  const cells = useMemo(() => monthGrid(month), [month]);
  const freeByDate = useDayAvailability(tenantId, serviceIds, staffId, cells);
  const headers = useMemo(() => weekdayHeaders(locale), [locale]);

  const prevMonth = startOfMonth(addDays(startOfMonth(month), -1));
  const nextMonth = startOfMonth(addDays(startOfMonth(month), 40));
  const atStart = prevMonth < startOfMonth(TODAY);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-[19px] leading-6 text-ink">
          {monthYear(month, locale)}
        </p>
        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            aria-label={t("a11y.prevMonth")}
            disabled={atStart}
            onClick={() => onMonthChange(prevMonth)}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            size="sm"
            aria-label={t("a11y.nextMonth")}
            onClick={() => onMonthChange(nextMonth)}
          >
            <ChevronRight />
          </IconButton>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {headers.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="pb-1 text-[11px] font-medium text-sand-500"
          >
            {label}
          </span>
        ))}

        {cells.map((date) => {
          const day = toDayAvailability(date, month, freeByDate.get(date) ?? 0);
          const disabled = !day.inMonth || day.past || (hydrated && day.free === 0);
          const selected = value === date;

          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={date}
              onClick={() => onChange(date)}
              className={cn(
                "relative grid h-9 place-items-center rounded-md text-[13px] transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
                !day.inMonth && "invisible",
                selected
                  ? "bg-brand font-semibold text-brand-fg"
                  : disabled
                    ? "text-sand-400"
                    : "text-ink hover:bg-sand-100",
                date === TODAY && !selected && "font-semibold",
              )}
            >
              <span className="tabular">{day.day}</span>
              {hydrated && !selected && day.free > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    day.scarce ? "bg-warn-ink/60" : "bg-brand",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {!hydrated && <Skeleton className="mt-2 h-3 w-32" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Week strip — the mobile booking flow                                */
/* ------------------------------------------------------------------ */

export interface WeekStripProps {
  tenantId: string;
  serviceIds: string[];
  staffId: string | null;
  anchor: string;
  onAnchorChange: (isoDate: string) => void;
  value: string | null;
  onChange: (isoDate: string) => void;
}

export function WeekStrip({
  tenantId,
  serviceIds,
  staffId,
  anchor,
  onAnchorChange,
  value,
  onChange,
}: WeekStripProps) {
  const { t, locale } = useI18n();
  const hydrated = useHydrated();
  const days = useMemo(() => weekStrip(anchor), [anchor]);
  const freeByDate = useDayAvailability(tenantId, serviceIds, staffId, days);
  const atStart = addDays(anchor, -7) < TODAY;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[19px] leading-6 text-ink">
          {monthYear(anchor, locale)}
        </p>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-3 text-[11px] text-muted sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-1.5 rounded-full bg-brand" />
              {t("company.manySlots")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-1.5 rounded-full bg-warn-ink/60" />
              {t("company.lastSlots")}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <IconButton
              size="sm"
              aria-label={t("a11y.prevDay")}
              disabled={atStart}
              onClick={() => onAnchorChange(addDays(anchor, -7))}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              size="sm"
              aria-label={t("a11y.nextDay")}
              onClick={() => onAnchorChange(addDays(anchor, 7))}
            >
              <ChevronRight />
            </IconButton>
          </div>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {days.map((date) => {
          const day = toDayAvailability(date, date, freeByDate.get(date) ?? 0);
          const disabled = day.past || (hydrated && day.free === 0);
          const selected = value === date;

          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={date}
              onClick={() => onChange(date)}
              className={cn(
                "flex h-[70px] w-[52px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
                selected
                  ? "border-brand bg-brand text-brand-fg"
                  : disabled
                    ? "border-line bg-sand-50 text-sand-400"
                    : "border-line bg-card text-ink hover:border-line-strong",
              )}
            >
              <span className="text-[11px] opacity-80">
                {weekdayShort(date, locale)}
              </span>
              <span className="tabular text-[17px] leading-6 font-medium">
                {Number(date.slice(8, 10))}
              </span>
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  !hydrated || day.free === 0
                    ? "bg-transparent"
                    : selected
                      ? "bg-brand-fg/70"
                      : day.scarce
                        ? "bg-warn-ink/60"
                        : "bg-brand",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
