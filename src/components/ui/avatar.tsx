import { SERVICE_COLORS, SERVICE_COLOR_KEYS } from "@/lib/brand";
import { cn, hashRatio, initialsOf } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: Record<AvatarSize, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-[11px]",
  md: "size-10 text-[13px]",
  lg: "size-12 text-[15px]",
  xl: "size-16 text-xl",
};

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  /** Hex colour coming from the data (e.g. Staff.avatarColor). */
  color?: string;
  size?: AvatarSize;
  src?: string;
  /** Green presence dot, bottom-right. */
  online?: boolean;
}

export function Avatar({
  name,
  color,
  size = "md",
  src,
  online = false,
  className,
  ...props
}: AvatarProps) {
  const initials = initialsOf(name);
  const fallback =
    SERVICE_COLORS[
      SERVICE_COLOR_KEYS[
        Math.floor(hashRatio(name) * SERVICE_COLOR_KEYS.length) %
          SERVICE_COLOR_KEYS.length
      ]
    ];

  // The initials lean hard on ink rather than on the seed colour: at 78% the
  // hue looked right but measured 3.7:1 on the tinted background in light and
  // 4.0:1 in dark. Mixing toward ink keeps the identity and clears 4.5:1 in both.
  const tinted = color
    ? {
        backgroundColor: `color-mix(in oklab, ${color} 16%, var(--color-card))`,
        color: `color-mix(in oklab, ${color} 45%, var(--color-ink))`,
      }
    : undefined;

  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      {...props}
    >
      <span
        title={src ? undefined : name}
        style={tinted}
        className={cn(
          "inline-grid place-items-center overflow-hidden rounded-full font-semibold leading-none select-none",
          SIZES[size],
          !color && `${fallback.bg} ${fallback.ink}`,
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            width={SIZE_PX[size]}
            height={SIZE_PX[size]}
            className="size-full object-cover"
          />
        ) : (
          initials
        )}
      </span>
      {online && (
        <span
          aria-hidden
          className={cn(
            "absolute right-0 bottom-0 rounded-full border-2 border-card bg-success",
            size === "xs" || size === "sm" ? "size-2.5" : "size-3",
          )}
        />
      )}
    </span>
  );
}
