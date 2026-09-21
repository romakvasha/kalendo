"use client";

import { Check, Play, Send } from "lucide-react";
import { toast } from "sonner";

import { boardBadge, detailLine } from "@/components/panel/clients/helpers";
import { Badge, Button } from "@/components/ui";
import { clientById, roomById, useDataState, useKalendo } from "@/lib/data";
import { TODAY, timeOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Appointment, Tenant } from "@/lib/types";

import { serviceLabel } from "./helpers";

export interface BoardRowProps {
  appointment: Appointment;
  tenant: Tenant;
}

export function BoardRow({ appointment, tenant }: BoardRowProps) {
  const { t, tl } = useI18n();
  const state = useDataState();
  const setAppointmentStatus = useKalendo((store) => store.setAppointmentStatus);

  const client = clientById(state, appointment.clientId);
  const room = appointment.roomId
    ? roomById(state, appointment.roomId)
    : undefined;
  const detail = detailLine(tenant, appointment);
  const badge = boardBadge(appointment.status);
  // Only the current day's jobs get a running action; other days are read-only.
  const onToday = appointment.start.slice(0, 10) === TODAY;

  const title = detail || client?.name || t("common.client");
  const subtitle = detail
    ? `${serviceLabel(state, appointment, tl)} · ${client?.name ?? ""}`
    : serviceLabel(state, appointment, tl);

  return (
    <li className="surface-flat flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-4">
      <div className="flex items-baseline justify-between gap-3 lg:w-32 lg:shrink-0 lg:flex-col lg:items-start lg:gap-0.5">
        <span className="tabular text-[13px] font-medium text-ink">
          {`${timeOf(appointment.start)}–${timeOf(appointment.end)}`}
        </span>
        <span className="truncate text-[12px] text-muted">
          {room ? tl(room.name) : t("panel.calendar.room")}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-ink lg:text-[14px]">
          {title}
        </p>
        <p className="truncate text-[13px] text-muted">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 lg:shrink-0 lg:justify-end lg:gap-3">
        <Badge size="sm" tone={badge.tone}>
          {t(badge.key)}
        </Badge>

        {onToday && appointment.status === "done" && (
          <Button
            size="sm"
            variant="secondary"
            iconLeft={Send}
            onClick={() => toast.success(t("toast.smsSent"))}
          >
            {t("panel.bookings.smsReady")}
          </Button>
        )}

        {onToday && appointment.status === "in-progress" && (
          <Button
            size="sm"
            iconLeft={Check}
            onClick={() => {
              setAppointmentStatus(appointment.id, "done");
              toast.success(t("toast.visitFinished"));
            }}
          >
            {t("panel.bookings.finish")}
          </Button>
        )}

        {onToday &&
          (appointment.status === "confirmed" ||
            appointment.status === "pending") && (
          <Button
            size="sm"
            variant="secondary"
            iconLeft={Play}
            onClick={() => {
              setAppointmentStatus(appointment.id, "in-progress");
              toast.success(t("toast.visitStarted"));
            }}
          >
            {t("panel.bookings.start")}
          </Button>
        )}
      </div>
    </li>
  );
}
