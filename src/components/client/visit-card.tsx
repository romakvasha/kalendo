"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CalendarX,
  MessageCircle,
  Navigation,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { dayMonth, money, timeOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Appointment, Service, Staff, Tenant } from "@/lib/types";
import { mapsHref, nearDayLabel } from "./helpers";
import { ActionTile, DateChip } from "./primitives";

function serviceNames(services: Service[], tl: (value: Service["name"]) => string) {
  return services.map((service) => tl(service.name)).join(" + ");
}

export interface VisitCardProps {
  appointment: Appointment;
  tenant: Tenant;
  staff?: Staff;
  services: Service[];
  onReschedule: () => void;
  onCancel: () => void;
}

export function VisitCard({
  appointment,
  tenant,
  staff,
  services,
  onReschedule,
  onCancel,
}: VisitCardProps) {
  const { t, tl, locale } = useI18n();
  const near = nearDayLabel(t, appointment.start);
  const pending = appointment.status === "pending";

  return (
    <article className="surface p-4 lg:flex lg:items-center lg:gap-4">
      <div className="flex gap-3 lg:min-w-0 lg:flex-1">
        <DateChip iso={appointment.start} />

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-ink">
            <span className="tabular">{timeOf(appointment.start)}</span> ·{" "}
            {tenant.name}
          </p>

          <p className="mt-0.5 truncate text-[13px] text-muted">
            {serviceNames(services, tl)}
            {staff ? ` · ${t("visits.withStaff", { name: staff.name })}` : ""}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge size="sm" tone={pending ? "warn" : "success"}>
              {pending ? t("visits.pending") : t("visits.confirmed")}
            </Badge>

            {near ? (
              <Badge size="sm" tone="neutral" className="bg-warn text-warn-ink">
                {near}
              </Badge>
            ) : null}

            {appointment.payment === "deposit" && appointment.depositAmount ? (
              <Badge size="sm" tone="info">
                {t("visits.depositPaid", {
                  amount: money(appointment.depositAmount, locale),
                })}
              </Badge>
            ) : appointment.payment === "paid" ? (
              <Badge size="sm" tone="info">
                {t("visits.paid")}
              </Badge>
            ) : (
              <Badge size="sm" tone="neutral">
                {t("visits.payOnSite", {
                  amount: money(appointment.total, locale),
                })}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-stretch divide-x divide-line border-t border-line pt-2 lg:mt-0 lg:w-64 lg:shrink-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-1">
        <ActionTile
          icon={<CalendarClock />}
          label={t("visits.short.reschedule")}
          onClick={onReschedule}
        />
        <ActionTile
          icon={<CalendarX />}
          label={t("visits.cancel")}
          tone="danger"
          onClick={onCancel}
        />
        <ActionTile
          icon={<Navigation />}
          label={t("visits.short.directions")}
          href={mapsHref(tenant)}
          external
        />
        <ActionTile
          icon={<MessageCircle />}
          label={t("visits.short.chat")}
          href={`/app/chat?tenant=${tenant.id}`}
        />
      </div>
    </article>
  );
}

export interface HistoryRowProps {
  appointment: Appointment;
  tenant: Tenant;
  services: Service[];
  rating?: number;
  onRate?: (value: number) => void;
}

export function HistoryRow({
  appointment,
  tenant,
  services,
  rating,
  onRate,
}: HistoryRowProps) {
  const { t, tl, locale } = useI18n();
  const bookAgain = `/b/${tenant.slug}?service=${appointment.serviceIds[0] ?? ""}`;

  return (
    <article className="surface-flat p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-muted">
            {dayMonth(appointment.start, locale)}
          </p>
          <p className="mt-0.5 truncate text-[15px] font-medium text-ink">
            {tenant.name}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-muted">
            {serviceNames(services, tl)}
          </p>
        </div>

        <span className="tabular shrink-0 text-[14px] font-medium text-ink">
          {money(appointment.total, locale)}
        </span>
      </div>

      <Link
        href={bookAgain}
        className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-line bg-card px-3.5 text-[13px] font-medium text-ink shadow-xs transition-colors hover:border-line-strong hover:bg-sand-50"
      >
        {t("visits.bookAgain")}
      </Link>

      {onRate ? (
        <RatingPrompt rating={rating} onRate={onRate} />
      ) : null}
    </article>
  );
}

interface RatingPromptProps {
  rating?: number;
  onRate: (value: number) => void;
}

function RatingPrompt({ rating, onRate }: RatingPromptProps) {
  const { t } = useI18n();
  const [hover, setHover] = useState(0);
  const shown = hover || rating || 0;

  return (
    <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
      <span className="text-[12px] text-muted">
        {rating ? t("visits.rated") : t("visits.rate")}
      </span>

      <span className="ml-auto flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={t("a11y.rateStars", { n: value })}
            aria-pressed={rating === value}
            disabled={Boolean(rating)}
            onMouseEnter={() => setHover(value)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(value)}
            onBlur={() => setHover(0)}
            onClick={() => onRate(value)}
            className="rounded-xs p-0.5 disabled:cursor-default"
          >
            <Star
              aria-hidden
              className={cn(
                "size-5 transition-colors",
                value <= shown ? "text-ink" : "text-sand-300",
              )}
              fill="currentColor"
              strokeWidth={0}
            />
          </button>
        ))}
      </span>
    </div>
  );
}
