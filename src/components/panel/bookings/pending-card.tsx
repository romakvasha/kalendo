"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { toast } from "sonner";

import { RescheduleDialog } from "@/components/panel/calendar";
import { detailLine, minutesWaiting } from "@/components/panel/clients/helpers";
import { Button, Card, CardBody, IconButton, Modal } from "@/components/ui";
import { clientById, roomById, useDataState, useKalendo } from "@/lib/data";
import { timeOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Appointment, Tenant } from "@/lib/types";

import { dayChip, serviceLabel } from "./helpers";

export interface PendingCardProps {
  appointment: Appointment;
  tenant: Tenant;
  /** 1-based position, rendered as the "1 z 2" counter. */
  index: number;
  total: number;
}

export function PendingCard({
  appointment,
  tenant,
  index,
  total,
}: PendingCardProps) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();
  const acceptBooking = useKalendo((store) => store.acceptBooking);
  const declineBooking = useKalendo((store) => store.declineBooking);
  const rescheduleAppointment = useKalendo(
    (store) => store.rescheduleAppointment,
  );

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);

  const client = clientById(state, appointment.clientId);
  const room = appointment.roomId
    ? roomById(state, appointment.roomId)
    : undefined;
  const detail = detailLine(tenant, appointment);
  const services = serviceLabel(state, appointment, tl);

  function accept() {
    acceptBooking(appointment.id);
    toast.success(t("toast.bookingConfirmed"));
  }

  function decline() {
    declineBooking(appointment.id);
    setDeclineOpen(false);
    toast.success(t("toast.bookingDeclined"));
  }

  function reschedule(date: string, time: string) {
    rescheduleAppointment(appointment.id, `${date}T${time}:00`);
    acceptBooking(appointment.id);
    setRescheduleOpen(false);
    toast.success(t("toast.rescheduled"));
  }

  return (
    <>
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-brand-ink">
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-brand" />
              <span className="truncate">
                {t("panel.bookings.newBooking", {
                  time: `${minutesWaiting(appointment.id)} ${t("common.min")}`,
                })}
              </span>
            </span>

            <span className="tabular shrink-0 text-[12px] text-muted">
              {`${index} ${t("common.of")} ${total}`}
            </span>
          </div>

          <p className="mt-3 text-[16px] font-medium text-ink">
            {client?.name ?? t("common.client")}
          </p>
          <p className="mt-0.5 text-[13px] leading-5 text-muted">
            {detail ? `${services} · ${detail}` : services}
          </p>

          <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-md bg-sand-50 px-3 py-2.5 text-[13px] text-ink">
            <CalendarDays aria-hidden className="size-4 shrink-0 text-sand-500" />
            <span>{dayChip(appointment.start, locale)}</span>
            <span aria-hidden className="text-sand-400">
              ·
            </span>
            <span className="tabular">{timeOf(appointment.start)}</span>
            {room ? (
              <>
                <span aria-hidden className="text-sand-400">
                  ·
                </span>
                <span>{tl(room.name)}</span>
              </>
            ) : null}
          </p>

          <div className="mt-4 flex items-center gap-2">
            <Button block className="sm:w-auto sm:px-6" onClick={accept}>
              {t("panel.bookings.accept")}
            </Button>
            <Button
              block
              variant="secondary"
              className="sm:w-auto"
              onClick={() => setRescheduleOpen(true)}
            >
              {t("panel.bookings.otherTime")}
            </Button>
            <IconButton
              variant="danger"
              className="sm:ml-auto"
              aria-label={t("panel.bookings.decline")}
              onClick={() => setDeclineOpen(true)}
            >
              <X />
            </IconButton>
          </div>
        </CardBody>
      </Card>

      {rescheduleOpen && (
        <RescheduleDialog
          open
          onOpenChange={setRescheduleOpen}
          appointment={appointment}
          onConfirm={reschedule}
        />
      )}

      <Modal
        open={declineOpen}
        onOpenChange={setDeclineOpen}
        size="sm"
        title={t("panel.bookings.declineConfirm")}
        closeLabel={t("common.close")}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              block
              onClick={() => setDeclineOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="danger" block onClick={decline}>
              {t("panel.bookings.decline")}
            </Button>
          </div>
        }
      >
        <p className="text-[14px] leading-5 text-muted">
          {t("panel.bookings.declineBody")}
        </p>
      </Modal>
    </>
  );
}
