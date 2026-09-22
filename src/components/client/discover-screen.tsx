"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Check,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Chip,
  ChipRow,
  EmptyState,
  IconButton,
  Input,
  Sheet,
} from "@/components/ui";
import {
  appointmentById,
  getTenant,
  loyaltyOf,
  servicesFor,
  staffById,
  useDataState,
  useHydrated,
  useUpcomingForClient,
} from "@/lib/data";
import { timeOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Tenant } from "@/lib/types";
import {
  DEFAULT_FILTERS,
  DiscoverFiltersSheet,
  activeFilterCount,
  filterTenants,
  type DiscoverFilters,
} from "./discover-filters";
import {
  DISCOVER_AREAS,
  DISCOVER_CATEGORIES,
  categoryKeyOf,
  hasLastMinute,
  mapsSearchHref,
  nextFreeToday,
  relativeDayLabel,
  type AreaKey,
} from "./helpers";
import { LoyaltyCard } from "./loyalty-card";
import { NextVisitCard, NextVisitEmpty } from "./next-visit-card";
import { SectionHeading } from "./primitives";
import { firstNameOf, useClientAccount } from "./session";
import { ScreenSkeleton } from "./skeletons";
import { TenantCard, TenantRow } from "./tenant-cards";
import { RescheduleSheet } from "./visit-actions";

