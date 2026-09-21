"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarCheck } from "lucide-react";

import { Badge, Card, EmptyState } from "@/components/ui";
import {
  NOW_TIME,
  clientById,
  servicesFor,
  staffById,
  useAppointmentsOn,
  useDataState,
} from "@/lib/data";
import { TODAY, timeOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/components/ui";
import type { Appointment } from "@/lib/types";

import { SERVICE_DOT } from "./helpers";

interface StatusBadge {
  tone: BadgeTone;
  key: string;
}

function badgeFor(appointment: Appointment): StatusBadge {
  if (appointment.status === "pending") {
    return { tone: "warn", key: "panel.dashboard.waiting" };
  }
  if (appointment.payment === "paid") {
    return { tone: "success", key: "panel.dashboard.paidBadge" };
  }
  if (appointment.payment === "deposit") {
    return { tone: "info", key: "panel.calendar.deposit" };
  }
  return { tone: "warn", key: "visits.noDeposit" };
}

export interface NextVisitsProps {
  tenantId: string;
  limit?: number;
  className?: string;
}

export function NextVisits({ tenantId, limit = 4, className }: NextVisitsProps) {
  const { t, tl } = useI18n();
  const state = useDataState();
  const today = useAppointmentsOn(tenantId, TODAY);

  const upcoming = useMemo(
    () =>
      today
        .filter(
          (item) =>
            item.status !== "cancelled" &&
            item.status !== "no-show" &&
            timeOf(item.start) >= NOW_TIME,
        )
        .slice(0, limit),
    [today, limit],
  );

  return (
    <section className={className}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-semibold text-ink">
          {t("panel.dashboard.nextVisits")}
        </h2>
        <Link
          href="/panel/calendar"
          className="rounded-sm text-[14px] font-medium text-cobalt hover:underline"
        >
          {t("nav.calendar")}
        </Link>
      </div>

      <Card flat className="overflow-hidden">
        {upcoming.length === 0 ? (
          <EmptyState
            compact
            icon={CalendarCheck}
            title={t("panel.dashboard.noVisits")}
          />
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.map((appointment) => {
              const client = clientById(state, appointment.clientId);
              const staff = staffById(state, appointment.staffId);
              const services = servicesFor(state, appointment.serviceIds);
              const badge = badgeFor(appointment);
              const dot = services[0]
                ? SERVICE_DOT[services[0].color]
                : "bg-sand-400";

              return (
                <li
                  key={appointment.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <span className="tabular w-11 shrink-0 text-[15px] font-medium text-ink">
                    {timeOf(appointment.start)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={cn("size-2 shrink-0 rounded-full", dot)}
                      />
                      <span className="truncate text-[15px] font-medium text-ink">
                        {client?.name ?? t("common.client")}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] leading-5 text-muted">
                      {services.map((service) => tl(service.name)).join(" + ")}
                      {staff ? ` · ${staff.name}` : ""}
                    </span>
                  </span>

                  <Badge tone={badge.tone} size="sm" className="shrink-0">
                    {t(badge.key)}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}
