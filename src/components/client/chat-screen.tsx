"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageCircle, SendHorizontal } from "lucide-react";
import {
  Chip,
  ChipRow,
  Divider,
  EmptyState,
  IconButton,
  Input,
} from "@/components/ui";
import { BrandProvider, TenantLogo } from "@/components/layout";
import {
  NOW_ISO,
  appointmentsForClient,
  getTenant,
  useDataState,
  useHydrated,
  useUpcomingForClient,
} from "@/lib/data";
import { timeOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn, makeId } from "@/lib/utils";
import type { Tenant } from "@/lib/types";
import { relativeDayLabel } from "./helpers";
import { useClientAccount } from "./session";
import { ScreenSkeleton } from "./skeletons";

interface ChatMessage {
  id: string;
  from: "tenant" | "client";
  text: string;
  at: string;
}

const QUICK_REPLIES = ["reschedule", "duration", "thanks"] as const;

export function ChatScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const account = useClientAccount();
  const state = useDataState();
  const upcoming = useUpcomingForClient(account.id);

  const [sent, setSent] = useState<Record<string, ChatMessage[]>>({});
  const [draft, setDraft] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const threads = useMemo(() => {
    const ids = [
      ...new Set(
        appointmentsForClient(state, account.id)
          .slice()
          .reverse()
          .map((appointment) => appointment.tenantId),
      ),
    ];
    return ids
      .map((id) => getTenant(state, id))
      .filter((tenant): tenant is Tenant => Boolean(tenant));
  }, [state, account.id]);

  const activeId = params.get("tenant");
  const active = threads.find((tenant) => tenant.id === activeId) ?? null;

  const seeded = useMemo(() => {
    if (!active) return [] as ChatMessage[];
    const next = upcoming.find((item) => item.tenantId === active.id);
    const messages: ChatMessage[] = [
      {
        id: `${active.id}-greeting`,
        from: "tenant",
        text: t("chat.seed.greeting", { name: active.name }),
        at: `${NOW_ISO.slice(0, 11)}09:12:00`,
      },
    ];
    if (next) {
      messages.push({
        id: `${active.id}-reminder`,
        from: "tenant",
        text: t("chat.seed.reminder", {
          day: relativeDayLabel(t, locale, next.start).toLowerCase(),
          time: timeOf(next.start),
        }),
        at: `${NOW_ISO.slice(0, 11)}09:13:00`,
      });
    }
    return messages;
  }, [active, upcoming, t, locale]);

  const messages = active ? [...seeded, ...(sent[active.id] ?? [])] : [];
  const ownCount = active ? (sent[active.id] ?? []).length : 0;

  useEffect(() => {
    if (ownCount > 0) endRef.current?.scrollIntoView({ block: "end" });
  }, [ownCount]);

  function append(tenantId: string, message: ChatMessage) {
    setSent((current) => ({
      ...current,
      [tenantId]: [...(current[tenantId] ?? []), message],
    }));
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !active) return;

    append(active.id, {
      id: makeId("msg"),
      from: "client",
      text: trimmed,
      at: NOW_ISO,
    });
    setDraft("");

    const quick = QUICK_REPLIES.find(
      (key) => t(`chat.quick.${key}`) === trimmed,
    );
    const replyKey = quick
      ? `chat.replies.${quick}`
      : "chat.replies.default";

    const timer = setTimeout(() => {
      append(active.id, {
        id: makeId("msg"),
        from: "tenant",
        text: t(replyKey),
        at: NOW_ISO,
      });
    }, 1100);
    timers.current.push(timer);
  }

  if (!hydrated) return <ScreenSkeleton hero={false} rows={4} />;

  if (!active) {
    return (
      <div className="pb-8">
        <div className="pt-safe">
          <h1 className="font-display px-4 pt-4 text-[30px] leading-tight text-ink">
            {t("nav.chat")}
          </h1>
        </div>

        {threads.length ? (
          <ul className="mt-4 space-y-2 px-4">
            {threads.map((tenant) => {
              const next = upcoming.find((item) => item.tenantId === tenant.id);
              return (
                <li key={tenant.id}>
                  <BrandProvider brand={tenant.brand}>
                    <button
                      type="button"
                      onClick={() => router.replace(`/app/chat?tenant=${tenant.id}`)}
                      className="surface-flat flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-sand-50"
                    >
                      <TenantLogo tenant={tenant} size="lg" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-ink">
                          {tenant.name}
                        </span>
                        <span className="block truncate text-[13px] text-muted">
                          {next
                            ? t("chat.seed.reminder", {
                                day: relativeDayLabel(
                                  t,
                                  locale,
                                  next.start,
                                ).toLowerCase(),
                                time: timeOf(next.start),
                              })
                            : t("chat.seed.greeting", { name: tenant.name })}
                        </span>
                      </span>
                    </button>
                  </BrandProvider>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={MessageCircle}
            title={t("chat.empty")}
            body={t("chat.emptyBody")}
          />
        )}
      </div>
    );
  }

  return (
    <BrandProvider brand={active.brand}>
      <div className="flex min-h-full flex-col pb-4">
        <div className="pt-safe sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur-md">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <IconButton
              aria-label={t("a11y.back")}
              onClick={() => router.replace("/app/chat")}
            >
              <ArrowLeft />
            </IconButton>
            <TenantLogo tenant={active} size="sm" />
            <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">
              {active.name}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2 px-4 pt-4">
          <Divider label={t("common.today")} className="pb-2" />

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.from === "client" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-5",
                  message.from === "client"
                    ? "rounded-br-sm bg-ink text-paper"
                    : "rounded-bl-sm border border-line bg-white text-ink",
                )}
              >
                <p>{message.text}</p>
                <p
                  className={cn(
                    "tabular mt-1 text-[10px]",
                    message.from === "client" ? "text-paper/50" : "text-muted",
                  )}
                >
                  {timeOf(message.at)}
                </p>
              </div>
            </div>
          ))}

          <div ref={endRef} />
        </div>

        <ChipRow className="mt-4 px-4">
          {QUICK_REPLIES.map((key) => (
            <Chip key={key} onClick={() => send(t(`chat.quick.${key}`))}>
              {t(`chat.quick.${key}`)}
            </Chip>
          ))}
        </ChipRow>

        <form
          className="mt-3 flex items-center gap-2 px-4"
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <Input
            value={draft}
            aria-label={t("chat.placeholder")}
            placeholder={t("chat.placeholder")}
            onChange={(event) => setDraft(event.target.value)}
          />
          <IconButton
            type="submit"
            variant="brand"
            aria-label={t("common.send")}
            disabled={!draft.trim()}
          >
            <SendHorizontal />
          </IconButton>
        </form>
      </div>
    </BrandProvider>
  );
}
