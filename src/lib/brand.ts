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
    baseDark: "#6d9bf5",
    softDark: "#1a2740",
    fgDark: "#10151f",
    inkDark: "#a9c4f8",
  },
  green: {
    key: "green",
    base: "#167645",
    soft: "#e3f2e9",
    fg: "#ffffff",
    ink: "#0e4d2d",
    baseDark: "#4fb37c",
    softDark: "#16291f",
    fgDark: "#0b1a12",
    inkDark: "#8fd4ad",
  },
  orange: {
    key: "orange",
    base: "#e8802a",
    soft: "#fdeedd",
    fg: "#ffffff",
    ink: "#9a4d0d",
    baseDark: "#f0954a",
    softDark: "#33210f",
    fgDark: "#1d1206",
    inkDark: "#f5c08a",
  },
  violet: {
    key: "violet",
    base: "#6d4bd6",
    soft: "#ece6fb",
    fg: "#ffffff",
    ink: "#452c94",
    baseDark: "#9b81ea",
    softDark: "#241d42",
    fgDark: "#140f26",
    inkDark: "#c4b3f4",
  },
  rose: {
    key: "rose",
    base: "#c23e6b",
    soft: "#fbe4ec",
    fg: "#ffffff",
    ink: "#87264a",
    baseDark: "#e8799f",
    softDark: "#3a1d28",
    fgDark: "#211017",
    inkDark: "#f2a8c0",
  },
};

export function brandTheme(key: BrandKey): BrandTheme {
  return BRAND_THEMES[key] ?? BRAND_THEMES.cobalt;
}

/**
 * Inline style object that activates a brand inside a subtree.
 *
 * These land as inline styles, which would otherwise beat the .dark rules in
 * globals.css, so each value carries both themes and lets light-dark() pick —
 * driven by the color-scheme that :root / .dark already declare.
 */
export function brandVars(key: BrandKey): React.CSSProperties {
  const theme = brandTheme(key);
  return {
    "--brand": `light-dark(${theme.base}, ${theme.baseDark})`,
    "--brand-soft": `light-dark(${theme.soft}, ${theme.softDark})`,
    "--brand-fg": `light-dark(${theme.fg}, ${theme.fgDark})`,
    "--brand-ink": `light-dark(${theme.ink}, ${theme.inkDark})`,
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
