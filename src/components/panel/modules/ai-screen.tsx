"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  CalendarClock,
  Send,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BarChart, ShareBars } from "@/components/charts";
import { usePanelSession } from "@/components/layout";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Chip,
  ChipRow,
  EmptyState,
  Input,
} from "@/components/ui";
import {
  dayRevenue,
  metricsRange,
  nextFreeWindows,
  suggestionsOf,
  useDataState,
  useHydrated,
  useKalendo,
  utilizationOn,
  type DataState,
} from "@/lib/data";
import { TODAY, addDays, dayMonth, daysBetween, money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { AiSuggestion, Locale, Tenant } from "@/lib/types";
import { sum } from "@/lib/utils";

import { ModuleHeader } from "./module-header";
import { ModuleSkeleton } from "./module-skeleton";
import { hourDemand, inactiveClients, serviceRevenue } from "./helpers";

/* ------------------------------------------------------------------ */

const KIND_ICONS: Record<AiSuggestion["kind"], LucideIcon> = {
  "fill-gaps": CalendarClock,
  reactivate: Users,
  pricing: TrendingUp,
  reminder: Bell,
  review: Star,
};

/** Hyphenated enum values get a camelCase i18n key, as elsewhere in the dictionary. */
const KIND_KEYS: Record<AiSuggestion["kind"], string> = {
  "fill-gaps": "fillGaps",
  reactivate: "reactivate",
  pricing: "pricing",
  reminder: "reminder",
  review: "review",
};

const PROMPTS = ["quiet", "inactive", "topService"] as const;

type AnswerKey = (typeof PROMPTS)[number] | "summary";

const KIND_ANSWERS: Record<AiSuggestion["kind"], AnswerKey> = {
  "fill-gaps": "quiet",
  reactivate: "inactive",
  pricing: "topService",
  reminder: "summary",
  review: "summary",
};

/** Maps a free-text question onto the closest computable answer. */
function answerFor(question: string): AnswerKey {
  const text = question.toLowerCase();
  if (/godzin|hour|okien|pust|slow|wolne/.test(text)) return "quiet";
  if (/nie by|wrac|reaktyw|odzysk|inactive|60|dawno/.test(text))
    return "inactive";
  if (/zarab|przychod|przychód|najwi|usług|uslug|cennik|revenue/.test(text))
    return "topService";
  return "summary";
}

/* ------------------------------------------------------------------ */

export function AiScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <ModuleSkeleton rows={4} />;
  return <Assistant tenant={tenant} />;
}

/* ------------------------------------------------------------------ */

