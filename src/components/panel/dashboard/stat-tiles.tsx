"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Card, Stat } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface MetricTileProps {
  label: ReactNode;
  value: ReactNode;
  delta?: number | string;
  deltaLabel?: ReactNode;
  hint?: ReactNode;
  chart?: ReactNode;
  className?: string;
}

export function MetricTile({
  label,
  value,
  delta,
  deltaLabel,
  hint,
  chart,
  className,
}: MetricTileProps) {
  return (
    <Card flat className={cn("p-4 lg:p-5", className)}>
      <Stat
        label={label}
        value={value}
        delta={delta}
        deltaLabel={deltaLabel}
        hint={hint}
        chart={chart}
      />
    </Card>
  );
}

export interface InvertedDeltaProps {
  /** Signed change; a fall is the good direction here. */
  value: number;
  text: string;
}

export function InvertedDelta({ value, text }: InvertedDeltaProps) {
  const Arrow = value > 0 ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center gap-0.5 font-semibold",
        value > 0 ? "text-danger" : value < 0 ? "text-success" : "text-sand-500",
      )}
    >
      {value !== 0 && <Arrow aria-hidden className="size-3.5" />}
      {text}
    </span>
  );
}
