"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Star } from "lucide-react";

import {
  Avatar,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Progress,
} from "@/components/ui";
import { staffById, staffPerformance, useDataState } from "@/lib/data";
import { money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import type { Bounds } from "./helpers";
import { decimal, percent } from "./helpers";

export interface TeamCardProps {
  tenantId: string;
  bounds: Bounds;
  className?: string;
}

const HEAD_CELL = "pb-2 text-[12px] font-medium text-muted";

export function TeamCard({ tenantId, bounds, className }: TeamCardProps) {
  const { t, locale } = useI18n();
  const state = useDataState();

  const rows = useMemo(
    () => staffPerformance(state, tenantId, bounds.from, bounds.to),
    [state, tenantId, bounds.from, bounds.to],
  );

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader
        action={
          <Link
            href="/panel/team"
            className="rounded-sm text-[13px] font-medium text-cobalt hover:underline"
          >
            {t("panel.dashboard.workSchedule")}
          </Link>
        }
      >
        <CardTitle as="h2">{t("panel.reports.team")}</CardTitle>
      </CardHeader>

      <CardBody className="overflow-x-auto pt-3">
        <table className="w-full min-w-[26rem] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className={HEAD_CELL}>
                {t("common.staff")}
              </th>
              <th scope="col" className={cn(HEAD_CELL, "text-right")}>
                {t("panel.reports.visits")}
              </th>
              <th scope="col" className={cn(HEAD_CELL, "text-right")}>
                {t("panel.reports.revenue")}
              </th>
              <th scope="col" className={cn(HEAD_CELL, "pl-4")}>
                {t("panel.reports.utilization")}
              </th>
              <th scope="col" className={cn(HEAD_CELL, "text-right")}>
                {t("panel.team.rating")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const member = staffById(state, row.staffId);
              return (
                <tr key={row.staffId} className="border-b border-line last:border-0">
                  <td className="py-3 pr-3">
                    <span className="flex items-center gap-2.5">
                      <Avatar
                        name={row.name}
                        color={member?.avatarColor}
                        size="sm"
                      />
                      <span className="truncate font-medium text-ink">
                        {row.name}
                      </span>
                    </span>
                  </td>
                  <td className="tabular py-3 text-right text-ink">
                    {row.appointments}
                  </td>
                  <td className="tabular py-3 text-right whitespace-nowrap text-ink">
                    {money(row.revenue, locale)}
                  </td>
                  <td className="py-3 pl-4">
                    <span className="flex items-center gap-2">
                      <Progress
                        value={row.utilization}
                        tone="brand"
                        className="w-12 shrink-0"
                      />
                      <span className="tabular text-ink">
                        {percent(row.utilization, locale)}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="tabular inline-flex items-center gap-1 font-medium text-ink">
                      <Star
                        className="size-3.5 text-warn-ink"
                        fill="currentColor"
                        strokeWidth={0}
                        aria-hidden
                      />
                      {decimal(row.rating, locale)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
