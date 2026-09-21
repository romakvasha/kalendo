"use client";

import { Gift } from "lucide-react";
import { Progress } from "@/components/ui";
import { number as formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { clamp, cn } from "@/lib/utils";
import type { Tenant } from "@/lib/types";

export interface LoyaltyCardProps {
  tenant: Tenant;
  points: number;
  rewardAt: number;
  variant?: "ink" | "plain";
  className?: string;
}

export function LoyaltyCard({
  tenant,
  points,
  rewardAt,
  variant = "ink",
  className,
}: LoyaltyCardProps) {
  const { t, tl, locale } = useI18n();
  const ink = variant === "ink";
  const missing = Math.max(0, rewardAt - points);
  const reward = tl(tenant.loyalty?.rewardLabel);

  return (
    <section
      className={cn(
        ink ? "rounded-2xl bg-ink p-5 text-paper shadow-md" : "surface p-5",
        className,
      )}
    >
      <p
        className={cn(
          "flex items-center gap-2 text-[12px]",
          ink ? "text-paper/70" : "text-muted",
        )}
      >
        <Gift aria-hidden className="size-4 shrink-0" />
        <span className="truncate">
          {t("visits.loyaltyCard")} · {tenant.name}
        </span>
      </p>

      <p className="mt-3 flex items-baseline gap-2">
        <span className="tabular font-display text-[40px] leading-none">
          {formatNumber(points, locale)}
        </span>
        <span className="font-display text-[20px] leading-none">
          {t("visits.pointsUnit")}
        </span>
        <span
          className={cn(
            "tabular text-[13px]",
            ink ? "text-paper/60" : "text-muted",
          )}
        >
          {t("common.of")} {formatNumber(rewardAt, locale)}
        </span>
      </p>

      <Progress
        tone="success"
        size="md"
        className={cn("mt-4", ink && "bg-paper/15")}
        value={clamp((points / rewardAt) * 100, 0, 100)}
      />

      <p
        className={cn(
          "mt-3 text-[13px] leading-5",
          ink ? "text-paper/70" : "text-muted",
        )}
      >
        {t("visits.pointsToReward", { n: missing, reward })}
      </p>
    </section>
  );
}
