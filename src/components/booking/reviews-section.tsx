"use client";

import { Star } from "lucide-react";

import { Rating } from "@/components/ui";
import { dayMonth, number } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Review, Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ReviewsSectionProps {
  tenant: Tenant;
  reviews: Review[];
  /** How many cards to show; the rest stay in the panel. */
  limit?: number;
  className?: string;
}

export function ReviewsSection({
  tenant,
  reviews,
  limit = 3,
  className,
}: ReviewsSectionProps) {
  const { t, tl, locale } = useI18n();
  const shown = reviews.slice(0, limit);

  return (
    <section id="reviews" className={cn("scroll-mt-24", className)}>
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-[26px] leading-8 text-ink lg:text-[32px]">
          {t("company.reviews")}
        </h2>
        <div className="shrink-0 text-right">
          <p className="tabular font-display text-[24px] leading-7 text-ink">
            {number(tenant.rating, locale)}
          </p>
          <p className="text-[12px] text-muted">
            {t("company.reviewsCount", { count: tenant.reviewCount })}
          </p>
        </div>
      </div>

      <ul className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {shown.map((review) => (
          <li
            key={review.id}
            className="surface-flat flex flex-col p-4 lg:p-5"
          >
            <span
              aria-label={t("a11y.rateStars", { n: review.rating })}
              className="inline-flex items-center gap-0.5"
            >
              {[0, 1, 2, 3, 4].map((index) => (
                <Star
                  key={index}
                  aria-hidden
                  className={cn(
                    "size-3.5",
                    index < review.rating ? "text-ink" : "text-sand-300",
                  )}
                  fill="currentColor"
                  strokeWidth={0}
                />
              ))}
            </span>

            <p className="mt-3 flex-1 text-[14px] leading-6 text-sand-800">
              “{tl(review.text)}”
            </p>

            <p className="mt-3 text-[12px] text-muted">
              {review.clientName} · {dayMonth(review.date, locale)}{" "}
              {review.date.slice(0, 4)} · {t("company.reviewVerified")}
            </p>

            {review.reply && (
              <p className="mt-3 rounded-md border-l-2 border-brand/40 bg-sand-50 px-3 py-2 text-[12.5px] leading-5 text-sand-700">
                <span className="font-medium text-ink">
                  {t("company.reply")}:{" "}
                </span>
                {tl(review.reply)}
              </p>
            )}
          </li>
        ))}
      </ul>

      {reviews.length === 0 && (
        <p className="mt-4 text-[13.5px] text-muted">{t("common.none")}</p>
      )}
    </section>
  );
}

/** Compact aggregate used above the fold on phones. */
export function RatingSummary({ tenant }: { tenant: Tenant }) {
  const { t, locale } = useI18n();
  return (
    <span className="inline-flex items-center gap-2">
      <Rating value={tenant.rating} size="sm" />
      <span className="tabular text-[13px] font-medium text-ink">
        {number(tenant.rating, locale)}
      </span>
      <span className="text-[13px] text-muted">
        {t("company.reviewsCount", { count: tenant.reviewCount })}
      </span>
    </span>
  );
}
