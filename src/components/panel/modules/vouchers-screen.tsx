"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Gift, Plus, Ticket } from "lucide-react";

import { usePanelSession } from "@/components/layout";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Chip,
  ChipRow,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  Stat,
} from "@/components/ui";
import {
  NOW_ISO,
  clientById,
  membershipsOf,
  useDataState,
  useHydrated,
  useKalendo,
  vouchersOf,
} from "@/lib/data";
import { TODAY, addDays, dayMonth, money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Membership, PaymentRecord, Tenant, Voucher } from "@/lib/types";
import { cn, makeId, sum } from "@/lib/utils";

import { ModuleHeader } from "./module-header";
import { ModuleSkeleton } from "./module-skeleton";

/* ------------------------------------------------------------------ */

const AMOUNT_CHIPS = [100, 150, 200, 300, 500];

type VoucherTab = "gift" | "passes";

export function VouchersScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <ModuleSkeleton rows={4} />;
  return <Vouchers tenant={tenant} />;
}

/* ------------------------------------------------------------------ */

function Vouchers({ tenant }: { tenant: Tenant }) {
  const { t, tn, tl, locale } = useI18n();
  const state = useDataState();

  const vouchers = useMemo(
    () => vouchersOf(state, tenant.id),
    [state, tenant.id],
  );
  const passes = useMemo(
    () => membershipsOf(state, tenant.id),
    [state, tenant.id],
  );

  const [tab, setTab] = useState<VoucherTab>("gift");
  const [selling, setSelling] = useState(false);

  const active = vouchers.filter((voucher) => !voucher.usedAt);
  const activeValue = sum(
    active.filter((voucher) => voucher.kind === "gift").map((v) => v.value),
  );

  function sellVoucher(amount: number, buyer: string, email: string) {
    const voucher: Voucher = {
      id: makeId("vch"),
      tenantId: tenant.id,
      code: `${tenant.slug.slice(0, 3).toUpperCase()}${amount}${Math.random()
        .toString(36)
        .slice(2, 5)
        .toUpperCase()}`,
      kind: "gift",
      value: amount,
      validUntil: addDays(TODAY, 365),
      buyerName: buyer.trim() || undefined,
    };

    const payment: PaymentRecord = {
      id: makeId("pay"),
      tenantId: tenant.id,
      amount,
      method: "card",
      at: NOW_ISO,
      kind: "voucher",
    };

    useKalendo.setState((current) => ({
      vouchers: [voucher, ...current.vouchers],
      payments: [...current.payments, payment],
    }));

    setSelling(false);
    toast.success(
      email.trim()
        ? t("panel.vouchers.sentTo", { email: email.trim() })
        : t("toast.voucherSold"),
    );
  }

  function addPassVisit(pass: Membership) {
    if (pass.used >= pass.total) return;
    useKalendo.setState((current) => ({
      memberships: current.memberships.map((item) =>
        item.id === pass.id ? { ...item, used: item.used + 1 } : item,
      ),
    }));
    toast.success(
      t("panel.vouchers.visitAdded", {
        used: pass.used + 1,
        total: pass.total,
      }),
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <ModuleHeader
        title={
          <>
            {t("panel.vouchers.title")} <em>{t("panel.vouchers.andPasses")}</em>
          </>
        }
        subtitle={t("panel.vouchers.subtitle", {
          active: active.length,
          vouchersWord: tn(active.length, "plurals.vouchersActive"),
          passes: passes.length,
          passesWord: tn(passes.length, "plurals.passes"),
        })}
        action={
          <Button iconLeft={Plus} onClick={() => setSelling(true)}>
            {t("panel.vouchers.sell")}
          </Button>
        }
        tabs={[
          {
            key: "gift",
            label: t("panel.vouchers.tabVouchers"),
            count: vouchers.length,
          },
          {
            key: "passes",
            label: t("panel.vouchers.memberships"),
            count: passes.length,
          },
        ]}
        activeTab={tab}
        onTabChange={(key) => setTab(key as VoucherTab)}
      />

      {tab === "gift" ? (
        <>
          <Card className="grid grid-cols-2 gap-5 p-5 lg:grid-cols-4 lg:gap-6">
            <Stat
              label={t("panel.vouchers.activeCount")}
              value={active.length}
            />
            <Stat
              label={t("panel.vouchers.totalValue")}
              value={money(activeValue, locale)}
            />
            <Stat
              label={t("panel.vouchers.used")}
              value={vouchers.length - active.length}
            />
            <Stat
              label={t("panel.vouchers.discount")}
              value={vouchers.filter((v) => v.kind === "discount").length}
            />
          </Card>

          {vouchers.length === 0 ? (
            <Card>
              <EmptyState
                icon={Gift}
                title={t("panel.vouchers.empty")}
                body={t("panel.vouchers.emptyBody")}
                action={
                  <Button iconLeft={Plus} onClick={() => setSelling(true)}>
                    {t("panel.vouchers.sell")}
                  </Button>
                }
              />
            </Card>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {vouchers.map((voucher) => (
                <li key={voucher.id} className="min-w-0">
                  <GiftTile
                    voucher={voucher}
                    valueLabel={
                      voucher.kind === "gift"
                        ? money(voucher.value, locale)
                        : `−${voucher.value}%`
                    }
                    kindLabel={
                      voucher.kind === "gift"
                        ? t("panel.vouchers.gift")
                        : t("panel.vouchers.discount")
                    }
                    validLabel={t("panel.vouchers.validUntilDate", {
                      date: dayMonth(voucher.validUntil, locale),
                    })}
                    statusLabel={
                      voucher.usedAt
                        ? t("panel.vouchers.used")
                        : t("panel.vouchers.active")
                    }
                    buyerLabel={
                      voucher.buyerName
                        ? `${t("panel.vouchers.buyer")}: ${voucher.buyerName}`
                        : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : passes.length === 0 ? (
        <Card>
          <EmptyState
            icon={Ticket}
            title={t("panel.vouchers.emptyPasses")}
            body={t("panel.vouchers.emptyPassesBody")}
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {passes.map((pass) => {
            const client = clientById(state, pass.clientId);
            const exhausted = pass.used >= pass.total;

            return (
              <li key={pass.id}>
                <Card>
                  <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                    <div className="min-w-0 lg:flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-ink">
                          {tl(pass.name)}
                        </h3>
                        <Badge
                          size="sm"
                          tone={exhausted ? "neutral" : "success"}
                        >
                          {exhausted
                            ? t("panel.vouchers.passExhausted")
                            : t("panel.vouchers.active")}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-muted">
                        {client?.name ?? t("common.client")} ·{" "}
                        {t("panel.vouchers.validUntilDate", {
                          date: dayMonth(pass.validUntil, locale),
                        })}
                      </p>
                    </div>

                    <div className="lg:w-56">
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[12px]">
                        <span className="text-muted">
                          {t("panel.vouchers.passProgress", {
                            used: pass.used,
                            total: pass.total,
                          })}
                        </span>
                        <span className="tabular font-medium text-ink">
                          {money(pass.price, locale)}
                        </span>
                      </div>
                      <Progress
                        value={(pass.used / Math.max(pass.total, 1)) * 100}
                        tone={exhausted ? "ink" : "brand"}
                        aria-label={`${tl(pass.name)} — ${t(
                          "panel.vouchers.passProgress",
                          { used: pass.used, total: pass.total },
                        )}`}
                      />
                    </div>

                    <Button
                      variant="secondary"
                      iconLeft={Plus}
                      disabled={exhausted}
                      className="shrink-0"
                      onClick={() => addPassVisit(pass)}
                    >
                      {t("panel.vouchers.addVisit")}
                    </Button>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {selling && (
        <SellVoucherModal
          onClose={() => setSelling(false)}
          onSell={sellVoucher}
          formatAmount={(amount) => money(amount, locale)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface GiftTileProps {
  voucher: Voucher;
  valueLabel: string;
  kindLabel: string;
  validLabel: string;
  statusLabel: string;
  buyerLabel?: string;
}

function GiftTile({
  voucher,
  valueLabel,
  kindLabel,
  validLabel,
  statusLabel,
  buyerLabel,
}: GiftTileProps) {
  const used = Boolean(voucher.usedAt);

  return (
    <article
      className={cn(
        "relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-xs",
        used
          ? "border-line bg-sand-100 text-sand-600"
          : "border-transparent bg-brand text-brand-fg",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 size-32 rounded-full",
          used ? "bg-card/40" : "bg-brand-fg/10",
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "text-[11px] font-medium tracking-[0.08em] uppercase",
              used ? "text-sand-500" : "text-brand-fg/70",
            )}
          >
            {kindLabel}
          </p>
          <p className="tabular font-display mt-1 text-[28px] leading-none">
            {valueLabel}
          </p>
        </div>
        <Badge
          size="sm"
          tone={used ? "neutral" : "ink"}
          className={used ? undefined : "border-transparent bg-ink/25 text-brand-fg"}
        >
          {statusLabel}
        </Badge>
      </div>

      <div className="relative mt-5">
        <p
          className={cn(
            "tabular rounded-md border px-3 py-2 text-[15px] font-semibold tracking-[0.12em]",
            used
              ? "border-line-strong bg-card/60"
              : "border-brand-fg/25 bg-brand-fg/10",
          )}
        >
          {voucher.code}
        </p>
        <p
          className={cn(
            "mt-2 text-[12px]",
            used ? "text-sand-500" : "text-brand-fg/80",
          )}
        >
          {validLabel}
        </p>
        {buyerLabel ? (
          <p
            className={cn(
              "truncate text-[12px]",
              used ? "text-sand-500" : "text-brand-fg/80",
            )}
          >
            {buyerLabel}
          </p>
        ) : null}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */

interface SellVoucherModalProps {
  onClose: () => void;
  onSell: (amount: number, buyer: string, email: string) => void;
  formatAmount: (amount: number) => string;
}

function SellVoucherModal({
  onClose,
  onSell,
  formatAmount,
}: SellVoucherModalProps) {
  const { t } = useI18n();
  const [amount, setAmount] = useState(AMOUNT_CHIPS[2]);
  const [custom, setCustom] = useState("");
  const [buyer, setBuyer] = useState("");
  const [email, setEmail] = useState("");

  const finalAmount = custom.trim() ? Number(custom) : amount;
  const invalid = !Number.isFinite(finalAmount) || finalAmount <= 0;

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="sm"
      closeLabel={t("common.close")}
      title={t("panel.vouchers.sell")}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" block onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            block
            disabled={invalid}
            onClick={() => onSell(finalAmount, buyer, email)}
          >
            {t("panel.vouchers.sell")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-sand-700">
            {t("panel.vouchers.value")}
          </legend>
          <ChipRow bleed>
            {AMOUNT_CHIPS.map((value) => (
              <Chip
                key={value}
                active={!custom.trim() && value === amount}
                onClick={() => {
                  setAmount(value);
                  setCustom("");
                }}
              >
                {formatAmount(value)}
              </Chip>
            ))}
          </ChipRow>
        </fieldset>

        <Field
          label={t("panel.vouchers.customAmount")}
          htmlFor="voucher-amount"
        >
          <Input
            id="voucher-amount"
            type="number"
            min={0}
            step={10}
            className="tabular"
            placeholder={String(amount)}
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
          />
        </Field>

        <Field label={t("panel.vouchers.buyer")} htmlFor="voucher-buyer">
          <Input
            id="voucher-buyer"
            value={buyer}
            autoComplete="name"
            onChange={(event) => setBuyer(event.target.value)}
          />
        </Field>

        <Field
          label={t("panel.vouchers.recipientEmail")}
          htmlFor="voucher-email"
          hint={t("panel.vouchers.recipientHint")}
        >
          <Input
            id="voucher-email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <p className="text-[12px] text-muted">
          {t("panel.vouchers.validityNote")}
        </p>
      </div>
    </Modal>
  );
}
