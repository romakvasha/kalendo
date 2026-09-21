"use client";

import { useMemo } from "react";

import { ShareBars } from "@/components/charts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { sourceBreakdown, useDataState } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { sum } from "@/lib/utils";
import type { BookingSource } from "@/lib/types";

const OFFLINE: (BookingSource | "widget")[] = ["phone", "walk-in"];

function sourceKey(source: BookingSource | "widget"): string {
  return source === "walk-in" ? "walkIn" : source;
}

export interface SourcesCardProps {
  tenantId: string;
  className?: string;
}

export function SourcesCard({ tenantId, className }: SourcesCardProps) {
  const { t } = useI18n();
  const state = useDataState();

  const breakdown = useMemo(
    () => sourceBreakdown(state, tenantId),
    [state, tenantId],
  );
  const online = sum(
    breakdown
      .filter((item) => !OFFLINE.includes(item.source))
      .map((item) => item.share),
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle
          as="h2"
          hint={t("panel.dashboard.onlineShare", { percent: online })}
        >
          {t("panel.reports.sources")}
        </CardTitle>
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
  );
}
