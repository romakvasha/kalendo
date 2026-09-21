"use client";

import { useId, useState } from "react";
import { Gift } from "lucide-react";
import { toast } from "sonner";

import { Button, Chip, Field, Input, Modal } from "@/components/ui";
import { money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";

const AMOUNTS = [100, 150, 200, 300, 500];

export interface GiftCardProps {
  tenant: Tenant;
  className?: string;
}

export function GiftCard({ tenant, className }: GiftCardProps) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(AMOUNTS[0]);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const emailId = useId();

  const emailValid = /.+@.+\..+/.test(email);

  function buy() {
    setTouched(true);
    if (!emailValid) return;
    setOpen(false);
    setTouched(false);
    setEmail("");
    toast.success(t("toast.voucherSold"));
  }

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-brand/20 bg-brand-soft/70 p-4 lg:p-5",
          className,
        )}
      >
        <span className="inline-grid size-9 place-items-center rounded-md bg-brand text-brand-fg">
          <Gift aria-hidden className="size-[18px]" strokeWidth={1.75} />
        </span>
        <p className="font-display mt-3 text-[22px] leading-7 text-ink">
          {t("company.voucher")}
        </p>
        <p className="mt-1 text-[13px] leading-5 text-sand-700">
          {t("company.voucherFrom", { amount: money(AMOUNTS[0], locale) })}
        </p>
        <Button
          variant="brand"
          size="sm"
          className="mt-3.5"
          iconLeft={Gift}
          onClick={() => setOpen(true)}
        >
          {t("company.buyVoucher")}
        </Button>
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={t("company.voucher")}
        size="sm"
        closeLabel={t("common.close")}
        footer={
          <Button variant="brand" block onClick={buy}>
            {t("company.buy")} · {money(amount, locale)}
          </Button>
        }
      >
        <p className="text-[13.5px] leading-5 text-muted">
          {t("company.voucherNote")}
        </p>

        <p className="mt-4 text-[13px] font-medium text-sand-700">
          {t("panel.vouchers.value")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AMOUNTS.map((value) => (
            <Chip
              key={value}
              active={amount === value}
              onClick={() => setAmount(value)}
            >
              {money(value, locale)}
            </Chip>
          ))}
        </div>

        <Field
          className="mt-4"
          htmlFor={emailId}
          label={t("company.voucherRecipient")}
          error={touched && !emailValid ? t("errors.email") : undefined}
        >
          <Input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="anna@example.com"
            value={email}
            invalid={touched && !emailValid}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <p className="mt-3 text-[12px] leading-4 text-muted">
          {t("company.voucherDelivery", { name: tenant.name })}
        </p>
      </Modal>
    </>
  );
}
