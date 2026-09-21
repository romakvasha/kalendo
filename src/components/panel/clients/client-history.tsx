"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";

import { Badge, Button, Card, CardBody, EmptyState } from "@/components/ui";
import { staffById, useDataState } from "@/lib/data";
import { money, timeOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { groupBy } from "@/lib/utils";
import type { Appointment, Client } from "@/lib/types";

import { hasEarlierVisits, shortDate, statusBadge, visitsOf } from "./helpers";

export interface ClientHistoryProps {
  client: Client;
  onBookAgain: (serviceId: string) => void;
}

export function ClientHistory({ client, onBookAgain }: ClientHistoryProps) {
  const { t, tn, tl, locale } = useI18n();
  const state = useDataState();

  const visits = useMemo(
    () => [...visitsOf(state, client.id)].reverse(),
    [state, client.id],
  );

  const years = useMemo(
    () => [...groupBy(visits, (visit) => visit.start.slice(0, 4)).entries()],
    [visits],
  );

  if (visits.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={CalendarDays}
          title={
            hasEarlierVisits(client)
              ? t("panel.clients.noRecentVisits")
              : t("panel.clients.noVisitsYet")
          }
          body={
            hasEarlierVisits(client)
              ? t("panel.clients.earlierVisits")
              : t("panel.clients.noVisitsBody")
          }
        />
      </Card>
    );
  }

  const serviceNames = (appointment: Appointment) =>
    appointment.serviceIds
      .map((id) => {
        const service = state.services.find((item) => item.id === id);
        return service ? tl(service.name) : id;
      })
      .join(" + ");

  return (
    <div className="flex flex-col gap-5">
      {years.map(([year, group]) => (
        <section key={year} className="flex flex-col gap-2.5">
          <div className="flex items-baseline gap-2">
            <h3 className="tabular font-display text-[20px] leading-none text-ink">
              {year}
            </h3>
            <span className="text-[12px] text-muted">
              {t("panel.clients.visitsCount", {
                count: group.length,
                visits: tn(group.length, "plurals.visits"),
              })}
            </span>
          </div>

          <Card>
            <CardBody className="px-4 py-1 sm:px-5">
              <ul className="divide-y divide-line">
                {group.map((appointment) => {
                  const badge = statusBadge(appointment.status);
                  const staff = staffById(state, appointment.staffId)?.name;

                  return (
                    <li
                      key={appointment.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3.5"
                    >
                      <div className="tabular w-16 shrink-0 text-[13px] text-muted">
                        <p>{shortDate(appointment.start, locale)}</p>
                        <p className="text-[11px] text-sand-400">
                          {timeOf(appointment.start)}
                        </p>
                      </div>

                      {/* A floor width makes the row wrap instead of crushing the service name. */}
                      <div className="min-w-[8rem] flex-1">
                        <p className="truncate text-[14px] text-ink">
                          {serviceNames(appointment)}
                        </p>
                        <p className="truncate text-[12px] text-muted">
                          {staff}
                        </p>
                      </div>

                      <Badge size="sm" tone={badge.tone}>
                        {t(badge.key)}
                      </Badge>

                      <span className="tabular w-20 shrink-0 text-right text-[14px] font-medium text-ink">
                        {money(appointment.total, locale)}
                      </span>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto sm:ml-0"
                        onClick={() =>
                          onBookAgain(appointment.serviceIds[0] ?? "")
                        }
                      >
                        {t("visits.bookAgain")}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        </section>
      ))}
    </div>
  );
}
