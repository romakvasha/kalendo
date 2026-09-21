"use client";

import { useMemo, useState } from "react";

import {
  categoriesOf,
  durationOf,
  priceOf,
  servicesOf,
  staffOf,
  useDataState,
} from "@/lib/data";
import { duration, money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Tenant } from "@/lib/types";
import { ALL_CATEGORIES, CategoryChips, ServiceList } from "./service-list";

export interface StepServiceProps {
  tenant: Tenant;
  serviceIds: string[];
  onToggle: (id: string) => void;
}

export function StepService({ tenant, serviceIds, onToggle }: StepServiceProps) {
  const { t } = useI18n();
  const state = useDataState();
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);

  const categories = useMemo(
    () => categoriesOf(state, tenant.id),
    [state, tenant.id],
  );
  const all = useMemo(() => servicesOf(state, tenant.id), [state, tenant.id]);
  const team = useMemo(() => staffOf(state, tenant.id), [state, tenant.id]);

  const services = useMemo(
    () =>
      category === ALL_CATEGORIES
        ? all
        : all.filter((service) => service.categoryId === category),
    [all, category],
  );

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-[28px] leading-9 text-ink lg:text-[34px]">
        {t("company.chooseService")}
      </h1>
      <p className="mt-1 text-[13.5px] text-muted">
        {t("company.addAnother")}
      </p>

      <CategoryChips
        className="mt-4"
        categories={categories}
        value={category}
        onChange={setCategory}
      />

      <ServiceList
        className="mt-4"
        tenant={tenant}
        services={services}
        team={team}
        selectedIds={serviceIds}
        onToggle={onToggle}
      />
    </div>
  );
}

/** "Wybrano: 2 · 1,5 h · 320 zł" for the sticky bar. */
export function useSelectionSummary(serviceIds: string[]): string {
  const { t, locale } = useI18n();
  const state = useDataState();
  if (!serviceIds.length) return t("company.chooseService");
  return t("company.selectedSummary", {
    count: serviceIds.length,
    duration: duration(durationOf(state, serviceIds), locale),
    price: money(priceOf(state, serviceIds), locale),
  });
}
