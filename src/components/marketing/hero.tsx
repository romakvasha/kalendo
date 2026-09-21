"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { PhoneFrame } from "@/components/brand/phone-frame";
import { Badge, Button } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { AutomationFloatCard, BookingFloatCard } from "./float-cards";
import { ClientHomeMock } from "./phone-mocks";
import { Container } from "./section";

export function Hero() {
  const t = useT();
  const router = useRouter();
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-sand-50 to-paper">
      <Container className="grid gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)] lg:items-center lg:gap-16 lg:py-24">
        <div className="animate-fade-up">
          <Badge tone="neutral" iconLeft={Sparkles}>
            {t("landing.eyebrow")}
          </Badge>

          <h1 className="font-display mt-5 text-[38px] leading-[1.04] text-ink sm:text-[52px] lg:text-[64px]">
            {t("landing.heroTitle")}{" "}
            <em className="text-cobalt">{t("landing.heroTitleItalic")}</em>
          </h1>

          <p className="mt-5 max-w-[48ch] text-[16px] leading-7 text-muted sm:text-[17px]">
            {t("landing.heroLead")}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              iconRight={ArrowRight}
              className="sm:w-auto"
              block
              onClick={() => router.push("/signup?type=company")}
            >
              {t("landing.finalCta")}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              block
              className="sm:w-auto"
              onClick={() => router.push("/panel")}
            >
              {t("landing.heroCtaSecondary")}
            </Button>
          </div>

          <p className="mt-5 flex items-center gap-2 text-[13px] text-muted">
            <Check aria-hidden className="size-4 shrink-0 text-success" strokeWidth={2.25} />
            {t("landing.ctaNote")}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[375px] lg:max-w-none">
          <PhoneFrame className="mx-auto">
            <ClientHomeMock />
          </PhoneFrame>

          <motion.div
            className="absolute -left-14 top-28 hidden w-[258px] xl:block"
            animate={reduced ? undefined : { y: [0, -10, 0] }}
            transition={
              reduced
                ? undefined
                : { duration: 7, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <BookingFloatCard />
          </motion.div>

          <motion.div
            className="absolute -right-10 bottom-24 hidden w-[232px] xl:block"
            animate={reduced ? undefined : { y: [0, 12, 0] }}
            transition={
              reduced
                ? undefined
                : { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }
            }
          >
            <AutomationFloatCard />
          </motion.div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2 xl:hidden">
          <BookingFloatCard />
          <AutomationFloatCard />
        </div>
      </Container>
    </section>
  );
}
