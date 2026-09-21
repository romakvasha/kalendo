"use client";

import { useMemo, useState } from "react";

import { BarChart } from "@/components/charts";
import { Card, CardBody, CardHeader, CardTitle, Segmented } from "@/components/ui";
import { useDataState } from "@/lib/data";
import { money, number as formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { bookedAhead, groupByWeek, monthRevenueBars } from "./helpers";

type Grain = "day" | "week";

export interface RevenueCardProps {
  tenantId: string;
  monthIso: string;
  className?: string;
}

export function RevenueCard({ tenantId, monthIso, className }: RevenueCardProps) {
  const { t, locale } = useI18n();
  const state = useDataState();
  const [grain, setGrain] = useState<Grain>("day");

  const days = useMemo(
    () => monthRevenueBars(state, tenantId, monthIso),
    [state, tenantId, monthIso],
  );
  const bars = grain === "week" ? groupByWeek(days, monthIso) : days;
  const ahead = bookedAhead(days);

  const axis = (value: number) =>
    value >= 1000
      ? `${formatNumber(Math.round(value / 100) / 10, locale)} ${t("panel.reports.thousandShort")}`
      : formatNumber(value, locale);

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader
        action={
          <Segmented
            size="sm"
            value={grain}
            onChange={(value) => setGrain(value as Grain)}
            options={[
              { value: "day", label: t("panel.calendar.day") },
              { value: "week", label: t("panel.calendar.week") },
            ]}
          />
        }
      >
        <CardTitle
          as="h2"
          hint={t("panel.dashboard.bookedRest", { amount: money(ahead, locale) })}
        >
          {`${t("panel.reports.dailyRevenue")}, zł`}
        </CardTitle>
      </CardHeader>

      <CardBody className="pt-3">
        <BarChart
          data={bars}
          height={220}
          tone="brand"
          format={axis}
          labelEvery={grain === "week" ? 1 : 7}
          primaryLabel={t("panel.reports.completed")}
          secondaryLabel={t("panel.reports.booked")}
          highlightLabel={t("common.today")}
          ariaLabel={t("panel.reports.dailyRevenue")}
        />
      </CardBody>
    </Card>
  );
}
