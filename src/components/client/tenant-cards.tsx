"use client";

import Link from "next/link";
import { BadgeCheck, Clock, Heart, Star } from "lucide-react";
import { Badge, IconButton } from "@/components/ui";
import { BrandProvider, TenantLogo } from "@/components/layout";
import { number as formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Locale, Tenant } from "@/lib/types";
import { categoryKeyOf, tenantCategories } from "./helpers";

interface TenantMeta {
  tenant: Tenant;
  nextFree: string | null;
}

function ratingLine(tenant: Tenant, locale: Locale): string {
  return formatNumber(tenant.rating, locale);
}

export interface TenantCardProps extends TenantMeta {
  lastMinute?: boolean;
  favourite?: boolean;
  onToggleFavourite?: (tenantId: string) => void;
  /** Lets the discover grid drop the fixed phone width from lg up. */
  className?: string;
}

/** The ~160px card used by the horizontal "free today" row. */
export function TenantCard({
  tenant,
  nextFree,
  lastMinute = false,
  favourite = false,
  onToggleFavourite,
  className,
}: TenantCardProps) {
  const { t, locale } = useI18n();

  return (
    <BrandProvider brand={tenant.brand}>
      <div className={cn("relative w-40 shrink-0", className)}>
        <Link href={`/b/${tenant.slug}`} className="block rounded-lg">
          <div className="relative grid h-28 place-items-center overflow-hidden rounded-lg border border-line bg-brand-soft px-3">
            <span className="font-display text-center text-[17px] leading-tight text-brand-ink">
              {tenant.name}
            </span>
            {lastMinute ? (
              <Badge tone="ink" size="sm" className="absolute top-2 left-2">
                {t("discover.lastMinuteOff")}
              </Badge>
            ) : null}
          </div>

          <p className="mt-2 truncate text-[14px] font-medium text-ink">
            {tenant.name}
          </p>

          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
            <Star
              aria-hidden
              className="size-3 shrink-0 text-ink"
              fill="currentColor"
              strokeWidth={0}
            />
            <span className="tabular text-ink">{ratingLine(tenant, locale)}</span>
            <span aria-hidden>·</span>
            <span className="tabular truncate">
              {t("discover.distance", {
                km: formatNumber(tenant.distanceKm ?? 0, locale),
              })}
            </span>
          </p>

          <p className="mt-1.5">
            {nextFree ? (
              <Badge tone="success" size="sm" iconLeft={Clock}>
                {t("discover.freeFrom", { time: nextFree })}
              </Badge>
            ) : (
              <Badge tone="neutral" size="sm">
                {t("company.noSlots")}
              </Badge>
            )}
          </p>
        </Link>

        {onToggleFavourite ? (
          <IconButton
            size="sm"
            variant="secondary"
            aria-pressed={favourite}
            aria-label={t("discover.favourites")}
            onClick={() => onToggleFavourite(tenant.id)}
            className="absolute top-1.5 right-1.5 rounded-full bg-card/90"
          >
            <Heart
              className={cn(favourite ? "text-danger" : "text-sand-500")}
              fill={favourite ? "currentColor" : "none"}
            />
          </IconButton>
        ) : null}
      </div>
    </BrandProvider>
  );
}

export interface TenantRowProps extends TenantMeta {
  className?: string;
}

/** The full-width row used by "Polecane w okolicy" and by search results. */
export function TenantRow({ tenant, nextFree, className }: TenantRowProps) {
  const { t, locale } = useI18n();
  const category = tenantCategories(tenant)[0];

  return (
    <BrandProvider brand={tenant.brand}>
      <Link
        href={`/b/${tenant.slug}`}
        className={cn(
          "surface-flat flex items-center gap-3 p-3 transition-colors hover:bg-sand-50",
          className,
        )}
      >
        <TenantLogo tenant={tenant} size="lg" />

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="truncate text-[15px] font-medium text-ink">
              {tenant.name}
            </span>
            <BadgeCheck
              aria-label={t("company.verified")}
              className="size-4 shrink-0 text-cobalt"
            />
          </span>

          <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
            <span className="truncate">{t(categoryKeyOf(category))}</span>
            <span aria-hidden>·</span>
            <span className="tabular flex items-center gap-0.5 text-ink">
              <Star
                aria-hidden
                className="size-3 text-ink"
                fill="currentColor"
                strokeWidth={0}
              />
              {ratingLine(tenant, locale)}
            </span>
            <span aria-hidden>·</span>
            <span className="tabular shrink-0">
              {t("discover.distance", {
                km: formatNumber(tenant.distanceKm ?? 0, locale),
              })}
            </span>
          </span>
        </span>

        {nextFree ? (
          <Badge tone="success" size="sm" className="shrink-0">
            {nextFree}
          </Badge>
        ) : null}
      </Link>
    </BrandProvider>
  );
}
