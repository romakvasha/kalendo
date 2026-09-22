"use client";

import { Check } from "lucide-react";

import {
  AutomationFloatCard,
  BookingFloatCard,
  RevenueFloatCard,
} from "@/components/marketing/float-cards";
import { LOCALE_LABELS, useT } from "@/lib/i18n";
import { LOCALES } from "@/lib/types";

const PROMISE_KEYS = [
  "landing.features.booking.title",
  "landing.features.reminders.title",
  "landing.features.payments.title",
  "landing.features.calendar.title",
  "landing.features.clients.title",
  "landing.features.insights.title",
];

export interface AuthAsideProps {
  /** Login drops the card stack — the panel sits beside a much shorter form. */
  compact?: boolean;
}

export function AuthAside({ compact = false }: AuthAsideProps) {
  const t = useT();

  return (
    <div className="flex h-full flex-col">
      <span className="inline-flex w-fit items-center rounded-full border border-paper/15 bg-paper/10 px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-paper/80 uppercase">
        {t("landing.footer.forBusiness")}
      </span>

      <h2 className="font-display mt-6 text-[34px] leading-[1.08] text-paper xl:text-[40px]">
        {t("landing.heroTitle")}{" "}
        <em className="text-cobalt">{t("landing.heroTitleItalic")}</em>
      </h2>

      <p className="mt-4 max-w-[46ch] text-[14.5px] leading-7 text-paper/70">
        {t("landing.heroLead")}
      </p>

      <ul className="mt-7 grid grid-cols-2 gap-x-5 gap-y-3">
        {PROMISE_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-2">
            <Check
              aria-hidden
              className="mt-0.5 size-3.5 shrink-0 text-cobalt"
              strokeWidth={2.5}
            />
            <span className="text-[13px] leading-5 text-paper/80">{t(key)}</span>
          </li>
        ))}
      </ul>

      {compact ? null : (
        <div className="relative mt-10 mb-4 min-h-[300px] flex-1">
          <BookingFloatCard className="absolute top-0 left-0 w-[260px] max-w-full" />
          <AutomationFloatCard className="absolute top-[132px] right-0 w-[236px] max-w-full" />
          <RevenueFloatCard className="absolute bottom-0 left-8 w-[212px] max-w-full" />
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-paper/10 pt-5 text-[12px] text-paper/55">
        <span>{t("landing.platforms")}</span>
        <span>{LOCALES.map((locale) => LOCALE_LABELS[locale].name).join(" · ")}</span>
      </div>
    </div>
  );
}
