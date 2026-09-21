"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, Chip, ChipRow, EmptyState, Modal, Sheet } from "@/components/ui";
import { CalendarX } from "lucide-react";
import {
  getTenant,
  servicesFor,
  staffById,
  useDataState,
  useKalendo,
  useSlots,
  type DataState,
} from "@/lib/data";
import { TODAY, weekdayShort } from "@/lib/format";
import { useI18n, type Localize } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";
import { dayOfMonth, upcomingDays } from "./helpers";

function describe(
  appointment: Appointment | null,
  state: DataState,
  tl: Localize,
): string {
  if (!appointment) return "";
  const services = servicesFor(state, appointment.serviceIds)
    .map((service) => tl(service.name))
    .join(" + ");
  const staff = staffById(state, appointment.staffId);
  return staff ? `${services} · ${staff.name}` : services;
}

export interface RescheduleSheetProps {
  appointment: Appointment | null;
  onClose: () => void;
}

export function RescheduleSheet({ appointment, onClose }: RescheduleSheetProps) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();
  const reschedule = useKalendo((store) => store.rescheduleAppointment);
  const [date, setDate] = useState<string | null>(null);

  const activeDate = date ?? appointment?.start.slice(0, 10) ?? TODAY;
  const slots = useSlots(
    appointment?.tenantId ?? "",
    appointment?.serviceIds ?? [],
    appointment?.staffId ?? null,
    appointment ? activeDate : null,
  );

  const free = slots.filter(
    (slot) =>
      slot.available && `${activeDate}T${slot.time}:00` !== appointment?.start,
  );

  function close() {
    setDate(null);
    onClose();
  }

  function pick(time: string) {
    if (!appointment) return;
    reschedule(appointment.id, `${activeDate}T${time}:00`);
    toast.success(t("toast.rescheduled"));
    close();
  }

  return (
    <Sheet
      open={Boolean(appointment)}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title={t("visits.reschedule")}
    >
      <p className="mb-4 text-[13px] text-muted">{describe(appointment, state, tl)}</p>

      <ChipRow className="-mx-5 px-5 pb-1">
        {upcomingDays(14).map((day) => (
          <Chip
            key={day}
            active={day === activeDate}
            onClick={() => setDate(day)}
            className="h-14 flex-col gap-0.5 px-3"
          >
            <span className="text-[10px] tracking-wide uppercase opacity-70">
              {weekdayShort(day, locale)}
            </span>
            <span className="tabular text-[15px] leading-none">
              {dayOfMonth(day)}
            </span>
          </Chip>
        ))}
      </ChipRow>

      {free.length ? (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {free.map((slot) => (
            <Chip
              key={slot.time}
              onClick={() => pick(slot.time)}
              className={cn(
                "tabular w-full justify-center px-2",
                slot.scarce && "border-warn-ink/30 bg-warn text-warn-ink",
              )}
            >
              {slot.time}
            </Chip>
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          icon={CalendarX}
          title={t("company.noSlots")}
          body={t("company.noSlotsBody")}
        />
      )}
    </Sheet>
  );
}

export interface CancelVisitModalProps {
  appointment: Appointment | null;
  onClose: () => void;
}

export function CancelVisitModal({
  appointment,
  onClose,
}: CancelVisitModalProps) {
  const { t, tl } = useI18n();
  const state = useDataState();
  const cancel = useKalendo((store) => store.cancelAppointment);
  const tenant = appointment ? getTenant(state, appointment.tenantId) : undefined;

  function confirm() {
    if (!appointment) return;
    cancel(appointment.id);
    toast.success(t("toast.bookingCancelled"));
    onClose();
  }

  return (
    <Modal
      open={Boolean(appointment)}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      size="sm"
      title={t("visits.cancelConfirm")}
      closeLabel={t("common.close")}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" block onClick={onClose}>
            {t("visits.keepVisit")}
          </Button>
          <Button variant="danger" block onClick={confirm}>
            {t("visits.cancel")}
          </Button>
        </div>
      }
    >
      <p className="text-[14px] leading-6 text-sand-700">
        {t("visits.cancelBody", { hours: tenant?.cancellationHours ?? 24 })}
      </p>
      <p className="mt-2 text-[13px] text-muted">
        {describe(appointment, state, tl)}
      </p>
    </Modal>
  );
}
