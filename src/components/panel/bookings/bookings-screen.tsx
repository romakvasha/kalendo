"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Inbox, Plus } from "lucide-react";

import { usePanelSession } from "@/components/layout";
import { BookVisitDialog } from "@/components/panel/clients/book-visit-dialog";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Segmented,
  Skeleton,
} from "@/components/ui";
import {
  appointmentsOn,
  dayRevenue,
  pendingBookings,
  roomsOf,
  useDataState,
  useHydrated,
} from "@/lib/data";
import { TODAY, money, weekdayDayMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn, groupBy, range } from "@/lib/utils";
import type { Tenant } from "@/lib/types";

import { BoardRow } from "./board-row";
import { PendingCard } from "./pending-card";
import {
  BOOKINGS_VIEWS,
  BOOKINGS_VIEW_KEYS,
  boardAppointments,
  dayChip,
  isBookingsView,
  type BookingsView,
} from "./helpers";

const ALL_ROOMS = "all";

export function BookingsScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <BookingsSkeleton />;
  return <Bookings tenant={tenant} />;
}

function Bookings({ tenant }: { tenant: Tenant }) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();

  const [view, setView] = useState<BookingsView>("pending");
  const [room, setRoom] = useState(ALL_ROOMS);
  const [bookOpen, setBookOpen] = useState(false);

  const pending = useMemo(
    () => pendingBookings(state, tenant.id),
    [state, tenant.id],
  );
  const rooms = useMemo(() => roomsOf(state, tenant.id), [state, tenant.id]);

  const today = useMemo(
    () => boardAppointments(appointmentsOn(state, tenant.id, TODAY)),
    [state, tenant.id],
  );
  const board = useMemo(
    () =>
      room === ALL_ROOMS
        ? today
        : today.filter((appointment) => appointment.roomId === room),
    [today, room],
  );

  const everything = useMemo(
    () =>
      state.appointments
        .filter((appointment) => appointment.tenantId === tenant.id)
        .sort((a, b) => b.start.localeCompare(a.start)),
    [state.appointments, tenant.id],
  );
  const byDay = useMemo(
    () => [...groupBy(everything, (item) => item.start.slice(0, 10)).entries()],
    [everything],
  );

  const revenue = useMemo(
    () => dayRevenue(state, tenant.id, TODAY),
    [state, tenant.id],
  );

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[28px] leading-[1.08] text-ink sm:text-[32px] lg:text-[38px]">
            {t("panel.bookings.onlineTitle")}
          </h1>
          {pending.length > 0 && (
            <Badge tone="warn">{pending.length}</Badge>
          )}
        </div>

        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Segmented
            value={view}
            onChange={(next) => {
              if (isBookingsView(next)) setView(next);
            }}
            options={BOOKINGS_VIEWS.map((key) => ({
              value: key,
              label: t(BOOKINGS_VIEW_KEYS[key]),
            }))}
          />
        </div>
      </header>

      {/* The reference's compact day summary — phone only. */}
      <section className="lg:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-muted">
            {weekdayDayMonth(TODAY, locale)}
          </span>
          <span className="text-[13px] text-muted">
            {`${t("panel.reports.revenue")} / `}
            <span className="tabular font-medium text-ink">
              {money(revenue, locale)}
            </span>
          </span>
        </div>
        <p className="font-display mt-1 text-[24px] leading-tight text-ink">
          {t("panel.bookings.visitsToday", { count: today.length })}
        </p>
      </section>

      {view === "pending" && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {pending.length === 0 ? (
            <Card className="lg:col-span-2">
              <EmptyState
                icon={Inbox}
                title={t("panel.bookings.empty")}
                body={t("panel.bookings.emptyBody")}
              />
            </Card>
          ) : (
            pending.map((appointment, position) => (
              <PendingCard
                key={appointment.id}
                appointment={appointment}
                tenant={tenant}
                index={position + 1}
                total={pending.length}
              />
            ))
          )}
        </div>
      )}

      {view === "today" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-[13px] font-medium text-muted">
              {t("panel.bookings.stations")}
            </h2>
            <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <Segmented
                size="sm"
                value={room}
                onChange={setRoom}
                options={[
                  { value: ALL_ROOMS, label: t("common.all") },
                  ...rooms.map((item) => ({
                    value: item.id,
                    label: tl(item.name),
                  })),
                ]}
              />
            </div>
          </div>

          {board.length === 0 ? (
            <Card>
              <EmptyState
                icon={CalendarCheck}
                title={t("panel.calendar.emptyDay")}
              />
            </Card>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {board.map((appointment) => (
                <BoardRow
                  key={appointment.id}
                  appointment={appointment}
                  tenant={tenant}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {view === "all" && (
        <div className="flex flex-col gap-5">
          {byDay.length === 0 ? (
            <Card>
              <EmptyState
                icon={CalendarCheck}
                title={t("panel.bookings.empty")}
                body={t("panel.bookings.emptyBody")}
              />
            </Card>
          ) : (
            byDay.map(([date, group]) => (
              <section key={date} className="flex flex-col gap-2.5">
                <h2
                  className={cn(
                    "text-[13px] font-medium",
                    date === TODAY ? "text-ink" : "text-muted",
                  )}
                >
                  {date === TODAY
                    ? t("common.today")
                    : dayChip(date, locale)}
                </h2>
                <ul className="flex flex-col gap-2.5">
                  {group.map((appointment) => (
                    <BoardRow
                      key={appointment.id}
                      appointment={appointment}
                      tenant={tenant}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      )}

      <Button
        aria-label={t("panel.dashboard.newVisit")}
        onClick={() => setBookOpen(true)}
        className="mb-safe fixed right-4 bottom-20 z-40 size-14 rounded-full p-0 shadow-lg lg:hidden"
      >
        <Plus className="size-6" />
      </Button>

      {bookOpen && (
        <BookVisitDialog
          tenantId={tenant.id}
          open={bookOpen}
          onOpenChange={setBookOpen}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function BookingsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-10 w-full max-w-sm rounded-full" />
      </div>
      {range(3).map((index) => (
        <Skeleton key={index} className="h-44 w-full rounded-xl" />
      ))}
    </div>
  );
}
