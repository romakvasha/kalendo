import type { BrandKey, BrandTheme, ServiceColor } from "./types";

/**
 * Brand presets. Each tenant picks one; <BrandProvider> writes the
 * chosen theme into CSS variables so every `bg-brand` / `text-brand`
 * utility follows the company colour at runtime.
 */
export const BRAND_THEMES: Record<BrandKey, BrandTheme> = {
  cobalt: {
    key: "cobalt",
    base: "#1b5bda",
    soft: "#e6f0ff",
    fg: "#ffffff",
    ink: "#123c91",
  },
  green: {
    key: "green",
    base: "#167645",
    soft: "#e3f2e9",
    fg: "#ffffff",
    ink: "#0e4d2d",
  },
  orange: {
    key: "orange",
    base: "#e8802a",
    soft: "#fdeedd",
    fg: "#ffffff",
    ink: "#9a4d0d",
  },
  violet: {
    key: "violet",
    base: "#6d4bd6",
    soft: "#ece6fb",
    fg: "#ffffff",
    ink: "#452c94",
  },
  rose: {
    key: "rose",
    base: "#c23e6b",
    soft: "#fbe4ec",
    fg: "#ffffff",
    ink: "#87264a",
  },
};

export function brandTheme(key: BrandKey): BrandTheme {
  return BRAND_THEMES[key] ?? BRAND_THEMES.cobalt;
}

/** Inline style object that activates a brand inside a subtree. */
export function brandVars(key: BrandKey): React.CSSProperties {
  const theme = brandTheme(key);
  return {
    "--brand": theme.base,
    "--brand-soft": theme.soft,
    "--brand-fg": theme.fg,
    "--brand-ink": theme.ink,
  } as React.CSSProperties;
}

/** Calendar chip colours, keyed by the service's `color`. */
export const SERVICE_COLORS: Record<
  ServiceColor,
  { bg: string; ink: string; border: string }
> = {
  peach: { bg: "bg-svc-peach", ink: "text-svc-peach-ink", border: "border-svc-peach-ink/20" },
  rose: { bg: "bg-svc-rose", ink: "text-svc-rose-ink", border: "border-svc-rose-ink/20" },
  violet: { bg: "bg-svc-violet", ink: "text-svc-violet-ink", border: "border-svc-violet-ink/20" },
  sky: { bg: "bg-svc-sky", ink: "text-svc-sky-ink", border: "border-svc-sky-ink/20" },
  mint: { bg: "bg-svc-mint", ink: "text-svc-mint-ink", border: "border-svc-mint-ink/20" },
  sand: { bg: "bg-svc-sand", ink: "text-svc-sand-ink", border: "border-svc-sand-ink/20" },
};

export const SERVICE_COLOR_KEYS: ServiceColor[] = [
  "peach",
  "rose",
  "violet",
  "sky",
  "mint",
  "sand",
];
