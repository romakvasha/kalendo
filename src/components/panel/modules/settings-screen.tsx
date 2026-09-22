"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building,
  CalendarDays,
  Check,
  Copy,
  CreditCard,
  Globe,
  Languages,
  Plug,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ThemeToggle, usePanelSession } from "@/components/layout";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  Divider,
  Field,
  Input,
  KeyValue,
  Progress,
  Segmented,
  Select,
  Switch,
} from "@/components/ui";
import { BRAND_THEMES } from "@/lib/brand";
import { staffOf, useDataState, useHydrated, useKalendo } from "@/lib/data";
import { TODAY, money, weekdayHeaders } from "@/lib/format";
import { LOCALE_LABELS, useI18n } from "@/lib/i18n";
import {
  LOCALES,
  type BrandKey,
  type Locale,
  type OpeningHours,
  type PlanKey,
  type Tenant,
} from "@/lib/types";
import { cn, range } from "@/lib/utils";

import { ModuleHeader } from "./module-header";
import { ModuleSkeleton } from "./module-skeleton";
import { COUNTING, timeOptions } from "./helpers";

/* ------------------------------------------------------------------ */

const SECTIONS = [
  { key: "company", labelKey: "settings.company", icon: Building },
  { key: "booking", labelKey: "settings.bookingPage", icon: Globe },
  { key: "deposits", labelKey: "settings.deposits", icon: Wallet },
  { key: "notifications", labelKey: "settings.notifications", icon: CalendarDays },
  { key: "languages", labelKey: "settings.language", icon: Languages },
  { key: "integrations", labelKey: "settings.integrations", icon: Plug },
  { key: "plan", labelKey: "settings.plan", icon: CreditCard },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

const BRAND_KEYS: BrandKey[] = ["cobalt", "green", "orange", "violet", "rose"];

const PLAN_KEYS: PlanKey[] = ["start", "pro", "max"];

const CANCELLATION_HOURS = [0, 2, 4, 12, 24, 48];

const NOTIFICATION_EVENTS = [
  "confirmation",
  "reminder",
  "change",
  "review",
] as const;
const CHANNELS = ["sms", "email", "push"] as const;

type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];
type Channel = (typeof CHANNELS)[number];
type NotificationMatrix = Record<NotificationEvent, Record<Channel, boolean>>;

const DEFAULT_NOTIFICATIONS: NotificationMatrix = {
  confirmation: { sms: true, email: true, push: false },
  reminder: { sms: true, email: false, push: true },
  change: { sms: true, email: true, push: true },
  review: { sms: false, email: true, push: false },
};

interface IntegrationItem {
  key: string;
  titleKey: string;
  bodyKey: string;
  connected: boolean;
}

const INTEGRATIONS: IntegrationItem[] = [
  {
    key: "googleCalendar",
    titleKey: "settings.integrationList.google",
    bodyKey: "settings.integrationBody.googleCalendar",
    connected: true,
  },
  {
    key: "googleBusiness",
    titleKey: "settings.integrationList.gmb",
    bodyKey: "settings.integrationBody.googleBusiness",
    connected: true,
  },
  {
    key: "instagram",
    titleKey: "settings.integrationItems.instagram",
    bodyKey: "settings.integrationBody.instagram",
    connected: false,
  },
  {
    key: "facebook",
    titleKey: "settings.integrationItems.facebook",
    bodyKey: "settings.integrationBody.facebook",
    connected: false,
  },
  {
    key: "appleCalendar",
    titleKey: "settings.integrationItems.appleCalendar",
    bodyKey: "settings.integrationBody.appleCalendar",
    connected: false,
  },
  {
    key: "webhook",
    titleKey: "settings.integrationList.api",
    bodyKey: "settings.integrationBody.webhook",
    connected: false,
  },
];

/* ------------------------------------------------------------------ */

export function SettingsScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <ModuleSkeleton rows={5} />;
  return <Settings tenant={tenant} />;
}

/* ------------------------------------------------------------------ */

