"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageSquarePlus, Star } from "lucide-react";

import { usePanelSession } from "@/components/layout";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Progress,
  Rating,
  Segmented,
  Stat,
  Textarea,
} from "@/components/ui";
import {
  clientById,
  reviewsOf,
  staffById,
  useDataState,
  useHydrated,
  useKalendo,
} from "@/lib/data";
import { TODAY, addDays, dayMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Review, Tenant } from "@/lib/types";

import { ModuleHeader } from "./module-header";
import { ModuleSkeleton } from "./module-skeleton";

/* ------------------------------------------------------------------ */

const FILTERS = ["all", "unanswered", "five", "belowFour"] as const;
type ReviewFilter = (typeof FILTERS)[number];

const STARS = [5, 4, 3, 2, 1];

export function ReviewsScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <ModuleSkeleton rows={4} />;
  return <Reviews tenant={tenant} />;
}

/* ------------------------------------------------------------------ */

function Reviews({ tenant }: { tenant: Tenant }) {
  const { t, tn, tl, locale } = useI18n();
  const state = useDataState();
  const addReviewReply = useKalendo((store) => store.addReviewReply);

  const reviews = useMemo(
    () => reviewsOf(state, tenant.id),
    [state, tenant.id],
  );

  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const average =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : tenant.rating;

  const distribution = useMemo(() => {
    const map = new Map<number, number>(STARS.map((star) => [star, 0]));
    for (const review of reviews) {
      const star = Math.round(review.rating);
      map.set(star, (map.get(star) ?? 0) + 1);
    }
    return map;
  }, [reviews]);

  const unanswered = reviews.filter((review) => !review.reply);

  /** Clients seen in the last 30 days who never left a review. */
  const askable = useMemo(() => {
    const since = addDays(TODAY, -30);
    const named = new Set(reviews.map((review) => review.clientName));
    const seen = new Set<string>();
    for (const appointment of state.appointments) {
      if (appointment.tenantId !== tenant.id) continue;
      if (appointment.status !== "done") continue;
      if (appointment.start.slice(0, 10) < since) continue;
      const client = clientById(state, appointment.clientId);
      if (client && !named.has(client.name)) seen.add(client.name);
    }
    return seen.size;
  }, [reviews, state, tenant.id]);

  const shown = reviews.filter((review) => {
    if (filter === "unanswered") return !review.reply;
    if (filter === "five") return review.rating >= 5;
    if (filter === "belowFour") return review.rating < 4;
    return true;
  });

  function openReply(review: Review) {
    setOpenId(review.id);
    setDraft(tl(review.reply));
  }

  function submitReply(review: Review) {
    const text = draft.trim();
    if (!text) return;
    addReviewReply(review.id, text);
    setOpenId(null);
    setDraft("");
    toast.success(t("panel.reviews.replySent"));
  }

  function askForReviews() {
    if (askable === 0) {
      toast.success(t("panel.reviews.nobodyToAsk"));
      return;
    }
    toast.success(
      t("panel.reviews.askSent", {
        count: askable,
        clients: tn(askable, "plurals.clientsTo"),
      }),
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <ModuleHeader
        title={
          <>
            {t("panel.reviews.title")} <em>{t("panel.reviews.andReplies")}</em>
          </>
        }
        subtitle={t("panel.reviews.subtitle", {
          count: reviews.length,
          reviews: tn(reviews.length, "plurals.reviews"),
          unanswered: unanswered.length,
          awaiting: tn(unanswered.length, "plurals.awaitingReply"),
        })}
        action={
          <Button iconLeft={MessageSquarePlus} onClick={askForReviews}>
            {t("panel.reviews.askForReview")}
          </Button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex h-full flex-col justify-center gap-3 text-center">
            <p className="text-[12px] text-muted">
              {t("panel.reviews.average")}
            </p>
            <p className="tabular font-display text-[52px] leading-none text-ink">
              {average.toFixed(1).replace(".", ",")}
            </p>
            <Rating value={average} size="md" className="justify-center" />
            <p className="text-[13px] text-muted">
              {t("company.reviewsCount", {
                count: reviews.length,
                reviews: tn(reviews.length, "plurals.reviews"),
              })}
            </p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle as="h2">{t("panel.reviews.distribution")}</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2.5 pt-4">
            {STARS.map((star) => {
              const count = distribution.get(star) ?? 0;
              const pct =
                reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="tabular inline-flex w-9 shrink-0 items-center gap-1 text-[13px] text-muted">
                    {star}
                    <Star
                      aria-hidden
                      className="size-3.5 text-sand-400"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  </span>
                  <Progress
                    value={pct}
                    tone="ink"
                    className="flex-1"
                    aria-label={t("a11y.rateStars", { n: star })}
                  />
                  <span className="tabular w-8 shrink-0 text-right text-[12px] text-muted">
                    {count}
                  </span>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <Card className="grid grid-cols-2 gap-5 p-5 lg:grid-cols-4 lg:gap-6">
        <Stat label={t("panel.reviews.total")} value={reviews.length} />
        <Stat
          label={t("panel.reviews.awaiting")}
          value={unanswered.length}
          tone={unanswered.length > 0 ? "default" : "muted"}
        />
        <Stat
          label={t("panel.reviews.fiveStars")}
          value={reviews.filter((review) => review.rating >= 5).length}
        />
        <Stat label={t("panel.reviews.askable")} value={askable} />
      </Card>

      <div className="flex flex-col gap-4">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Segmented
            size="sm"
            value={filter}
            onChange={(next) => setFilter(next as ReviewFilter)}
            options={FILTERS.map((key) => ({
              value: key,
              label: t(`panel.reviews.filters.${key}`),
            }))}
          />
        </div>

        {shown.length === 0 ? (
          <Card>
            <EmptyState
              icon={Star}
              title={t("panel.reviews.empty")}
              body={t("panel.reviews.emptyBody")}
            />
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((review) => {
              const specialist = review.staffId
                ? staffById(state, review.staffId)
                : undefined;
              const replying = openId === review.id;

              return (
                <li key={review.id}>
                  <Card>
                    <CardBody className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Rating value={review.rating} size="sm" />
                        <span className="tabular text-[12px] text-muted">
                          {dayMonth(review.date, locale)}
                        </span>
                      </div>

                      <blockquote className="font-display text-[17px] leading-7 text-ink">
                        {`„${tl(review.text)}”`}
                      </blockquote>

                      <div className="flex flex-wrap items-center gap-2 text-[13px]">
                        <span className="font-medium text-ink">
                          {review.clientName}
                        </span>
                        {specialist ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-line py-0.5 pr-2.5 pl-0.5 text-[12px] text-sand-700">
                            <Avatar
                              name={specialist.name}
                              color={specialist.avatarColor}
                              size="xs"
                            />
                            {specialist.name}
                          </span>
                        ) : null}
                        {review.reply ? (
                          <Badge size="sm" tone="success">
                            {t("panel.reviews.replied")}
                          </Badge>
                        ) : (
                          <Badge size="sm" tone="warn">
                            {t("panel.reviews.awaiting")}
                          </Badge>
                        )}
                      </div>

                      {review.reply ? (
                        <p className="rounded-md bg-sand-50 px-3.5 py-2.5 text-[13px] leading-5 text-muted">
                          <span className="font-medium text-sand-700">
                            {`${t("company.reply")}: `}
                          </span>
                          {tl(review.reply)}
                        </p>
                      ) : null}

                      {replying ? (
                        <div className="flex flex-col gap-2">
                          <Textarea
                            rows={3}
                            autoFocus
                            value={draft}
                            aria-label={t("panel.reviews.reply")}
                            placeholder={t("panel.reviews.replyPlaceholder")}
                            onChange={(event) => setDraft(event.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setOpenId(null);
                                setDraft("");
                              }}
                            >
                              {t("common.cancel")}
                            </Button>
                            <Button
                              size="sm"
                              disabled={draft.trim().length === 0}
                              onClick={() => submitReply(review)}
                            >
                              {t("common.send")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openReply(review)}
                          >
                            {review.reply
                              ? t("panel.reviews.editReply")
                              : t("panel.reviews.reply")}
                          </Button>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
