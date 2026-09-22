"use client";

import { GripVertical } from "lucide-react";

import { SERVICE_COLORS } from "@/lib/brand";
import { MIN_BLOCK_HEIGHT } from "@/lib/calendar-geometry";
import { timeOf } from "@/lib/format";
import type { Appointment, ServiceColor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BlockChips, type VisitChip } from "./block-chips";
import { DRAG_STEP_MINUTES } from "./calendar-model";

/** Below this the block only has room for one line of text. */
const COMPACT_HEIGHT = 38;
const CHIPS_HEIGHT = 58;

/** Static so Tailwind keeps the classes — the accent bar on the block's left edge. */
const BARS: Record<ServiceColor, string> = {
  peach: "bg-svc-peach-ink",
  rose: "bg-svc-rose-ink",
  violet: "bg-svc-violet-ink",
  sky: "bg-svc-sky-ink",
  mint: "bg-svc-mint-ink",
  sand: "bg-svc-sand-ink",
};

export interface AppointmentBlockProps {
  appointment: Appointment;
  clientName: string;
  serviceLabel: string;
  color: ServiceColor;
  chips: VisitChip[];
  top: number;
  height: number;
  column: number;
  columns: number;
  selected: boolean;
  dragging: boolean;
  label: string;
  /** Narrow columns only have room for one pill. */
  maxChips: number;
  /** Phone columns drop the start time — the gutter already carries it. */
  showTime: boolean;
  onSelect: () => void;
  onDragStart: (event: React.PointerEvent<HTMLElement>) => void;
  onNudge: (deltaMinutes: number) => void;
}

export function AppointmentBlock({
  appointment,
  clientName,
  serviceLabel,
  color,
  chips,
  top,
  height,
  column,
  columns,
  selected,
  dragging,
  label,
  maxChips,
  showTime,
  onSelect,
  onDragStart,
  onNudge,
}: AppointmentBlockProps) {
  const tone = SERVICE_COLORS[color];
  const compact = height <= COMPACT_HEIGHT;
  const roomForChips = height >= CHIPS_HEIGHT && chips.length > 0;

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      onClick={onSelect}
      onPointerDown={(event) => {
        // Touch pointers scroll the grid; they drag through the grip instead.
        if (event.pointerType === "touch") return;
        onDragStart(event);
      }}
      onKeyDown={(event) => {
        if (!event.altKey) return;
        if (event.key === "ArrowUp") {
          event.preventDefault();
          onNudge(-DRAG_STEP_MINUTES);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          onNudge(DRAG_STEP_MINUTES);
        }
      }}
      style={{
        top,
        height: Math.max(height, MIN_BLOCK_HEIGHT),
        left: `calc(${(column / columns) * 100}% + 2px)`,
        width: `calc(${100 / columns}% - 4px)`,
      }}
      className={cn(
        "group absolute z-10 flex flex-col overflow-hidden rounded-md border p-2 text-left",
        "transition-shadow duration-150 ease-out hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/40",
        tone.bg,
        tone.ink,
        tone.border,
        selected && "z-20 opacity-100 shadow-md ring-2 ring-cobalt",
        dragging && "opacity-35",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-0.5 rounded-l-md opacity-40",
          BARS[color],
        )}
      />

      <span className="flex min-w-0 items-baseline gap-1.5">
        <span className="truncate text-[13px] leading-4 font-semibold">
          {clientName}
        </span>
        {showTime && !compact ? (
          <span className="tabular ml-auto shrink-0 text-[11px] leading-4 opacity-65">
            {timeOf(appointment.start)}
          </span>
        ) : null}
      </span>

      {!compact ? (
        <span className="mt-0.5 line-clamp-2 text-[12px] leading-4 opacity-75">
          {serviceLabel}
        </span>
      ) : null}

      {roomForChips ? (
        <BlockChips chips={chips.slice(0, maxChips)} className="mt-auto pt-1" />
      ) : null}

      <span
        aria-hidden
        onPointerDown={(event) => {
          event.stopPropagation();
          onDragStart(event);
        }}
        style={{ touchAction: "none" }}
        className={cn(
          "absolute right-0.5 bottom-0.5 inline-grid size-4 cursor-grab place-items-center rounded-xs",
          "bg-card/55 opacity-60 transition-opacity duration-150",
          "lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100",
        )}
      >
        <GripVertical className="size-3" />
      </span>
    </button>
  );
}
