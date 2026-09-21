"use client";

import { BellRing, Check } from "lucide-react";

import { Stat } from "@/components/ui";
import {
  clientById,
  dayRevenue,
  getTenant,
  NOW_ISO,
  SEED_STATE,
  servicesFor,
  staffById,
} from "@/lib/data";
import { dayMonth, money, timeOf, TODAY } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Appointment } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The newest paid-deposit booking in the seed — the card shows real data. */
function showcaseBooking(): Appointment | undefined {
  const future = SEED_STATE.appointments
    .filter((a) => a.start >= NOW_ISO && a.status !== "cancelled")
    .sort((a, b) => a.start.localeCompare(b.start));
  return future.find((a) => a.payment === "deposit") ?? future[0];
}

const REMINDERS_SENT = SEED_STATE.appointments.filter(
  (a) => a.smsReminderSent,
).length;

export function BookingFloatCard({ className }: { className?: string }) {
  const { t, tl, locale } = useI18n();
  const appointment = showcaseBooking();
  if (!appointment) return null;

  const tenant = getTenant(SEED_STATE, appointment.tenantId);
  const client = clientById(SEED_STATE, appointment.clientId);
  const service = servicesFor(SEED_STATE, appointment.serviceIds)[0];
  const staff = staffById(SEED_STATE, appointment.staffId);
  const deposit = appointment.depositAmount ?? Math.round(appointment.total * 0.2);

  return (
    <div
      className={cn(
        "w-full rounded-lg border border-line bg-white p-4 shadow-lg",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="animate-pulse-ring inline-block size-1.5 rounded-full bg-success"
        />
        <p className="text-[11px] font-medium tracking-[0.06em] text-sand-500 uppercase">
          {t("landing.float.newBooking")}
        </p>
        <span aria-hidden className="text-[11px] text-sand-400">
          ·
        </span>
        <span className="text-[11px] text-sand-400">{t("landing.float.now")}</span>
      </div>

      <p className="mt-2.5 text-[15px] font-semibold text-ink">
        {client?.name ?? tenant?.name}
      </p>
      <p className="mt-0.5 truncate text-[13px] text-muted">{tl(service?.name)}</p>

      <p className="tabular mt-2 text-[12px] text-sand-600">
        {dayMonth(appointment.start, locale)} · {timeOf(appointment.start)} ·{" "}
        {staff?.name}
      </p>

      <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[12px] font-medium text-success">
        <Check aria-hidden className="size-3.5" strokeWidth={2.5} />
        {t("booking.deposit")} {money(deposit, locale)} · {t("booking.methods.blik")}
      </p>
    </div>
  );
}

export function AutomationFloatCard({ className }: { className?: string }) {
  const { t, tn } = useI18n();

  return (
    <div
      className={cn(
        "w-full rounded-lg bg-cobalt p-4 text-white shadow-lg",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <BellRing aria-hidden className="size-4 text-white/80" strokeWidth={1.75} />
        <p className="text-[11px] font-medium tracking-[0.06em] text-white/75 uppercase">
          {t("landing.float.autoTitle")}
        </p>
      </div>
      <p className="mt-2 text-[14px] leading-5 font-medium">
        {t("landing.float.autoBody", {
          count: REMINDERS_SENT,
          people: tn(REMINDERS_SENT, "plurals.peopleTo"),
        })}
      </p>
    </div>
  );
}

export function RevenueFloatCard({ className }: { className?: string }) {
  const { t, locale } = useI18n();
  const revenue = dayRevenue(SEED_STATE, "t_aurora", TODAY);

  return (
    <div
      className={cn(
        "w-full rounded-lg border border-line bg-white p-4 shadow-lg",
        className,
      )}
    >
      <Stat
        label={t("panel.dashboard.revenueToday")}
        value={money(revenue, locale)}
        delta={0.18}
        deltaLabel={t("panel.dashboard.vsLastWeek")}
      />
    </div>
  );
}
