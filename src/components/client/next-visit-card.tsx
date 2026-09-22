"use client";

import Link from "next/link";
import {
  CalendarClock,
  CalendarPlus,
  Check,
  MessageCircle,
  Navigation,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui";
import { duration as formatDuration, timeOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { sum } from "@/lib/utils";
import type { Appointment, Service, Staff, Tenant } from "@/lib/types";
import { ActionTile } from "./primitives";
import {
  downloadIcs,
  icsCalendar,
  mapsHref,
  relativeDayLabel,
} from "./helpers";

export interface NextVisitCardProps {
  appointment: Appointment;
  tenant: Tenant;
  staff?: Staff;
  services: Service[];
  onReschedule: () => void;
}

export function NextVisitCard({
  appointment,
  tenant,
  staff,
  services,
  onReschedule,
}: NextVisitCardProps) {
  const { t, tl, locale } = useI18n();

  const names = services.map((service) => tl(service.name)).join(" + ");
  const minutes = sum(services.map((service) => service.durationMin));
  const pending = appointment.status === "pending";

  function addToCalendar() {
    downloadIcs(
      `kalendo-${appointment.id}.ics`,
      icsCalendar([
        {
          uid: appointment.id,
          start: appointment.start,
          end: appointment.end,
          summary: `${names} · ${tenant.name}`,
          location: `${tenant.address}, ${tenant.city}`,
        },
      ]),
    );
    toast.success(t("visits.addToCalendar"));
  }

  return (
    <section className="animate-fade-up rounded-2xl bg-ink p-5 text-paper shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex h-6 items-center rounded-full bg-paper/10 px-2.5 text-[11px] font-medium text-paper/90">
          {t("discover.nextVisit")}
        </span>

        <Badge
          size="sm"
          tone={pending ? "warn" : "success"}
          iconLeft={pending ? undefined : Check}
        >
          {pending ? t("visits.pending") : t("discover.confirmed")}
        </Badge>
      </div>

      <p className="font-display mt-4 text-[30px] leading-none">
        {relativeDayLabel(t, locale, appointment.start)},{" "}
        <em className="tabular">{timeOf(appointment.start)}</em>
      </p>

      <p className="mt-3 text-[14px] text-paper/85">
        {names} · {formatDuration(minutes, locale)}
      </p>

      <p className="mt-1 text-[13px] leading-5 text-paper/60">
        {tenant.name} · {tenant.address}
        {staff ? ` · ${t("visits.withStaff", { name: staff.name })}` : ""}
      </p>

      <div className="mt-5 flex items-stretch gap-2">
        <ActionTile
          variant="ink"
          icon={<Navigation />}
          label={t("visits.short.directions")}
          href={mapsHref(tenant)}
          external
        />
        <ActionTile
          variant="ink"
          icon={<CalendarClock />}
          label={t("visits.short.reschedule")}
          onClick={onReschedule}
        />
        <ActionTile
          variant="ink"
          icon={<CalendarPlus />}
          label={t("visits.short.calendar")}
          onClick={addToCalendar}
        />
        <ActionTile
          variant="ink"
          icon={<MessageCircle />}
          label={t("visits.short.chat")}
          href={`/app/chat?tenant=${tenant.id}`}
        />
      </div>
    </section>
  );
}

/** Shown to a client with nothing booked — same ink card, invitation copy. */
export function NextVisitEmpty() {
  const { t } = useI18n();

  return (
    <section className="animate-fade-up rounded-2xl bg-ink p-5 text-paper shadow-md">
      <span className="inline-grid size-11 place-items-center rounded-full bg-paper/10">
        <Sparkles aria-hidden className="size-5 text-paper" />
      </span>

      <p className="font-display mt-4 text-[26px] leading-tight">
        {t("visits.empty")}
      </p>

      <p className="mt-2 text-[13px] leading-5 text-paper/70">
        {t("visits.emptyBody")}
      </p>

      <Link
        href="/app/search"
        className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-paper px-5 text-[14px] font-medium text-ink transition-colors hover:bg-card"
      >
        {t("visits.find")}
      </Link>
    </section>
  );
}
