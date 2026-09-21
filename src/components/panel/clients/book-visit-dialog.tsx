"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useIsDesktop } from "@/components/panel/calendar";
import {
  Avatar,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Sheet,
} from "@/components/ui";
import {
  clientsOf,
  eligibleStaff,
  servicesOf,
  useDataState,
  useKalendo,
  useSlots,
} from "@/lib/data";
import { TODAY, duration, money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/types";

export interface BookVisitDialogProps {
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Locks the picker to one client — used from the client card. */
  client?: Client;
  /** Pre-selects a service, e.g. "book this again". */
  serviceId?: string;
  staffId?: string;
  onBooked?: (appointmentId: string) => void;
}

/**
 * Mount this per seed (`key={...}`) so the initial state below doubles as the
 * reset when the prefilled client or service changes.
 */
export function BookVisitDialog({
  tenantId,
  open,
  onOpenChange,
  client,
  serviceId: seedServiceId,
  staffId: seedStaffId,
  onBooked,
}: BookVisitDialogProps) {
  const { t, tl, locale } = useI18n();
  const isDesktop = useIsDesktop();
  const state = useDataState();
  const createBooking = useKalendo((store) => store.createBooking);
  const setAppointmentStatus = useKalendo((store) => store.setAppointmentStatus);

  const [clientId, setClientId] = useState(client?.id ?? "");
  const [serviceId, setServiceId] = useState(seedServiceId ?? "");
  const [staffId, setStaffId] = useState(
    seedStaffId ?? client?.preferredStaffId ?? "",
  );
  const [date, setDate] = useState(TODAY);
  const [time, setTime] = useState("");

  const clients = useMemo(
    () =>
      [...clientsOf(state, tenantId)].sort((a, b) =>
        a.name.localeCompare(b.name, "pl"),
      ),
    [state, tenantId],
  );
  const services = useMemo(() => servicesOf(state, tenantId), [state, tenantId]);
  const serviceIds = useMemo(
    () => (serviceId ? [serviceId] : []),
    [serviceId],
  );
  const team = useMemo(
    () => eligibleStaff(state, tenantId, serviceIds),
    [state, tenantId, serviceIds],
  );

  const slots = useSlots(
    tenantId,
    serviceIds,
    staffId || null,
    serviceId ? date : null,
  );
  const free = slots.filter((slot) => slot.available);

  const picked = client ?? clients.find((item) => item.id === clientId);
  const ready = Boolean(
    picked && serviceId && time && free.some((slot) => slot.time === time),
  );

  function submit() {
    if (!picked || !ready) return;

    const appointment = createBooking({
      tenantId,
      serviceIds,
      staffId: staffId || null,
      date,
      time,
      customFields: {},
      contact: {
        name: picked.name,
        phone: picked.phone,
        email: picked.email ?? "",
      },
      paymentChoice: "on-site",
      marketingConsent: false,
      termsAccepted: true,
      createAccount: false,
    });

    // Booked by the company itself, so it skips the accept/decline inbox.
    setAppointmentStatus(appointment.id, "confirmed");
    toast.success(t("toast.bookingConfirmed"));
    onBooked?.(appointment.id);
    onOpenChange(false);
  }

  const body = (
    <div className="flex flex-col gap-4">
      {client ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-sand-50 p-3">
          <Avatar name={client.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-ink">
              {client.name}
            </p>
            <p className="tabular truncate text-[12px] text-muted">
              {client.phone}
            </p>
          </div>
        </div>
      ) : (
        <Field label={t("common.client")} htmlFor="book-client" required>
          <Select
            id="book-client"
            value={clientId}
            placeholder={t("common.select")}
            onChange={(event) => setClientId(event.target.value)}
            options={clients.map((item) => ({
              value: item.id,
              label: `${item.name} · ${item.phone}`,
            }))}
          />
        </Field>
      )}

      <Field label={t("common.service")} htmlFor="book-service" required>
        <Select
          id="book-service"
          value={serviceId}
          placeholder={t("common.select")}
          onChange={(event) => {
            setServiceId(event.target.value);
            setTime("");
          }}
          options={services.map((service) => ({
            value: service.id,
            label: `${tl(service.name)} · ${duration(service.durationMin, locale)} · ${money(service.price, locale)}`,
          }))}
        />
      </Field>

      <Field label={t("common.staff")} htmlFor="book-staff">
        <Select
          id="book-staff"
          value={staffId}
          onChange={(event) => {
            setStaffId(event.target.value);
            setTime("");
          }}
          options={[
            { value: "", label: t("company.anyStaff") },
            ...team.map((member) => ({
              value: member.id,
              label: member.name,
            })),
          ]}
        />
      </Field>

      <Field label={t("common.date")} htmlFor="book-date">
        <Input
          id="book-date"
          type="date"
          value={date}
          min={TODAY}
          onChange={(event) => {
            setDate(event.target.value);
            setTime("");
          }}
        />
      </Field>

      <Field label={t("common.time")}>
        {!serviceId ? (
          <p className="text-[13px] text-muted">
            {t("panel.clients.pickServiceFirst")}
          </p>
        ) : free.length === 0 ? (
          <EmptyState compact title={t("company.noSlots")} />
        ) : (
          <div className="thin-scrollbar grid max-h-56 grid-cols-4 gap-2 overflow-y-auto pr-1">
            {free.map((slot) => (
              <button
                key={slot.time}
                type="button"
                aria-pressed={time === slot.time}
                onClick={() => setTime(slot.time)}
                className={cn(
                  "tabular h-10 rounded-md border text-[13px] font-medium transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25",
                  time === slot.time
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-white text-ink hover:border-line-strong hover:bg-sand-50",
                )}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </Field>
    </div>
  );

  const footer = (
    <div className="flex gap-2">
      <Button variant="secondary" block onClick={() => onOpenChange(false)}>
        {t("common.cancel")}
      </Button>
      <Button block disabled={!ready} onClick={submit}>
        {t("booking.confirmBooking")}
      </Button>
    </div>
  );

  const title = t("panel.dashboard.newVisit");

  if (isDesktop) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        size="md"
        footer={footer}
        closeLabel={t("common.close")}
      >
        {body}
      </Modal>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} footer={footer}>
      {body}
    </Sheet>
  );
}
