"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { timeLabel } from "@/lib/calendar-geometry";
import {
  NOW_ISO,
  appointmentById,
  clientById,
  pendingBookings,
  servicesFor,
  staffOf,
  useActiveTenant,
  useDataState,
  useHydrated,
  useKalendo,
} from "@/lib/data";
import {
  TODAY,
  addDays,
  minutesOf,
  money,
  parseLocal,
  startOfMonth,
  toISODate,
} from "@/lib/format";
import { useLocale, useT, useTl } from "@/lib/i18n";
import type { Appointment, AppointmentStatus, BookingDraft } from "@/lib/types";
import { cn, makeId, range } from "@/lib/utils";
import { Button, Card, Radio, Sheet, Skeleton } from "@/components/ui";
import { CalendarToolbar } from "./calendar-toolbar";
import { DayGrid } from "./day-grid";
import { MonthGrid } from "./month-grid";
import { NewVisitDialog, type NewVisitInput } from "./new-visit-dialog";
import { RescheduleDialog } from "./reschedule-dialog";
import { SettleModal, type SettleInput } from "./settle-modal";
import { VisitDetails } from "./visit-details";
import {
  ALL_STAFF,
  buildColumns,
  datesForView,
  shortDateLabel,
  stepForView,
  visibleAppointments,
  visibleBlocks,
  windowForDates,
  type CalendarView,
  type ComposerSeed,
  type MoveRequest,
} from "./calendar-model";
import { useIsDesktop } from "./use-media-query";

/** Field-level edits the public store actions do not cover (staff column, room, note). */
function patchAppointment(id: string, patch: Partial<Appointment>) {
  useKalendo.setState((current) => ({
    appointments: current.appointments.map((appointment) =>
      appointment.id === id ? { ...appointment, ...patch } : appointment,
    ),
  }));
}

