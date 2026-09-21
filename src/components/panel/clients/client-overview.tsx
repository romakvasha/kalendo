"use client";

import { useMemo } from "react";
import { CalendarDays, Plus, TriangleAlert } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Stat,
} from "@/components/ui";
import { staffById, useDataState } from "@/lib/data";
import {
  money,
  number as formatNumber,
  timeOf,
  weekdayDayMonth,
} from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Appointment, Client } from "@/lib/types";

import {
  nextVisitOf,
  pastVisitsOf,
  paymentBadge,
  shortDate,
} from "./helpers";

const RECENT_COUNT = 3;

export interface ClientOverviewProps {
  client: Client;
  onBook: () => void;
  onShowHistory: () => void;
  onEditNotes: () => void;
}

export function ClientOverview({
  client,
  onBook,
  onShowHistory,
  onEditNotes,
}: ClientOverviewProps) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();

  const next = useMemo(() => nextVisitOf(state, client.id), [state, client.id]);
  const past = useMemo(
    () => pastVisitsOf(state, client.id),
    [state, client.id],
  );
  const recent = past.slice(0, RECENT_COUNT);

  const serviceNames = (appointment: Appointment) =>
    appointment.serviceIds
      .map((id) => {
        const service = state.services.find((item) => item.id === id);
        return service ? tl(service.name) : id;
      })
      .join(" + ");

  const staffName = (id: string) => staffById(state, id)?.name ?? "";

  const noteStaff =
    (client.preferredStaffId ? staffName(client.preferredStaffId) : "") ||
    (past[0] ? staffName(past[0].staffId) : "");
  const noteDate = shortDate(past[0]?.start ?? client.since, locale);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2.5 lg:hidden">
        <StatTile
          label={t("panel.clients.visits")}
          value={formatNumber(client.visitCount, locale)}
        />
        <StatTile
          label={t("panel.clients.spent")}
          value={money(client.totalSpent, locale)}
        />
        <StatTile
          label={t("panel.clients.noShows")}
          value={formatNumber(client.noShows, locale)}
          alarm={client.noShows > 0}
        />
      </div>

      {/* Notes */}
      <section className="rounded-xl border border-warn-ink/15 bg-warn p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[12px] font-medium text-warn-ink">
            {client.notes
              ? t("panel.clients.notesBy", {
                  staff: noteStaff || t("common.staff"),
                  date: noteDate,
                })
              : t("panel.clients.notes")}
          </h3>
          <button
            type="button"
            onClick={onEditNotes}
            className="shrink-0 rounded-xs text-[12px] font-medium text-warn-ink underline underline-offset-2 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25"
          >
            {client.notes ? t("common.edit") : t("panel.clients.addNote")}
          </button>
        </div>

        {client.notes ? (
          <p className="mt-2 text-[14px] leading-5 text-ink">
            {tl(client.notes)}
          </p>
        ) : (
          <p className="mt-2 text-[13px] leading-5 text-warn-ink/80">
            {t("panel.clients.notesEmpty")}
          </p>
        )}

        {client.alert ? (
          <p className="mt-3 flex items-start gap-2 border-t border-warn-ink/15 pt-3 text-[13px] leading-5 font-medium text-danger">
            <TriangleAlert aria-hidden className="mt-px size-4 shrink-0" />
            {tl(client.alert)}
          </p>
        ) : null}
      </section>

      {/* Next visit */}
      <Card>
        <CardHeader>
          <CardTitle>{t("panel.clients.nextVisit")}</CardTitle>
        </CardHeader>
        <CardBody className="pt-3">
          {next ? (
            <NextVisitRow
              appointment={next}
              services={serviceNames(next)}
              staff={staffName(next.staffId)}
            />
          ) : (
            <EmptyState
              compact
              icon={CalendarDays}
              title={t("panel.clients.noNextVisit")}
              action={
                <Button size="sm" iconLeft={Plus} onClick={onBook}>
                  {t("panel.clients.book")}
                </Button>
              }
            />
          )}
        </CardBody>
      </Card>

      {/* Recent visits */}
      <Card>
        <CardHeader
          action={
            past.length > RECENT_COUNT ? (
              <Button size="sm" variant="ghost" onClick={onShowHistory}>
                {t("common.all")}
              </Button>
            ) : null
          }
        >
          <CardTitle>{t("panel.clients.lastVisits")}</CardTitle>
        </CardHeader>
        <CardBody className="pt-1">
          {recent.length === 0 ? (
            <EmptyState compact title={t("panel.clients.noVisitsYet")} />
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((appointment) => (
                <li
                  key={appointment.id}
                  className="flex items-center gap-3 py-3 first:pt-1"
                >
                  <span className="tabular w-16 shrink-0 text-[13px] text-muted">
                    {shortDate(appointment.start, locale)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-ink">
                      {serviceNames(appointment)}
                    </p>
                    <p className="truncate text-[12px] text-muted">
                      {staffName(appointment.staffId)}
                    </p>
                  </div>

                  <span className="tabular shrink-0 text-[14px] font-medium text-ink">
                    {money(appointment.total, locale)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function NextVisitRow({
  appointment,
  services,
  staff,
}: {
  appointment: Appointment;
  services: string;
  staff: string;
}) {
  const { t, locale } = useI18n();
  const badge = paymentBadge(appointment);

  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-ink">
        <CalendarDays aria-hidden className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-ink">
          {weekdayDayMonth(appointment.start, locale)}
          {" · "}
          <span className="tabular">{timeOf(appointment.start)}</span>
        </p>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          {services}
          {staff ? ` · ${staff}` : ""}
        </p>
      </div>

      {badge ? (
        <Badge size="sm" tone={badge.tone}>
          {t(badge.key)}
        </Badge>
      ) : null}
    </div>
  );
}

export function StatTile({
  label,
  value,
  alarm = false,
  className,
}: {
  label: string;
  value: string;
  alarm?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("surface-flat px-3 py-3.5", className)}>
      <Stat
        tone="muted"
        label={label}
        value={
          <span
            className={cn(
              "text-[19px] sm:text-[22px]",
              alarm && "text-danger",
            )}
          >
            {value}
          </span>
        }
      />
    </div>
  );
}
