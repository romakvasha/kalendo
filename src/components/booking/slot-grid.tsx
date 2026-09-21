"use client";

import { useMemo } from "react";

import { Skeleton } from "@/components/ui";
import { useHydrated, useSlots } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import type { TimeSlot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { hhmmToMinutes } from "./helpers";

type Band = "morning" | "afternoon" | "evening";

const BAND_KEYS: Record<Band, string> = {
  morning: "company.morning",
  afternoon: "company.afternoon",
  evening: "company.evening",
};

function bandOf(time: string): Band {
  const minutes = hhmmToMinutes(time);
  if (minutes < 12 * 60) return "morning";
  if (minutes < 17 * 60) return "afternoon";
  return "evening";
}

export interface SlotGridProps {
  tenantId: string;
  serviceIds: string[];
  staffId: string | null;
  date: string | null;
  value: string | null;
  onChange: (time: string) => void;
  /** Splits the chips under Rano / Popołudnie / Wieczór. */
  grouped?: boolean;
  className?: string;
}

export function SlotGrid({
  tenantId,
  serviceIds,
  staffId,
  date,
  value,
  onChange,
  grouped = false,
  className,
}: SlotGridProps) {
  const t = useI18n().t;
  const hydrated = useHydrated();
  const slots = useSlots(tenantId, serviceIds, staffId, date);

  const bands = useMemo(() => {
    const out: Record<Band, TimeSlot[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    for (const slot of slots) out[bandOf(slot.time)].push(slot);
    return out;
  }, [slots]);

  if (!hydrated) {
    return (
      <div className={cn("grid grid-cols-4 gap-1.5", className)}>
        {Array.from({ length: 12 }, (_, index) => (
          <Skeleton key={index} className="h-9 rounded-md" />
        ))}
      </div>
    );
  }

  if (!date || slots.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-line-strong bg-sand-50 px-4 py-6 text-center",
          className,
        )}
      >
        <p className="text-[13.5px] font-medium text-ink">
          {t("company.noSlots")}
        </p>
        <p className="mt-1 text-[12.5px] leading-4 text-muted">
          {t("company.noSlotsBody")}
        </p>
      </div>
    );
  }

  if (!grouped) {
    return (
      <div className={cn("grid grid-cols-4 gap-1.5", className)}>
        {slots.map((slot) => (
          <SlotChip
            key={slot.time}
            slot={slot}
            selected={value === slot.time}
            onSelect={onChange}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {(Object.keys(BAND_KEYS) as Band[]).map((band) =>
        bands[band].length === 0 ? null : (
          <div key={band}>
            <p className="text-[12px] font-medium tracking-wide text-sand-500 uppercase">
              {t(BAND_KEYS[band])}
            </p>
            <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {bands[band].map((slot) => (
                <SlotChip
                  key={slot.time}
                  slot={slot}
                  selected={value === slot.time}
                  onSelect={onChange}
                />
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

interface SlotChipProps {
  slot: TimeSlot;
  selected: boolean;
  onSelect: (time: string) => void;
}

function SlotChip({ slot, selected, onSelect }: SlotChipProps) {
  return (
    <button
      type="button"
      disabled={!slot.available}
      aria-pressed={selected}
      onClick={() => onSelect(slot.time)}
      className={cn(
        "tabular h-9 rounded-md border text-[13px] font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
        "disabled:cursor-not-allowed",
        selected
          ? "border-brand bg-brand text-brand-fg"
          : slot.available
            ? "border-line bg-white text-ink hover:border-brand/40 hover:bg-brand-soft/50"
            : "border-transparent bg-sand-50 text-sand-400 line-through",
        slot.scarce && !selected && slot.available && "border-warn-ink/30 bg-warn/40",
      )}
    >
      {slot.time}
    </button>
  );
}
