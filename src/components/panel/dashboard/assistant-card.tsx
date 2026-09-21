"use client";

import { Fragment, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui";
import { suggestionsOf, useDataState, useKalendo } from "@/lib/data";
import { TODAY, addDays } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AiSuggestion } from "@/lib/types";

import {
  freeWindowTimes,
  joinTimes,
  regularClientCount,
} from "./helpers";

const SOLID_BUTTON =
  "rounded-full border-transparent bg-paper text-ink shadow-none hover:bg-white";
const GHOST_BUTTON =
  "rounded-full border border-paper/30 text-paper hover:bg-paper/10 active:bg-paper/15";

function Highlighted({ text, needle }: { text: string; needle: string }) {
  const index = needle ? text.indexOf(needle) : -1;
  if (index < 0) return <Fragment>{text}</Fragment>;
  return (
    <Fragment>
      {text.slice(0, index)}
      <strong className="font-semibold text-paper">{needle}</strong>
      {text.slice(index + needle.length)}
    </Fragment>
  );
}

function AssistantHeading({ note }: { note?: string }) {
  const t = useI18n().t;
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-grid size-8 shrink-0 place-items-center rounded-full bg-cobalt text-white">
        <Sparkles className="size-4" aria-hidden />
      </span>
      <span className="text-[15px] font-semibold text-paper">
        {t("panel.dashboard.assistant")}
      </span>
      {note ? (
        <span className="tabular ml-auto text-[12px] text-paper/60">{note}</span>
      ) : null}
    </div>
  );
}

function useAssistant(tenantId: string) {
  const { t, tl } = useI18n();
  const state = useDataState();
  const dismissSuggestion = useKalendo((store) => store.dismissSuggestion);
  const suggestions = useMemo(
    () => suggestionsOf(state, tenantId),
    [state, tenantId],
  );
  const times = useMemo(
    () => freeWindowTimes(state, tenantId, addDays(TODAY, 1)),
    [state, tenantId],
  );
  const list = joinTimes(times, t("common.and"));
  const regulars = regularClientCount(state, tenantId);

  const bodyOf = (suggestion: AiSuggestion): string =>
    suggestion.kind === "fill-gaps" && times.length > 1
      ? t("panel.dashboard.assistantTip", {
          n: times.length,
          list,
          count: regulars,
        })
      : tl(suggestion.body);

  return { suggestions, list, bodyOf, dismissSuggestion };
}

/* ------------------------------------------------------------------ */
/* Mobile — one suggestion, full bleed dark card                       */
/* ------------------------------------------------------------------ */

export interface AssistantCardProps {
  tenantId: string;
  className?: string;
}

export function AssistantCard({ tenantId, className }: AssistantCardProps) {
  const { t, tl } = useI18n();
  const { suggestions, list, bodyOf, dismissSuggestion } = useAssistant(tenantId);
  const suggestion = suggestions[0];

  if (!suggestion) return null;

  return (
    <section className={cn("rounded-2xl bg-ink p-5 text-paper", className)}>
      <AssistantHeading />

      <p className="mt-3.5 text-[16px] leading-6 text-paper/90">
        <Highlighted text={bodyOf(suggestion)} needle={list} />
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Button
          variant="secondary"
          iconLeft={<Sparkles />}
          className={SOLID_BUTTON}
          onClick={() => {
            dismissSuggestion(suggestion.id);
            toast.success(t("toast.offerSent"));
          }}
        >
          {tl(suggestion.cta)}
        </Button>
        <Button
          variant="ghost"
          className={GHOST_BUTTON}
          onClick={() => dismissSuggestion(suggestion.id)}
        >
          {t("panel.dashboard.later")}
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop — a stacked list of suggestions                             */
/* ------------------------------------------------------------------ */

export interface AssistantPanelProps {
  tenantId: string;
  limit?: number;
  className?: string;
}

export function AssistantPanel({
  tenantId,
  limit = 2,
  className,
}: AssistantPanelProps) {
  const { t, tl } = useI18n();
  const { suggestions, list, bodyOf, dismissSuggestion } = useAssistant(tenantId);
  const shown = suggestions.slice(0, limit);

  if (!shown.length) return null;

  return (
    <section className={cn("flex flex-col rounded-2xl bg-ink p-5 text-paper", className)}>
      <AssistantHeading
        note={t("panel.dashboard.suggestionCount", { count: suggestions.length })}
      />

      <ul className="mt-1 flex flex-1 flex-col">
        {shown.map((suggestion) => (
          <li
            key={suggestion.id}
            className="border-t border-paper/15 pt-4 pb-4 first:border-t-0 last:pb-0"
          >
            <p className="text-[14px] leading-6 text-paper/90">
              <Highlighted text={bodyOf(suggestion)} needle={list} />
            </p>
            <Button
              size="sm"
              variant="ghost"
              className={cn(GHOST_BUTTON, "mt-3")}
              onClick={() => {
                dismissSuggestion(suggestion.id);
                toast.success(t("toast.offerSent"));
              }}
            >
              {tl(suggestion.cta)}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
