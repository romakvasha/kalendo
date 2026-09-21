"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Divider } from "@/components/ui";
import { durationOf, priceOf, useDataState } from "@/lib/data";
import { duration, money, weekdayDayMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Room, Staff, Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { bookHref } from "./helpers";
import { MonthCalendar } from "./month-calendar";
import { SlotGrid } from "./slot-grid";

export interface BookingRailProps {
  tenant: Tenant;
  serviceIds: string[];
  staffId: string | null;
  staff: Staff | undefined;
  room: Room | undefined;
  month: string;
  onMonthChange: (monthISO: string) => void;
  date: string | null;
  onDateChange: (isoDate: string) => void;
  time: string | null;
  onTimeChange: (time: string) => void;
}

export function BookingRail({
  tenant,
  serviceIds,
  staffId,
  staff,
  room,
  month,
  onMonthChange,
  date,
  onDateChange,
  time,
  onTimeChange,
}: BookingRailProps) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();

  const total = priceOf(state, serviceIds);
  const minutes = serviceIds.length ? durationOf(state, serviceIds) : 0;
  const services = state.services.filter((service) =>
    serviceIds.includes(service.id),
  );

  const depositAmount = tenant.deposit.enabled
    ? tenant.deposit.mode === "percent"
      ? Math.round((total * tenant.deposit.value) / 100)
      : tenant.deposit.value
    : 0;

  const ready = serviceIds.length > 0 && Boolean(date) && Boolean(time);

  return (
    <div className="surface p-5">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <StepMark>3</StepMark>
        {t("company.chooseSlot")}
      </p>

      <MonthCalendar
        tenantId={tenant.id}
        serviceIds={serviceIds}
        staffId={staffId}
        month={month}
        onMonthChange={onMonthChange}
        value={date}
        onChange={onDateChange}
      />

      <Divider className="my-4" />

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13.5px] font-medium text-ink">
          {date ? weekdayDayMonth(date, locale) : t("booking.pickDate")}
        </p>
        <p className="truncate text-[12.5px] text-muted">
          {staff ? staff.name : t("company.anyStaff")}
        </p>
      </div>

      <SlotGrid
        className="mt-3"
        tenantId={tenant.id}
        serviceIds={serviceIds}
        staffId={staffId}
        date={date}
        value={time}
        onChange={onTimeChange}
      />

      {serviceIds.length > 0 && (
        <div className="mt-4 rounded-lg border border-line bg-sand-50 p-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 text-[13.5px] font-medium text-ink">
              <span className="line-clamp-1">
                {services.map((service) => tl(service.name)).join(" + ")}
              </span>
              <span className="mt-0.5 block text-[12px] font-normal text-muted">
                {duration(minutes, locale)}
              </span>
            </p>
            <p className="tabular shrink-0 text-[15px] font-medium text-ink">
              {money(total, locale)}
            </p>
          </div>

          {date && time && (
            <p className="mt-2 border-t border-line pt-2 text-[12.5px] text-muted">
              {weekdayDayMonth(date, locale)}, {time}
              {room ? ` · ${tl(room.name)}` : ""}
            </p>
          )}

          {depositAmount > 0 && (
            <p className="mt-2 flex items-baseline justify-between gap-3 text-[12.5px]">
              <span className="text-muted">{t("company.depositOnline")}</span>
              <span className="tabular font-medium text-ink">
                {money(depositAmount, locale)}
              </span>
            </p>
          )}

          <p className="mt-2.5 flex items-start gap-1.5 text-[12px] leading-4 text-success">
            <ShieldCheck aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={1.75} />
            {t("settings.cancellationHours", { hours: tenant.cancellationHours })}
          </p>
        </div>
      )}

      {ready ? (
        <Link
          href={bookHref(tenant.slug, {
            serviceIds,
            staffId,
            date,
            time,
            step: "dane",
          })}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand text-[15px] font-medium text-brand-fg shadow-xs transition-opacity hover:opacity-90"
        >
          {t("company.bookSlot")}
          <ArrowRight aria-hidden className="size-[18px]" />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-4 inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-md bg-brand/40 text-[15px] font-medium text-brand-fg"
        >
          {t("company.bookSlot")}
        </button>
      )}

      <p className="mt-2.5 text-center text-[11.5px] leading-4 text-muted">
        {ready ? t("company.noAccountNote") : t("company.bookHint")}
      </p>
    </div>
  );
}

export function StepMark({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "tabular grid size-5 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-semibold text-brand-fg",
        className,
      )}
    >
      {children}
    </span>
  );
}
