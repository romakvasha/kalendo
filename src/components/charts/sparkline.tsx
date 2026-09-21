"use client";

import { useId } from "react";
import { clamp, cn } from "@/lib/utils";

export type SparklineTone = "brand" | "success" | "ink" | "muted";

export interface SparklineProps {
  values: number[];
  tone?: SparklineTone;
  height?: number;
  width?: number;
  className?: string;
}

const TONE_CLASS: Record<SparklineTone, string> = {
  brand: "text-brand",
  success: "text-success",
  ink: "text-ink",
  muted: "text-sand-400",
};

const VB_W = 100;
const VB_H = 32;
const PAD = 3;

interface Point {
  x: number;
  y: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Catmull-Rom control points expressed as cubic beziers — smooth, no overshoot spikes. */
function smoothPath(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M${round(points[0].x)},${round(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < points.length ? points[i + 2] : p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6, 0, VB_H);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6, 0, VB_H);
    d += ` C${round(c1x)},${round(c1y)} ${round(c2x)},${round(c2y)} ${round(p2.x)},${round(p2.y)}`;
  }
  return d;
}

export function Sparkline({
  values,
  tone = "brand",
  height = 36,
  width = 120,
  className,
}: SparklineProps) {
  const gradientId = `kal-spark-${useId().replace(/:/g, "")}`;
  const clean = values.filter((value) => Number.isFinite(value));

  if (clean.length === 0) return null;

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min;
  const innerH = VB_H - PAD * 2;

  const points: Point[] =
    clean.length === 1
      ? [
          { x: 0, y: VB_H / 2 },
          { x: VB_W, y: VB_H / 2 },
        ]
      : clean.map((value, index) => ({
          x: (index / (clean.length - 1)) * VB_W,
          y: span === 0 ? VB_H / 2 : VB_H - PAD - ((value - min) / span) * innerH,
        }));

  const line = smoothPath(points);
  const area = `${line} L${VB_W},${VB_H} L${round(points[0].x)},${VB_H} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="none"
      className={cn("block", TONE_CLASS[tone], className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.24} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
