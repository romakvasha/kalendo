import { CircleAlert, CircleCheck, Clock, Tag, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Translate } from "@/lib/i18n";
import type { Appointment, Membership, Service } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ChipTone =
  "success" | "danger" | "info" | "warn" | "muted" | "neutral";

export interface VisitChip {
  key: string;
  label: string;
  tone: ChipTone;
  icon?: LucideIcon;
}

const TONES: Record<ChipTone, string> = {
  success: "bg-card/65 text-success",
  danger: "bg-card/75 text-danger",
  info: "bg-card/75 text-cobalt",
  warn: "bg-card/75 text-warn-ink",
  muted: "bg-card/60 text-sand-600",
  neutral: "bg-card/60 text-sand-700",
};

export interface ChipsInput {
  appointment: Appointment;
  services: Service[];
  membership?: Membership;
  t: Translate;
}

export function chipsForAppointment({
  appointment,
  services,
  membership,
  t,
}: ChipsInput): VisitChip[] {
  const chips: VisitChip[] = [];

  if (appointment.status === "no-show") {
    chips.push({
      key: "no-show",
      label: t("panel.calendar.noShow"),
      tone: "danger",
    });
  }

  if (appointment.payment === "paid") {
    chips.push({
      key: "paid",
      label: t("panel.calendar.paid"),
      tone: "success",
      icon: CircleCheck,
    });
  } else if (appointment.payment === "deposit") {
    chips.push({
      key: "deposit",
      label: t("panel.calendar.deposit"),
      tone: "success",
      icon: CircleCheck,
    });
  } else if (appointment.depositAmount && appointment.status !== "no-show") {
    chips.push({
      key: "awaiting-deposit",
      label: t("panel.calendar.awaitingDeposit"),
      tone: "warn",
      icon: Clock,
    });
  }

  // A paid visit is self-evidently confirmed — the reference shows one pill.
  if (appointment.smsReminderSent && appointment.payment !== "paid") {
    chips.push({
      key: "sms",
      label: t("panel.calendar.smsConfirmed"),
      tone: "success",
      icon: CircleCheck,
    });
  }

  if (appointment.isFirstVisit) {
    chips.push({
      key: "first",
      label: t("panel.calendar.firstVisit"),
      tone: "info",
    });
  }

  if (membership) {
    chips.push({
      key: "membership",
      label: t("panel.calendar.pass", {
        used: Math.min(membership.used + 1, membership.total),
        total: membership.total,
      }),
      tone: "neutral",
      icon: Tag,
    });
  }

  if (services.some((service) => service.online)) {
    chips.push({
      key: "video",
      label: t("panel.calendar.video"),
      tone: "info",
      icon: Video,
    });
  }

  if (appointment.status === "pending") {
    chips.push({
      key: "pending",
      label: t("panel.calendar.unconfirmed"),
      tone: "muted",
      icon: CircleAlert,
    });
  }

  return chips;
}

export interface BlockChipsProps {
  chips: VisitChip[];
  className?: string;
}

export function BlockChips({ chips, className }: BlockChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1 overflow-hidden", className)}>
      {chips.map((chip) => {
        const Glyph = chip.icon;
        return (
          <span
            key={chip.key}
            className={cn(
              "inline-flex h-4.5 shrink-0 items-center gap-1 rounded-full px-1.5 text-[10px] leading-none font-semibold whitespace-nowrap",
              TONES[chip.tone],
            )}
          >
            {Glyph ? <Glyph aria-hidden className="size-3 shrink-0" /> : null}
            {chip.label}
          </span>
        );
      })}
    </div>
  );
}
