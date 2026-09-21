"use client";

import { Check } from "lucide-react";

import { useT } from "@/lib/i18n";
import { Container, SectionHeading } from "./section";
import { Reveal } from "./reveal";

interface SystemColumn {
  key: string;
  titleKey: string;
  itemKeys: string[];
}

const COLUMNS: SystemColumn[] = [
  {
    key: "booking",
    titleKey: "nav.groups.booking",
    itemKeys: [
      "landing.system.booking.online",
      "landing.system.booking.page",
      "landing.system.booking.reminders",
      "landing.system.booking.deposits",
      "landing.system.booking.waitlist",
      "landing.system.booking.sources",
    ],
  },
  {
    key: "panel",
    titleKey: "nav.panel",
    itemKeys: [
      "landing.system.panel.calendar",
      "landing.system.panel.clients",
      "landing.system.panel.payments",
      "landing.system.panel.team",
      "landing.system.panel.inventory",
      "landing.system.panel.roles",
    ],
  },
  {
    key: "growth",
    titleKey: "nav.groups.growth",
    itemKeys: [
      "landing.system.growth.reports",
      "landing.system.growth.sources",
      "landing.system.growth.campaigns",
      "landing.system.growth.reviews",
      "landing.system.growth.loyalty",
      "landing.system.growth.ai",
    ],
  },
];

export function SystemColumns() {
  const t = useT();

  return (
    <section id="features" className="scroll-mt-20 border-b border-line bg-paper">
      <Container className="py-14 sm:py-20">
        <Reveal>
          <SectionHeading
            title={t("landing.system.title")}
            titleItalic={t("landing.system.titleItalic")}
            lead={t("landing.featuresSubtitle")}
          />
        </Reveal>

        <div className="mt-10 grid gap-10 sm:mt-12 lg:grid-cols-3 lg:gap-12">
          {COLUMNS.map((column, index) => (
            <Reveal key={column.key} delay={index * 90}>
              <h3 className="font-display border-b border-line pb-3 text-[22px] leading-tight text-ink">
                {t(column.titleKey)}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {column.itemKeys.map((itemKey) => (
                  <li key={itemKey} className="flex items-start gap-2.5">
                    <Check
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-cobalt"
                      strokeWidth={2.25}
                    />
                    <span className="text-[14px] leading-6 text-sand-700">
                      {t(itemKey)}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        <p className="mt-10 text-right text-[12.5px] text-sand-500">
          {t("landing.system.note")}
        </p>
      </Container>
    </section>
  );
}
