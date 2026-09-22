"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";

import { Badge, Button, Chip, ChipRow, renderIcon } from "@/components/ui";
import { SERVICE_COLORS } from "@/lib/brand";
import { useI18n } from "@/lib/i18n";
import type { Service, ServiceCategory, Staff, Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { serviceIcon, serviceMeta, servicePrice } from "./helpers";

/* ------------------------------------------------------------------ */
/* Category filter                                                     */
/* ------------------------------------------------------------------ */

export const ALL_CATEGORIES = "all";

export interface CategoryChipsProps {
  categories: ServiceCategory[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function CategoryChips({
  categories,
  value,
  onChange,
  className,
}: CategoryChipsProps) {
  const { t, tl } = useI18n();
  return (
    <ChipRow bleed className={className}>
      <Chip
        active={value === ALL_CATEGORIES}
        onClick={() => onChange(ALL_CATEGORIES)}
      >
        {t("common.all")}
      </Chip>
      {categories.map((category) => (
        <Chip
          key={category.id}
          active={value === category.id}
          onClick={() => onChange(category.id)}
        >
          {tl(category.name)}
        </Chip>
      ))}
    </ChipRow>
  );
}

/* ------------------------------------------------------------------ */
/* Service row                                                         */
/* ------------------------------------------------------------------ */

export interface ServiceRowProps {
  tenant: Tenant;
  service: Service;
  team: Staff[];
  selected: boolean;
  onToggle: (id: string) => void;
  /** When set, phones get a direct "Umów" link into the flow instead. */
  href?: string;
}

export function ServiceRow({
  tenant,
  service,
  team,
  selected,
  onToggle,
  href,
}: ServiceRowProps) {
  const { t, tl, locale } = useI18n();
  const swatch = SERVICE_COLORS[service.color];
  const seatsLeft = service.group
    ? Math.max(service.group.capacity - service.group.taken, 0)
    : 0;

  const meta = service.group
    ? `${t("company.groupSchedule")} · ${t("company.groupSeatsLeft", { count: seatsLeft })}`
    : serviceMeta(service, team, tl, locale);

  const price = (
    <span className="tabular shrink-0 text-[14px] font-medium text-ink">
      {servicePrice(service, locale, t)}
    </span>
  );

  const toggleLabel = service.group
    ? t("company.joinClass")
    : selected
      ? t("company.chosen")
      : t("common.select");

  const toggle = (
    <Button
      size="sm"
      variant={selected ? "brand" : "secondary"}
      iconLeft={selected ? Check : service.group ? Plus : undefined}
      aria-pressed={selected}
      onClick={() => onToggle(service.id)}
    >
      {toggleLabel}
    </Button>
  );

  const action = href ? (
    <>
      <span className="hidden lg:inline-flex">{toggle}</span>
      <Link
        href={href}
        className="inline-flex h-9 items-center rounded-md border border-line bg-card px-3 text-[13px] font-medium text-ink shadow-xs transition-colors hover:bg-sand-50 lg:hidden"
      >
        {service.group ? t("company.joinClass") : t("company.book")}
      </Link>
    </>
  ) : (
    toggle
  );

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors duration-150 sm:items-center sm:gap-4",
        selected
          ? "border-brand/35 bg-brand-soft/55"
          : "border-line bg-card hover:border-line-strong",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-md sm:size-11",
          swatch.bg,
          swatch.ink,
        )}
      >
        {renderIcon(serviceIcon(tenant, service), "size-[18px] stroke-[1.75]")}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[14px] leading-5 font-medium text-ink">
            {tl(service.name)}
          </p>
          {service.popular && (
            <Badge tone="neutral" size="sm">
              {t("company.popular")}
            </Badge>
          )}
          {service.online && (
            <Badge tone="info" size="sm">
              {t("company.features.video")}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-[12.5px] leading-4 text-muted">{meta}</p>

        <div className="mt-2.5 flex items-center gap-3 sm:hidden">
          {price}
          <span className="ml-auto flex items-center gap-2">{action}</span>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-3 sm:flex">
        {price}
        {action}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* List                                                                */
/* ------------------------------------------------------------------ */

export interface ServiceListProps {
  tenant: Tenant;
  services: Service[];
  team: Staff[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  hrefFor?: (service: Service) => string;
  className?: string;
}

export function ServiceList({
  tenant,
  services,
  team,
  selectedIds,
  onToggle,
  hrefFor,
  className,
}: ServiceListProps) {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {services.map((service) => (
        <ServiceRow
          key={service.id}
          tenant={tenant}
          service={service}
          team={team}
          selected={selectedIds.includes(service.id)}
          onToggle={onToggle}
          href={hrefFor?.(service)}
        />
      ))}
    </ul>
  );
}
