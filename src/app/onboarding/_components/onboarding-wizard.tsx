"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button, IconButton, Skeleton } from "@/components/ui";
import { useHydrated, useKalendo } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import type { Industry } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  demoTenantId,
  seededHours,
  seededServices,
  slugify,
  type MemberDraft,
  type OnboardingDraft,
} from "./draft";
import { StepDetails } from "./step-details";
import { StepHours } from "./step-hours";
import { StepIndustry } from "./step-industry";
import { StepServices } from "./step-services";
import { StepTeam } from "./step-team";

const STEPS = ["details", "industry", "services", "hours", "team"] as const;
type StepKey = (typeof STEPS)[number];

const NEXT_LABEL_KEYS: Record<StepKey, string> = {
  details: "onboarding.nextIndustry",
  industry: "onboarding.nextServices",
  services: "onboarding.nextHours",
  hours: "onboarding.nextTeam",
  team: "onboarding.finish",
};

const COPY_KEYS: Record<StepKey, { title: string; lead: string }> = {
  details: { title: "onboarding.detailsTitle", lead: "onboarding.detailsBody" },
  industry: {
    title: "onboarding.industryQuestion",
    lead: "onboarding.industryNote",
  },
  services: {
    title: "onboarding.servicesTitle",
    lead: "onboarding.servicesBody",
  },
  hours: { title: "onboarding.hoursTitle", lead: "onboarding.hoursBody" },
  team: { title: "onboarding.teamTitle", lead: "onboarding.teamBody" },
};

const INITIAL_INDUSTRY: Industry = "hair";

export function OnboardingWizard() {
  const { t, tl } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const account = useKalendo((state) => state.account);
  const signInAsCompany = useKalendo((state) => state.signInAsCompany);

  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<OnboardingDraft>(() => ({
    companyName: "",
    city: "",
    address: "",
    phone: "",
    industry: INITIAL_INDUSTRY,
    slug: slugify(""),
    slugEdited: false,
    services: seededServices(INITIAL_INDUSTRY, tl),
    hours: seededHours(INITIAL_INDUSTRY),
  }));

  // null means "still following the signed-in owner", which only arrives
  // after the persisted store rehydrates.
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [ownerRole, setOwnerRole] = useState<string | null>(null);
  const [extraMembers, setExtraMembers] = useState<MemberDraft[]>([]);

  const team: MemberDraft[] = [
    {
      id: "owner",
      name: ownerName ?? account?.name ?? "",
      role: ownerRole ?? t("onboarding.owner"),
      owner: true,
    },
    ...extraMembers,
  ];

  const step = STEPS[index];

  const patch = (next: Partial<OnboardingDraft>) =>
    setDraft((current) => {
      const merged = { ...current, ...next };
      if (next.companyName !== undefined && !merged.slugEdited) {
        merged.slug = slugify(next.companyName);
      }
      return merged;
    });

  const changeIndustry = (industry: Industry) =>
    setDraft((current) => ({
      ...current,
      industry,
      services: seededServices(industry, tl),
      hours: seededHours(industry),
    }));

  const setTeam = (next: MemberDraft[]) => {
    const owner = next.find((member) => member.owner);
    if (owner) {
      setOwnerName(owner.name);
      setOwnerRole(owner.role);
    }
    setExtraMembers(next.filter((member) => !member.owner));
  };

  const finish = () => {
    // signInAsCompany also makes that tenant the active one for the panel.
    signInAsCompany(demoTenantId(draft.industry));
    toast.success(t("toast.companyReady"));
    router.push("/panel");
  };

  const goBack = () => {
    if (index === 0) {
      router.back();
      return;
    }
    setErrors({});
    setIndex(index - 1);
  };

  const goNext = () => {
    if (step === "details" && !draft.companyName.trim()) {
      setErrors({ companyName: t("errors.required") });
      return;
    }
    setErrors({});
    if (index === STEPS.length - 1) {
      finish();
      return;
    }
    setIndex(index + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const stepName = t(`onboarding.steps.${step}`);
  const stepLabel = `${t("onboarding.stepOf", {
    current: index + 1,
    total: STEPS.length,
  })} · ${stepName}`;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[680px] px-4 sm:px-6 lg:px-0">
          <div className="flex h-14 items-center justify-between gap-2">
            <IconButton size="sm" aria-label={t("a11y.back")} onClick={goBack}>
              <ArrowLeft />
            </IconButton>

            <p className="min-w-0 truncate text-center text-[12.5px] font-medium text-sand-600">
              {stepLabel}
            </p>

            <Button variant="ghost" size="sm" onClick={finish}>
              {t("onboarding.skip")}
            </Button>
          </div>

          <div
            role="progressbar"
            aria-label={stepLabel}
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            className="flex items-center gap-1.5 pb-3"
          >
            {STEPS.map((key, position) => (
              <span
                key={key}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  position <= index ? "bg-cobalt" : "bg-sand-200",
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[680px] px-4 py-8 sm:px-6 lg:px-0 lg:py-12">
          <h1 className="font-display text-[28px] leading-tight text-ink sm:text-[34px]">
            {t(COPY_KEYS[step].title)}
          </h1>
          <p className="mt-2 text-[14.5px] leading-6 text-muted">
            {t(COPY_KEYS[step].lead)}
          </p>

          <div className="mt-7">
            {!hydrated ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-11 rounded-md" />
                <Skeleton className="h-11 rounded-md" />
                <Skeleton className="h-11 w-2/3 rounded-md" />
              </div>
            ) : (
              <>
                {step === "details" ? (
                  <StepDetails draft={draft} onChange={patch} errors={errors} />
                ) : null}
                {step === "industry" ? (
                  <StepIndustry
                    draft={draft}
                    onChange={patch}
                    onIndustryChange={changeIndustry}
                  />
                ) : null}
                {step === "services" ? (
                  <StepServices
                    services={draft.services}
                    onChange={(services) => patch({ services })}
                  />
                ) : null}
                {step === "hours" ? (
                  <StepHours
                    hours={draft.hours}
                    onChange={(hours) => patch({ hours })}
                  />
                ) : null}
                {step === "team" ? (
                  <StepTeam draft={draft} team={team} onChange={setTeam} />
                ) : null}
              </>
            )}
          </div>
        </div>
      </main>

      <div className="pb-safe sticky bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[680px] px-4 py-3 sm:px-6 lg:px-0">
          <Button
            size="lg"
            block
            iconRight={ArrowRight}
            disabled={!hydrated}
            onClick={goNext}
          >
            {t(NEXT_LABEL_KEYS[step])}
          </Button>
        </div>
      </div>
    </>
  );
}