export function CalendarScreen() {
  const t = useT();
  const tl = useTl();
  const locale = useLocale();
  const hydrated = useHydrated();
  const isDesktop = useIsDesktop();
  const state = useDataState();
  const tenant = useActiveTenant();
  const tenantId = tenant?.id ?? "";

  const [view, setView] = useState<CalendarView>("day");
  const [date, setDate] = useState<string>(TODAY);
  const [staffFilter, setStaffFilter] = useState<string>(ALL_STAFF);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composer, setComposer] = useState<ComposerSeed | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const rescheduleAppointment = useKalendo(
    (store) => store.rescheduleAppointment,
  );
  const cancelAppointment = useKalendo((store) => store.cancelAppointment);
  const setAppointmentStatus = useKalendo(
    (store) => store.setAppointmentStatus,
  );
  const setAppointmentPayment = useKalendo(
    (store) => store.setAppointmentPayment,
  );
  const createBooking = useKalendo((store) => store.createBooking);

  const team = useMemo(
    () => (tenantId ? staffOf(state, tenantId) : []),
    [state, tenantId],
  );
  const dates = useMemo(() => datesForView(view, date), [view, date]);
  const dayWindow = useMemo(
    () => windowForDates(tenant, dates),
    [tenant, dates],
  );

  const visibleStaff = useMemo(() => {
    const filtered =
      staffFilter === ALL_STAFF
        ? team
        : team.filter((member) => member.id === staffFilter);
    // A phone cannot carry four specialists across seven days — show one at a time.
    if (view !== "day" && !isDesktop && filtered.length > 1)
      return filtered.slice(0, 1);
    return filtered;
  }, [team, staffFilter, view, isDesktop]);

  const { columns, groups } = useMemo(
    () => buildColumns(dates, visibleStaff),
    [dates, visibleStaff],
  );

  const appointments = useMemo(() => {
    const base = visibleAppointments(state.appointments, tenantId, dates);
    const needle = query.trim().toLowerCase();
    if (!needle) return base;
    return base.filter((appointment) => {
      const client = clientById(state, appointment.clientId);
      if (client?.name.toLowerCase().includes(needle)) return true;
      return servicesFor(state, appointment.serviceIds).some((service) =>
        tl(service.name).toLowerCase().includes(needle),
      );
    });
  }, [state, tenantId, dates, query, tl]);

  const blocks = useMemo(
    () => visibleBlocks(state.blocks, tenantId, dates),
    [state.blocks, tenantId, dates],
  );

  const pendingCount = useMemo(
    () => (tenantId ? pendingBookings(state, tenantId).length : 0),
    [state, tenantId],
  );

  const selected = selectedId ? appointmentById(state, selectedId) : undefined;
  const paid =
    selected?.payment === "paid"
      ? selected.total
      : selected?.payment === "deposit"
        ? (selected.depositAmount ?? 0)
        : 0;
  const due = selected ? Math.max(selected.total - paid, 0) : 0;

  /* ---------------------------------------------------------------- */
  /* Actions                                                           */
  /* ---------------------------------------------------------------- */

  const handleStep = useCallback(
    (direction: -1 | 1) => {
      setDate((current) => {
        if (view !== "month")
          return addDays(current, direction * stepForView(view));
        const anchor = parseLocal(startOfMonth(current));
        anchor.setMonth(anchor.getMonth() + direction);
        return toISODate(anchor);
      });
    },
    [view],
  );

  const handleMove = useCallback(
    (move: MoveRequest) => {
      const appointment = appointmentById(state, move.id);
      if (!appointment) return;

      const minutes = minutesOf(appointment.end) - minutesOf(appointment.start);
      const blocked =
        move.startMin < dayWindow.startMin ||
        move.startMin + minutes > dayWindow.endMin ||
        state.blocks.some(
          (block) =>
            block.staffId === move.staffId &&
            block.start.slice(0, 10) === move.date &&
            minutesOf(block.start) < move.startMin + minutes &&
            move.startMin < minutesOf(block.end),
        );

      if (blocked) {
        toast.error(t("errors.slotTaken"));
        return;
      }

      const previousStart = appointment.start;
      const previousStaff = appointment.staffId;
      const nextStart = `${move.date}T${timeLabel(move.startMin)}:00`;
      if (nextStart === previousStart && move.staffId === previousStaff) return;

      rescheduleAppointment(move.id, nextStart);
      if (move.staffId !== previousStaff)
        patchAppointment(move.id, { staffId: move.staffId });

      toast.success(t("toast.rescheduled"), {
        description: `${shortDateLabel(move.date, locale)} · ${timeLabel(move.startMin)}`,
        action: {
          label: t("panel.calendar.undo"),
          onClick: () => {
            rescheduleAppointment(move.id, previousStart);
            patchAppointment(move.id, { staffId: previousStaff });
          },
        },
      });
    },
    [
      state,
      dayWindow.startMin,
      dayWindow.endMin,
      rescheduleAppointment,
      t,
      locale,
    ],
  );

  const handleCreate = useCallback(
    (seed: ComposerSeed) => setComposer(seed),
    [],
  );

  const handleNewVisit = useCallback(() => {
    setComposer({
      date,
      staffId: staffFilter === ALL_STAFF ? null : staffFilter,
      time: null,
    });
  }, [date, staffFilter]);

  const handleCreated = useCallback(
    (input: NewVisitInput) => {
      if (!tenant) return;
      const draft: BookingDraft = {
        tenantId: tenant.id,
        serviceIds: input.serviceIds,
        staffId: input.staffId,
        date: input.date,
        time: input.time,
        customFields: {},
        contact: {
          name: input.client.name,
          phone: input.client.phone,
          email: input.client.email,
        },
        paymentChoice: input.deposit ? "deposit" : "on-site",
        marketingConsent: false,
        termsAccepted: true,
        createAccount: false,
      };

      const created = createBooking(draft);
      if (input.note || input.roomId) {
        patchAppointment(created.id, {
          note: input.note || undefined,
          roomId: input.roomId ?? undefined,
        });
      }

      setComposer(null);
      setDate(input.date);
      setSelectedId(created.id);
      toast.success(t("toast.bookingConfirmed"), {
        description: `${shortDateLabel(input.date, locale)} · ${input.time}`,
      });
    },
    [tenant, createBooking, t, locale],
  );

  const handleSettle = useCallback(
    (input: SettleInput) => {
      if (!selected || !tenant) return;
      setAppointmentPayment(selected.id, "paid");
      setAppointmentStatus(selected.id, "done");
      useKalendo.setState((current) => ({
        payments: [
          ...current.payments,
          {
            id: makeId("pay"),
            tenantId: tenant.id,
            appointmentId: selected.id,
            amount: input.amount,
            method: input.method,
            at: NOW_ISO,
            kind: "full" as const,
            invoiceNumber: input.invoice
              ? `FV/${TODAY.slice(0, 4)}/${current.payments.length + 1}`
              : undefined,
          },
        ],
      }));
      setSettleOpen(false);
      toast.success(t("toast.paymentSettled"), {
        description: money(input.amount, locale),
      });
    },
    [selected, tenant, setAppointmentPayment, setAppointmentStatus, t, locale],
  );

  const handleCancel = useCallback(() => {
    if (!selected) return;
    const id = selected.id;
    const previous: AppointmentStatus = selected.status;
    cancelAppointment(id);
    setSelectedId(null);
    toast.success(t("toast.bookingCancelled"), {
      action: {
        label: t("panel.calendar.undo"),
        onClick: () => setAppointmentStatus(id, previous),
      },
    });
  }, [selected, cancelAppointment, setAppointmentStatus, t]);

  const handleRescheduled = useCallback(
    (isoDate: string, time: string) => {
      if (!selected) return;
      const previousStart = selected.start;
      const id = selected.id;
      rescheduleAppointment(id, `${isoDate}T${time}:00`);
      setRescheduleOpen(false);
      setDate(isoDate);
      toast.success(t("toast.rescheduled"), {
        description: `${shortDateLabel(isoDate, locale)} · ${time}`,
        action: {
          label: t("panel.calendar.undo"),
          onClick: () => rescheduleAppointment(id, previousStart),
        },
      });
    },
    [selected, rescheduleAppointment, t, locale],
  );

  /* ---------------------------------------------------------------- */

  if (!hydrated || !tenant) return <CalendarSkeleton />;

  const staffOptions = [
    { value: ALL_STAFF, label: t("panel.calendar.everyone") },
    ...team.map((member) => ({ value: member.id, label: member.name })),
  ];

  return (
    <div className="animate-fade-up">
      <Card className="overflow-hidden">
        <CalendarToolbar
          view={view}
          onViewChange={setView}
          date={date}
          onStep={handleStep}
          onToday={() => setDate(TODAY)}
          staffOptions={staffOptions}
          staffFilter={staffFilter}
          onStaffChange={setStaffFilter}
          query={query}
          onQueryChange={setQuery}
          pendingCount={pendingCount}
          onNewVisit={handleNewVisit}
          onFilter={() => setFilterOpen(true)}
        />

        {view !== "month" && appointments.length === 0 ? (
          <p className="border-b border-line bg-sand-50 px-4 py-2.5 text-[13px] text-muted">
            {t("panel.calendar.emptyDay")}
          </p>
        ) : null}

        <div className="flex min-h-0 items-stretch">
          <div className="min-w-0 flex-1">
            {view === "month" ? (
              <MonthGrid
                state={state}
                tenant={tenant}
                anchor={date}
                staffFilter={staffFilter}
                onPickDay={(isoDate) => {
                  setDate(isoDate);
                  setView("day");
                }}
              />
            ) : (
              <DayGrid
                state={state}
                tenant={tenant}
                columns={columns}
                groups={groups}
                showDateHeaders={view !== "day"}
                window={dayWindow}
                appointments={appointments}
                blocks={blocks}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onCreate={handleCreate}
                onMove={handleMove}
                onFilter={() => setFilterOpen(true)}
              />
            )}
          </div>

          {isDesktop && selected && view !== "month" ? (
            <aside className="hidden w-[300px] shrink-0 overflow-hidden border-l border-line lg:block xl:w-[340px]">
              <VisitDetails
                state={state}
                tenant={tenant}
                appointment={selected}
                onClose={() => setSelectedId(null)}
                onSettle={() => setSettleOpen(true)}
                onReschedule={() => setRescheduleOpen(true)}
                onCancel={handleCancel}
              />
            </aside>
          ) : null}
        </div>
      </Card>

      <Button
        aria-label={t("panel.calendar.newVisit")}
        onClick={handleNewVisit}
        className="fixed right-4 bottom-20 z-40 size-14 rounded-full p-0 shadow-lg lg:hidden"
      >
        <Plus className="size-6" />
      </Button>

      <Sheet
        open={!isDesktop && view !== "month" && Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        title={t("panel.calendar.visitDetails")}
      >
        {selected ? (
          <VisitDetails
            state={state}
            tenant={tenant}
            appointment={selected}
            showHeader={false}
            className="h-auto"
            onClose={() => setSelectedId(null)}
            onSettle={() => setSettleOpen(true)}
            onReschedule={() => setRescheduleOpen(true)}
            onCancel={handleCancel}
          />
        ) : null}
      </Sheet>

      <Sheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title={t("common.staff")}
      >
        <div className="space-y-1 pb-2">
          {staffOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5",
                staffFilter === option.value
                  ? "bg-sand-100"
                  : "hover:bg-sand-50",
              )}
            >
              <Radio
                name="calendar-staff-filter"
                checked={staffFilter === option.value}
                onChange={() => {
                  setStaffFilter(option.value);
                  setFilterOpen(false);
                }}
              />
              <span className="text-[15px] text-ink">{option.label}</span>
            </label>
          ))}
        </div>
      </Sheet>

      {composer ? (
        <NewVisitDialog
          key={`${composer.date}|${composer.staffId ?? ""}|${composer.time ?? ""}`}
          open
          onOpenChange={(open) => {
            if (!open) setComposer(null);
          }}
          state={state}
          tenant={tenant}
          seed={composer}
          onCreate={handleCreated}
        />
      ) : null}

      {settleOpen && selected ? (
        <SettleModal
          key={selected.id}
          open
          onOpenChange={setSettleOpen}
          state={state}
          tenant={tenant}
          appointment={selected}
          due={due}
          onConfirm={handleSettle}
        />
      ) : null}

      {rescheduleOpen && selected ? (
        <RescheduleDialog
          key={selected.id}
          open
          onOpenChange={setRescheduleOpen}
          appointment={selected}
          onConfirm={handleRescheduled}
        />
      ) : null}
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="ml-auto h-9 w-56 rounded-full" />
      </div>
      <div className="space-y-2 p-4">
        {range(9).map((index) => (
          <Skeleton key={index} className="h-16 w-full rounded-md" />
        ))}
      </div>
    </Card>
  );
}
