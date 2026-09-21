"use client";

import { useState } from "react";
import { Button, Chip, Segmented, Sheet, Switch } from "@/components/ui";
import { money, number as formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { DataState } from "@/lib/data";
import type { Tenant } from "@/lib/types";
import {
  DISCOVER_CATEGORIES,
  categoryKeyOf,
  nextFreeToday,
  tenantCategories,
  tenantMinPrice,
  type CategoryKey,
} from "./helpers";

export interface DiscoverFilters {
  category: CategoryKey | "all";
  /** Kilometres, null = any. */
  maxDistance: number | null;
  /** Cheapest service must fit under this, null = any. */
  maxPrice: number | null;
  minRating: number | null;
  freeTodayOnly: boolean;
}

export const DEFAULT_FILTERS: DiscoverFilters = {
  category: "all",
  maxDistance: null,
  maxPrice: null,
  minRating: null,
  freeTodayOnly: false,
};

export function activeFilterCount(filters: DiscoverFilters): number {
  return [
    filters.category !== "all",
    filters.maxDistance !== null,
    filters.maxPrice !== null,
    filters.minRating !== null,
    filters.freeTodayOnly,
  ].filter(Boolean).length;
}

/** Nearest first — the discovery feed is sorted by distance everywhere. */
export function filterTenants(
  state: DataState,
  filters: DiscoverFilters,
): Tenant[] {
  return state.tenants
    .filter((tenant) => {
      if (
        filters.category !== "all" &&
        !tenantCategories(tenant).includes(filters.category)
      ) {
        return false;
      }
      if (
        filters.maxDistance !== null &&
        (tenant.distanceKm ?? Number.POSITIVE_INFINITY) > filters.maxDistance
      ) {
        return false;
      }
      if (filters.minRating !== null && tenant.rating < filters.minRating) {
        return false;
      }
      if (
        filters.maxPrice !== null &&
        tenantMinPrice(state, tenant.id) > filters.maxPrice
      ) {
        return false;
      }
      if (filters.freeTodayOnly && !nextFreeToday(state, tenant.id)) {
        return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        (a.distanceKm ?? Number.POSITIVE_INFINITY) -
        (b.distanceKm ?? Number.POSITIVE_INFINITY),
    );
}

const DISTANCES = [1, 3, 5];
const PRICES = [100, 200, 400];
const RATINGS = [4, 4.5, 4.8];

function toValue(value: number | null): string {
  return value === null ? "any" : String(value);
}

export interface DiscoverFiltersSheetProps {
  open: boolean;
  value: DiscoverFilters;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: DiscoverFilters) => void;
}

export function DiscoverFiltersSheet({
  open,
  value,
  onOpenChange,
  onApply,
}: DiscoverFiltersSheetProps) {
  const { t } = useI18n();

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("discover.filters")}>
      {/* Remounting on open resets the draft without an effect. */}
      <FiltersForm
        key={open ? "open" : "closed"}
        initial={value}
        onApply={(next) => {
          onApply(next);
          onOpenChange(false);
        }}
      />
    </Sheet>
  );
}

interface FiltersFormProps {
  initial: DiscoverFilters;
  onApply: (filters: DiscoverFilters) => void;
}

function FiltersForm({ initial, onApply }: FiltersFormProps) {
  const { t, locale } = useI18n();
  const [draft, setDraft] = useState<DiscoverFilters>(initial);

  return (
    <div className="space-y-5">
      <section>
        <p className="mb-2 text-[13px] font-medium text-sand-700">
          {t("discover.industry")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Chip
            active={draft.category === "all"}
            onClick={() => setDraft({ ...draft, category: "all" })}
          >
            {t("common.all")}
          </Chip>
          {DISCOVER_CATEGORIES.map((category) => (
            <Chip
              key={category}
              active={draft.category === category}
              onClick={() => setDraft({ ...draft, category })}
            >
              {t(categoryKeyOf(category))}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-[13px] font-medium text-sand-700">
          {t("discover.maxDistance")}
        </p>
        <Segmented
          block
          size="sm"
          value={toValue(draft.maxDistance)}
          onChange={(next) =>
            setDraft({
              ...draft,
              maxDistance: next === "any" ? null : Number(next),
            })
          }
          options={[
            { value: "any", label: t("discover.any") },
            ...DISTANCES.map((km) => ({
              value: String(km),
              label: t("discover.distanceWithin", { km }),
            })),
          ]}
        />
      </section>

      <section>
        <p className="mb-2 text-[13px] font-medium text-sand-700">
          {t("discover.priceRange")}
        </p>
        <Segmented
          block
          size="sm"
          value={toValue(draft.maxPrice)}
          onChange={(next) =>
            setDraft({
              ...draft,
              maxPrice: next === "any" ? null : Number(next),
            })
          }
          options={[
            { value: "any", label: t("discover.any") },
            ...PRICES.map((price) => ({
              value: String(price),
              label: t("discover.priceUnder", { price: money(price, locale) }),
            })),
          ]}
        />
      </section>

      <section>
        <p className="mb-2 text-[13px] font-medium text-sand-700">
          {t("discover.minRating")}
        </p>
        <Segmented
          block
          size="sm"
          value={toValue(draft.minRating)}
          onChange={(next) =>
            setDraft({
              ...draft,
              minRating: next === "any" ? null : Number(next),
            })
          }
          options={[
            { value: "any", label: t("discover.any") },
            ...RATINGS.map((rating) => ({
              value: String(rating),
              label: t("discover.ratingFrom", {
                value: formatNumber(rating, locale),
              }),
            })),
          ]}
        />
      </section>

      <Switch
        className="border-t border-line pt-4"
        label={t("discover.freeTodayOnly")}
        checked={draft.freeTodayOnly}
        onCheckedChange={(checked) =>
          setDraft({ ...draft, freeTodayOnly: checked })
        }
      />

      <div className="pb-safe sticky bottom-0 -mx-5 flex gap-2 border-t border-line bg-paper/95 px-5 py-4 backdrop-blur-sm">
        <Button
          variant="secondary"
          block
          onClick={() => setDraft(DEFAULT_FILTERS)}
        >
          {t("discover.reset")}
        </Button>
        <Button block onClick={() => onApply(draft)}>
          {t("discover.apply")}
        </Button>
      </div>
    </div>
  );
}