function Assistant({ tenant }: { tenant: Tenant }) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();
  const dismissSuggestion = useKalendo((store) => store.dismissSuggestion);

  const suggestions = useMemo(
    () => suggestionsOf(state, tenant.id),
    [state, tenant.id],
  );

  const freeMinutes = useMemo(
    () =>
      sum(
        nextFreeWindows(state, tenant.id, TODAY, 30).map(
          (window) => window.minutes,
        ),
      ),
    [state, tenant.id],
  );

  const [answer, setAnswer] = useState<AnswerKey | null>(null);
  const [question, setQuestion] = useState("");

  function apply(suggestion: AiSuggestion) {
    dismissSuggestion(suggestion.id);
    setAnswer(KIND_ANSWERS[suggestion.kind]);
    toast.success(t("panel.ai.applied"));
  }

  function ask(next: AnswerKey, label?: string) {
    setAnswer(next);
    if (label !== undefined) setQuestion(label);
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <ModuleHeader
        title={
          <>
            {t("panel.ai.title")} <em>{t("panel.ai.andInsights")}</em>
          </>
        }
        subtitle={t("panel.ai.subtitle")}
      />

      <section className="relative overflow-hidden rounded-2xl bg-ink p-6 text-paper lg:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-paper/5"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-grid size-10 place-items-center rounded-full bg-cobalt text-white">
              <Sparkles aria-hidden className="size-5" />
            </span>
            <h2 className="font-display mt-4 text-[26px] leading-[1.12] lg:text-[32px]">
              {t("panel.ai.heroTitle")}{" "}
              <em className="text-paper/70">{t("panel.ai.heroTitleItalic")}</em>
            </h2>
            <p className="mt-3 text-[15px] leading-6 text-paper/75">
              {t("panel.ai.heroBody")}
            </p>
          </div>

          <dl className="grid shrink-0 grid-cols-3 gap-5 border-t border-paper/15 pt-5 lg:border-t-0 lg:border-l lg:border-paper/15 lg:pt-0 lg:pl-8">
            <HeroMetric
              label={t("panel.ai.suggestions")}
              value={String(suggestions.length)}
            />
            <HeroMetric
              label={t("panel.ai.freeToday")}
              value={`${Math.round(freeMinutes / 60)} h`}
            />
            <HeroMetric
              label={t("panel.dashboard.utilization")}
              value={`${utilizationOn(state, tenant.id, TODAY)}%`}
            />
          </dl>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold text-ink">
          {t("panel.ai.suggestions")}
        </h2>

        {suggestions.length === 0 ? (
          <Card>
            <EmptyState
              icon={Sparkles}
              title={t("panel.ai.empty")}
              body={t("panel.ai.emptyBody")}
            />
          </Card>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {suggestions.map((suggestion) => {
              const Icon = KIND_ICONS[suggestion.kind];
              return (
                <li key={suggestion.id} className="min-w-0">
                  <Card className="h-full">
                    <CardBody className="flex h-full flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden
                          className="inline-grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink"
                        >
                          <Icon className="size-[18px]" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
                            {t(`panel.ai.kinds.${KIND_KEYS[suggestion.kind]}`)}
                          </p>
                          <h3 className="mt-0.5 text-[15px] leading-5 font-semibold text-ink">
                            {tl(suggestion.title)}
                          </h3>
                        </div>
                      </div>

                      <p className="text-[14px] leading-6 text-muted">
                        {tl(suggestion.body)}
                      </p>

                      <div className="mt-auto flex flex-wrap gap-2 pt-1">
                        <Button size="sm" onClick={() => apply(suggestion)}>
                          {tl(suggestion.cta)}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissSuggestion(suggestion.id)}
                        >
                          {suggestion.secondaryCta
                            ? tl(suggestion.secondaryCta)
                            : t("common.skip")}
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Card>
        <CardHeader bordered>
          <CardTitle as="h2" hint={t("panel.ai.askHint")}>
            {t("panel.ai.ask")}
          </CardTitle>
        </CardHeader>

        <CardBody className="flex flex-col gap-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (!question.trim()) return;
              setAnswer(answerFor(question));
            }}
          >
            <Input
              value={question}
              aria-label={t("panel.ai.ask")}
              placeholder={t("panel.ai.askPlaceholder")}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <Button
              type="submit"
              iconLeft={Send}
              disabled={question.trim().length === 0}
              className="shrink-0"
            >
              {t("common.send")}
            </Button>
          </form>

          <ChipRow bleed>
            {PROMPTS.map((key) => (
              <Chip
                key={key}
                active={answer === key}
                onClick={() => ask(key, t(`panel.ai.prompts.${key}`))}
              >
                {t(`panel.ai.prompts.${key}`)}
              </Chip>
            ))}
          </ChipRow>

          {answer ? (
            <AssistantAnswer
              answer={answer}
              state={state}
              tenant={tenant}
              locale={locale}
            />
          ) : (
            <p className="surface-flat p-4 text-[13px] leading-5 text-muted">
              {t("panel.ai.askIdle")}
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[11px] text-paper/55">{label}</dt>
      <dd className="tabular font-display mt-1 text-[22px] leading-none">
        {value}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Answers — every number below is derived from the store              */
/* ------------------------------------------------------------------ */

interface AssistantAnswerProps {
  answer: AnswerKey;
  state: DataState;
  tenant: Tenant;
  locale: Locale;
}

function AssistantAnswer({
  answer,
  state,
  tenant,
  locale,
}: AssistantAnswerProps) {
  const { t, tn, tl } = useI18n();

  if (answer === "quiet") {
    const demand = hourDemand(state, tenant.id);
    const weakest = [...demand]
      .sort((a, b) => a.visits - b.visits)
      .slice(0, 3)
      .sort((a, b) => a.hour - b.hour);
    // Only the single quietest hour carries the callout — three overlapping
    // labels on neighbouring empty bars are unreadable.
    const quietest = [...demand].sort((a, b) => a.visits - b.visits)[0];
    const peak = demand.reduce((acc, item) => Math.max(acc, item.visits), 0);
    const gap = sum(weakest.map((item) => Math.max(0, peak - item.visits)));

    return (
      <AnswerShell
        text={t("panel.ai.answers.quiet", {
          hours: weakest.map((item) => item.label).join(", "),
          visits: sum(weakest.map((item) => item.visits)),
          visitsWord: tn(sum(weakest.map((item) => item.visits)), "plurals.visits"),
          gap,
          gapWord: tn(gap, "plurals.visitsGen"),
        })}
      >
        <BarChart
          data={demand.map((item) => ({
            label: item.label.slice(0, 2),
            value: item.visits,
            highlight: item.hour === quietest?.hour,
          }))}
          height={150}
          labelEvery={2}
          tone="ink"
          format={(value) => String(Math.round(value))}
          highlightLabel={t("panel.ai.answers.quietTag")}
          ariaLabel={t("panel.ai.prompts.quiet")}
        />
      </AnswerShell>
    );
  }

  if (answer === "inactive") {
    const all = inactiveClients(state, tenant.id, 60);
    const rows = all.slice(0, 6);
    const value = sum(
      all.map((entry) =>
        entry.client.visitCount > 0
          ? Math.round(entry.client.totalSpent / entry.client.visitCount)
          : 0,
      ),
    );

    return (
      <AnswerShell
        text={t("panel.ai.answers.inactive", {
          count: all.length,
          clients: tn(all.length, "plurals.clientsAbsent"),
          value: money(value, locale),
        })}
      >
        {rows.length === 0 ? null : (
          <table className="w-full border-collapse text-[13px]">
            <caption className="sr-only">
              {t("panel.ai.prompts.inactive")}
            </caption>
            <thead>
              <tr className="border-b border-line text-[11px] text-muted">
                <th scope="col" className="pb-2 text-left font-medium">
                  {t("common.client")}
                </th>
                <th scope="col" className="pb-2 text-left font-medium">
                  {t("panel.ai.answers.lastVisit")}
                </th>
                <th scope="col" className="pb-2 text-right font-medium">
                  {t("panel.ai.answers.daysAgo")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr
                  key={entry.client.id}
                  className="border-b border-line/70 last:border-0"
                >
                  <th
                    scope="row"
                    className="py-2 text-left font-normal text-ink"
                  >
                    {entry.client.name}
                  </th>
                  <td className="tabular py-2 text-muted">
                    {entry.lastVisit
                      ? dayMonth(entry.lastVisit.slice(0, 10), locale)
                      : t("common.none")}
                  </td>
                  <td className="tabular py-2 text-right font-medium text-ink">
                    {entry.days}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AnswerShell>
    );
  }

  if (answer === "topService") {
    const ranking = serviceRevenue(state, tenant.id)
      .filter((item) => item.revenue > 0)
      .slice(0, 5);
    const top = ranking[0];
    const total = sum(ranking.map((item) => item.revenue)) || 1;

    return (
      <AnswerShell
        text={
          top
            ? t("panel.ai.answers.topService", {
                name: tl(top.service.name),
                revenue: money(top.revenue, locale),
                share: Math.round((top.revenue / total) * 100),
                visits: top.visits,
                visitsWord: tn(top.visits, "plurals.visitsAt"),
              })
            : t("panel.ai.answers.noData")
        }
      >
        <ShareBars
          items={ranking.map((item) => ({
            label: tl(item.service.name),
            value: item.revenue,
          }))}
          format={(value) => money(value, locale)}
        />
      </AnswerShell>
    );
  }

  const from = addDays(TODAY, -6);
  const series = metricsRange(state, tenant.id, from, TODAY);
  const today = dayRevenue(state, tenant.id, TODAY);
  const week = sum(series.map((item) => item.revenue));

  return (
    <AnswerShell
      text={t("panel.ai.answers.summary", {
        today: money(today, locale),
        week: money(week, locale),
        utilization: utilizationOn(state, tenant.id, TODAY),
        days: daysBetween(from, TODAY) + 1,
      })}
    >
      {series.length === 0 ? null : (
        <BarChart
          data={series.map((item) => ({
            label: dayMonth(item.date, locale).split(" ")[0],
            value: item.revenue,
            highlight: item.date === TODAY,
          }))}
          height={150}
          labelEvery={1}
          tone="ink"
          format={(value) => money(value, locale)}
          highlightLabel={t("common.today")}
          ariaLabel={t("panel.reports.dailyRevenue")}
        />
      )}
    </AnswerShell>
  );
}

function AnswerShell({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div
      aria-live="polite"
      className="flex flex-col gap-4 rounded-xl border border-line bg-sand-50 p-4 lg:p-5"
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden
          className="inline-grid size-7 shrink-0 place-items-center rounded-full bg-ink text-paper"
        >
          <Sparkles className="size-3.5" />
        </span>
        <p className="text-[14px] leading-6 text-ink">{text}</p>
      </div>
      {children ? <div className="pl-0 sm:pl-10">{children}</div> : null}
      <p className="text-[11px] text-sand-500">{t("panel.ai.answerNote")}</p>
    </div>
  );
}