export function DiscoverScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const account = useClientAccount();
  const state = useDataState();
  const upcoming = useUpcomingForClient(account.id);

  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [area, setArea] = useState<AreaKey>("srodmiescie");
  const [areaOpen, setAreaOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  const results = useMemo(
    () =>
      filterTenants(state, filters).map((tenant) => ({
        tenant,
        nextFree: nextFreeToday(state, tenant.id),
        lastMinute: hasLastMinute(state, tenant.id),
      })),
    [state, filters],
  );

  const freeToday = results.filter((item) => item.nextFree);
  const nextVisit = upcoming[0];
  const pending = upcoming.filter((item) => item.status === "pending").length;

  const visit = useMemo(() => {
    if (!nextVisit) return null;
    const tenant = getTenant(state, nextVisit.tenantId);
    if (!tenant) return null;
    return {
      appointment: nextVisit,
      tenant,
      staff: staffById(state, nextVisit.staffId),
      services: servicesFor(state, nextVisit.serviceIds),
    };
  }, [state, nextVisit]);

  /** Only surfaced in the desktop rail — the phone layout stays untouched. */
  const loyalty = useMemo(() => {
    const cards: Array<{ tenant: Tenant; points: number; rewardAt: number }> = [];
    for (const tenant of state.tenants) {
      const info = loyaltyOf(state, account.id, tenant.id);
      if (info && info.points > 0) cards.push({ tenant, ...info });
    }
    return cards[0] ?? null;
  }, [state, account.id]);

  const rescheduling = rescheduleId
    ? (appointmentById(state, rescheduleId) ?? null)
    : null;

  if (!hydrated) return <ScreenSkeleton />;

  return (
    <div className="flex flex-col pb-8 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,340px)] lg:items-start lg:gap-8 lg:pb-0">
      {/* Main column — `contents` below lg so the phone order is untouched. */}
      <div className="contents lg:block lg:min-w-0">
        <div className="order-1 lg:order-none">
          <div className="pt-safe lg:flex lg:flex-row-reverse lg:items-start lg:justify-between lg:gap-4">
            <div className="flex items-center gap-2 px-4 pt-3 lg:shrink-0 lg:px-0 lg:pt-1.5">
              <button
                type="button"
                onClick={() => setAreaOpen(true)}
                className="-ml-1 flex min-w-0 items-center gap-1 rounded-md px-1 py-1.5 text-[13px] font-medium text-sand-700 transition-colors hover:bg-sand-100 hover:text-ink lg:ml-0"
              >
                <MapPin aria-hidden className="size-4 shrink-0 text-sand-500" />
                <span className="truncate">
                  {account.city}, {t(`discover.areas.${area}`)}
                </span>
                <ChevronDown
                  aria-hidden
                  className="size-4 shrink-0 text-sand-400"
                />
              </button>

              {/* From lg up the shell header owns the bell and the avatar. */}
              <div className="ml-auto flex shrink-0 items-center gap-1 lg:hidden">
                <span className="relative">
                  <IconButton
                    aria-label={t("a11y.notifications")}
                    onClick={() => setAlertsOpen(true)}
                  >
                    <Bell />
                  </IconButton>
                  {pending > 0 ? (
                    <span
                      aria-hidden
                      className="absolute top-2.5 right-2.5 size-2 rounded-full bg-danger ring-2 ring-paper"
                    />
                  ) : null}
                </span>

                <Link
                  href="/app/profile"
                  aria-label={t("nav.profile")}
                  className="rounded-full"
                >
                  <Avatar name={account.name} size="sm" />
                </Link>
              </div>
            </div>

            <header className="px-4 pt-2 lg:min-w-0 lg:px-0 lg:pt-0">
              <h1 className="font-display text-[30px] leading-tight text-ink">
                {t("discover.greeting", { name: firstNameOf(account.name) })}
              </h1>
              <p className="mt-1 text-[14px] text-muted">
                {t("discover.subtitle")}
              </p>
            </header>
          </div>

          <div className="mt-4 flex items-center gap-2 px-4 lg:max-w-[560px] lg:px-0">
            <div className="relative min-w-0 flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-sand-400"
              />
              <Input
                readOnly
                value=""
                aria-label={t("common.search")}
                placeholder={t("discover.searchPlaceholder")}
                onChange={() => undefined}
                onClick={() => router.push("/app/search")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push("/app/search");
                  }
                }}
                className="cursor-pointer pl-11"
              />
            </div>

            <span className="relative shrink-0">
              <IconButton
                variant="secondary"
                aria-label={t("discover.filters")}
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal />
              </IconButton>
              {activeFilterCount(filters) > 0 ? (
                <span className="tabular absolute -top-1 -right-1 grid size-4.5 place-items-center rounded-full bg-ink text-[10px] font-semibold text-paper">
                  {activeFilterCount(filters)}
                </span>
              ) : null}
            </span>
          </div>
        </div>

        <div className="order-3 lg:order-none">
          <section className="mt-7">
            <SectionHeading
              className="px-4 lg:px-0"
              title={t("discover.categories")}
              actionLabel={t("common.all")}
              onAction={() => setFilters({ ...filters, category: "all" })}
            />
            <ChipRow className="mt-3 px-4 lg:flex-wrap lg:overflow-visible lg:px-0">
              <Chip
                active={filters.category === "all"}
                onClick={() => setFilters({ ...filters, category: "all" })}
              >
                {t("common.all")}
              </Chip>
              {DISCOVER_CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  active={filters.category === category}
                  onClick={() => setFilters({ ...filters, category })}
                >
                  {t(categoryKeyOf(category))}
                </Chip>
              ))}
            </ChipRow>
          </section>

          {results.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon={Search}
              title={t("discover.noResults")}
              body={t("discover.noResultsBody")}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                >
                  {t("discover.reset")}
                </Button>
              }
            />
          ) : (
            <>
              <section className="mt-7">
                <SectionHeading
                  className="px-4 lg:px-0"
                  title={t("discover.freeTodayTitle")}
                  actionLabel={t("discover.map")}
                  actionHref={mapsSearchHref(
                    `${account.city ?? ""} ${t(`discover.areas.${area}`)}`,
                  )}
                  actionExternal
                />
                <ChipRow className="mt-3 items-stretch gap-3 px-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 xl:grid-cols-4">
                  {(freeToday.length ? freeToday : results).map((item) => (
                    <TenantCard
                      key={item.tenant.id}
                      tenant={item.tenant}
                      nextFree={item.nextFree}
                      lastMinute={item.lastMinute}
                      className="lg:w-auto"
                      favourite={favourites.includes(item.tenant.id)}
                      onToggleFavourite={(id) =>
                        setFavourites((current) =>
                          current.includes(id)
                            ? current.filter((value) => value !== id)
                            : [...current, id],
                        )
                      }
                    />
                  ))}
                </ChipRow>
              </section>

              <section className="mt-7 px-4 lg:px-0">
                <SectionHeading title={t("discover.recommendedNearby")} />
                <div className="mt-3 space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                  {results.map((item) => (
                    <TenantRow
                      key={item.tenant.id}
                      tenant={item.tenant}
                      nextFree={item.nextFree}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* Right rail from lg up; on a phone these keep their old slot. */}
      <div className="contents lg:sticky lg:top-24 lg:block lg:min-w-0">
        <div className="order-2 mt-5 px-4 lg:mt-0 lg:px-0">
          {visit ? (
            <NextVisitCard
              appointment={visit.appointment}
              tenant={visit.tenant}
              staff={visit.staff}
              services={visit.services}
              onReschedule={() => setRescheduleId(visit.appointment.id)}
            />
          ) : (
            <NextVisitEmpty />
          )}
        </div>

        {loyalty ? (
          <div className="hidden lg:mt-6 lg:block">
            <LoyaltyCard
              variant="plain"
              tenant={loyalty.tenant}
              points={loyalty.points}
              rewardAt={loyalty.rewardAt}
            />
          </div>
        ) : null}
      </div>

      <Sheet
        open={areaOpen}
        onOpenChange={setAreaOpen}
        title={t("discover.chooseArea")}
      >
        <ul className="divide-y divide-line">
          {DISCOVER_AREAS.map((key) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => {
                  setArea(key);
                  setAreaOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 py-3 text-left text-[15px] text-ink"
              >
                <span className="flex items-center gap-2">
                  <MapPin aria-hidden className="size-4 text-sand-400" />
                  {t(`discover.areas.${key}`)}
                </span>
                {key === area ? (
                  <Check aria-hidden className="size-4 text-cobalt" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        title={t("a11y.notifications")}
      >
        {upcoming.length ? (
          <ul className="space-y-2">
            {upcoming.slice(0, 6).map((item) => {
              const tenant = getTenant(state, item.tenantId);
              return (
                <li
                  key={item.id}
                  className="surface-flat flex items-center gap-3 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink">
                      {tenant?.name}
                    </p>
                    <p className="text-[12px] text-muted">
                      {relativeDayLabel(t, locale, item.start)} ·{" "}
                      <span className="tabular">{timeOf(item.start)}</span>
                    </p>
                  </div>
                  <Badge
                    size="sm"
                    tone={item.status === "pending" ? "warn" : "success"}
                  >
                    {item.status === "pending"
                      ? t("visits.pending")
                      : t("visits.confirmed")}
                  </Badge>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            compact
            icon={BellOff}
            title={t("discover.notificationsEmpty")}
          />
        )}
      </Sheet>

      <DiscoverFiltersSheet
        open={filtersOpen}
        value={filters}
        onOpenChange={setFiltersOpen}
        onApply={setFilters}
      />

      <RescheduleSheet
        appointment={rescheduling}
        onClose={() => setRescheduleId(null)}
      />
    </div>
  );
}
