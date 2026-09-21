"use client";

import { delta, duration, number } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { Container } from "./section";
import { Reveal } from "./reveal";

interface Metric {
  key: string;
  labelKey: string;
  value: (locale: Locale) => string;
}

const METRICS: Metric[] = [
  {
    key: "companies",
    labelKey: "landing.metrics.companies",
    value: (locale) => number(1240, locale),
  },
  {
    key: "bookings",
    labelKey: "landing.metrics.bookings",
    value: (locale) => number(482000, locale),
  },
  {
    key: "noShows",
    labelKey: "landing.metrics.noShows",
    value: (locale) => delta(-0.38, locale),
  },
  {
    key: "setup",
    labelKey: "landing.metrics.setup",
    value: (locale) => duration(12, locale),
  },
];

export function MetricsStrip() {
  const { t, locale } = useI18n();

  return (
    <section className="border-b border-line bg-paper">
      <Container className="py-10 sm:py-12">
        <Reveal>
          <p className="text-center text-[13px] text-muted">{t("landing.trustedBy")}</p>

          <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-y-10 lg:grid-cols-4">
            {METRICS.map((metric) => (
              <div key={metric.key} className="text-center">
                <dt className="sr-only">{t(metric.labelKey)}</dt>
                <dd>
                  <span className="tabular font-display block text-[32px] leading-none text-ink sm:text-[40px]">
                    {metric.value(locale)}
                  </span>
                  <span className="mt-2 block text-[12.5px] leading-5 text-muted">
                    {t(metric.labelKey)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Container>
    </section>
  );
}
