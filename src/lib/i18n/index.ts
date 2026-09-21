"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LOCALES, type Locale, type LocalizedText } from "@/lib/types";
import { pl, type Dict } from "./pl";
import { en } from "./en";
import { uk } from "./uk";

export type { Dict };

export const dictionaries: Record<Locale, Dict> = { pl, en, uk };

export const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  pl: { short: "PL", name: "Polski" },
  en: { short: "EN", name: "English" },
  uk: { short: "UA", name: "Українська" },
};

export type TranslateVars = Record<string, string | number>;
export type Translate = (key: string, vars?: TranslateVars) => string;
export type Localize = (text: LocalizedText | null | undefined) => string;

const STORAGE_KEY = "kalendo.locale";
const DEFAULT_LOCALE: Locale = "pl";

const warned = new Set<string>();

function warnMissing(locale: Locale, key: string): void {
  if (process.env.NODE_ENV === "production") return;
  const id = `${locale}:${key}`;
  if (warned.has(id)) return;
  warned.add(id);
  console.warn(`[i18n] missing key "${key}" in "${locale}"`);
}

function resolve(dict: Dict, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

function interpolate(text: string, vars?: TranslateVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

/** Locale-aware lookup usable outside React (seed data, metadata). */
export function translate(
  locale: Locale,
  key: string,
  vars?: TranslateVars,
): string {
  const value = resolve(dictionaries[locale], key);
  if (value === undefined) {
    warnMissing(locale, key);
    return key;
  }
  return interpolate(value, vars);
}

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
  tl: Localize;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Read after mount so the server render and the first client render match.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isLocale(stored)) setLocaleState(stored);
    } catch {
      // Storage can be blocked (private mode) — the default locale is fine.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore — the locale still applies for this session.
    }
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const t: Translate = (key, vars) => translate(locale, key, vars);
    const tl: Localize = (text) => (text ? text[locale] : "");
    return { locale, setLocale, t, tl };
  }, [locale, setLocale]);

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }
  return context;
}

export function useT(): Translate {
  return useI18n().t;
}

export function useLocale(): Locale {
  return useI18n().locale;
}

/** Picks the current language out of a LocalizedText value. */
export function useTl(): Localize {
  return useI18n().tl;
}

export { pl, en, uk };
