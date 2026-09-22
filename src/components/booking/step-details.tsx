"use client";

import { useId, useState } from "react";
import { BadgePercent, Check, ChevronDown } from "lucide-react";

import {
  Button,
  Checkbox,
  Chip,
  Field,
  Input,
  PhoneInput,
  Select,
} from "@/components/ui";
import { money, weekdayDayMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { BookingDraft, CustomField, PaymentRecord, Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The slice of the draft this step owns; the rest lives in the URL. */
export type ContactDraft = Pick<
  BookingDraft,
  | "customFields"
  | "contact"
  | "paymentChoice"
  | "paymentMethod"
  | "voucherCode"
  | "marketingConsent"
  | "termsAccepted"
  | "createAccount"
>;

export interface PaymentOption {
  choice: BookingDraft["paymentChoice"];
  title: string;
  note: string;
}

export interface StepDetailsProps {
  tenant: Tenant;
  draft: BookingDraft;
  onDraftChange: (patch: Partial<ContactDraft>) => void;
  paymentOptions: PaymentOption[];
  methods: PaymentRecord["method"][];
  serviceSummary: string;
  total: number;
  dueNow: number;
  discount: number;
  onApplyCode: (code: string) => boolean;
  errors: Record<string, string>;
}

export function StepDetails({
  tenant,
  draft,
  onDraftChange,
  paymentOptions,
  methods,
  serviceSummary,
  total,
  dueNow,
  discount,
  onApplyCode,
  errors,
}: StepDetailsProps) {
  const { t, tl, locale } = useI18n();
  const nameId = useId();
  const phoneId = useId();
  const emailId = useId();

  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const payingNow = draft.paymentChoice !== "on-site";

  function applyCode() {
    const ok = onApplyCode(code);
    setCodeError(ok ? null : t("errors.code"));
  }

  return (
    <div className="animate-fade-up flex flex-col gap-7">
      {/* --------------------------------------- tenant custom fields */}
      {tenant.customFields.length > 0 && (
        <section>
          <h2 className="text-[15px] font-semibold text-ink">
            {t(`booking.customTitle.${tenant.industry}`)}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {tenant.customFields.map((field) => (
              <CustomFieldControl
                key={field.id}
                field={field}
                value={draft.customFields[field.id] ?? ""}
                error={errors[`custom.${field.id}`]}
                label={tl(field.label)}
                onChange={(value) =>
                  onDraftChange({
                    customFields: { ...draft.customFields, [field.id]: value },
                  })
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* --------------------------------------------------- contact */}
      <section>
        <h2 className="text-[15px] font-semibold text-ink">
          {t("booking.detailsTitle")}
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          <Field
            label={t("booking.name")}
            htmlFor={nameId}
            required
            error={errors.name}
          >
            <Input
              id={nameId}
              autoComplete="name"
              placeholder="Julia Wiśniewska"
              value={draft.contact.name}
              invalid={Boolean(errors.name)}
              onChange={(event) =>
                onDraftChange({
                  contact: { ...draft.contact, name: event.target.value },
                })
              }
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={t("booking.phone")}
              htmlFor={phoneId}
              required
              error={errors.phone}
            >
              <PhoneInput
                id={phoneId}
                placeholder="512 340 118"
                value={draft.contact.phone}
                invalid={Boolean(errors.phone)}
                onChange={(event) =>
                  onDraftChange({
                    contact: { ...draft.contact, phone: event.target.value },
                  })
                }
              />
            </Field>

            <Field
              label={t("booking.email")}
              htmlFor={emailId}
              error={errors.email}
            >
              <Input
                id={emailId}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="julia@example.com"
                value={draft.contact.email}
                invalid={Boolean(errors.email)}
                onChange={(event) =>
                  onDraftChange({
                    contact: { ...draft.contact, email: event.target.value },
                  })
                }
              />
            </Field>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-cobalt/15 bg-cobalt-soft px-3.5 py-3">
          <Checkbox
            checked={draft.createAccount}
            onChange={(event) =>
              onDraftChange({ createAccount: event.target.checked })
            }
            label={
              <span>
                <span className="font-medium">{t("booking.createAccount")}</span>
                <span className="mt-0.5 block text-[12.5px] leading-4 text-sand-700">
                  {t("booking.createAccountNote")}
                </span>
              </span>
            }
          />
        </div>
      </section>

      {/* --------------------------------------------------- payment */}
      <section>
        <h2 className="text-[15px] font-semibold text-ink">
          {t("booking.paymentTitle")}
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {paymentOptions.map((option) => (
            <label
              key={option.choice}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors duration-150",
                draft.paymentChoice === option.choice
                  ? "border-ink bg-sand-50"
                  : "border-line bg-card hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name="payment-choice"
                className="mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-full border border-line-strong bg-card transition-all duration-150 checked:border-[6px] checked:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25"
                checked={draft.paymentChoice === option.choice}
                onChange={() => onDraftChange({ paymentChoice: option.choice })}
              />
              <span className="min-w-0">
                <span className="block text-[14px] font-medium text-ink">
                  {option.title}
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-4 text-muted">
                  {option.note}
                </span>
              </span>
            </label>
          ))}
        </div>

        {payingNow && (
          <div className="mt-3 flex flex-wrap gap-2">
            {methods.map((method) => (
              <Chip
                key={method}
                active={draft.paymentMethod === method}
                onClick={() => onDraftChange({ paymentMethod: method })}
              >
                {t(`booking.methods.${methodKey(method)}`)}
              </Chip>
            ))}
          </div>
        )}

        {/* ------------------------------------------------- voucher */}
        <div className="mt-3 overflow-hidden rounded-lg border border-line bg-card">
          <button
            type="button"
            aria-expanded={codeOpen}
            onClick={() => setCodeOpen((open) => !open)}
            className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-sand-50"
          >
            <BadgePercent
              aria-hidden
              className="size-[17px] shrink-0 text-sand-600"
              strokeWidth={1.75}
            />
            <span className="flex-1 text-[13.5px] font-medium text-ink">
              {t("booking.discountCode")}
            </span>
            <ChevronDown
              aria-hidden
              className={cn(
                "size-4 shrink-0 text-sand-500 transition-transform duration-200",
                codeOpen && "rotate-180",
              )}
            />
          </button>

          {codeOpen && (
            <div className="border-t border-line px-3.5 py-3">
              <div className="flex gap-2">
                <Input
                  placeholder={t("booking.codePlaceholder")}
                  value={code}
                  invalid={Boolean(codeError)}
                  onChange={(event) => {
                    setCode(event.target.value.toUpperCase());
                    setCodeError(null);
                  }}
                />
                <Button variant="secondary" onClick={applyCode}>
                  {t("booking.codeApply")}
                </Button>
              </div>
              {codeError && (
                <p className="mt-1.5 text-xs font-medium text-danger">
                  {codeError}
                </p>
              )}
              {discount > 0 && draft.voucherCode && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-success">
                  <Check aria-hidden className="size-3.5" strokeWidth={3} />
                  {t("booking.codeApplied", {
                    code: draft.voucherCode,
                    amount: money(discount, locale),
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------- consents */}
      <section className="flex flex-col gap-3">
        <Checkbox
          checked={draft.termsAccepted}
          onChange={(event) =>
            onDraftChange({ termsAccepted: event.target.checked })
          }
          label={t("booking.terms")}
        />
        {errors.terms && (
          <p className="-mt-1.5 text-xs font-medium text-danger">
            {errors.terms}
          </p>
        )}
        <Checkbox
          checked={draft.marketingConsent}
          onChange={(event) =>
            onDraftChange({ marketingConsent: event.target.checked })
          }
          label={t("booking.marketingConsent")}
        />
      </section>

      {/* --------------------------------------------------- summary */}
      <section className="rounded-lg border border-line bg-sand-50 p-4">
        <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
          <span className="min-w-0 truncate text-sand-700">{serviceSummary}</span>
          <span className="tabular shrink-0 font-medium text-ink">
            {money(total, locale)}
          </span>
        </div>

        {draft.date && draft.time && (
          <p className="mt-1.5 text-[12.5px] text-muted">
            {weekdayDayMonth(draft.date, locale)}, {draft.time}
          </p>
        )}

        {discount > 0 && (
          <div className="mt-2 flex items-baseline justify-between gap-3 text-[13px] text-success">
            <span>{t("booking.discountCode")}</span>
            <span className="tabular font-medium">
              −{money(discount, locale)}
            </span>
          </div>
        )}

        <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-3">
          <span className="text-[13.5px] text-sand-700">
            {payingNow ? t("booking.toPay") : t("booking.toPayOnSite")}
          </span>
          <span className="tabular font-display text-[26px] leading-7 text-ink">
            {money(dueNow, locale)}
          </span>
        </div>
      </section>
    </div>
  );
}

function methodKey(method: PaymentRecord["method"]): string {
  if (method === "apple-pay") return "applePay";
  if (method === "google-pay") return "googlePay";
  return method;
}

interface CustomFieldControlProps {
  field: CustomField;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function CustomFieldControl({
  field,
  label,
  value,
  error,
  onChange,
}: CustomFieldControlProps) {
  const t = useI18n().t;
  const id = useId();

  return (
    <Field
      className={field.half ? undefined : "sm:col-span-2"}
      label={label}
      htmlFor={id}
      required={field.required}
      error={error}
    >
      {field.type === "select" ? (
        <Select
          id={id}
          value={value}
          placeholder={t("common.select")}
          invalid={Boolean(error)}
          options={(field.options ?? []).map((option) => ({
            value: option,
            label: option,
          }))}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={field.type === "number" ? "number" : "text"}
          inputMode={field.type === "number" ? "numeric" : undefined}
          placeholder={field.placeholder}
          value={value}
          invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}
