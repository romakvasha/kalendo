"use client";

import Link from "next/link";
import { ArrowRight, Scissors, Stethoscope, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BrandProvider } from "@/components/brand/brand-provider";
import { Card } from "@/components/ui";
import { getTenantBySlug, SEED_STATE } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { Container, SectionHeading } from "./section";
import { Reveal } from "./reveal";

interface Audience {
  key: string;
  slug: string;
  icon: LucideIcon;
}

const AUDIENCES: Audience[] = [
  { key: "salon", slug: "aurora", icon: Scissors },
  { key: "clinic", slug: "fizjobalans", icon: Stethoscope },
  { key: "workshop", slug: "garaz44", icon: Wrench },
];

export function AudienceCards() {
  const t = useT();

  return (
    <section id="audience" className="scroll-mt-20 border-b border-line bg-sand-50">
      <Container className="py-14 sm:py-20">
        <Reveal>
          <SectionHeading
            title={t("landing.audienceTitle")}
            titleItalic={t("landing.audienceTitleItalic")}
          />
        </Reveal>

        <ul className="mt-10 grid gap-4 sm:mt-12 lg:grid-cols-3">
          {AUDIENCES.map((audience, index) => {
            const tenant = getTenantBySlug(SEED_STATE, audience.slug);
            if (!tenant) return null;
            const Glyph = audience.icon;

            return (
              <li key={audience.key}>
                <Reveal delay={index * 90} className="h-full">
                  <BrandProvider brand={tenant.brand}>
                    <Card
                      interactive
                      className="relative flex h-full flex-col p-5 sm:p-6"
                    >
                      <span className="inline-grid size-11 place-items-center rounded-md bg-brand-soft text-brand-ink">
                        <Glyph aria-hidden className="size-5" strokeWidth={1.75} />
                      </span>

                      <h3 className="font-display mt-4 text-[22px] leading-tight text-ink">
                        {t(`landing.audience.${audience.key}.title`)}
                      </h3>
                      <p className="mt-2 flex-1 text-[14px] leading-6 text-muted">
                        {t(`landing.audience.${audience.key}.body`)}
                      </p>

                      <Link
                        href={`/b/${tenant.slug}`}
                        className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-ink after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                      >
                        {t("landing.ctaSecondary")}
                        <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
                        <span className="sr-only">— {tenant.name}</span>
                      </Link>
                    </Card>
                  </BrandProvider>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
