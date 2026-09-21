import type { Locale } from "./types";

/**
 * The demo clock. Seed data is authored around this date so the app
 * matches the reference design exactly. Point it at `new Date()` to run
 * against live data.
 */
export const TODAY = "2026-09-21";

const INTL_LOCALE: Record<Locale, string> = {
  pl: "pl-PL",
  en: "en-GB",
  uk: "uk-UA",
};

/* ---------------------------------------------------------------- */
/* Money                                                             */
/* ---------------------------------------------------------------- */

/** 2340 -> "2 340 zł". Keeps the narrow no-break space used in the design. */
export function money(amount: number, locale: Locale = "pl"): string {
  const formatted = new Intl.NumberFormat(INTL_LOCALE[locale], {
    minimumFractionDigits: 0,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
  return `${formatted} zł`;
}

/** 38420 -> "38 420" (no currency suffix, for big display numbers). */
export function number(value: number, locale: Locale = "pl"): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale]).format(value);
}

/** 0.14 -> "+14%" */
export function delta(value: number, locale: Locale = "pl"): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${new Intl.NumberFormat(INTL_LOCALE[locale], {
    maximumFractionDigits: 1,
  }).format(Math.abs(value * 100))}%`;
}

/* ---------------------------------------------------------------- */
/* Dates                                                             */
/* ---------------------------------------------------------------- */

/** Parses "2026-09-24" or "2026-09-24T10:30:00" as local wall-clock time. */
export function parseLocal(iso: string): Date {
  const [datePart, timePart = "00:00:00"] = iso.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm, ss = 0] = timePart.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, ss);
}

/** Date -> "2026-09-24" */
export function toISODate(date: Date): string {
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** "2026-09-24T10:30:00" -> "10:30" */
export function timeOf(iso: string): string {
  const time = iso.split("T")[1] ?? "00:00:00";
  return time.slice(0, 5);
}

/** Minutes since midnight, for positioning items on the day grid. */
export function minutesOf(iso: string): number {
  const [h, m] = timeOf(iso).split(":").map(Number);
  return h * 60 + m;
}

export function addDays(iso: string, days: number): string {
  const date = parseLocal(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function addMinutes(iso: string, minutes: number): string {
  const date = parseLocal(iso);
  date.setMinutes(date.getMinutes() + minutes);
  const time = `${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}:00`;
  return `${toISODate(date)}T${time}`;
}

/** Difference in whole days between two ISO dates (b − a). */
export function daysBetween(a: string, b: string): number {
  const ms = parseLocal(b.split("T")[0]).getTime() - parseLocal(a.split("T")[0]).getTime();
  return Math.round(ms / 86_400_000);
}

/** 1 = Monday … 7 = Sunday */
export function weekdayOf(iso: string): number {
  const day = parseLocal(iso).getDay();
  return day === 0 ? 7 : day;
}

/** The Monday of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  return addDays(iso, -(weekdayOf(iso) - 1));
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function daysInMonth(iso: string): number {
  const date = parseLocal(iso);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/* ---------------------------------------------------------------- */
/* Human-readable dates                                              */
/* ---------------------------------------------------------------- */

/** "24 września" / "24 September" / "24 вересня" */
export function dayMonth(iso: string, locale: Locale = "pl"): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
  }).format(parseLocal(iso));
}

/** "Czwartek, 24 września" */
export function weekdayDayMonth(iso: string, locale: Locale = "pl"): string {
  const text = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseLocal(iso));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Short weekday for calendar headers: "Pn", "Wt"… */
export function weekdayShort(iso: string, locale: Locale = "pl"): string {
  const text = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: "short",
  }).format(parseLocal(iso));
  return text.replace(".", "").slice(0, 2);
}

/** "wrz" — three-letter month used on date chips. */
export function monthShort(iso: string, locale: Locale = "pl"): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: "short" })
    .format(parseLocal(iso))
    .replace(".", "");
}

/** "Wrzesień 2026" */
export function monthYear(iso: string, locale: Locale = "pl"): string {
  const text = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    month: "long",
    year: "numeric",
  }).format(parseLocal(iso));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "60 min" / "2–2,5 h" is authored in data; this handles the simple case. */
export function duration(minutes: number, locale: Locale = "pl"): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  const rounded = new Intl.NumberFormat(INTL_LOCALE[locale], {
    maximumFractionDigits: 1,
  }).format(hours);
  return `${rounded} h`;
}

/** Week-day column headers, Monday first. */
export function weekdayHeaders(locale: Locale = "pl"): string[] {
  // 2026-09-21 is a Monday.
  return Array.from({ length: 7 }, (_, i) =>
    weekdayShort(addDays("2026-09-21", i), locale),
  );
}
