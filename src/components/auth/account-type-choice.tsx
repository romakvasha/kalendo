"use client";

import { Check, Store, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Segmented } from "@/components/ui";
import { useT } from "@/lib/i18n";
import type { AccountKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: AccountKind; icon: LucideIcon }[] = [
  { value: "client", icon: UserRound },
  { value: "company", icon: Store },
];

const COPY_KEY: Record<AccountKind, string> = {
  client: "auth.typeClient",
  company: "auth.typeCompany",
};

export interface AccountTypeChoiceProps {
  value: AccountKind;
  onChange: (value: AccountKind) => void;
}

export function AccountTypeChoice({ value, onChange }: AccountTypeChoiceProps) {
  const t = useT();

  return (
    <div>
      <p className="mb-3 text-[13px] font-medium text-sand-700">
        {t("auth.chooseType")}
      </p>

      <Segmented
        block
        className="sm:hidden"
        value={value}
        onChange={(next) => onChange(next as AccountKind)}
        options={OPTIONS.map((option) => ({
          value: option.value,
          label: t(`${COPY_KEY[option.value]}.title`),
        }))}
      />

      <div
        role="radiogroup"
        aria-label={t("auth.chooseType")}
        className="hidden gap-3 sm:grid sm:grid-cols-2"
      >
        {OPTIONS.map((option) => {
          const selected = option.value === value;
          const Glyph = option.icon;
          return (
            <label
              key={option.value}
              className={cn(
                "relative flex cursor-pointer flex-col rounded-lg border bg-card p-4 text-left",
                "transition-[border-color,box-shadow] duration-150",
                "focus-within:ring-2 focus-within:ring-cobalt/25 focus-within:ring-offset-1",
                selected
                  ? "border-ink shadow-xs"
                  : "border-line hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name="accountType"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />

              <span
                aria-hidden
                className={cn(
                  "absolute top-3.5 right-3.5 grid size-5 place-items-center rounded-full border transition-colors duration-150",
                  selected
                    ? "border-ink bg-ink text-paper"
                    : "border-line-strong bg-card",
                )}
              >
                {selected ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>

              <Glyph
                aria-hidden
                className={cn("size-5", selected ? "text-ink" : "text-sand-500")}
                strokeWidth={1.75}
              />
              <span className="mt-3 text-[15px] font-semibold text-ink">
                {t(`${COPY_KEY[option.value]}.title`)}
              </span>
              <span className="mt-1 text-[13px] leading-5 text-muted">
                {t(`${COPY_KEY[option.value]}.body`)}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
