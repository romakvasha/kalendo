"use client";

import { Check, UsersRound } from "lucide-react";

import { Avatar, Rating } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { Staff } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BaseProps {
  team: Staff[];
  value: string | null;
  onChange: (staffId: string | null) => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Cards — the public page                                             */
/* ------------------------------------------------------------------ */

export function StaffCards({ team, value, onChange, className }: BaseProps) {
  const { t, tl } = useI18n();

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      <StaffCard
        selected={value === null}
        onSelect={() => onChange(null)}
        title={t("company.anyStaff")}
        subtitle={t("company.anyStaffNote")}
        media={
          <span className="grid size-10 place-items-center rounded-full border border-line bg-sand-50 text-sand-600">
            <UsersRound className="size-5" strokeWidth={1.6} aria-hidden />
          </span>
        }
      />

      {team.map((member) => (
        <StaffCard
          key={member.id}
          selected={value === member.id}
          onSelect={() => onChange(member.id)}
          title={member.name}
          subtitle={tl(member.role)}
          rating={member.rating}
          media={
            <Avatar name={member.name} color={member.avatarColor} size="md" />
          }
        />
      ))}
    </div>
  );
}

interface StaffCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  rating?: number;
  media: React.ReactNode;
}

function StaffCard({
  selected,
  onSelect,
  title,
  subtitle,
  rating,
  media,
}: StaffCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-start gap-2.5 rounded-lg border p-3 text-left transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-1 focus-visible:ring-offset-paper",
        selected
          ? "border-brand bg-brand-soft/45 ring-1 ring-brand"
          : "border-line bg-card hover:border-line-strong hover:bg-sand-50",
      )}
    >
      {media}
      <span className="min-w-0 w-full">
        <span className="block truncate text-[13.5px] font-medium text-ink">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-muted">
          {subtitle}
        </span>
      </span>
      {rating !== undefined && (
        <Rating value={rating} size="sm" showValue className="-mt-0.5" />
      )}
      {selected && (
        <span
          aria-hidden
          className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-brand text-brand-fg"
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar row — the booking flow                                       */
/* ------------------------------------------------------------------ */

export function StaffRow({ team, value, onChange, className }: BaseProps) {
  const t = useI18n().t;

  return (
    <div
      className={cn("no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}
    >
      <StaffBubble
        selected={value === null}
        onSelect={() => onChange(null)}
        label={t("company.anyStaff")}
        media={
          <span className="grid size-14 place-items-center rounded-full border border-line bg-sand-50 text-sand-600">
            <UsersRound className="size-6" strokeWidth={1.5} aria-hidden />
          </span>
        }
      />
      {team.map((member) => (
        <StaffBubble
          key={member.id}
          selected={value === member.id}
          onSelect={() => onChange(member.id)}
          label={member.name.split(" ")[0]}
          media={
            <Avatar
              name={member.name}
              color={member.avatarColor}
              size="lg"
              className="size-14"
            />
          }
        />
      ))}
    </div>
  );
}

interface StaffBubbleProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
  media: React.ReactNode;
}

function StaffBubble({ selected, onSelect, label, media }: StaffBubbleProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="group flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
    >
      <span
        className={cn(
          "relative inline-flex rounded-full p-0.5 transition-colors duration-150",
          selected ? "ring-2 ring-brand" : "ring-1 ring-transparent",
        )}
      >
        {media}
        {selected && (
          <span
            aria-hidden
            className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full border-2 border-paper bg-brand text-brand-fg"
          >
            <Check className="size-2.5" strokeWidth={3} />
          </span>
        )}
      </span>
      <span
        className={cn(
          "w-full truncate text-center text-[11.5px] leading-4",
          selected ? "font-medium text-ink" : "text-muted",
        )}
      >
        {label}
      </span>
    </button>
  );
}
