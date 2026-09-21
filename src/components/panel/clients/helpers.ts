import { Cake, Sparkles, Star, TriangleAlert, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { NOW_ISO, clientsOf, type DataState } from "@/lib/data";
import { TODAY, dayMonth, monthShort, monthYearGenitive } from "@/lib/format";
import { hashRatio } from "@/lib/utils";
import type {
  Appointment,
  AppointmentStatus,
  Client,
  ClientTag,
  Locale,
  RodoConsent,
  Tenant,
} from "@/lib/types";
import type { BadgeTone } from "@/components/ui";

const INTL_TAG: Record<Locale, string> = {
  pl: "pl-PL",
  en: "en-GB",
  uk: "uk-UA",
};

/* ------------------------------------------------------------------ */
/* Filters & sorting                                                   */
/* ------------------------------------------------------------------ */

export type ClientFilter = "all" | "regular" | "new" | "birthday" | "noShows";

export const CLIENT_FILTERS: ClientFilter[] = [
  "all",
  "regular",
  "new",
  "birthday",
  "noShows",
];

export type ClientSort = "name" | "lastVisit" | "spent";

export const CLIENT_SORTS: ClientSort[] = ["name", "lastVisit", "spent"];

export function isClientFilter(value: string): value is ClientFilter {
  return (CLIENT_FILTERS as string[]).includes(value);
}

export function isClientSort(value: string): value is ClientSort {
  return (CLIENT_SORTS as string[]).includes(value);
}

export function matchesFilter(client: Client, filter: ClientFilter): boolean {
  switch (filter) {
    case "regular":
      return client.tags.includes("regular") || client.tags.includes("vip");
    case "new":
      return client.tags.includes("new");
    case "birthday":
      return client.birthday
        ? client.birthday.slice(5, 7) === TODAY.slice(5, 7)
        : false;
    case "noShows":
      return client.noShows > 0;
    default:
      return true;
  }
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function matchesQuery(client: Client, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  if (client.name.toLocaleLowerCase().includes(needle)) return true;
  if (client.email?.toLocaleLowerCase().includes(needle)) return true;
  if (client.phone.toLocaleLowerCase().includes(needle)) return true;
  const digits = normalizePhone(needle);
  return digits.length > 1 && normalizePhone(client.phone).includes(digits);
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

/**
 * A booking counts as a visit once it has actually taken place and was not
 * called off — waiting for the "done" flag hid every past appointment the
 * salon had not ticked off yet.
 */
export function hasHappened(appointment: Appointment): boolean {
  if (appointment.status === "done") return true;
  if (appointment.status === "cancelled" || appointment.status === "no-show") {
    return false;
  }
  return appointment.start < NOW_ISO;
}

/**
 * A client carries a lifetime `visitCount`, but only the demo window exists as
 * appointment rows — so someone who joined earlier can honestly have visits
 * that nothing here can list. Someone who joined today cannot.
 */
export function hasEarlierVisits(client: Client): boolean {
  return client.visitCount > 0 && client.since < TODAY;
}

export interface ClientRow {
  client: Client;
  /** ISO datetime of the most recent visit on record, when there is one. */
  lastVisit?: string;
}

export function clientRows(state: DataState, tenantId: string): ClientRow[] {
  const latest = new Map<string, string>();
  for (const appointment of state.appointments) {
    if (appointment.tenantId !== tenantId || !hasHappened(appointment)) {
      continue;
    }
    const current = latest.get(appointment.clientId);
    if (!current || appointment.start > current) {
      latest.set(appointment.clientId, appointment.start);
    }
  }
  return clientsOf(state, tenantId).map((client) => ({
    client,
    lastVisit: latest.get(client.id),
  }));
}

export function sortRows(
  rows: ClientRow[],
  sort: ClientSort,
  locale: Locale,
): ClientRow[] {
  const sorted = [...rows];
  if (sort === "spent") {
    sorted.sort((a, b) => b.client.totalSpent - a.client.totalSpent);
  } else if (sort === "lastVisit") {
    sorted.sort((a, b) => (b.lastVisit ?? "").localeCompare(a.lastVisit ?? ""));
  } else {
    sorted.sort((a, b) =>
      a.client.name.localeCompare(b.client.name, INTL_TAG[locale]),
    );
  }
  return sorted;
}

/* ------------------------------------------------------------------ */
/* One client's appointments                                           */
/* ------------------------------------------------------------------ */

/**
 * Deliberately not `appointmentsForClient` — that helper follows the phone
 * number across tenants, which is right for the client app and wrong for a
 * company's own client card.
 */
export function visitsOf(state: DataState, clientId: string): Appointment[] {
  return state.appointments
    .filter((appointment) => appointment.clientId === clientId)
    .sort((a, b) => a.start.localeCompare(b.start));
}

const OPEN_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "in-progress",
];

export function pastVisitsOf(state: DataState, clientId: string): Appointment[] {
  return visitsOf(state, clientId)
    .filter(
      (appointment) =>
        appointment.status === "done" || appointment.start < NOW_ISO,
    )
    .reverse();
}

export function nextVisitOf(
  state: DataState,
  clientId: string,
): Appointment | undefined {
  return visitsOf(state, clientId).find(
    (appointment) =>
      appointment.start >= `${TODAY}T00:00:00` &&
      OPEN_STATUSES.includes(appointment.status),
  );
}

/* ------------------------------------------------------------------ */
/* Labels                                                              */
/* ------------------------------------------------------------------ */

export interface ToneKey {
  tone: BadgeTone;
  key: string;
}

export interface TagBadge extends ToneKey {
  icon: LucideIcon;
}

export const TAG_BADGES: Record<ClientTag, TagBadge> = {
  regular: { tone: "brand", key: "panel.clients.regular", icon: UserCheck },
  vip: { tone: "ink", key: "panel.clients.vip", icon: Star },
  new: { tone: "info", key: "panel.clients.newClient", icon: Sparkles },
  birthday: { tone: "warn", key: "panel.clients.birthday", icon: Cake },
  "no-show-risk": {
    tone: "danger",
    key: "panel.clients.noShowRisk",
    icon: TriangleAlert,
  },
};

const TAG_ORDER: ClientTag[] = ["vip", "regular", "new", "birthday", "no-show-risk"];

export function primaryTag(client: Client): ClientTag | undefined {
  return TAG_ORDER.find((tag) => client.tags.includes(tag));
}

export function orderedTags(client: Client): ClientTag[] {
  return TAG_ORDER.filter((tag) => client.tags.includes(tag));
}

export function statusBadge(status: AppointmentStatus): ToneKey {
  switch (status) {
    case "done":
      return { tone: "success", key: "panel.calendar.done" };
    case "in-progress":
      return { tone: "info", key: "panel.calendar.inProgress" };
    case "pending":
      return { tone: "warn", key: "visits.pending" };
    case "cancelled":
      return { tone: "neutral", key: "visits.cancelled" };
    case "no-show":
      return { tone: "danger", key: "panel.calendar.noShow" };
    default:
      return { tone: "info", key: "visits.confirmed" };
  }
}

export function boardBadge(status: AppointmentStatus): ToneKey {
  switch (status) {
    case "done":
      return { tone: "success", key: "panel.bookings.ready" };
    case "in-progress":
      return { tone: "info", key: "panel.bookings.inProgress" };
    case "pending":
      return { tone: "warn", key: "panel.dashboard.waiting" };
    case "no-show":
      return { tone: "danger", key: "panel.calendar.noShow" };
    case "cancelled":
      return { tone: "neutral", key: "visits.cancelled" };
    default:
      return { tone: "neutral", key: "panel.bookings.scheduled" };
  }
}

export function paymentBadge(appointment: Appointment): ToneKey | null {
  if (appointment.payment === "paid") {
    return { tone: "success", key: "panel.calendar.paid" };
  }
  if (appointment.payment === "deposit") {
    return { tone: "success", key: "panel.calendar.deposit" };
  }
  if (appointment.status === "pending") {
    return { tone: "warn", key: "panel.dashboard.waiting" };
  }
  return null;
}

/** "Volvo XC60 · DW 4412K" — the tenant's own required booking fields. */
export function detailLine(tenant: Tenant, appointment: Appointment): string {
  return tenant.customFields
    .filter((field) => field.required)
    .map((field) => appointment.customFields?.[field.id])
    .filter((value): value is string => Boolean(value))
    .join(" · ");
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/** "14 paź" */
export function shortDate(iso: string, locale: Locale): string {
  return `${Number.parseInt(iso.slice(8, 10), 10)} ${monthShort(iso, locale)}`;
}

/** "24 września 2026" */
export function fullDate(iso: string, locale: Locale): string {
  return `${dayMonth(iso, locale)} ${iso.slice(0, 4)}`;
}

/** "listopada 2022" — genitive, because it always reads after "od"/"z". */
export function lowerMonthYear(iso: string, locale: Locale): string {
  return monthYearGenitive(iso, locale);
}


/**
 * How long a request has been waiting. Appointments carry no `createdAt`, so
 * the id seeds a stable pseudo-random age instead of a moving clock.
 */
export function minutesWaiting(appointmentId: string): number {
  return 4 + Math.floor(hashRatio(appointmentId) * 86);
}

/* ------------------------------------------------------------------ */
/* Consents & export                                                   */
/* ------------------------------------------------------------------ */

/** The tenant's consent wording, taken from a client that already has it. */
export function consentTemplates(
  state: DataState,
  tenantId: string,
  client?: Client,
): RodoConsent[] {
  if (client?.consents.length) return client.consents;
  const source = clientsOf(state, tenantId).find(
    (candidate) => candidate.consents.length > 0,
  );
  return source?.consents ?? [];
}

export interface ClientExport {
  name: string;
  phone: string;
  email?: string;
  since: string;
  birthday?: string;
  tags: ClientTag[];
  visitCount: number;
  totalSpent: number;
  noShows: number;
  loyaltyPoints?: number;
  consents: { label: string; granted: boolean; grantedAt?: string }[];
  visits: {
    date: string;
    services: string[];
    staff: string;
    status: AppointmentStatus;
    total: number;
  }[];
}

export function buildClientExport(
  state: DataState,
  client: Client,
  serviceName: (id: string) => string,
  staffName: (id: string) => string,
  consentLabel: (consent: RodoConsent) => string,
): ClientExport {
  return {
    name: client.name,
    phone: client.phone,
    email: client.email,
    since: client.since,
    birthday: client.birthday,
    tags: client.tags,
    visitCount: client.visitCount,
    totalSpent: client.totalSpent,
    noShows: client.noShows,
    loyaltyPoints: client.loyaltyPoints,
    consents: client.consents.map((consent) => ({
      label: consentLabel(consent),
      granted: consent.granted,
      grantedAt: consent.grantedAt,
    })),
    visits: visitsOf(state, client.id).map((appointment) => ({
      date: appointment.start,
      services: appointment.serviceIds.map(serviceName),
      staff: staffName(appointment.staffId),
      status: appointment.status,
      total: appointment.total,
    })),
  };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
