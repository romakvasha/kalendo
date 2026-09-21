import { cn, hashRatio, range } from "@/lib/utils";

const SIZE = 25;
const QUIET = 2;

/** Ring distance from the middle of a square pattern. */
function ring(x: number, y: number, centre: number): number {
  return Math.max(Math.abs(x - centre), Math.abs(y - centre));
}

function finderAt(x: number, y: number): boolean | null {
  const zones: [number, number][] = [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ];
  for (const [ox, oy] of zones) {
    if (x >= ox && x < ox + 7 && y >= oy && y < oy + 7) {
      const value = ring(x - ox, y - oy, 3);
      return value === 3 || value <= 1;
    }
    // Separator: the quiet ring that keeps a finder readable.
    if (x >= ox - 1 && x <= ox + 7 && y >= oy - 1 && y <= oy + 7) return false;
  }
  return null;
}

function alignmentAt(x: number, y: number): boolean | null {
  const ox = SIZE - 9;
  const oy = SIZE - 9;
  if (x < ox || x > ox + 4 || y < oy || y > oy + 4) return null;
  const value = ring(x - ox, y - oy, 2);
  return value === 2 || value === 0;
}

function moduleAt(value: string, x: number, y: number): boolean {
  const finder = finderAt(x, y);
  if (finder !== null) return finder;

  const alignment = alignmentAt(x, y);
  if (alignment !== null) return alignment;

  // Timing patterns run between the finders on row and column 6.
  if (y === 6) return x % 2 === 0;
  if (x === 6) return y % 2 === 0;

  // Coordinates lead the seed so every module gets a full mixing pass and the
  // matrix does not fall into repeating bands.
  return hashRatio(`${x}:${y}#${value}`) > 0.5;
}

export interface QrCodeProps {
  value: string;
  className?: string;
  title?: string;
}

export function QrCode({ value, className, title }: QrCodeProps) {
  const span = SIZE + QUIET * 2;

  return (
    <svg
      viewBox={`0 0 ${span} ${span}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title}
      className={cn("block h-auto w-full text-ink", className)}
    >
      <rect width={span} height={span} fill="#ffffff" />
      {range(SIZE).map((y) =>
        range(SIZE).map((x) =>
          moduleAt(value, x, y) ? (
            <rect
              key={`${x}-${y}`}
              x={x + QUIET}
              y={y + QUIET}
              width={1}
              height={1}
              fill="currentColor"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
