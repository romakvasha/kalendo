"use client";

import { useState } from "react";

import { productsOf, type DataState } from "@/lib/data";
import { money } from "@/lib/format";
import { useLocale, useT, useTl } from "@/lib/i18n";
import type { Appointment, PaymentRecord, Tenant } from "@/lib/types";
import {
  Button,
  Checkbox,
  Chip,
  ChipRow,
  Field,
  Modal,
  Select,
} from "@/components/ui";

const METHODS: { value: PaymentRecord["method"]; key: string }[] = [
  { value: "cash", key: "cash" },
  { value: "card", key: "card" },
  { value: "blik", key: "blik" },
  { value: "transfer", key: "transfer" },
];

export interface SettleInput {
  method: PaymentRecord["method"];
  productId: string | null;
  invoice: boolean;
  amount: number;
}

export interface SettleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: DataState;
  tenant: Tenant;
  /** Mounted per appointment, so the initial state is the reset. */
  appointment: Appointment;
  due: number;
  onConfirm: (input: SettleInput) => void;
}

export function SettleModal({
  open,
  onOpenChange,
  state,
  tenant,
  due,
  onConfirm,
}: SettleModalProps) {
  const t = useT();
  const tl = useTl();
  const locale = useLocale();

  const [method, setMethod] = useState<PaymentRecord["method"]>("blik");
  const [productId, setProductId] = useState("");
  const [invoice, setInvoice] = useState(false);

  const products = productsOf(state, tenant.id);
  const product = products.find((entry) => entry.id === productId);
  const amount = due + (product?.price ?? 0);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("panel.calendar.settle", { amount: money(amount, locale) })}
      size="sm"
      closeLabel={t("common.close")}
      footer={
        <Button
          block
          onClick={() =>
            onConfirm({ method, productId: productId || null, invoice, amount })
          }
        >
          {t("common.confirm")}
        </Button>
      }
    >
      <div className="space-y-5">
        <Field label={t("panel.payments.method")}>
          <ChipRow>
            {METHODS.map((entry) => (
              <Chip
                key={entry.value}
                active={method === entry.value}
                onClick={() => setMethod(entry.value)}
              >
                {t(`panel.payments.methods.${entry.key}`)}
              </Chip>
            ))}
          </ChipRow>
        </Field>

        {products.length > 0 ? (
          <Field
            label={t("panel.inventory.addProduct")}
            hint={t("common.optional")}
            htmlFor="settle-product"
          >
            <Select
              id="settle-product"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              options={[
                { value: "", label: t("common.none") },
                ...products.map((entry) => ({
                  value: entry.id,
                  label: `${tl(entry.name)} · ${money(entry.price, locale)}`,
                })),
              ]}
            />
          </Field>
        ) : null}

        <Checkbox
          checked={invoice}
          onChange={(event) => setInvoice(event.target.checked)}
          label={t("panel.calendar.issueInvoice")}
        />

        <div className="flex items-baseline justify-between rounded-lg bg-sand-50 px-4 py-3">
          <span className="text-[13px] text-muted">{t("common.total")}</span>
          <span className="tabular font-display text-[22px] leading-none text-ink">
            {money(amount, locale)}
          </span>
        </div>
      </div>
    </Modal>
  );
}
