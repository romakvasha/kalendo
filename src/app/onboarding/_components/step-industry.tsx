"use client";

import { useId, useState } from "react";
import { Check, HandHeart, Link2, Plus, Scissors, Sparkles, Stethoscope, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button, Input } from "@/components/ui";
import { useT } from "@/lib/i18n";
import type { Industry } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { OnboardingDraft } from "./draft";

const INDUSTRY_ICONS: Record<Industry, LucideIcon> = {
  hair: Scissors,
  beauty: Sparkles,
  physio: HandHeart,
  dental: Stethoscope,
  auto: Wrench,
  other: Plus,
};

const INDUSTRIES: Industry[] = [
  "hair",
  "beauty",
  "physio",
  "dental",
  "auto",
  "other",
];

export interface StepIndustryProps {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
  onIndustryChange: (industry: Industry) => void;
}

export function StepIndustry({
  draft,
  onChange,
  onIndustryChange,
}: StepIndustryProps) {
  const t = useT();
  const ids = useId();
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <div role="radiogroup" aria-label={t("onboarding.industryQuestion")}>
        <div className="grid grid-cols-2 gap-3">
          {INDUSTRIES.map((industry) => {
            const selected = industry === draft.industry;
            const Glyph = INDUSTRY_ICONS[industry];
            return (
              <label
                key={industry}
                className={cn(
                  "relative flex cursor-pointer flex-col justify-between rounded-lg border bg-white p-3.5 sm:p-4",
                  "transition-[border-color,box-shadow] duration-150",
                  "focus-within:ring-2 focus-within:ring-cobalt/25 focus-within:ring-offset-1",
                  selected
                    ? "border-ink shadow-xs"
                    : "border-line hover:border-line-strong",
                )}
              >
                <input
                  type="radio"
                  name="industry"
                  value={industry}
                  checked={selected}
                  onChange={() => onIndustryChange(industry)}
                  className="sr-only"
                />

                <span
                  aria-hidden
                  className={cn(
                    "absolute top-3 right-3 grid size-5 place-items-center rounded-full border transition-colors duration-150",
                    selected
                      ? "border-ink bg-ink text-paper"
                      : "border-line-strong bg-white",
                  )}
                >
                  {selected ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>

                <Glyph
                  aria-hidden
                  className={cn("size-5", selected ? "text-ink" : "text-sand-500")}
                  strokeWidth={1.75}
                />
                <span className="mt-6 pr-6 text-[13.5px] leading-5 font-medium text-ink">
                  {t(`onboarding.industries.${industry}`)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-line bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-cobalt-soft text-cobalt">
            <Link2 aria-hidden className="size-4" strokeWidth={1.75} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-ink">
              {t("onboarding.linkTitle")}
            </p>

            {editing ? (
              <div className="mt-2 flex items-center gap-2">
                <label htmlFor={`${ids}-slug`} className="sr-only">
                  {t("onboarding.linkTitle")}
                </label>
                <Input
                  id={`${ids}-slug`}
                  value={draft.slug}
                  onChange={(event) =>
                    onChange({ slug: event.target.value, slugEdited: true })
                  }
                  className="h-10"
                  autoFocus
                />
                <Button size="sm" onClick={() => setEditing(false)}>
                  {t("common.done")}
                </Button>
              </div>
            ) : (
              <p className="tabular mt-1 truncate text-[15px] text-cobalt">
                {draft.slug}.kalendo.pl
              </p>
            )}

            <p className="mt-2 text-[12px] leading-5 text-muted">
              {t("onboarding.linkNote")}
            </p>
          </div>

          {editing ? null : (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              {t("onboarding.change")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
