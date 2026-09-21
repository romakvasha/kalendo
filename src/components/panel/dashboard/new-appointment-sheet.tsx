"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button, Field, Input, Select, Sheet } from "@/components/ui";
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

export interface NewAppointmentSheetProps {
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAppointmentSheet({
  tenantId,
  open,
  onOpenChange,
}: NewAppointmentSheetProps) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();
  const createBooking = useKalendo((store) => store.createBooking);
  const setAppointmentStatus = useKalendo((store) => store.setAppointmentStatus);

  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(TODAY);
  const [time, setTime] = useState("");

  const clients = useMemo(
    () => clientsOf(state, tenantId).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [state, tenantId],
  );
  const services = useMemo(() => servicesOf(state, tenantId), [state, tenantId]);
  const serviceIds = useMemo(() => (serviceId ? [serviceId] : []), [serviceId]);
  const team = useMemo(
    () => eligibleStaff(state, tenantId, serviceIds),
    [state, tenantId, serviceIds],
  );

  const slots = useSlots(tenantId, serviceIds, staffId || null, serviceId ? date : null);
  const free = slots.filter((slot) => slot.available);
  const ready = Boolean(clientId && serviceId && time && free.some((slot) => slot.time === time));

  function reset() {
    setClientId("");
    setServiceId("");
    setStaffId("");
    setDate(TODAY);
    setTime("");
  }

  function submit() {
    const client = clients.find((item) => item.id === clientId);
    if (!client || !ready) return;

    const appointment = createBooking({
      tenantId,
      serviceIds,
      staffId: staffId || null,
      date,
      time,
      customFields: {},
      contact: {
        name: client.name,
        phone: client.phone,
        email: client.email ?? "",
      },
      paymentChoice: "on-site",
      marketingConsent: false,
      termsAccepted: true,
      createAccount: false,
    });

    // Booked at the desk, so it skips the accept/decline inbox.
    setAppointmentStatus(appointment.id, "confirmed");
    toast.success(t("toast.bookingConfirmed"));
    reset();
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("panel.dashboard.newVisit")}
      footer={
        <Button block size="lg" disabled={!ready} onClick={submit}>
          {t("booking.confirmBooking")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t("common.client")} htmlFor="new-visit-client">
          <Select
            id="new-visit-client"
            value={clientId}
            placeholder={t("common.select")}
            onChange={(event) => setClientId(event.target.value)}
            options={clients.map((client) => ({
              value: client.id,
              label: `${client.name} · ${client.phone}`,
            }))}
          />
        </Field>

        <Field label={t("common.service")} htmlFor="new-visit-service">
          <Select
            id="new-visit-service"
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

        <Field label={t("common.staff")} htmlFor="new-visit-staff">
          <Select
            id="new-visit-staff"
            value={staffId}
            onChange={(event) => {
              setStaffId(event.target.value);
              setTime("");
            }}
            options={[
              { value: "", label: t("company.anyStaff") },
              ...team.map((member) => ({ value: member.id, label: member.name })),
            ]}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("common.date")} htmlFor="new-visit-date">
            <Input
              id="new-visit-date"
              type="date"
              value={date}
              min={TODAY}
              onChange={(event) => {
                setDate(event.target.value);
                setTime("");
              }}
            />
          </Field>

          <Field
            label={t("common.time")}
            htmlFor="new-visit-time"
            hint={serviceId && free.length === 0 ? t("company.noSlots") : undefined}
          >
            <Select
              id="new-visit-time"
              value={time}
              disabled={!serviceId || free.length === 0}
              placeholder={t("common.select")}
              onChange={(event) => setTime(event.target.value)}
              options={free.map((slot) => ({ value: slot.time, label: slot.time }))}
            />
          </Field>
        </div>
      </div>
    </Sheet>
  );
}
