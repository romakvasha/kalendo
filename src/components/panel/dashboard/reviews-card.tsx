"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Modal,
  Rating,
  Textarea,
} from "@/components/ui";
import { reviewsOf, useDataState, useKalendo } from "@/lib/data";
import { dayMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Review, Tenant } from "@/lib/types";

export interface ReviewsCardProps {
  tenant: Tenant;
  limit?: number;
  className?: string;
}

export function ReviewsCard({ tenant, limit = 2, className }: ReviewsCardProps) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();
  const addReviewReply = useKalendo((store) => store.addReviewReply);

  const reviews = useMemo(
    () => reviewsOf(state, tenant.id).slice(0, limit),
    [state, tenant.id, limit],
  );

  const [active, setActive] = useState<Review | null>(null);
  const [draft, setDraft] = useState("");

  function open(review: Review) {
    setActive(review);
    setDraft(tl(review.reply));
  }

  function save() {
    if (!active || !draft.trim()) return;
    addReviewReply(active.id, draft.trim());
    toast.success(t("toast.saved"));
    setActive(null);
    setDraft("");
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader
        action={
          <Rating
            value={tenant.rating}
            count={tenant.reviewCount}
            size="sm"
            showValue
          />
        }
      >
        <CardTitle as="h2">{t("panel.reports.latestReviews")}</CardTitle>
      </CardHeader>

      <CardBody className="flex flex-1 flex-col gap-4 pt-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="border-t border-line pt-4 first:border-t-0 first:pt-0"
          >
            <Rating value={review.rating} size="sm" />
            <p className="mt-2 text-[14px] leading-6 text-ink">
              {`„${tl(review.text)}”`}
            </p>

            {review.reply ? (
              <p className="mt-2 rounded-sm bg-sand-50 px-3 py-2 text-[13px] leading-5 text-muted">
                <span className="font-medium text-sand-700">
                  {`${t("company.reply")}: `}
                </span>
                {tl(review.reply)}
              </p>
            ) : null}

            <div className="mt-2 flex items-center justify-between gap-3 text-[12px]">
              <span className="truncate text-muted">
                {`${review.clientName} · ${dayMonth(review.date, locale)}`}
              </span>
              <button
                type="button"
                onClick={() => open(review)}
                className="shrink-0 rounded-sm font-medium text-cobalt hover:underline"
              >
                {t("panel.reviews.reply")}
              </button>
            </div>
          </div>
        ))}
      </CardBody>

      <Modal
        open={active !== null}
        onOpenChange={(next) => {
          if (!next) setActive(null);
        }}
        title={t("panel.reviews.reply")}
        size="sm"
        closeLabel={t("common.close")}
        footer={
          <Button block onClick={save} disabled={!draft.trim()}>
            {t("common.send")}
          </Button>
        }
      >
        {active ? (
          <p className="mb-3 text-[13px] leading-5 text-muted">
            {`„${tl(active.text)}” — ${active.clientName}`}
          </p>
        ) : null}
        <Textarea
          value={draft}
          rows={4}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("panel.reviews.replyPlaceholder")}
          aria-label={t("panel.reviews.reply")}
        />
      </Modal>
    </Card>
  );
}
