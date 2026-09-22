"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { Container } from "./section";
import { Reveal } from "./reveal";

export function FinalCta() {
  const t = useT();
  const router = useRouter();

  return (
    <section className="bg-ink">
      <Container className="py-16 sm:py-24">
        <Reveal className="mx-auto max-w-[46ch] text-center">
          <h2 className="font-display text-[32px] leading-[1.08] text-paper sm:text-[44px] lg:text-[52px]">
            {t("landing.finalTitle")}{" "}
            <em className="text-paper/60">{t("landing.finalTitleItalic")}</em>
          </h2>

          <p className="mt-4 text-[15px] leading-7 text-paper/70 sm:text-base">
            {t("landing.finalLead")}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              variant="secondary"
              iconRight={ArrowRight}
              block
              className="sm:w-auto"
              onClick={() => router.push("/signup?type=company")}
            >
              {t("landing.finalCta")}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              block
              className="text-paper hover:bg-paper/10 sm:w-auto"
              onClick={() => router.push("/b/aurora")}
            >
              {t("landing.ctaSecondary")}
            </Button>
          </div>

          <p className="mt-6 text-[12.5px] text-paper/55">{t("landing.ctaNote")}</p>
        </Reveal>
      </Container>
    </section>
  );
}
