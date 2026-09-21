"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Megaphone, MessageSquare, Plus, Send } from "lucide-react";

import { PhoneFrame, usePanelSession } from "@/components/layout";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Chip,
  ChipRow,
  EmptyState,
  Field,
  Input,
  Modal,
  Switch,
  Textarea,
} from "@/components/ui";
import { useDataState, useHydrated } from "@/lib/data";
import { TODAY, dayMonth, number as formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Tenant } from "@/lib/types";
import { cn, makeId } from "@/lib/utils";

import { ModuleHeader } from "./module-header";
import { ModuleSkeleton } from "./module-skeleton";
import {
  AUDIENCE_KEYS,
  SMS_SEGMENT,
  audienceOf,
  campaignsFor,
  type AudienceKey,
  type Campaign,
  type CampaignStatus,
} from "./helpers";

/* ------------------------------------------------------------------ */

const STATUS_TONES: Record<CampaignStatus, "success" | "info" | "neutral"> = {
  sent: "success",
  scheduled: "info",
  draft: "neutral",
};

const AUTOMATIONS = [
  { key: "reminder", enabled: true },
  { key: "review", enabled: true },
  { key: "birthday", enabled: false },
  { key: "winback", enabled: false },
] as const;

type AutomationKey = (typeof AUTOMATIONS)[number]["key"];

export function MarketingScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <ModuleSkeleton rows={4} />;
  return <Marketing tenant={tenant} />;
}

/* ------------------------------------------------------------------ */

