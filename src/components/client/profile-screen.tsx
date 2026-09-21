"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Languages,
  LogOut,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Progress,
  Radio,
  Sheet,
  Switch,
} from "@/components/ui";
import { BrandProvider } from "@/components/layout";
import {
  clientRecordsForAccount,
  loyaltyOf,
  useDataState,
  useHydrated,
  useKalendo,
} from "@/lib/data";
import { dayMonth, money } from "@/lib/format";
import { LOCALE_LABELS, useI18n } from "@/lib/i18n";
import { LOCALES, type Locale, type Tenant } from "@/lib/types";
import { LoyaltyCard } from "./loyalty-card";
import { SectionHeading } from "./primitives";
import { useClientAccount } from "./session";
import { ScreenSkeleton } from "./skeletons";

type PanelKey = "language" | "notifications" | "payments" | "vouchers" | "consents";

const METHODS: Array<{ key: string; labelKey: string }> = [
  { key: "blik", labelKey: "booking.methods.blik" },
  { key: "card", labelKey: "booking.methods.card" },
  { key: "applePay", labelKey: "booking.methods.applePay" },
  { key: "transfer", labelKey: "booking.methods.transfer" },
];

export function ProfileScreen() {
  const { t, tl, locale, setLocale } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const account = useClientAccount();
  const state = useDataState();
  const signOut = useKalendo((store) => store.signOut);

  const [panel, setPanel] = useState<PanelKey | null>(null);
  const [notifications, setNotifications] = useState({
    sms: true,
    email: true,
    push: false,
  });
  const [method, setMethod] = useState<string>("blik");
  const [consents, setConsents] = useState<Record<string, boolean>>({});

  const records = useMemo(
    () => clientRecordsForAccount(state, account),
    [state, account],
  );

  const memberships = useMemo(() => {
    const ids = records.map((record) => record.id);
    return state.memberships.filter((item) => ids.includes(item.clientId));
  }, [state.memberships, records]);

  const vouchers = useMemo(
    () =>
      state.vouchers.filter(
        (voucher) => voucher.buyerName === account.name && !voucher.usedAt,
      ),
    [state.vouchers, account.name],
  );

  const loyaltyCards = useMemo(() => {
    const cards: Array<{ tenant: Tenant; points: number; rewardAt: number }> = [];
    for (const tenant of state.tenants) {
      const info = loyaltyOf(state, account.id, tenant.id);
      if (info) cards.push({ tenant, ...info });
    }
    return cards;
  }, [state, account.id]);

  const consentRows = records[0]?.consents ?? [];

  if (!hydrated) return <ScreenSkeleton hero={false} rows={5} />;

  const rows: Array<{
    key: PanelKey;
    icon: React.ReactNode;
    label: string;
    value?: string;
  }> = [
    {
      key: "language",
      icon: <Languages />,
      label: t("common.language"),
      value: LOCALE_LABELS[locale].name,
    },
    {
      key: "notifications",
      icon: <Bell />,
      label: t("settings.notifications"),
      value: [
        notifications.sms ? t("settings.sms") : null,
        notifications.email ? t("settings.email") : null,
        notifications.push ? t("settings.push") : null,
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      key: "payments",
      icon: <CreditCard />,
      label: t("profile.paymentMethods"),
      value: t(
        METHODS.find((item) => item.key === method)?.labelKey ??
          "booking.methods.blik",
      ),
    },
    {
      key: "vouchers",
      icon: <Ticket />,
      label: t("profile.vouchers"),
      value: String(memberships.length + vouchers.length),
    },
    {
      key: "consents",
      icon: <ShieldCheck />,
      label: t("profile.consents"),
    },
  ];

  return (
    <div className="pb-8">
      <div className="pt-safe">
        <header className="flex items-center gap-4 px-4 pt-6">
          <Avatar name={account.name} size="xl" />
          <div className="min-w-0">
            <h1 className="font-display text-[26px] leading-tight text-ink">
              {account.name}
            </h1>
            <p className="tabular mt-0.5 text-[13px] text-muted">
              {account.phone}
            </p>
          </div>
        </header>
      </div>

      <section className="mt-6 px-4">
        <ul className="surface divide-y divide-line overflow-hidden">
          {rows.map((row) => (
            <li key={row.key}>
              <button
                type="button"
                onClick={() => setPanel(row.key)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sand-50"
              >
                <span aria-hidden className="text-sand-500 [&_svg]:size-[18px]">
                  {row.icon}
                </span>
                <span className="flex-1 text-[15px] text-ink">{row.label}</span>
                {row.value ? (
                  <span className="max-w-[45%] truncate text-[13px] text-muted">
                    {row.value}
                  </span>
                ) : null}
                <ChevronRight aria-hidden className="size-4 text-sand-400" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {loyaltyCards.length ? (
        <section className="mt-7 px-4">
          <SectionHeading title={t("profile.loyaltyCards")} />
          <div className="mt-3 space-y-3">
            {loyaltyCards.map((card) => (
              <BrandProvider key={card.tenant.id} brand={card.tenant.brand}>
                <LoyaltyCard
                  variant="plain"
                  tenant={card.tenant}
                  points={card.points}
                  rewardAt={card.rewardAt}
                />
              </BrandProvider>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-7 px-4">
        <Link
          href="/signup?type=company"
          className="surface-flat flex items-center gap-4 bg-sand-50 p-5 transition-colors hover:bg-sand-100"
        >
          <span className="min-w-0 flex-1">
            <span className="font-display block text-[21px] leading-tight text-ink">
              {t("profile.business.title")}
            </span>
            <span className="mt-1 block text-[13px] leading-5 text-muted">
              {t("profile.business.body")}
            </span>
            <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-cobalt">
              {t("landing.finalCta")}
              <ArrowUpRight aria-hidden className="size-4" />
            </span>
          </span>
        </Link>
      </section>

      <div className="mt-7 px-4">
        <Button
          block
          variant="ghost"
          iconLeft={LogOut}
          className="text-danger hover:bg-danger-soft"
          onClick={() => {
            signOut();
            router.push("/");
          }}
        >
          {t("settings.logOut")}
        </Button>
      </div>

      <Sheet
        open={panel === "language"}
        onOpenChange={(open) => setPanel(open ? "language" : null)}
        title={t("common.language")}
      >
        <ul className="divide-y divide-line">
          {LOCALES.map((item: Locale) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => {
                  setLocale(item);
                  setPanel(null);
                }}
                className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-[15px] text-ink"
              >
                <span>
                  {LOCALE_LABELS[item].name}
                  <span className="ml-2 text-[12px] text-muted">
                    {LOCALE_LABELS[item].short}
                  </span>
                </span>
                {item === locale ? (
                  <Check aria-hidden className="size-4 text-cobalt" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet
        open={panel === "notifications"}
        onOpenChange={(open) => setPanel(open ? "notifications" : null)}
        title={t("settings.notifications")}
      >
        <div className="space-y-4 py-1">
          <Switch
            label={t("settings.sms")}
            checked={notifications.sms}
            onCheckedChange={(checked) =>
              setNotifications((current) => ({ ...current, sms: checked }))
            }
          />
          <Switch
            label={t("settings.email")}
            checked={notifications.email}
            onCheckedChange={(checked) =>
              setNotifications((current) => ({ ...current, email: checked }))
            }
          />
          <Switch
            label={t("settings.push")}
            checked={notifications.push}
            onCheckedChange={(checked) =>
              setNotifications((current) => ({ ...current, push: checked }))
            }
          />
        </div>
      </Sheet>

      <Sheet
        open={panel === "payments"}
        onOpenChange={(open) => setPanel(open ? "payments" : null)}
        title={t("profile.paymentMethods")}
      >
        <div className="space-y-3 py-1">
          {METHODS.map((item) => (
            <Radio
              key={item.key}
              name="payment-method"
              value={item.key}
              checked={method === item.key}
              onChange={() => setMethod(item.key)}
              label={t(item.labelKey)}
            />
          ))}
        </div>
      </Sheet>

      <Sheet
        open={panel === "vouchers"}
        onOpenChange={(open) => setPanel(open ? "vouchers" : null)}
        title={t("profile.vouchers")}
      >
        {memberships.length || vouchers.length ? (
          <ul className="space-y-3">
            {memberships.map((membership) => (
              <li key={membership.id} className="surface-flat p-4">
                <p className="text-[15px] font-medium text-ink">
                  {tl(membership.name)}
                </p>
                <p className="tabular mt-0.5 text-[12px] text-muted">
                  {membership.used} / {membership.total} ·{" "}
                  {t("common.to")} {dayMonth(membership.validUntil, locale)}
                </p>
                <Progress
                  className="mt-3"
                  tone="ink"
                  value={(membership.used / membership.total) * 100}
                />
              </li>
            ))}
            {vouchers.map((voucher) => (
              <li
                key={voucher.id}
                className="surface-flat flex items-center gap-3 p-4"
              >
                <span className="tabular flex-1 text-[15px] font-medium text-ink">
                  {voucher.code}
                </span>
                <Badge tone="success" size="sm">
                  {voucher.kind === "gift"
                    ? money(voucher.value, locale)
                    : `−${voucher.value}%`}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState compact icon={Ticket} title={t("profile.vouchersEmpty")} />
        )}
      </Sheet>

      <Sheet
        open={panel === "consents"}
        onOpenChange={(open) => setPanel(open ? "consents" : null)}
        title={t("profile.consents")}
      >
        <div className="space-y-4 py-1">
          {consentRows.map((consent) => (
            <Switch
              key={consent.id}
              label={tl(consent.label)}
              checked={consents[consent.id] ?? consent.granted}
              onCheckedChange={(checked) =>
                setConsents((current) => ({ ...current, [consent.id]: checked }))
              }
            />
          ))}
        </div>
      </Sheet>
    </div>
  );
}
