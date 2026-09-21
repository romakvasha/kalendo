import {
  Car,
  Dumbbell,
  FileText,
  Gift,
  Hourglass,
  Scissors,
  Sparkles,
  Stethoscope,
  Users,
  Video,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { NOW_MINUTES } from "@/lib/data";
import { TODAY, addDays, duration, money, weekdayDayMonth, weekdayOf } from "@/lib/format";
import type {
  Industry,
  Locale,
  LocalizedText,
  Service,
  Staff,
  Tenant,
  TenantFeature,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Flow                                                                */
/* ------------------------------------------------------------------ */

export type FlowStep = "usluga" | "termin" | "dane" | "gotowe";

export const FLOW_STEPS: FlowStep[] = ["usluga", "termin", "dane", "gotowe"];

export const FLOW_STEP_KEYS: Record<FlowStep, string> = {
  usluga: "booking.steps.service",
  termin: "booking.steps.time",
  dane: "booking.steps.details",
  gotowe: "booking.steps.done",
};

export function isFlowStep(value: string | null | undefined): value is FlowStep {
  return value !== null && value !== undefined && (FLOW_STEPS as string[]).includes(value);
}

export interface BookHrefInput {
  serviceIds?: readonly string[];
  staffId?: string | null;
  date?: string | null;
  time?: string | null;
  step?: FlowStep;
}

/** Builds /b/{slug}/book with the draft carried in the query string. */
export function bookHref(slug: string, input: BookHrefInput = {}): string {
  const params = new URLSearchParams();
  if (input.serviceIds?.length) params.set("service", input.serviceIds.join(","));
  if (input.staffId) params.set("staff", input.staffId);
  if (input.date) params.set("date", input.date);
  if (input.time) params.set("time", input.time);
  if (input.step) params.set("step", input.step);
  const query = params.toString();
  return `/b/${slug}/book${query ? `?${query}` : ""}`;
}

/* ------------------------------------------------------------------ */
/* Opening hours                                                       */
/* ------------------------------------------------------------------ */

export function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export interface OpenState {
  /** The tenant works at all on the pinned demo day. */
  worksToday: boolean;
  /** The pinned clock sits inside today's window. */
  openNow: boolean;
  closeTime: string | null;
}

export function openStateOf(tenant: Tenant, isoDate: string = TODAY): OpenState {
  const hours = tenant.openingHours.find((h) => h.weekday === weekdayOf(isoDate));
  if (!hours?.open || !hours.close) {
    return { worksToday: false, openNow: false, closeTime: null };
  }
  const open = hhmmToMinutes(hours.open);
  const close = hhmmToMinutes(hours.close);
  return {
    worksToday: true,
    openNow: NOW_MINUTES >= open && NOW_MINUTES < close,
    closeTime: hours.close,
  };
}

/** "Poniedziałek" — reuses the shared formatter and drops the date part. */
export function weekdayLong(weekday: number, locale: Locale): string {
  // 2026-09-21 is a Monday, so weekday 1 maps to offset 0.
  const iso = addDays("2026-09-21", weekday - 1);
  return weekdayDayMonth(iso, locale).split(",")[0];
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

const INDUSTRY_ICONS: Record<Industry, LucideIcon> = {
  hair: Scissors,
  beauty: Sparkles,
  physio: Stethoscope,
  dental: Stethoscope,
  auto: Wrench,
  other: Sparkles,
};

export function industryIcon(industry: Industry): LucideIcon {
  return INDUSTRY_ICONS[industry];
}

const FEATURE_ICONS: Record<TenantFeature, LucideIcon> = {
  "online-payment": Wallet,
  video: Video,
  invoices: FileText,
  vouchers: Gift,
  loyalty: Sparkles,
  waitlist: Hourglass,
  "group-classes": Users,
  products: Car,
};

export function featureIcon(feature: TenantFeature): LucideIcon {
  return FEATURE_ICONS[feature];
}

const FEATURE_SLUGS: Record<TenantFeature, string> = {
  "online-payment": "onlinePayment",
  video: "video",
  invoices: "invoices",
  vouchers: "vouchers",
  loyalty: "loyalty",
  waitlist: "waitlist",
  "group-classes": "groupClasses",
  products: "products",
};

export function featureKey(feature: TenantFeature): string {
  return `company.features.${FEATURE_SLUGS[feature]}`;
}

export function serviceIcon(tenant: Tenant, service: Service): LucideIcon {
  if (service.online) return Video;
  if (service.group) return Dumbbell;
  if (tenant.industry === "auto" && service.categoryId.includes("tyres")) return Car;
  return industryIcon(tenant.industry);
}

/* ------------------------------------------------------------------ */
/* Copy derived from data                                              */
/* ------------------------------------------------------------------ */

/** "50 min · wywiad, badanie i plan terapii" — falls back to the staff list. */
export function serviceMeta(
  service: Service,
  team: readonly Staff[],
  tl: (text: LocalizedText | null | undefined) => string,
  locale: Locale,
): string {
  const head = duration(service.durationMin, locale);
  if (service.description) return `${head} · ${tl(service.description)}`;
  const named = service.staffIds.length
    ? team.filter((member) => service.staffIds.includes(member.id))
    : team;
  const names = named.slice(0, 2).map((member) => member.name);
  return names.length ? `${head} · ${names.join(", ")}` : head;
}

/** "od 250 zł" when the price is a starting point. */
export function servicePrice(
  service: Service,
  locale: Locale,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const value = money(service.price, locale);
  return service.priceFrom ? t("common.priceFrom", { price: value }) : value;
}

/** "Garaż 44" reads better as "44" than as "G4". */
export function tenantMark(name: string): string {
  const digits = /\d{1,3}/.exec(name);
  if (digits) return digits[0];
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * The house rule a client should read before this booking. Derived from the
 * industry and the chosen category — the dictionary carries the wording.
 */
export function serviceNoteKey(
  tenant: Tenant,
  services: readonly Service[],
): string | null {
  if (!services.length) return null;
  if (tenant.industry === "auto" && services.some((s) => s.categoryId.includes("tyres"))) {
    return "booking.serviceNote.tyres";
  }
  if (tenant.industry === "physio") return "booking.serviceNote.physio";
  if (tenant.industry === "hair" && services.some((s) => s.categoryId.includes("color"))) {
    return "booking.serviceNote.colour";
  }
  return null;
}

/** Workshops ask whether the client waits or leaves the car. */
export function hasModeQuestion(tenant: Tenant): boolean {
  return tenant.industry === "auto";
}

export const MODE_FIELD_ID = "mode";

export type ServiceMode = "wait" | "leave";

/* ------------------------------------------------------------------ */
/* Calendar export                                                     */
/* ------------------------------------------------------------------ */

function stamp(iso: string): string {
  return `${iso.slice(0, 10).replace(/-/g, "")}T${iso.slice(11, 16).replace(":", "")}00`;
}

function escapeIcs(value: string): string {
  return value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

export interface CalendarEvent {
  uid: string;
  start: string;
  end: string;
  title: string;
  location: string;
  description: string;
}

export function buildIcs(event: CalendarEvent): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kalendo//Booking//PL",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.uid}@kalendo.pl`,
    `DTSTAMP:${stamp(event.start)}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${stamp(event.start)}/${stamp(event.end)}`,
    location: event.location,
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(event: CalendarEvent, fileName: string): void {
  const blob = new Blob([buildIcs(event)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function mapsUrl(tenant: Tenant): string {
  const query = encodeURIComponent(`${tenant.name}, ${tenant.address}, ${tenant.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
