"use client";

import { useId } from "react";

import { Field, Input, PhoneInput } from "@/components/ui";
import { useT } from "@/lib/i18n";
import type { OnboardingDraft } from "./draft";

export interface StepDetailsProps {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
  errors: Record<string, string>;
}

export function StepDetails({ draft, onChange, errors }: StepDetailsProps) {
  const t = useT();
  const ids = useId();

  return (
    <div className="flex flex-col gap-4">
      <Field
        label={t("onboarding.companyName")}
        htmlFor={`${ids}-name`}
        error={errors.companyName}
        required
      >
        <Input
          id={`${ids}-name`}
          value={draft.companyName}
          onChange={(event) => onChange({ companyName: event.target.value })}
          placeholder={t("auth.companyNamePlaceholder")}
          autoComplete="organization"
          invalid={Boolean(errors.companyName)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("onboarding.city")} htmlFor={`${ids}-city`}>
          <Input
            id={`${ids}-city`}
            value={draft.city}
            onChange={(event) => onChange({ city: event.target.value })}
            autoComplete="address-level2"
          />
        </Field>

        <Field label={t("onboarding.address")} htmlFor={`${ids}-address`}>
          <Input
            id={`${ids}-address`}
            value={draft.address}
            onChange={(event) => onChange({ address: event.target.value })}
            autoComplete="street-address"
          />
        </Field>
      </div>

      <Field
        label={t("onboarding.phone")}
        htmlFor={`${ids}-phone`}
        error={errors.phone}
      >
        <PhoneInput
          id={`${ids}-phone`}
          value={draft.phone}
          onChange={(event) => onChange({ phone: event.target.value })}
          placeholder="601 234 567"
          invalid={Boolean(errors.phone)}
        />
      </Field>
    </div>
  );
}
