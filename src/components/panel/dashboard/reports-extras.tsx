"use client";

import { useMemo } from "react";

import { ShareBars } from "@/components/charts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { useDataState } from "@/lib/data";
import { money, weekdayHeaders } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn, range } from "@/lib/utils";

import {
  HEAT_HOURS,
  HEAT_START_HOUR,
  hourHeat,
  servicesByRevenue,
  type Bounds,
} from "./helpers";

/* ------------------------------------------------------------------ */

export interface ServiceRankingProps {
  tenantId: string;
  bounds: Bounds;
  limit?: number;
  className?: string;
}

export function ServiceRanking({
  tenantId,
  bounds,
  limit = 6,
  className,
}: ServiceRankingProps) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();

  const ranked = useMemo(
    () => servicesByRevenue(state, tenantId, bounds).slice(0, limit),
    [state, tenantId, bounds, limit],
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle as="h2">{t("panel.reports.topServices")}</CardTitle>
      </CardHeader>
      <CardBody className="pt-4">
        <ShareBars
          items={ranked.map((item) => ({
            label: tl(item.name),
            value: item.revenue,
          }))}
          format={(value) => money(value, locale)}
        />
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

const LEVELS = [
  "bg-sand-100",
  "bg-brand/20",
  "bg-brand/40",
  "bg-brand/65",
  "bg-brand/90",
];

function levelOf(value: number, peak: number): number {
  if (!peak || value <= 0) return 0;
  return Math.min(4, Math.ceil((value / peak) * 4));
}

export interface HourHeatmapProps {
  tenantId: string;
  bounds: Bounds;
  className?: string;
}

export function HourHeatmap({ tenantId, bounds, className }: HourHeatmapProps) {
  const { t, locale } = useI18n();
  const state = useDataState();

  const grid = useMemo(
    () => hourHeat(state, tenantId, bounds),
    [state, tenantId, bounds],
  );
  const peak = grid.reduce(
    (acc, column) => column.reduce((max, value) => Math.max(max, value), acc),
    0,
  );
  const days = weekdayHeaders(locale);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle as="h2">{t("panel.reports.hourHeatmap")}</CardTitle>
      </CardHeader>

      <CardBody className="pt-3">
        <table className="w-full border-separate border-spacing-1 text-[11px]">
          <caption className="sr-only">{t("panel.reports.hourHeatmap")}</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">{t("common.time")}</span>
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  scope="col"
                  className="pb-1 font-medium text-muted"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {range(HEAT_HOURS).map((hour) => {
              const label = `${`${HEAT_START_HOUR + hour}`.padStart(2, "0")}:00`;
              return (
                <tr key={label}>
                  <th
                    scope="row"
                    className="tabular w-10 pr-1 text-right font-normal text-muted"
                  >
                    {label}
                  </th>
                  {days.map((day, index) => {
                    const value = grid[index][hour];
                    const level = levelOf(value, peak);
                    return (
                      <td key={day} className="p-0">
                        <span
                          title={`${day} ${label} · ${Math.round(value)} ${t("common.min")}`}
                          className={cn(
                            "block h-5 w-full rounded-xs",
                            LEVELS[level],
                          )}
                        >
                          <span className="sr-only">
                            {`${day} ${label} · ${Math.round(value)} ${t("common.min")}`}
                          </span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-muted">
          <span>{t("common.less")}</span>
          {LEVELS.map((level) => (
            <span
              key={level}
              aria-hidden
              className={cn("size-3 rounded-xs", level)}
            />
          ))}
          <span>{t("common.more")}</span>
        </div>
      </CardBody>
    </Card>
  );
}
