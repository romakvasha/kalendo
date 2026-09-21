"use client";

import { Copy } from "lucide-react";

import { Button, Select, Switch } from "@/components/ui";
import { addDays, weekdayDayMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { TIME_OPTIONS, type HoursDraft } from "./draft";

/** 2026-09-21 is a Monday, so weekday 1…7 maps onto that week. */
const MONDAY = "2026-09-21";

function weekdayName(weekday: number, locale: Locale): string {
  // format.ts exposes no bare weekday name; the long form starts with one.
  return weekdayDayMonth(addDays(MONDAY, weekday - 1), locale).split(",")[0];
}

export interface StepHoursProps {
  hours: HoursDraft[];
  onChange: (hours: HoursDraft[]) => void;
}

export function StepHours({ hours, onChange }: StepHoursProps) {
  const { t, locale } = useI18n();

  const patch = (weekday: number, next: Partial<HoursDraft>) =>
    onChange(
      hours.map((day) => (day.weekday === weekday ? { ...day, ...next } : day)),
    );

  const copyToAll = () => {
    const source = hours.find((day) => day.open) ?? hours[0];
    if (!source) return;
    onChange(
      hours.map((day) => ({
        ...day,
        open: true,
        from: source.from,
        to: source.to,
      })),
    );
  };

  const timeOptions = TIME_OPTIONS.map((time) => ({ value: time, label: time }));

  return (
    <div>
      <ul className="flex flex-col gap-2">
        {hours.map((day) => {
          const name = weekdayName(day.weekday, locale);
          return (
            <li
              key={day.weekday}
              className="rounded-lg border border-line bg-white p-3 sm:flex sm:items-center sm:gap-4 sm:py-2.5"
            >
              <div className="flex items-center justify-between gap-3 sm:w-[190px] sm:shrink-0">
                <span className="text-[14px] font-medium text-ink">{name}</span>
                <Switch
                  checked={day.open}
                  onCheckedChange={(checked) => patch(day.weekday, { open: checked })}
                  aria-label={name}
                />
              </div>

              <div className="mt-3 sm:mt-0 sm:flex-1">
                {day.open ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={day.from}
                      onChange={(event) =>
                        patch(day.weekday, { from: event.target.value })
                      }
                      options={timeOptions}
                      aria-label={`${name} — ${t("common.from")}`}
                      className="tabular h-10"
                    />
                    <span aria-hidden className="text-sand-400">
                      –
                    </span>
                    <Select
                      value={day.to}
                      onChange={(event) =>
                        patch(day.weekday, { to: event.target.value })
                      }
                      options={timeOptions}
                      aria-label={`${name} — ${t("common.to")}`}
                      className="tabular h-10"
                    />
                  </div>
                ) : (
                  <p className="text-[13px] text-muted">{t("onboarding.closed")}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Button variant="secondary" className="mt-3" iconLeft={Copy} onClick={copyToAll}>
        {t("onboarding.copyToAll")}
      </Button>
    </div>
  );
}
