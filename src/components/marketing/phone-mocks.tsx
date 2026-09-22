"use client";

import { CalendarDays, MapPin, Search, Star } from "lucide-react";

import { BrandProvider } from "@/components/brand/brand-provider";
import { TenantLogo } from "@/components/brand/logo";
import { Avatar, Badge, Rating } from "@/components/ui";
import {
  DEMO_CLIENT_ACCOUNT,
  getTenant,
  getTenantBySlug,
  SEED_STATE,
  servicesFor,
  servicesOf,
  staffById,
  upcomingForClient,
} from "@/lib/data";
import { dayMonth, duration, money, timeOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

/** Compact mock of /app — the client home screen, as shown inside a PhoneFrame. */
export function ClientHomeMock() {
  const { t, tl, locale } = useI18n();

  const next = upcomingForClient(SEED_STATE, DEMO_CLIENT_ACCOUNT.id)[0];
  const tenant = next ? getTenant(SEED_STATE, next.tenantId) : undefined;
  const service = next ? servicesFor(SEED_STATE, next.serviceIds)[0] : undefined;
  const staff = next ? staffById(SEED_STATE, next.staffId) : undefined;
  const nearby = SEED_STATE.tenants.slice(0, 2);

  return (
    <div className="flex flex-col bg-paper px-4 pt-6 pb-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-[19px] leading-tight text-ink">
            {t("discover.greeting", {
              name: DEMO_CLIENT_ACCOUNT.name.split(" ")[0],
            })}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">{t("discover.subtitle")}</p>
        </div>
        <Avatar name={DEMO_CLIENT_ACCOUNT.name} size="sm" />
      </div>

      <div className="mt-3.5 flex h-10 items-center gap-2 rounded-full border border-line bg-card px-3.5">
        <Search aria-hidden className="size-4 shrink-0 text-sand-400" strokeWidth={1.75} />
        <span className="truncate text-[13px] text-sand-400">
          {t("discover.searchPlaceholder")}
        </span>
      </div>

      {next && tenant ? (
        <BrandProvider brand={tenant.brand}>
          <div className="mt-4 overflow-hidden rounded-lg border border-line bg-card shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-3">
              <TenantLogo tenant={tenant} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">
                  {tenant.name}
                </p>
                <p className="truncate text-[11px] text-muted">{tl(service?.name)}</p>
              </div>
              <Badge tone="success" size="sm">
                {t("discover.confirmed")}
              </Badge>
            </div>
            <div className="flex items-center gap-3 px-3.5 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-brand-soft text-brand-ink">
                <CalendarDays aria-hidden className="size-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="tabular text-[13px] font-medium text-ink">
                  {dayMonth(next.start, locale)}, {timeOf(next.start)}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {t("booking.specialist")}: {staff?.name}
                </p>
              </div>
            </div>
          </div>
        </BrandProvider>
      ) : null}

      <p className="mt-4 mb-2 text-[12px] font-semibold text-ink">
        {t("discover.nearby")}
      </p>
      <ul className="flex flex-col gap-2">
        {nearby.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2.5 rounded-md border border-line bg-card px-3 py-2.5"
          >
            <BrandProvider brand={item.brand}>
              <TenantLogo tenant={item} size="sm" />
            </BrandProvider>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium text-ink">{item.name}</p>
              <p className="flex items-center gap-1 truncate text-[11px] text-muted">
                <MapPin aria-hidden className="size-3" strokeWidth={1.75} />
                {t("discover.distance", { km: item.distanceKm ?? 1 })}
              </p>
            </div>
            <span className="tabular inline-flex items-center gap-0.5 text-[11px] font-medium text-ink">
              <Star aria-hidden className="size-3 fill-current text-ink" />
              {item.rating}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Compact mock of /b/[slug] — a company's public booking page. */
export function CompanyPageMock() {
  const { t, tn, tl, locale } = useI18n();

  const tenant = getTenantBySlug(SEED_STATE, "aurora");
  if (!tenant) return null;
  const services = servicesOf(SEED_STATE, tenant.id).slice(0, 3);

  return (
    <BrandProvider brand={tenant.brand}>
      <div className="flex flex-col bg-card">
        <div className="h-20 bg-brand-soft" aria-hidden />
        <div className="-mt-6 px-4">
          <TenantLogo tenant={tenant} size="lg" className="shadow-sm" />
          <h3 className="font-display mt-2.5 text-[20px] leading-tight text-ink">
            {tenant.name}
          </h3>
          <p className="mt-0.5 text-[12px] text-muted">{tl(tenant.tagline)}</p>
          <div className="mt-2 flex items-center gap-2">
            <Rating value={tenant.rating} size="sm" />
            <span className="text-[11px] text-muted">
              {t("company.reviewsCount", {
                count: tenant.reviewCount,
                reviews: tn(tenant.reviewCount, "plurals.reviews"),
              })}
            </span>
          </div>
        </div>

        <div className="mt-4 px-4">
          <p className="text-[12px] font-semibold text-ink">{t("company.services")}</p>
          <ul className="mt-2 flex flex-col divide-y divide-line border-y border-line">
            {services.map((service) => (
              <li key={service.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium text-ink">
                    {tl(service.name)}
                  </p>
                  <p className="tabular text-[11px] text-muted">
                    {duration(service.durationMin, locale)}
                  </p>
                </div>
                <span className="tabular shrink-0 text-[12.5px] font-semibold text-ink">
                  {service.priceFrom
                    ? t("common.priceFrom", { price: money(service.price, locale) })
                    : money(service.price, locale)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 px-4 pb-5">
          <span className="flex h-11 w-full items-center justify-center rounded-md bg-brand text-[14px] font-medium text-brand-fg">
            {t("company.book")}
          </span>
          <p className="mt-2 text-center text-[11px] text-muted">
            {t("company.noAccountNote")}
          </p>
        </div>
      </div>
    </BrandProvider>
  );
}
