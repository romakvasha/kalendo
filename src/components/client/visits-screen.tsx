"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarDays, CalendarSearch } from "lucide-react";
import { EmptyState, IconButton, Segmented } from "@/components/ui";
import {
  appointmentById,
  getTenant,
  loyaltyOf,
  pastForClient,
  servicesFor,
  staffById,
  useDataState,
  useHydrated,
  useUpcomingForClient,
} from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import type { Appointment, Service, Staff, Tenant } from "@/lib/types";
import { downloadIcs, icsCalendar } from "./helpers";
import { LoyaltyCard } from "./loyalty-card";
import { SectionHeading } from "./primitives";
import { addClientReview } from "./reviews";
import { useClientAccount } from "./session";
import { ScreenSkeleton } from "./skeletons";
import { HistoryRow, VisitCard } from "./visit-card";
import { CancelVisitModal, RescheduleSheet } from "./visit-actions";

interface Resolved {
  appointment: Appointment;
  tenant: Tenant;
  staff?: Staff;
  services: Service[];
}

export function VisitsScreen() {
  const { t, tl } = useI18n();
  const hydrated = useHydrated();
  const account = useClientAccount();
  const state = useDataState();
  const upcoming = useUpcomingForClient(account.id);

  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const resolve = useCallback(
    (appointment: Appointment): Resolved | null => {
      const tenant = getTenant(state, appointment.tenantId);
      if (!tenant) return null;
      return {
        appointment,
        tenant,
        staff: staffById(state, appointment.staffId),
        services: servicesFor(state, appointment.serviceIds),
      };
    },
    [state],
  );

  const upcomingRows = useMemo(
    () => upcoming.map(resolve).filter((item): item is Resolved => item !== null),
    [upcoming, resolve],
  );

  const pastRows = useMemo(
    () =>
      pastForClient(state, account.id)
        .map(resolve)
        .filter((item): item is Resolved => item !== null),
    [state, account.id, resolve],
  );

  const loyalty = useMemo(() => {
    const cards: Array<{ tenant: Tenant; points: number; rewardAt: number }> = [];
    for (const tenant of state.tenants) {
      const info = loyaltyOf(state, account.id, tenant.id);
      if (info && info.points > 0) cards.push({ tenant, ...info });
    }
    return cards[0] ?? null;
  }, [state, account.id]);

  function exportCalendar() {
    if (!upcomingRows.length) return;
    downloadIcs(
      "kalendo-wizyty.ics",
      icsCalendar(
        upcomingRows.map(({ appointment, tenant, services }) => ({
          uid: appointment.id,
          start: appointment.start,
          end: appointment.end,
          summary: `${services.map((service) => tl(service.name)).join(" + ")} · ${tenant.name}`,
          location: `${tenant.address}, ${tenant.city}`,
        })),
      ),
    );
    toast.success(t("visits.addToCalendar"));
  }

  function rate(row: Resolved, value: number) {
    addClientReview({
      tenantId: row.tenant.id,
      clientName: account.name,
      staffId: row.appointment.staffId,
      rating: value,
      text: "",
    });
    setRatings((current) => ({ ...current, [row.appointment.id]: value }));
    toast.success(t("toast.reviewSent"));
  }

  if (!hydrated) return <ScreenSkeleton hero={false} rows={4} />;

  const rescheduling = rescheduleId
    ? (appointmentById(state, rescheduleId) ?? null)
    : null;
  const cancelling = cancelId
    ? (appointmentById(state, cancelId) ?? null)
    : null;

  return (
    <div className="pb-8">
      <div className="pt-safe">
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <h1 className="font-display text-[30px] leading-tight text-ink">
            {t("nav.visits")}
          </h1>
          <IconButton
            variant="secondary"
            aria-label={t("visits.addToCalendar")}
            onClick={exportCalendar}
          >
            <CalendarDays />
          </IconButton>
        </div>
      </div>

      <div className="px-4 pt-4">
        <Segmented
          block
          value={tab}
          onChange={(value) => setTab(value === "history" ? "history" : "upcoming")}
          options={[
            {
              value: "upcoming",
              label: `${t("visits.upcoming")} · ${upcomingRows.length}`,
            },
            { value: "history", label: t("visits.history") },
          ]}
        />
      </div>

      {tab === "upcoming" ? (
        <div className="space-y-6 px-4 pt-5">
          {upcomingRows.length ? (
            <div className="space-y-3">
              {upcomingRows.map((row) => (
                <VisitCard
                  key={row.appointment.id}
                  appointment={row.appointment}
                  tenant={row.tenant}
                  staff={row.staff}
                  services={row.services}
                  onReschedule={() => setRescheduleId(row.appointment.id)}
                  onCancel={() => setCancelId(row.appointment.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="surface-flat"
              icon={CalendarSearch}
              title={t("visits.empty")}
              body={t("visits.emptyBody")}
              action={
                <Link
                  href="/app/search"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-ink px-5 text-[14px] font-medium text-paper shadow-xs transition-colors hover:bg-sand-800"
                >
                  {t("visits.find")}
                </Link>
              }
            />
          )}

          {loyalty ? (
            <LoyaltyCard
              tenant={loyalty.tenant}
              points={loyalty.points}
              rewardAt={loyalty.rewardAt}
            />
          ) : null}

          {pastRows.length ? (
            <section>
              <SectionHeading
                title={t("visits.recent")}
                actionLabel={t("common.all")}
                onAction={() => setTab("history")}
              />
              <div className="mt-3 space-y-2">
                {pastRows.slice(0, 3).map((row) => (
                  <HistoryRow
                    key={row.appointment.id}
                    appointment={row.appointment}
                    tenant={row.tenant}
                    services={row.services}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2 px-4 pt-5">
          {pastRows.length ? (
            pastRows.map((row) => (
              <HistoryRow
                key={row.appointment.id}
                appointment={row.appointment}
                tenant={row.tenant}
                services={row.services}
                rating={ratings[row.appointment.id]}
                onRate={
                  row.appointment.status === "done"
                    ? (value) => rate(row, value)
                    : undefined
                }
              />
            ))
          ) : (
            <EmptyState
              className="surface-flat"
              icon={CalendarSearch}
              title={t("visits.empty")}
              body={t("visits.emptyBody")}
            />
          )}
        </div>
      )}

      <RescheduleSheet
        appointment={rescheduling}
        onClose={() => setRescheduleId(null)}
      />
      <CancelVisitModal
        appointment={cancelling}
        onClose={() => setCancelId(null)}
      />
    </div>
  );
}
