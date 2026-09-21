"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  Navigation,
  Smartphone,
} from "lucide-react";

import { TenantLogo } from "@/components/layout";
import { Badge } from "@/components/ui";
import { duration, money, timeOf, weekdayDayMonth, weekdayPhrase } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Appointment, Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  downloadIcs,
  googleCalendarUrl,
  mapsUrl,
  type CalendarEvent,
} from "./helpers";

export interface StepDoneProps {
  tenant: Tenant;
  appointment: Appointment;
  serviceSummary: string;
  customSummary: string;
  minutes: number;
  paidNow: number;
  manageHref: string;
}

export function StepDone({
  tenant,
  appointment,
  serviceSummary,
  customSummary,
  minutes,
  paidNow,
  manageHref,
}: StepDoneProps) {
  const { t, locale } = useI18n();

  const date = appointment.start.slice(0, 10);
  const weekday = weekdayPhrase(date, locale);

  const event: CalendarEvent = {
    uid: appointment.id,
    start: appointment.start,
    end: appointment.end,
    title: `${serviceSummary} · ${tenant.name}`,
    location: `${tenant.address}, ${tenant.city}`,
    description: `${tenant.name}, ${tenant.phone}`,
  };

  const paymentLabel =
    appointment.payment === "paid"
      ? t("visits.paid")
      : appointment.payment === "deposit"
        ? t("visits.depositPaid", {
            amount: money(appointment.depositAmount ?? paidNow, locale),
          })
        : t("booking.toPayOnSite");

  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-lg flex-col items-center text-center">
      <span className="animate-scale-in grid size-20 place-items-center rounded-full bg-success-soft text-success">
        <span className="animate-pulse-ring grid size-14 place-items-center rounded-full bg-success text-white">
          <Check className="size-7" strokeWidth={2.5} aria-hidden />
        </span>
      </span>

      <h1 className="font-display mt-6 text-[30px] leading-10 text-ink lg:text-[38px]">
        {t("booking.done.title", { weekday })}
      </h1>
      <p className="mt-2 text-[14px] leading-6 text-muted">
        {t("booking.done.body")}
      </p>

      {/* ------------------------------------------------- ticket */}
      <div className="relative mt-7 w-full overflow-hidden rounded-2xl border border-line bg-white text-left shadow-sm">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13.5px] font-medium text-sand-700">
              {weekdayDayMonth(date, locale)}
            </p>
            <Badge tone="warn" size="sm">
              {t("booking.done.approxDuration", {
                duration: duration(minutes, locale),
              })}
            </Badge>
          </div>

          <p className="tabular font-display mt-1 text-[56px] leading-[1.05] text-ink">
            {timeOf(appointment.start)}
          </p>

          <p className="mt-1 text-[14px] font-medium text-ink">
            {serviceSummary}
          </p>
          {customSummary && (
            <p className="mt-1 text-[12.5px] text-muted">{customSummary}</p>
          )}

          <p className="tabular mt-3 text-[11.5px] tracking-wide text-sand-500 uppercase">
            {t("booking.done.code")} · {appointment.id.replace("apt_", "").toUpperCase()}
          </p>
        </div>

        {/* perforation */}
        <div aria-hidden className="relative h-0">
          <span className="absolute -left-2 -translate-y-1/2 size-4 rounded-full bg-paper" />
          <span className="absolute -right-2 -translate-y-1/2 size-4 rounded-full bg-paper" />
          <span className="absolute inset-x-4 top-0 border-t border-dashed border-line-strong" />
        </div>

        <div className="flex items-center justify-between gap-3 p-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <TenantLogo tenant={tenant} size="md" />
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-medium text-ink">
                {tenant.name}
              </span>
              <span className="block truncate text-[12px] text-muted">
                {tenant.address}, {tenant.city}
              </span>
            </span>
          </div>
          <div className="shrink-0 text-right">
            <span className="tabular block text-[15px] font-medium text-ink">
              {money(appointment.total, locale)}
            </span>
            <span className="block text-[11.5px] text-muted">
              {paymentLabel}
            </span>
          </div>
        </div>
      </div>

      {/* --------------------------------------- add to calendar */}
      <div className="mt-6 w-full">
        <p className="flex items-center justify-center gap-2 text-[13px] font-medium text-sand-700">
          <CalendarPlus aria-hidden className="size-4" strokeWidth={1.75} />
          {t("booking.done.addToCalendar")}
        </p>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noreferrer"
            className={CALENDAR_BUTTON}
          >
            {t("booking.done.calGoogle")}
          </a>
          <button
            type="button"
            className={CALENDAR_BUTTON}
            onClick={() => downloadIcs(event, `${tenant.slug}-${date}.ics`)}
          >
            {t("booking.done.calApple")}
          </button>
          <button
            type="button"
            className={CALENDAR_BUTTON}
            onClick={() => downloadIcs(event, `${tenant.slug}-${date}.ics`)}
          >
            {t("booking.done.calOutlook")}
          </button>
        </div>
      </div>

      <div className="mt-3 grid w-full grid-cols-2 gap-2">
        <a
          href={mapsUrl(tenant)}
          target="_blank"
          rel="noreferrer"
          className={cn(CALENDAR_BUTTON, "h-11 gap-2")}
        >
          <Navigation aria-hidden className="size-[17px]" strokeWidth={1.75} />
          {t("booking.done.directions")}
        </a>
        <Link href={manageHref} className={cn(CALENDAR_BUTTON, "h-11")}>
          {t("booking.done.manage")}
        </Link>
      </div>

      {/* ------------------------------------------------- app card */}
      <div className="mt-6 flex w-full items-center gap-3.5 rounded-xl border border-cobalt/15 bg-cobalt-soft p-4 text-left">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-md bg-cobalt text-white"
        >
          <Smartphone className="size-[18px]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-ink">
            {t("booking.done.appTitle")}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-4 text-sand-700">
            {t("booking.done.appBody")}
          </p>
        </div>
        <Link
          href="/app"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-ink px-3 text-[13px] font-medium text-paper transition-opacity hover:opacity-90"
        >
          {t("common.download")}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>

      <Link
        href={`/b/${tenant.slug}`}
        className="mt-5 text-[13px] font-medium text-muted underline underline-offset-2 hover:text-ink"
      >
        {t("booking.done.backToCompany")}
      </Link>
    </div>
  );
}

const CALENDAR_BUTTON = cn(
  "inline-flex h-10 items-center justify-center rounded-md border border-line bg-white",
  "text-[13px] font-medium text-ink shadow-xs transition-colors hover:bg-sand-50",
);
