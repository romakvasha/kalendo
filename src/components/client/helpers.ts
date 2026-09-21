import {
  daysBetween,
  parseLocal,
  timeOf,
  toISODate,
  TODAY,
  weekdayDayMonth,
} from "@/lib/format";
import { NOW_MINUTES, servicesOf, slotsFor, type DataState } from "@/lib/data";
import type { Translate } from "@/lib/i18n";
import type { Industry, Locale, Tenant } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Discovery categories                                                */
/* ------------------------------------------------------------------ */

export type CategoryKey =
  | "hair"
  | "nails"
  | "beauty"
  | "physio"
  | "massage"
  | "dental"
  | "auto"
  | "other";

export const DISCOVER_CATEGORIES: CategoryKey[] = [
  "hair",
  "nails",
  "beauty",
  "physio",
  "massage",
  "dental",
  "auto",
  "other",
];

const INDUSTRY_CATEGORIES: Record<Industry, CategoryKey[]> = {
  hair: ["hair"],
  beauty: ["nails", "beauty"],
  physio: ["physio", "massage"],
  dental: ["dental"],
  auto: ["auto"],
  other: ["other"],
};

export function tenantCategories(tenant: Tenant): CategoryKey[] {
  return INDUSTRY_CATEGORIES[tenant.industry];
}

export function categoryKeyOf(category: CategoryKey): string {
  return `discover.cat.${category}`;
}

export const DISCOVER_AREAS = [
  "srodmiescie",
  "stareMiasto",
  "krzyki",
  "nadodrze",
  "psiePole",
] as const;

export type AreaKey = (typeof DISCOVER_AREAS)[number];

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/** "Dziś" / "Jutro" / "Czwartek, 24 września" — always against the demo clock. */
export function relativeDayLabel(
  t: Translate,
  locale: Locale,
  iso: string,
): string {
  const diff = daysBetween(TODAY, iso);
  if (diff === 0) return t("common.today");
  if (diff === 1) return t("common.tomorrow");
  if (diff === -1) return t("common.yesterday");
  return weekdayDayMonth(iso, locale);
}

/** Only the warm "Dziś" / "Jutro" badge, or null when it is further out. */
export function nearDayLabel(t: Translate, iso: string): string | null {
  const diff = daysBetween(TODAY, iso);
  if (diff === 0) return t("common.today");
  if (diff === 1) return t("common.tomorrow");
  return null;
}

export function dayOfMonth(iso: string): number {
  return parseLocal(iso).getDate();
}

/** The next `count` days, starting today — the reschedule day strip. */
export function upcomingDays(count: number, from: string = TODAY): string[] {
  const start = parseLocal(from);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    return toISODate(date);
  });
}

/* ------------------------------------------------------------------ */
/* Tenant facts                                                        */
/* ------------------------------------------------------------------ */

export function freeTimesToday(state: DataState, tenantId: string): string[] {
  return slotsFor(state, tenantId, [], null, TODAY)
    .filter((slot) => slot.available)
    .map((slot) => slot.time);
}

export function nextFreeToday(
  state: DataState,
  tenantId: string,
): string | null {
  return freeTimesToday(state, tenantId)[0] ?? null;
}

/** Cheapest service, used by the price filter. */
export function tenantMinPrice(state: DataState, tenantId: string): number {
  const prices = servicesOf(state, tenantId).map((service) => service.price);
  return prices.length ? Math.min(...prices) : 0;
}

/** A free slot inside the next two hours earns the last-minute badge. */
export function hasLastMinute(state: DataState, tenantId: string): boolean {
  const next = nextFreeToday(state, tenantId);
  if (!next) return false;
  const [hours, minutes] = next.split(":").map(Number);
  return hours * 60 + minutes <= NOW_MINUTES + 120;
}

export function mapsHref(tenant: Pick<Tenant, "name" | "address" | "city">): string {
  return mapsSearchHref(`${tenant.name}, ${tenant.address}, ${tenant.city}`);
}

export function mapsSearchHref(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

/** Diacritic-insensitive compare so "masaz" finds "masaż". */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function matches(haystack: string, needle: string): boolean {
  return normalize(haystack).includes(normalize(needle));
}

/* ------------------------------------------------------------------ */
/* Calendar export                                                     */
/* ------------------------------------------------------------------ */

function icsStamp(iso: string): string {
  return `${iso.slice(0, 10).replace(/-/g, "")}T${timeOf(iso).replace(":", "")}00`;
}

function escapeIcs(value: string): string {
  return value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export interface IcsEvent {
  uid: string;
  start: string;
  end: string;
  summary: string;
  location: string;
}

export function icsCalendar(events: IcsEvent[]): string {
  const body = events.flatMap((event) => [
    "BEGIN:VEVENT",
    `UID:${event.uid}@kalendo.pl`,
    `DTSTAMP:${icsStamp(event.start)}`,
    `DTSTART:${icsStamp(event.start)}`,
    `DTEND:${icsStamp(event.end)}`,
    `SUMMARY:${escapeIcs(event.summary)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    "END:VEVENT",
  ]);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kalendo//PL",
    ...body,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(filename: string, content: string): void {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
