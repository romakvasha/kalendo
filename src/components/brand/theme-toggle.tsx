"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronRight, Monitor, Moon, Sun } from "lucide-react";

import { IconButton, Segmented } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const CYCLE: Record<string, string> = {
  light: "dark",
  dark: "system",
  system: "light",
};

export interface ThemeToggleProps {
  variant?: "segmented" | "icon" | "row";
  className?: string;
}

export function ThemeToggle({
  variant = "segmented",
  className,
}: ThemeToggleProps) {
  const t = useT();
  const { theme, resolvedTheme, setTheme } = useTheme();

  // next-themes only knows the theme in the browser, so the first client render
  // has to match the themeless server markup.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const choice = theme ?? "system";
  const isDark = resolvedTheme === "dark";

  if (variant === "icon") {
    return (
      <IconButton
        variant="ghost"
        aria-label={t("a11y.toggleTheme")}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={className}
      >
        {!mounted ? (
          <span aria-hidden className="size-[18px]" />
        ) : isDark ? (
          <Moon aria-hidden strokeWidth={1.8} />
        ) : (
          <Sun aria-hidden strokeWidth={1.8} />
        )}
      </IconButton>
    );
  }

  if (variant === "row") {
    const RowIcon = !mounted ? null : choice === "system" ? Monitor : isDark ? Moon : Sun;

    return (
      <button
        type="button"
        onClick={() => setTheme(CYCLE[choice] ?? "light")}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sand-50",
          className,
        )}
      >
        <span aria-hidden className="text-sand-500 [&_svg]:size-[18px]">
          {RowIcon ? <RowIcon strokeWidth={1.8} /> : <span className="block size-[18px]" />}
        </span>
        <span className="flex-1 text-[15px] text-ink">
          {t("settings.appearance")}
        </span>
        <span className="max-w-[45%] truncate text-[13px] text-muted">
          {mounted ? t(`settings.theme.${choice}`) : ""}
        </span>
        <ChevronRight aria-hidden className="size-4 text-sand-400" />
      </button>
    );
  }

  return (
    <Segmented
      className={className}
      value={mounted ? choice : ""}
      onChange={setTheme}
      options={[
        { value: "light", label: t("settings.theme.light") },
        { value: "dark", label: t("settings.theme.dark") },
        { value: "system", label: t("settings.theme.system") },
      ]}
    />
  );
}
