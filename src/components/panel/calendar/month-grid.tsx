"use client";

import { useMemo } from "react";

import { SERVICE_COLORS } from "@/lib/brand";
import {
  appointmentsOn,
  clientById,
  servicesFor,
  utilizationOn,
  type DataState,
} from "@/lib/data";
import { TODAY, timeOf, weekdayDayMonth, weekdayHeaders } from "@/lib/format";
import { useLocale, useT, useTl } from "@/lib/i18n";
import type { Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui";
import { ALL_STAFF, monthCells } from "./calendar-model";

const MAX_PILLS = 3;

export interface MonthGridProps {
  state: DataState;
  tenant: Tenant;
  anchor: string;
  staffFilter: string;
  onPickDay: (isoDate: string) => void;
}

export function MonthGrid({
  state,
  tenant,
  anchor,
  staffFilter,
  onPickDay,
}: MonthGridProps) {
  const t = useT();
  const tl = useTl();
  const locale = useLocale();

  const headers = useMemo(() => weekdayHeaders(locale), [locale]);
  const cells = useMemo(() => monthCells(anchor), [anchor]);

  const days = useMemo(
    () =>
      cells.map((cell) => {
        const all = appointmentsOn(state, tenant.id, cell.date).filter(
          (appointment) =>
            appointment.status !== "cancelled" &&
            (staffFilter === ALL_STAFF || appointment.staffId === staffFilter),
        );
        return {
          ...cell,
          appointments: all,
          utilization: utilizationOn(state, tenant.id, cell.date),
        };
      }),
    [cells, state, tenant.id, staffFilter],
  );

  return (
    <div className="p-3 lg:p-4">
      <div className="grid grid-cols-7 gap-px pb-1">
        {headers.map((label) => (
          <div
            key={label}
            className="px-1 text-center text-[11px] font-medium tracking-wide text-muted uppercase"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-line bg-line">
        {days.map((day) => {
          const overflow = day.appointments.length - MAX_PILLS;
          const isToday = day.date === TODAY;

          return (
            <div
              key={day.date}
              aria-current={isToday ? "date" : undefined}
              className={cn(
                "group relative flex min-h-[86px] flex-col gap-1 bg-white p-1.5 text-left lg:min-h-[128px] lg:p-2",
                "transition-colors duration-150 hover:bg-sand-50",
                "focus-within:ring-2 focus-within:ring-cobalt/30 focus-within:ring-inset",
                !day.inMonth && "bg-sand-50/60 text-sand-400",
              )}
            >
              <span className="flex items-center justify-between">
                <span
                  className={cn(
                    "tabular grid size-6 place-items-center rounded-full text-[12px] font-semibold",
                    isToday
                      ? "bg-cobalt text-white"
                      : day.inMonth
                        ? "text-ink"
                        : "text-sand-400",
                  )}
                >
                  {Number(day.date.slice(8, 10))}
                </span>
              </span>

              <span className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                {day.appointments.slice(0, MAX_PILLS).map((appointment) => {
                  const services = servicesFor(state, appointment.serviceIds);
                  const tone = SERVICE_COLORS[services[0]?.color ?? "sand"];
                  const client = clientById(state, appointment.clientId);
                  return (
                    <span
                      key={appointment.id}
                      title={`${timeOf(appointment.start)} · ${client?.name ?? ""} · ${services
                        .map((service) => tl(service.name))
                        .join(" + ")}`}
                      className={cn(
                        "flex h-4.5 items-center gap-1 rounded-xs px-1 text-[10px] leading-none font-medium",
                        tone.bg,
                        tone.ink,
                      )}
                    >
                      <span className="tabular shrink-0 opacity-70">
                        {timeOf(appointment.start)}
                      </span>
                      <span className="truncate">{client?.name ?? ""}</span>
                    </span>
                  );
                })}

                {overflow > 0 ? (
                  <span className="tabular px-1 text-[10px] font-semibold text-muted">
                    +{overflow}
                  </span>
                ) : null}
              </span>

              {day.inMonth ? (
                <Progress
                  value={day.utilization}
                  size="sm"
                  tone="ink"
                  aria-label={`${t("panel.reports.utilization")} ${day.utilization}%`}
                  className="mt-auto h-1"
                />
              ) : null}

              <button
                type="button"
                onClick={() => onPickDay(day.date)}
                className="absolute inset-0 focus-visible:outline-none"
              >
                <span className="sr-only">
                  {weekdayDayMonth(day.date, locale)}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
