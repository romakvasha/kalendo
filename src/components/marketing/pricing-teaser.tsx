"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { Badge, Button, Card } from "@/components/ui";
import { useT } from "@/lib/i18n";
import type { PlanKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Container, SectionHeading } from "./section";
import { Reveal } from "./reveal";

const PLAN_FEATURES: Record<PlanKey, string[]> = {
  start: [
    "landing.planFeatures.start.calendar",
    "landing.planFeatures.start.one",
    "landing.planFeatures.start.reminders",
    "landing.planFeatures.start.clients",
  ],
  pro: [
    "landing.planFeatures.pro.everything",
    "landing.planFeatures.pro.team",
    "landing.planFeatures.pro.sms",
    "landing.planFeatures.pro.reports",
  ],
  max: [
    "landing.planFeatures.max.everything",
    "landing.planFeatures.max.locations",
    "landing.planFeatures.max.marketing",
    "landing.planFeatures.max.ai",
  ],
};

const PLANS: PlanKey[] = ["start", "pro", "max"];

export function PricingTeaser() {
  const t = useT();
  const router = useRouter();

  return (
    <section id="pricing" className="scroll-mt-20 border-b border-line bg-sand-50">
      <Container className="py-14 sm:py-20">
        <Reveal>
          <SectionHeading
            align="center"
            title={t("landing.pricingTitle")}
            lead={t("landing.pricingSubtitle")}
          />
        </Reveal>

        <ul className="mt-10 grid gap-4 sm:mt-12 lg:grid-cols-3 lg:items-start">
          {PLANS.map((plan, index) => {
            const highlighted = plan === "pro";
            return (
              <li key={plan}>
                <Reveal delay={index * 90} className="h-full">
                  <Card
                    className={cn(
                      "flex h-full flex-col p-5 sm:p-6",
                      highlighted && "border-brand/30 shadow-md lg:-mt-3 lg:pb-8",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-[24px] leading-none text-ink">
                        {t(`landing.plans.${plan}.name`)}
                      </h3>
                      {highlighted ? (
                        <Badge tone="brand" size="sm">
                          {t("landing.pricingPopular")}
                        </Badge>
                      ) : null}
                    </div>

                    <p className="mt-2 min-h-[40px] text-[13px] leading-5 text-muted">
                      {t(`landing.plans.${plan}.desc`)}
                    </p>

                    <p className="mt-4 flex items-baseline gap-1">
                      <span
                        className={cn(
                          "tabular font-display text-[34px] leading-none",
                          highlighted ? "text-brand" : "text-ink",
                        )}
                      >
                        {t(`landing.plans.${plan}.price`)}
                      </span>
                      <span className="text-[13px] text-muted">
                        {t("common.perMonth")}
                      </span>
                    </p>

                    <ul className="mt-5 flex flex-1 flex-col gap-2.5 border-t border-line pt-5">
                      {PLAN_FEATURES[plan].map((featureKey) => (
                        <li key={featureKey} className="flex items-start gap-2.5">
                          <Check
                            aria-hidden
                            className={cn(
                              "mt-0.5 size-4 shrink-0",
                              highlighted ? "text-brand" : "text-success",
                            )}
                            strokeWidth={2.25}
                          />
                          <span className="text-[13.5px] leading-5 text-sand-700">
                            {t(featureKey)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      block
                      className="mt-6"
                      variant={highlighted ? "brand" : "secondary"}
                      onClick={() => router.push("/signup?type=company")}
                    >
                      {t("landing.ctaPrimary")}
                    </Button>
                  </Card>
                </Reveal>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-center text-[12.5px] text-muted">
          {t("landing.pricingNote")}
        </p>
      </Container>
    </section>
  );
}
