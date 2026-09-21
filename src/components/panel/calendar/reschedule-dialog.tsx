"use client";

import { useState } from "react";

import { useSlots } from "@/lib/data";
import { timeOf } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { Appointment } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Sheet,
} from "@/components/ui";
import { useIsDesktop } from "./use-media-query";

export interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Mounted per appointment, so the initial state is the reset. */
  appointment: Appointment;
  onConfirm: (isoDate: string, time: string) => void;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  appointment,
  onConfirm,
}: RescheduleDialogProps) {
  const t = useT();
  const isDesktop = useIsDesktop();

  const [date, setDate] = useState(appointment.start.slice(0, 10));
  const [time, setTime] = useState<string | null>(null);

  const slots = useSlots(
    appointment.tenantId,
    appointment.serviceIds,
    appointment.staffId,
    date || null,
  );
  const available = slots.filter((slot) => slot.available);

  const body = (
    <div className="space-y-5">
      <p className="text-[13px] text-muted">
        {`${t("common.time")}: ${timeOf(appointment.start)}–${timeOf(appointment.end)}`}
      </p>

      <Field label={t("common.date")} htmlFor="reschedule-date">
        <Input
          id="reschedule-date"
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setTime(null);
          }}
        />
      </Field>

      <Field label={t("common.time")}>
        {available.length === 0 ? (
          <EmptyState compact title={t("company.noSlots")} />
        ) : (
          <div className="thin-scrollbar grid max-h-56 grid-cols-4 gap-2 overflow-y-auto pr-1">
            {available.map((slot) => (
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
      <Button
        block
        disabled={!time || !date}
        onClick={() => {
          if (time && date) onConfirm(date, time);
        }}
      >
        {t("panel.calendar.reschedule")}
      </Button>
    </div>
  );

  const title = t("panel.calendar.reschedule");

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
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={footer}
    >
      {body}
    </Sheet>
  );
}
