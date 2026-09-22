"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Navigation, Phone, Share2, Star } from "lucide-react";
import { toast } from "sonner";

import { Button, PhotoPlaceholder, Rating, renderIcon } from "@/components/ui";
import { number } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { ServiceCategory, Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  bookHref,
  featureIcon,
  featureKey,
  industryIcon,
  mapsUrl,
  openStateOf,
  tenantMark,
} from "./helpers";

/** Sets the last word in italic, the way the display face is used everywhere. */
function DisplayName({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return <>{name}</>;
  const head = parts.slice(0, -1).join(" ");
  return (
    <>
      {head} <em>{parts[parts.length - 1]}</em>
    </>
  );
}

export interface CompanyHeroProps {
  tenant: Tenant;
  categories: ServiceCategory[];
}

export function CompanyHero({ tenant, categories }: CompanyHeroProps) {
  const { t, tn, tl, locale } = useI18n();
  const open = openStateOf(tenant);
  const extraPhotos = Math.max(tenant.photoCount - 3, 0);

  const openLabel = open.worksToday && open.closeTime && open.openNow
    ? t("company.openTodayUntil", { time: open.closeTime })
    : t("company.closed");

  async function share() {
    const url = typeof window === "undefined" ? "" : window.location.href;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: tenant.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(t("toast.linkCopied"));
    } catch {
      // The user dismissed the share sheet — nothing to report.
    }
  }

  return (
    <section className="pt-5 lg:pt-10">
      {/* ---------------------------------------------- mobile hero */}
      <div className="lg:hidden">
        <div className="relative isolate aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-brand-soft">
          <span
            aria-hidden
            className="absolute -top-10 -right-8 size-44 rounded-full bg-brand/10"
          />
          <span
            aria-hidden
            className="absolute -bottom-16 -left-10 size-52 rounded-full border border-brand/15"
          />
          <span
            aria-hidden
            className="font-display absolute inset-0 grid place-items-center text-[86px] leading-none text-brand/35 select-none"
          >
            {tenantMark(tenant.name)}
          </span>
          <div className="no-scrollbar absolute right-3 bottom-3 left-3 flex justify-end gap-1.5 overflow-x-auto">
            {categories.slice(0, 3).map((category) => (
              <span
                key={category.id}
                className="shrink-0 rounded-full bg-card/85 px-2.5 py-1 text-[11px] font-medium text-sand-700 shadow-xs backdrop-blur-sm"
              >
                {tl(category.name)}
              </span>
            ))}
          </div>
        </div>

        <h1 className="font-display mt-5 text-[34px] leading-[1.08] text-ink">
          <DisplayName name={tenant.name} />
        </h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          {t(`onboarding.industries.${tenant.industry}`)} · {tenant.city}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
          <span className="inline-flex items-center gap-1.5">
            <Star
              aria-hidden
              className="size-3.5 text-ink"
              fill="currentColor"
              strokeWidth={0}
            />
            <span className="tabular font-medium text-ink">
              {number(tenant.rating, locale)}
            </span>
            <span className="text-muted">
              (
              {t("company.reviewsCount", {
                count: tenant.reviewCount,
                reviews: tn(tenant.reviewCount, "plurals.reviews"),
              })}
              )
            </span>
          </span>
          {tenant.distanceKm !== undefined && (
            <span className="text-muted">
              {t("discover.distance", { km: tenant.distanceKm })}
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              open.openNow ? "text-success" : "text-muted",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                open.openNow ? "bg-success" : "bg-sand-400",
              )}
            />
            {openLabel}
          </span>
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-[13px] text-muted">
          <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
          {tenant.address}, {tenant.city}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <HeroAction href={`tel:${tenant.phone.replace(/\s/g, "")}`} icon={<Phone />}>
            {t("company.call")}
          </HeroAction>
          <HeroAction href={mapsUrl(tenant)} external icon={<Navigation />}>
            {t("company.directions")}
          </HeroAction>
          <HeroAction onClick={share} icon={<Share2 />}>
            {t("company.share")}
          </HeroAction>
        </div>

        <div className="mt-4 rounded-xl border border-brand/20 bg-brand-soft/70 p-4">
          <span className="inline-grid size-9 place-items-center rounded-md bg-brand text-brand-fg">
            {renderIcon(
              industryIcon(tenant.industry),
              "size-[18px] stroke-[1.75]",
            )}
          </span>
          <p className="mt-2.5 text-[15px] font-semibold text-ink">
            {t(`company.promo.${tenant.industry}.title`)}
          </p>
          <p className="mt-1 text-[13px] leading-5 text-sand-700">
            {t(`company.promo.${tenant.industry}.body`)}
          </p>
          <Button
            variant="brand"
            size="sm"
            className="mt-3"
            iconRight={ArrowRight}
            onClick={() => {
              document
                .getElementById("services")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {t("company.promo.cta")}
          </Button>
        </div>
      </div>

      {/* --------------------------------------------- desktop hero */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center lg:gap-12">
        <div>
          <p className="text-[12px] font-medium tracking-[0.14em] text-sand-500 uppercase">
            {tenant.city} · {t(`onboarding.industries.${tenant.industry}`)}
          </p>
          <h1 className="font-display mt-3 text-[62px] leading-[1.02] text-ink xl:text-[72px]">
            <DisplayName name={tenant.name} />
          </h1>
          <p className="mt-4 max-w-lg text-[16px] leading-7 text-sand-700">
            {tl(tenant.tagline)}. {tl(tenant.about)}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px]">
            <span className="inline-flex items-center gap-2">
              <Rating value={tenant.rating} size="md" showValue />
              <span className="text-muted">
                (
              {t("company.reviewsCount", {
                count: tenant.reviewCount,
                reviews: tn(tenant.reviewCount, "plurals.reviews"),
              })}
              )
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted">
              <MapPin aria-hidden className="size-4" strokeWidth={1.75} />
              {tenant.address}, {tenant.city}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-2",
                open.openNow ? "text-success" : "text-muted",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-2 rounded-full",
                  open.openNow ? "animate-pulse-ring bg-success" : "bg-sand-400",
                )}
              />
              {openLabel}
            </span>
          </div>

          <ul className="mt-6 flex flex-wrap gap-2">
            {tenant.features.map((feature) => {
              const Icon = featureIcon(feature);
              return (
                <li
                  key={feature}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] font-medium text-sand-700"
                >
                  <Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
                  {t(featureKey(feature))}
                </li>
              );
            })}
          </ul>

          <div className="mt-7 flex items-center gap-3">
            <Link
              href={bookHref(tenant.slug)}
              className="inline-flex h-12 items-center gap-2 rounded-md bg-brand px-5 text-[15px] font-medium text-brand-fg shadow-xs transition-opacity hover:opacity-90"
            >
              {t("company.book")}
              <ArrowRight aria-hidden className="size-[18px]" />
            </Link>
            <a
              href={`tel:${tenant.phone.replace(/\s/g, "")}`}
              className="inline-flex h-12 items-center gap-2 rounded-md border border-line bg-card px-5 text-[15px] font-medium text-ink shadow-xs transition-colors hover:bg-sand-50"
            >
              <Phone aria-hidden className="size-[18px]" strokeWidth={1.75} />
              {tenant.phone}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PhotoPlaceholder
            tone="brand"
            label={tenant.name}
            className="col-span-2 aspect-[16/10] rounded-2xl"
          />
          <PhotoPlaceholder tone="neutral" className="aspect-square rounded-2xl" />
          <div className="relative">
            <PhotoPlaceholder
              tone="brand"
              className="aspect-square h-full rounded-2xl"
            />
            {/* ink/paper swap, so an ink scrim would turn into a light veil in dark. */}
            {extraPhotos > 0 && (
              <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl bg-ink/35 backdrop-blur-[2px] dark:bg-paper/55">
                <span className="rounded-full bg-card/90 px-3 py-1.5 text-[12.5px] font-medium text-ink shadow-xs">
                  {t("company.morePhotos", {
                    count: extraPhotos,
                    photos: tn(extraPhotos, "plurals.photos"),
                  })}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

interface HeroActionProps {
  href?: string;
  external?: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function HeroAction({ href, external, onClick, icon, children }: HeroActionProps) {
  const className =
    "flex flex-col items-center justify-center gap-1.5 rounded-lg border border-line bg-card px-2 py-3 text-[12px] font-medium text-ink shadow-xs transition-colors hover:bg-sand-50 [&_svg]:size-[18px] [&_svg]:text-sand-600";

  if (href) {
    return (
      <a
        href={href}
        className={className}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {icon}
      {children}
    </button>
  );
}