function Marketing({ tenant }: { tenant: Tenant }) {
  const { t, locale } = useI18n();
  const state = useDataState();

  const seeded = useMemo(
    () => campaignsFor(state, tenant.id),
    [state, tenant.id],
  );
  const [created, setCreated] = useState<Campaign[]>([]);
  const [composing, setComposing] = useState(false);
  const [automations, setAutomations] = useState<Record<AutomationKey, boolean>>(
    () =>
      AUTOMATIONS.reduce(
        (acc, item) => ({ ...acc, [item.key]: item.enabled }),
        {} as Record<AutomationKey, boolean>,
      ),
  );

  const campaigns = [...created, ...seeded];

  const counts = useMemo(() => {
    const entries = AUDIENCE_KEYS.map(
      (key) => [key, audienceOf(state, tenant.id, key).length] as const,
    );
    return Object.fromEntries(entries) as Record<AudienceKey, number>;
  }, [state, tenant.id]);

  function nameOf(campaign: Campaign): string {
    return campaign.nameKey ? t(campaign.nameKey) : campaign.name;
  }

  function send(
    audience: AudienceKey,
    name: string,
    message: string,
    scheduled: boolean,
  ) {
    const recipients = counts[audience];
    const campaign: Campaign = {
      id: makeId("cmp"),
      nameKey: null,
      name:
        name.trim() ||
        message.split(/[.!?\n]/)[0].slice(0, 42) ||
        t("panel.marketing.sms"),
      audience,
      recipients,
      sent: scheduled ? 0 : recipients,
      opens: 0,
      bookings: 0,
      status: scheduled ? "scheduled" : "sent",
      date: TODAY,
      message,
    };
    setCreated((current) => [campaign, ...current]);
    setComposing(false);
    toast.success(
      scheduled
        ? t("panel.marketing.scheduledToast", { count: recipients })
        : t("panel.marketing.sentToast", { count: recipients }),
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <ModuleHeader
        title={
          <>
            {t("panel.marketing.title")} <em>{t("panel.marketing.andSms")}</em>
          </>
        }
        subtitle={t("panel.marketing.subtitle", {
          count: campaigns.length,
          audience: counts.all,
        })}
        action={
          <Button iconLeft={Plus} onClick={() => setComposing(true)}>
            {t("panel.marketing.newCampaign")}
          </Button>
        }
      />

      {campaigns.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title={t("panel.marketing.empty")}
            body={t("panel.marketing.emptyBody")}
            action={
              <Button iconLeft={Plus} onClick={() => setComposing(true)}>
                {t("panel.marketing.newCampaign")}
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="min-w-0">
              <Card className="h-full">
                <CardBody className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold text-ink">
                        {nameOf(campaign)}
                      </h3>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {dayMonth(campaign.date, locale)} ·{" "}
                        {t(`panel.marketing.audiences.${campaign.audience}`)}
                      </p>
                    </div>
                    <Badge size="sm" tone={STATUS_TONES[campaign.status]}>
                      {t(`panel.marketing.statuses.${campaign.status}`)}
                    </Badge>
                  </div>

                  <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
                    <Metric
                      label={t("panel.marketing.audience")}
                      value={formatNumber(campaign.recipients, locale)}
                    />
                    <Metric
                      label={t("panel.marketing.sent")}
                      value={formatNumber(campaign.sent, locale)}
                    />
                    <Metric
                      label={t("panel.marketing.openRate")}
                      value={formatNumber(campaign.opens, locale)}
                    />
                    <Metric
                      label={t("panel.marketing.bookings")}
                      value={formatNumber(campaign.bookings, locale)}
                    />
                  </dl>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader bordered>
          <CardTitle as="h2" hint={t("panel.marketing.automationHint")}>
            {t("panel.marketing.automations")}
          </CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-1">
          {AUTOMATIONS.map((item) => (
            <div
              key={item.key}
              className="flex items-start justify-between gap-4 border-b border-line/70 py-3.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-ink">
                  {t(`panel.marketing.automation.${item.key}.title`)}
                </p>
                <p className="mt-0.5 text-[13px] leading-5 text-muted">
                  {t(`panel.marketing.automation.${item.key}.body`)}
                </p>
              </div>
              <Switch
                checked={automations[item.key]}
                onCheckedChange={(next) => {
                  setAutomations((current) => ({
                    ...current,
                    [item.key]: next,
                  }));
                  toast.success(t("toast.saved"));
                }}
                aria-label={t(`panel.marketing.automation.${item.key}.title`)}
                className="mt-0.5"
              />
            </div>
          ))}
        </CardBody>
      </Card>

      {composing && (
        <CampaignModal
          counts={counts}
          senderName={tenant.name}
          onClose={() => setComposing(false)}
          onSend={send}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[11px] text-muted">{label}</dt>
      <dd className="tabular font-display mt-0.5 text-[18px] leading-none text-ink">
        {value}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface CampaignModalProps {
  counts: Record<AudienceKey, number>;
  senderName: string;
  onClose: () => void;
  onSend: (
    audience: AudienceKey,
    name: string,
    message: string,
    scheduled: boolean,
  ) => void;
}

function CampaignModal({
  counts,
  senderName,
  onClose,
  onSend,
}: CampaignModalProps) {
  const { t, locale } = useI18n();
  const [audience, setAudience] = useState<AudienceKey>("all");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const recipients = counts[audience];
  const segments = Math.max(1, Math.ceil(message.length / SMS_SEGMENT));
  const invalid = message.trim().length === 0 || recipients === 0;

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="lg"
      closeLabel={t("common.close")}
      title={t("panel.marketing.newCampaign")}
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            block
            disabled={invalid}
            onClick={() => onSend(audience, name, message.trim(), true)}
          >
            {t("panel.marketing.schedule")}
          </Button>
          <Button
            block
            iconLeft={Send}
            disabled={invalid}
            onClick={() => onSend(audience, name, message.trim(), false)}
          >
            {t("panel.marketing.send")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label={t("panel.marketing.campaignName")} htmlFor="campaign-name">
          <Input
            id="campaign-name"
            value={name}
            placeholder={t("panel.marketing.lastMinute")}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-sand-700">
            {t("panel.marketing.audience")}
          </legend>
          <ChipRow bleed>
            {AUDIENCE_KEYS.map((key) => (
              <Chip
                key={key}
                active={key === audience}
                onClick={() => setAudience(key)}
              >
                {t(`panel.marketing.audiences.${key}`)}
                <span className="tabular ml-1 opacity-60">{counts[key]}</span>
              </Chip>
            ))}
          </ChipRow>
          <p
            aria-live="polite"
            className="mt-2 text-[13px] font-medium text-ink"
          >
            {t("panel.marketing.recipients", {
              count: formatNumber(recipients, locale),
            })}
          </p>
        </fieldset>

        <Field
          label={t("panel.marketing.message")}
          htmlFor="campaign-message"
          hint={t("panel.marketing.segments", {
            chars: message.length,
            segments,
          })}
        >
          <Textarea
            id="campaign-message"
            rows={4}
            value={message}
            placeholder={t("panel.marketing.messagePlaceholder")}
            onChange={(event) => setMessage(event.target.value)}
          />
        </Field>

        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-sand-700">
            {t("common.preview")}
          </p>
          <PhoneFrame
            className="mx-auto"
            screenClassName="bg-sand-50"
          >
            <div className="flex min-h-[220px] flex-col gap-3 p-4">
              <p className="text-center text-[11px] text-muted">{senderName}</p>
              <div
                className={cn(
                  "max-w-[82%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5",
                  "border border-line text-[14px] leading-5 text-ink shadow-xs",
                )}
              >
                {message.trim() || t("panel.marketing.messagePlaceholder")}
              </div>
              <p className="tabular mt-auto text-center text-[11px] text-muted">
                {t("panel.marketing.segments", {
                  chars: message.length,
                  segments,
                })}
              </p>
            </div>
          </PhoneFrame>
        </div>

        <p className="surface-flat flex items-start gap-2.5 p-3 text-[13px] leading-5 text-muted">
          <MessageSquare aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("panel.marketing.costNote", {
            count: recipients * segments,
          })}
        </p>
      </div>
    </Modal>
  );
}
