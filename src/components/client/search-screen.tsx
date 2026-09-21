"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Chip, ChipRow, EmptyState, IconButton, Input } from "@/components/ui";
import { SERVICE_COLORS } from "@/lib/brand";
import {
  appointmentsForClient,
  getTenant,
  useDataState,
  useHydrated,
} from "@/lib/data";
import { duration as formatDuration, money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Service, Tenant } from "@/lib/types";
import {
  DISCOVER_CATEGORIES,
  categoryKeyOf,
  matches,
  nextFreeToday,
  tenantCategories,
  type CategoryKey,
} from "./helpers";
import { SectionHeading } from "./primitives";
import { useClientAccount } from "./session";
import { ScreenSkeleton } from "./skeletons";
import { TenantRow } from "./tenant-cards";

const RECENT_KEY = "kalendo.recentSearches";
const MAX_RECENT = 6;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function SearchScreen() {
  const { t, tl, locale } = useI18n();
  const hydrated = useHydrated();
  const state = useDataState();
  const account = useClientAccount();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryKey | "all">("all");
  const [recent, setRecent] = useState<string[]>(readRecent);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const remember = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setRecent((current) => {
      const next = [trimmed, ...current.filter((item) => item !== trimmed)].slice(
        0,
        MAX_RECENT,
      );
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // Ignore — the list still works for this session.
      }
      return next;
    });
  }, []);

  /** Places this client has already been — the default suggestions. */
  const visited = useMemo(() => {
    const names = appointmentsForClient(state, account.id)
      .map((appointment) => getTenant(state, appointment.tenantId)?.name)
      .filter((name): name is string => Boolean(name));
    return [...new Set(names)];
  }, [state, account.id]);

  const inCategory = useCallback(
    (tenant: Tenant) =>
      category === "all" || tenantCategories(tenant).includes(category),
    [category],
  );

  const tenants = useMemo(
    () =>
      state.tenants.filter((tenant) => {
        if (!inCategory(tenant)) return false;
        if (!query.trim()) return true;
        return (
          matches(tenant.name, query) ||
          matches(tenant.city, query) ||
          matches(tenant.address, query) ||
          matches(tl(tenant.tagline), query) ||
          tenantCategories(tenant).some((key) => matches(t(categoryKeyOf(key)), query))
        );
      }),
    [state.tenants, query, inCategory, t, tl],
  );

  const services = useMemo(() => {
    const found: Array<{ service: Service; tenant: Tenant }> = [];
    if (!query.trim()) return found;
    for (const service of state.services) {
      const tenant = getTenant(state, service.tenantId);
      if (!tenant || !inCategory(tenant)) continue;
      if (
        !matches(tl(service.name), query) &&
        !matches(tl(service.description), query)
      ) {
        continue;
      }
      found.push({ service, tenant });
      if (found.length === 12) break;
    }
    return found;
  }, [state, query, inCategory, tl]);

  if (!hydrated) return <ScreenSkeleton hero={false} rows={4} />;

  const hasQuery = query.trim().length > 0;
  const empty = hasQuery && tenants.length === 0 && services.length === 0;
  const suggestions = [...new Set([...recent, ...visited])].slice(0, 8);

  return (
    <div className="pb-8">
      <div className="pt-safe sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur-md">
        <form
          className="flex items-center gap-2 px-4 pt-3 pb-3"
          onSubmit={(event) => {
            event.preventDefault();
            remember(query);
            inputRef.current?.blur();
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-sand-400"
            />
            <Input
              ref={inputRef}
              type="text"
              enterKeyHint="search"
              value={query}
              aria-label={t("common.search")}
              placeholder={t("discover.searchPlaceholder")}
              onChange={(event) => setQuery(event.target.value)}
              className="pr-11 pl-11"
            />
            {hasQuery ? (
              <IconButton
                size="sm"
                aria-label={t("common.clear")}
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute top-1/2 right-1 -translate-y-1/2"
              >
                <X />
              </IconButton>
            ) : null}
          </div>
        </form>

        <ChipRow className="px-4 pb-3">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            {t("common.all")}
          </Chip>
          {DISCOVER_CATEGORIES.map((key) => (
            <Chip
              key={key}
              active={category === key}
              onClick={() => setCategory(key)}
            >
              {t(categoryKeyOf(key))}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {!hasQuery && suggestions.length ? (
        <section className="px-4 pt-5">
          <SectionHeading title={t("discover.recent")} />
          <ChipRow className="mt-3 flex-wrap gap-2 overflow-visible">
            {suggestions.map((item) => (
              <Chip
                key={item}
                onClick={() => {
                  setQuery(item);
                  remember(item);
                }}
              >
                {item}
              </Chip>
            ))}
          </ChipRow>
        </section>
      ) : null}

      {empty ? (
        <EmptyState
          icon={Search}
          title={t("discover.noResults")}
          body={t("discover.noResultsBody")}
        />
      ) : null}

      {tenants.length ? (
        <section className="px-4 pt-6">
          <SectionHeading title={t("discover.companies")} />
          <div className="mt-3 space-y-2">
            {tenants.map((tenant) => (
              <TenantRow
                key={tenant.id}
                tenant={tenant}
                nextFree={nextFreeToday(state, tenant.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {services.length ? (
        <section className="px-4 pt-6">
          <SectionHeading title={t("company.services")} />
          <ul className="mt-3 space-y-2">
            {services.map(({ service, tenant }) => (
              <li key={service.id}>
                <Link
                  href={`/b/${tenant.slug}?service=${service.id}`}
                  className="surface-flat flex items-center gap-3 p-3 transition-colors hover:bg-sand-50"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-9 shrink-0 rounded-sm",
                      SERVICE_COLORS[service.color].bg,
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-ink">
                      {tl(service.name)}
                    </span>
                    <span className="block truncate text-[12px] text-muted">
                      {tenant.name} · {formatDuration(service.durationMin, locale)}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-[14px] font-medium text-ink">
                    {service.priceFrom
                      ? t("common.priceFrom", {
                          price: money(service.price, locale),
                        })
                      : money(service.price, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