function Settings({ tenant }: { tenant: Tenant }) {
  const { t } = useI18n();
  const [section, setSection] = useState<SectionKey>("company");

  function patchTenant(patch: Partial<Tenant>) {
    useKalendo.setState((current) => ({
      tenants: current.tenants.map((item) =>
        item.id === tenant.id ? { ...item, ...patch } : item,
      ),
    }));
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <ModuleHeader
        title={
          <>
            {t("settings.title")} <em>{t("settings.andPreferences")}</em>
          </>
        }
        subtitle={t("settings.subtitle", { name: tenant.name })}
      />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
        <div className="lg:hidden">
          <Field label={t("settings.section")} htmlFor="settings-section">
            <Select
              id="settings-section"
              value={section}
              onChange={(event) => setSection(event.target.value as SectionKey)}
              options={SECTIONS.map((item) => ({
                value: item.key,
                label: t(item.labelKey),
              }))}
            />
          </Field>
        </div>

        <nav
          aria-label={t("settings.title")}
          className="hidden w-60 shrink-0 lg:block"
        >
          <ul className="flex flex-col gap-0.5">
            {SECTIONS.map((item) => {
              const active = item.key === section;
              const Icon: LucideIcon = item.icon;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => setSection(item.key)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[14px]",
                      "transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25",
                      active
                        ? "bg-sand-100 font-medium text-ink"
                        : "text-muted hover:bg-sand-50 hover:text-ink",
                    )}
                  >
                    <Icon aria-hidden className="size-4 shrink-0" />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          {section === "company" && (
            <CompanySection tenant={tenant} onPatch={patchTenant} />
          )}
          {section === "booking" && (
            <BookingSection tenant={tenant} onPatch={patchTenant} />
          )}
          {section === "deposits" && (
            <DepositSection tenant={tenant} onPatch={patchTenant} />
          )}
          {section === "notifications" && <NotificationsSection />}
          {section === "languages" && <LanguagesSection />}
          {section === "integrations" && <IntegrationsSection />}
          {section === "plan" && (
            <PlanSection tenant={tenant} onPatch={patchTenant} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Firma                                                               */
/* ------------------------------------------------------------------ */

interface SectionProps {
  tenant: Tenant;
  onPatch: (patch: Partial<Tenant>) => void;
}

function CompanySection({ tenant, onPatch }: SectionProps) {
  const { t, locale } = useI18n();
  const [name, setName] = useState(tenant.name);
  const [address, setAddress] = useState(tenant.address);
  const [city, setCity] = useState(tenant.city);
  const [phone, setPhone] = useState(tenant.phone);
  const [email, setEmail] = useState(tenant.email);
  const [hours, setHours] = useState<OpeningHours[]>(() =>
    range(7, 1).map((weekday) => {
      const found = tenant.openingHours.find(
        (item) => item.weekday === weekday,
      );
      return found ?? { weekday, open: null, close: null };
    }),
  );

  const dayLabels = weekdayHeaders(locale);
  const options = useMemo(
    () => timeOptions(30).map((time) => ({ value: time, label: time })),
    [],
  );

  function patchDay(weekday: number, patch: Partial<OpeningHours>) {
    setHours((current) =>
      current.map((row) =>
        row.weekday === weekday ? { ...row, ...patch } : row,
      ),
    );
  }

  function save() {
    onPatch({
      name: name.trim() || tenant.name,
      address,
      city,
      phone,
      email,
      openingHours: hours,
    });
    toast.success(t("toast.saved"));
  }

  return (
    <Card>
      <CardHeader bordered>
        <CardTitle as="h2" hint={t("settings.companyHint")}>
          {t("settings.company")}
        </CardTitle>
      </CardHeader>

      <CardBody className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("onboarding.companyName")}
            htmlFor="company-name"
            required
            className="sm:col-span-2"
          >
            <Input
              id="company-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label={t("common.address")} htmlFor="company-address">
            <Input
              id="company-address"
              value={address}
              autoComplete="street-address"
              onChange={(event) => setAddress(event.target.value)}
            />
          </Field>
          <Field label={t("common.city")} htmlFor="company-city">
            <Input
              id="company-city"
              value={city}
              autoComplete="address-level2"
              onChange={(event) => setCity(event.target.value)}
            />
          </Field>
          <Field label={t("common.phone")} htmlFor="company-phone">
            <Input
              id="company-phone"
              type="tel"
              className="tabular"
              value={phone}
              autoComplete="tel"
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
          <Field label={t("common.email")} htmlFor="company-email">
            <Input
              id="company-email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
        </div>

        <Divider />

        <section className="flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold text-ink">
            {t("settings.hours")}
          </h3>
          <ul className="flex flex-col gap-2">
            {hours.map((row, index) => {
              const open = Boolean(row.open && row.close);
              return (
                <li
                  key={row.weekday}
                  className="surface-flat flex flex-wrap items-center gap-3 p-3"
                >
                  <span className="w-10 shrink-0 text-[13px] font-medium text-ink">
                    {dayLabels[index]}
                  </span>
                  <Switch
                    checked={open}
                    aria-label={`${dayLabels[index]} — ${t("settings.hours")}`}
                    onCheckedChange={(next) =>
                      patchDay(
                        row.weekday,
                        next
                          ? { open: "09:00", close: "17:00" }
                          : { open: null, close: null },
                      )
                    }
                  />
                  {open ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Select
                        className="h-9 text-[13px]"
                        aria-label={`${dayLabels[index]} — ${t("common.from")}`}
                        options={options}
                        value={row.open ?? "09:00"}
                        onChange={(event) =>
                          patchDay(row.weekday, { open: event.target.value })
                        }
                      />
                      <span aria-hidden className="text-muted">
                        –
                      </span>
                      <Select
                        className="h-9 text-[13px]"
                        aria-label={`${dayLabels[index]} — ${t("common.to")}`}
                        options={options}
                        value={row.close ?? "17:00"}
                        onChange={(event) =>
                          patchDay(row.weekday, { close: event.target.value })
                        }
                      />
                    </div>
                  ) : (
                    <span className="flex-1 text-[13px] text-muted">
                      {t("onboarding.closed")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex justify-end">
          <Button onClick={save}>{t("common.saveChanges")}</Button>
        </div>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Strona rezerwacji                                                   */
/* ------------------------------------------------------------------ */

function BookingSection({ tenant, onPatch }: SectionProps) {
  const { t } = useI18n();
  const [slug, setSlug] = useState(tenant.slug);

  const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "firma";
  const host = `${clean}.kalendo.pl`;
  const embed = `<script src="https://widget.kalendo.pl/v1.js" data-kalendo="${clean}" async></script>`;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("toast.copied"));
    } catch {
      toast.error(t("errors.generic"));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader bordered>
          <CardTitle as="h2" hint={t("settings.bookingHint")}>
            {t("settings.bookingPage")}
          </CardTitle>
        </CardHeader>

        <CardBody className="flex flex-col gap-5">
          <Field
            label={t("settings.slug")}
            htmlFor="booking-slug"
            hint={t("settings.slugHint")}
          >
            <Input
              id="booking-slug"
              value={slug}
              spellCheck={false}
              autoCapitalize="none"
              onChange={(event) => setSlug(event.target.value)}
            />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-brand-soft px-4 py-3">
            <span className="tabular min-w-0 truncate text-[15px] font-medium text-brand-ink">
              {host}
            </span>
            <Button
              size="sm"
              variant="secondary"
              iconLeft={Copy}
              onClick={() => copy(`https://${host}`)}
            >
              {t("settings.copyLink")}
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                onPatch({ slug: clean });
                setSlug(clean);
                toast.success(t("toast.saved"));
              }}
            >
              {t("common.saveChanges")}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader bordered>
          <CardTitle as="h2" hint={t("settings.brandHint")}>
            {t("settings.brandColor")}
          </CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <fieldset>
            <legend className="sr-only">{t("settings.brandColor")}</legend>
            <div className="flex flex-wrap gap-3">
              {BRAND_KEYS.map((key) => {
                const theme = BRAND_THEMES[key];
                const active = key === tenant.brand;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    aria-label={t(`settings.brands.${key}`)}
                    onClick={() => onPatch({ brand: key })}
                    style={{ backgroundColor: theme.base }}
                    className={cn(
                      "grid size-11 place-items-center rounded-full border transition-transform",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/30 focus-visible:ring-offset-2",
                      active
                        ? "scale-105 border-ink ring-2 ring-ink/70 ring-offset-2 ring-offset-paper"
                        : "border-line hover:scale-105",
                    )}
                  >
                    {active && (
                      /* The swatch is a fixed brand colour in both themes, so the tick stays white. */
                      <Check
                        aria-hidden
                        className="size-4 text-white"
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="rounded-xl border border-line bg-card p-4">
            <p className="text-[11px] tracking-[0.08em] text-muted uppercase">
              {t("common.preview")}
            </p>
            <p className="font-display mt-2 text-[20px] text-ink">
              {tenant.name}
            </p>
            <p className="tabular mt-0.5 text-[13px] text-muted">{host}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex h-9 items-center rounded-md bg-brand px-3.5 text-[13px] font-medium text-brand-fg">
                {t("company.book")}
              </span>
              <span className="inline-flex h-9 items-center rounded-md bg-brand-soft px-3.5 text-[13px] font-medium text-brand-ink">
                {t("company.voucher")}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader bordered>
          <CardTitle as="h2" hint={t("settings.embedHint")}>
            {t("settings.widget")}
          </CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <pre className="thin-scrollbar overflow-x-auto rounded-md border border-line bg-sand-50 p-3.5 text-[12px] leading-5 text-sand-700">
            <code>{embed}</code>
          </pre>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              iconLeft={Copy}
              onClick={() => copy(embed)}
            >
              {t("common.copy")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Zadatki i zasady                                                    */
/* ------------------------------------------------------------------ */

function DepositSection({ tenant, onPatch }: SectionProps) {
  const { t, locale } = useI18n();
  const [enabled, setEnabled] = useState(tenant.deposit.enabled);
  const [mode, setMode] = useState(tenant.deposit.mode);
  const [value, setValue] = useState(String(tenant.deposit.value));
  const [cancellation, setCancellation] = useState(
    String(tenant.cancellationHours),
  );

  const parsed = Number(value);
  const valid = Number.isFinite(parsed) && parsed >= 0;

  return (
    <Card>
      <CardHeader bordered>
        <CardTitle as="h2" hint={t("settings.depositsHint")}>
          {t("settings.deposits")}
        </CardTitle>
      </CardHeader>

      <CardBody className="flex flex-col gap-5">
        <Switch
          label={t("settings.depositEnabled")}
          checked={enabled}
          onCheckedChange={setEnabled}
          className="surface-flat p-4"
        />

        <div
          className={cn(
            "grid gap-4 sm:grid-cols-2",
            !enabled && "pointer-events-none opacity-45",
          )}
        >
          <div className="flex w-full flex-col gap-1.5">
            <p className="text-[13px] font-medium text-sand-700">
              {t("settings.depositMode")}
            </p>
            <Segmented
              block
              className="h-11"
              aria-label={t("settings.depositMode")}
              value={mode}
              onChange={(next) => setMode(next as "fixed" | "percent")}
              options={[
                { value: "fixed", label: t("settings.modes.fixed") },
                { value: "percent", label: t("settings.modes.percent") },
              ]}
            />
          </div>

          <Field
            label={t("settings.depositValue")}
            htmlFor="deposit-value"
            hint={
              mode === "percent"
                ? t("settings.depositPercentHint")
                : t("settings.depositFixedHint")
            }
          >
            <Input
              id="deposit-value"
              type="number"
              min={0}
              step={mode === "percent" ? 5 : 10}
              className="tabular"
              value={value}
              invalid={!valid}
              onChange={(event) => setValue(event.target.value)}
            />
          </Field>
        </div>

        <Divider />

        <Field
          label={t("settings.cancellationWindow")}
          htmlFor="cancellation-hours"
          hint={t("settings.cancellationHours", { hours: cancellation })}
        >
          <Select
            id="cancellation-hours"
            value={cancellation}
            onChange={(event) => setCancellation(event.target.value)}
            options={CANCELLATION_HOURS.map((hours) => ({
              value: String(hours),
              label:
                hours === 0
                  ? t("settings.noCancellationWindow")
                  : `${hours} ${t("common.hours")}`,
            }))}
          />
        </Field>

        <p className="surface-flat p-3.5 text-[13px] leading-5 text-muted">
          {enabled
            ? t("settings.depositSummary", {
                value:
                  mode === "percent"
                    ? `${parsed || 0}%`
                    : money(parsed || 0, locale),
                hours: cancellation,
              })
            : t("settings.depositOffSummary")}
        </p>

        <div className="flex justify-end">
          <Button
            disabled={!valid}
            onClick={() => {
              onPatch({
                deposit: { enabled, mode, value: parsed || 0 },
                cancellationHours: Number(cancellation),
              });
              toast.success(t("toast.saved"));
            }}
          >
            {t("common.saveChanges")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Powiadomienia                                                       */
/* ------------------------------------------------------------------ */

function NotificationsSection() {
  const { t } = useI18n();
  const [matrix, setMatrix] = useState<NotificationMatrix>(
    DEFAULT_NOTIFICATIONS,
  );

  function toggle(event: NotificationEvent, channel: Channel, next: boolean) {
    setMatrix((current) => ({
      ...current,
      [event]: { ...current[event], [channel]: next },
    }));
    toast.success(t("toast.saved"));
  }

  return (
    <Card>
      <CardHeader bordered>
        <CardTitle as="h2" hint={t("settings.notificationsHint")}>
          {t("settings.notifications")}
        </CardTitle>
      </CardHeader>

      <CardBody className="flex flex-col gap-3">
        {/* Stacked groups on phones */}
        <ul className="flex flex-col gap-3 lg:hidden">
          {NOTIFICATION_EVENTS.map((event) => (
            <li key={event} className="surface-flat p-4">
              <p className="text-[14px] font-medium text-ink">
                {t(`settings.notificationEvents.${event}`)}
              </p>
              <div className="mt-3 flex flex-col gap-2.5">
                {CHANNELS.map((channel) => (
                  <Switch
                    key={channel}
                    label={t(`settings.${channel}`)}
                    checked={matrix[event][channel]}
                    onCheckedChange={(next) => toggle(event, channel, next)}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>

        {/* Matrix from lg up */}
        <table className="hidden w-full border-collapse text-[14px] lg:table">
          <caption className="sr-only">{t("settings.notifications")}</caption>
          <thead>
            <tr className="border-b border-line">
              <th
                scope="col"
                className="pb-3 text-left text-[12px] font-medium text-muted"
              >
                {t("settings.event")}
              </th>
              {CHANNELS.map((channel) => (
                <th
                  key={channel}
                  scope="col"
                  className="w-28 pb-3 text-center text-[12px] font-medium text-muted"
                >
                  {t(`settings.${channel}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_EVENTS.map((event) => (
              <tr key={event} className="border-b border-line/70 last:border-0">
                <th
                  scope="row"
                  className="py-3.5 text-left font-normal text-ink"
                >
                  {t(`settings.notificationEvents.${event}`)}
                </th>
                {CHANNELS.map((channel) => (
                  <td key={channel} className="py-3.5 text-center">
                    <Switch
                      checked={matrix[event][channel]}
                      onCheckedChange={(next) => toggle(event, channel, next)}
                      aria-label={`${t(
                        `settings.notificationEvents.${event}`,
                      )} — ${t(`settings.${channel}`)}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Języki                                                              */
/* ------------------------------------------------------------------ */

function LanguagesSection() {
  const { t } = useI18n();
  const [offered, setOffered] = useState<Locale[]>([...LOCALES]);
  const [fallback, setFallback] = useState<Locale>("pl");

  function toggle(locale: Locale, next: boolean) {
    setOffered((current) => {
      const updated = next
        ? [...current, locale]
        : current.filter((item) => item !== locale);
      // The default language must stay on the list.
      if (!next && locale === fallback && updated[0]) setFallback(updated[0]);
      return updated.length > 0 ? updated : current;
    });
    toast.success(t("toast.saved"));
  }

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader bordered>
          <CardTitle as="h2" hint={t("settings.languagesHint")}>
            {t("settings.language")}
          </CardTitle>
        </CardHeader>

        <CardBody className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-medium text-sand-700">
              {t("settings.offeredLanguages")}
            </legend>
            {LOCALES.map((locale) => (
              <label
                key={locale}
                className="surface-flat flex cursor-pointer items-center gap-3 p-3.5"
              >
                <Checkbox
                  checked={offered.includes(locale)}
                  disabled={offered.length === 1 && offered.includes(locale)}
                  onChange={(event) => toggle(locale, event.target.checked)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] text-ink">
                    {LOCALE_LABELS[locale].name}
                  </span>
                  <span className="block text-[12px] text-muted">
                    {LOCALE_LABELS[locale].short}
                  </span>
                </span>
                {locale === fallback && (
                  <Badge size="sm" tone="brand">
                    {t("settings.defaultLanguage")}
                  </Badge>
                )}
              </label>
            ))}
          </fieldset>

          <Field
            label={t("settings.defaultLanguage")}
            htmlFor="default-language"
            hint={t("settings.defaultLanguageHint")}
          >
            <Select
              id="default-language"
              value={fallback}
              onChange={(event) => {
                setFallback(event.target.value as Locale);
                toast.success(t("toast.saved"));
              }}
              options={offered.map((locale) => ({
                value: locale,
                label: LOCALE_LABELS[locale].name,
              }))}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader bordered>
          <CardTitle as="h2">{t("settings.appearance")}</CardTitle>
        </CardHeader>

        <CardBody className="flex flex-col gap-2.5">
          <ThemeToggle variant="segmented" />
          <p className="text-[13px] leading-5 text-muted">
            {t("settings.theme.hint")}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Integracje                                                          */
/* ------------------------------------------------------------------ */

function IntegrationsSection() {
  const { t } = useI18n();
  const [state, setState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      INTEGRATIONS.map((item) => [item.key, item.connected]),
    ),
  );
  const [webhook, setWebhook] = useState("https://");

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {INTEGRATIONS.map((item) => {
          const connected = state[item.key];
          return (
            <li key={item.key} className="min-w-0">
              <Card className="h-full">
                <CardBody className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold text-ink">
                        {t(item.titleKey)}
                      </h3>
                      <Badge
                        size="sm"
                        tone={connected ? "success" : "neutral"}
                        className="mt-1.5"
                      >
                        {connected
                          ? t("settings.connected")
                          : t("settings.connect")}
                      </Badge>
                    </div>
                    <Switch
                      checked={connected}
                      aria-label={`${t(item.titleKey)} — ${
                        connected
                          ? t("settings.disconnect")
                          : t("settings.connect")
                      }`}
                      onCheckedChange={(next) => {
                        setState((current) => ({
                          ...current,
                          [item.key]: next,
                        }));
                        toast.success(
                          next
                            ? t("settings.connectedToast", {
                                name: t(item.titleKey),
                              })
                            : t("settings.disconnectedToast", {
                                name: t(item.titleKey),
                              }),
                        );
                      }}
                    />
                  </div>

                  <p className="text-[13px] leading-5 text-muted">
                    {t(item.bodyKey)}
                  </p>

                  {item.key === "webhook" && connected && (
                    <Field
                      label={t("settings.webhookUrl")}
                      htmlFor="webhook-url"
                      className="mt-auto"
                    >
                      <Input
                        id="webhook-url"
                        value={webhook}
                        spellCheck={false}
                        onChange={(event) => setWebhook(event.target.value)}
                      />
                    </Field>
                  )}
                </CardBody>
              </Card>
            </li>
          );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Plan i płatności                                                    */
/* ------------------------------------------------------------------ */

const PLAN_LIMITS: Record<PlanKey, { staff: number; sms: number }> = {
  start: { staff: 1, sms: 50 },
  pro: { staff: 8, sms: 500 },
  max: { staff: 40, sms: 2000 },
};

function PlanSection({ tenant, onPatch }: SectionProps) {
  const { t } = useI18n();
  const data = useDataState();

  const team = useMemo(() => staffOf(data, tenant.id), [data, tenant.id]);
  const month = TODAY.slice(0, 7);

  const bookings = data.appointments.filter(
    (appointment) =>
      appointment.tenantId === tenant.id &&
      appointment.start.slice(0, 7) === month &&
      COUNTING.includes(appointment.status),
  ).length;

  const sms = data.appointments.filter(
    (appointment) =>
      appointment.tenantId === tenant.id &&
      appointment.start.slice(0, 7) === month &&
      appointment.smsReminderSent,
  ).length;

  const limits = PLAN_LIMITS[tenant.plan];

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader
          bordered
          action={
            <Badge tone="brand">{t(`landing.plans.${tenant.plan}.name`)}</Badge>
          }
        >
          <CardTitle as="h2" hint={t("settings.planHint")}>
            {t("settings.currentPlan")}
          </CardTitle>
        </CardHeader>

        <CardBody className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <UsageRow
              label={t("settings.usageStaff")}
              value={team.length}
              limit={limits.staff}
            />
            <UsageRow
              label={t("settings.usageSms")}
              value={sms}
              limit={limits.sms}
            />
          </div>

          <Divider />

          <div className="flex flex-col">
            <KeyValue
              label={t("settings.usageBookings")}
              value={<span className="tabular">{bookings}</span>}
            />
            <KeyValue
              label={t("settings.billing")}
              value={t(`landing.plans.${tenant.plan}.price`)}
            />
          </div>
        </CardBody>
      </Card>

      <ul className="grid gap-3 lg:grid-cols-3">
        {PLAN_KEYS.map((plan) => {
          const current = plan === tenant.plan;
          return (
            <li key={plan} className="min-w-0">
              <Card
                className={cn(
                  "h-full",
                  current && "border-brand ring-1 ring-brand/30",
                )}
              >
                <CardBody className="flex h-full flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-[20px] text-ink">
                      {t(`landing.plans.${plan}.name`)}
                    </h3>
                    <p className="tabular text-[15px] font-medium text-ink">
                      {t(`landing.plans.${plan}.price`)}
                      <span className="text-[12px] text-muted">
                        {t("common.perMonth")}
                      </span>
                    </p>
                  </div>

                  <p className="text-[13px] leading-5 text-muted">
                    {t(`landing.plans.${plan}.desc`)}
                  </p>

                  <p className="tabular text-[12px] text-sand-500">
                    {t("settings.planLimits", {
                      staff: PLAN_LIMITS[plan].staff,
                      sms: PLAN_LIMITS[plan].sms,
                    })}
                  </p>

                  <Button
                    className="mt-auto"
                    variant={current ? "secondary" : "brand"}
                    disabled={current}
                    block
                    onClick={() => {
                      onPatch({ plan });
                      toast.success(
                        t("settings.planChanged", {
                          plan: t(`landing.plans.${plan}.name`),
                        }),
                      );
                    }}
                  >
                    {current ? t("settings.currentPlan") : t("settings.upgrade")}
                  </Button>
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function UsageRow({
  label,
  value,
  limit,
}: {
  label: string;
  value: number;
  limit: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-muted">{label}</span>
        <span className="tabular font-medium text-ink">
          {value} / {limit}
        </span>
      </div>
      <Progress
        value={(value / Math.max(limit, 1)) * 100}
        tone={value >= limit ? "ink" : "brand"}
        aria-label={label}
      />
    </div>
  );
}
