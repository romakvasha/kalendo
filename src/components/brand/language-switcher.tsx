"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { Segmented } from "@/components/ui";
import { LOCALE_LABELS, useI18n } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */

export interface LanguageSegmentedProps {
  size?: "sm" | "md";
  className?: string;
}

export function LanguageSegmented({ size = "sm", className }: LanguageSegmentedProps) {
  const { locale, setLocale } = useI18n();

  return (
    <div className={className}>
      <Segmented
        size={size}
        value={locale}
        onChange={(value) => setLocale(value as Locale)}
        options={LOCALES.map((item) => ({
          value: item,
          label: LOCALE_LABELS[item].short,
        }))}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export interface LanguageDropdownProps {
  align?: "left" | "right";
  className?: string;
}

export function LanguageDropdown({ align = "right", className }: LanguageDropdownProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("a11y.changeLanguage")}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-sand-700 transition-colors hover:bg-sand-100 hover:text-ink"
      >
        <Globe className="size-4" strokeWidth={1.75} aria-hidden="true" />
        <span className="tabular">{LOCALE_LABELS[locale].short}</span>
        <ChevronDown
          className={cn("size-3.5 text-sand-400 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "surface animate-scale-in absolute top-full z-50 mt-2 min-w-[184px] p-1",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {LOCALES.map((item) => {
            const active = item === locale;
            return (
              <button
                key={item}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setLocale(item);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm transition-colors hover:bg-sand-50",
                  active ? "font-medium text-ink" : "text-sand-700",
                )}
              >
                <span className="tabular w-6 text-[11px] font-medium text-sand-400">
                  {LOCALE_LABELS[item].short}
                </span>
                <span className="flex-1">{LOCALE_LABELS[item].name}</span>
                {active ? (
                  <Check className="size-4 text-brand" strokeWidth={2.25} aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
