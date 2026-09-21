import {
  appointmentsOn,
  clientsOf,
  productsOf,
  serviceById,
  servicesOf,
  type DataState,
} from "@/lib/data";
import { TODAY, daysBetween, minutesOf, timeOf } from "@/lib/format";
import { hashRatio, sum } from "@/lib/utils";
import type {
  Appointment,
  AppointmentStatus,
  Client,
  LocalizedText,
  Service,
} from "@/lib/types";

/** Statuses that count towards money and utilisation. */
export const COUNTING: AppointmentStatus[] = [
  "confirmed",
  "in-progress",
  "done",
];

export const SMS_SEGMENT = 160;

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

function csvCell(value: string | number): string {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvCell).join(";")).join("\n");
}

/** Prefixed with a BOM so Excel opens Polish characters correctly. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Money per service                                                   */
/* ------------------------------------------------------------------ */

export interface ServiceRevenue {
  service: Service;
  revenue: number;
  visits: number;
}

export function serviceRevenue(
  state: DataState,
  tenantId: string,
): ServiceRevenue[] {
  const totals = new Map<string, { revenue: number; visits: number }>();

  for (const appointment of state.appointments) {
    if (appointment.tenantId !== tenantId) continue;
    if (!COUNTING.includes(appointment.status)) continue;

    const services = appointment.serviceIds
      .map((id) => serviceById(state, id))
      .filter((service): service is Service => Boolean(service));
    const basis = sum(services.map((service) => service.price)) || 1;

    for (const service of services) {
      const share = (service.price / basis) * appointment.total;
      const current = totals.get(service.id) ?? { revenue: 0, visits: 0 };
      totals.set(service.id, {
        revenue: current.revenue + share,
        visits: current.visits + 1,
      });
    }
  }

  return servicesOf(state, tenantId)
    .map((service) => ({
      service,
      revenue: Math.round(totals.get(service.id)?.revenue ?? 0),
      visits: totals.get(service.id)?.visits ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/* ------------------------------------------------------------------ */
/* Client segments                                                     */
/* ------------------------------------------------------------------ */

export type AudienceKey = "all" | "regulars" | "inactive" | "birthdays";

export const AUDIENCE_KEYS: AudienceKey[] = [
  "all",
  "regulars",
  "inactive",
  "birthdays",
];

/** Most recent past visit of a client, or null when they never came. */
export function lastVisitOf(
  state: DataState,
  clientId: string,
): string | null {
  const past = state.appointments
    .filter(
      (a) =>
        a.clientId === clientId &&
        a.start.slice(0, 10) <= TODAY &&
        a.status !== "cancelled",
    )
    .map((a) => a.start)
    .sort();
  return past.length ? past[past.length - 1] : null;
}

export interface InactiveClient {
  client: Client;
  lastVisit: string | null;
  days: number;
}

/** Clients whose last visit is older than `days`, longest gap first. */
export function inactiveClients(
  state: DataState,
  tenantId: string,
  days: number,
): InactiveClient[] {
  return clientsOf(state, tenantId)
    .map((client) => {
      const lastVisit = lastVisitOf(state, client.id);
      return {
        client,
        lastVisit,
        days: daysBetween(lastVisit ?? client.since, TODAY),
      };
    })
    .filter((entry) => entry.days > days)
    .sort((a, b) => b.days - a.days);
}

export function regularClients(state: DataState, tenantId: string): Client[] {
  return clientsOf(state, tenantId).filter(
    (client) => client.tags.includes("regular") || client.visitCount >= 5,
  );
}

export function birthdayClients(state: DataState, tenantId: string): Client[] {
  const month = TODAY.slice(5, 7);
  return clientsOf(state, tenantId).filter(
    (client) => client.birthday?.slice(5, 7) === month,
  );
}

export function audienceOf(
  state: DataState,
  tenantId: string,
  audience: AudienceKey,
): Client[] {
  if (audience === "regulars") return regularClients(state, tenantId);
  if (audience === "inactive")
    return inactiveClients(state, tenantId, 60).map((entry) => entry.client);
  if (audience === "birthdays") return birthdayClients(state, tenantId);
  return clientsOf(state, tenantId);
}

/* ------------------------------------------------------------------ */
/* Demand by hour                                                      */
/* ------------------------------------------------------------------ */

export interface HourDemand {
  hour: number;
  label: string;
  visits: number;
  revenue: number;
}

/** Bookings per opening hour across every day the tenant has on record. */
export function hourDemand(state: DataState, tenantId: string): HourDemand[] {
  const tenant = state.tenants.find((item) => item.id === tenantId);
  const open = tenant?.openingHours.find((hours) => hours.open) ?? null;
  const from = open?.open ? Number(open.open.slice(0, 2)) : 8;
  const to = open?.close ? Number(open.close.slice(0, 2)) : 20;

  const buckets = new Map<number, { visits: number; revenue: number }>();
  for (let hour = from; hour < to; hour++) {
    buckets.set(hour, { visits: 0, revenue: 0 });
  }

  for (const appointment of state.appointments) {
    if (appointment.tenantId !== tenantId) continue;
    if (!COUNTING.includes(appointment.status)) continue;
    const hour = Math.floor(minutesOf(appointment.start) / 60);
    const bucket = buckets.get(hour);
    if (!bucket) continue;
    bucket.visits += 1;
    bucket.revenue += appointment.total;
  }

  return [...buckets.entries()].map(([hour, bucket]) => ({
    hour,
    label: `${`${hour}`.padStart(2, "0")}:00`,
    visits: bucket.visits,
    revenue: bucket.revenue,
  }));
}

/* ------------------------------------------------------------------ */
/* Marketing campaigns, derived from the tenant's own data             */
/* ------------------------------------------------------------------ */

export type CampaignStatus = "sent" | "scheduled" | "draft";

export interface Campaign {
  id: string;
  /** i18n key for the seeded campaigns; null when the user named it. */
  nameKey: string | null;
  name: string;
  audience: AudienceKey;
  recipients: number;
  sent: number;
  opens: number;
  bookings: number;
  status: CampaignStatus;
  date: string;
  message: string;
}

interface CampaignSeed {
  id: string;
  nameKey: string;
  audience: AudienceKey;
  status: CampaignStatus;
  date: string;
}

const CAMPAIGN_SEEDS: CampaignSeed[] = [
  {
    id: "cmp_last_minute",
    nameKey: "panel.marketing.lastMinute",
    audience: "regulars",
    status: "sent",
    date: "2026-09-18",
  },
  {
    id: "cmp_birthday",
    nameKey: "panel.marketing.birthday",
    audience: "birthdays",
    status: "sent",
    date: "2026-09-01",
  },
  {
    id: "cmp_winback",
    nameKey: "panel.marketing.winback",
    audience: "inactive",
    status: "scheduled",
    date: "2026-09-24",
  },
];

/**
 * The demo has no campaign entity, so the history is derived from the real
 * audiences — the numbers move with the store instead of being hardcoded.
 */
export function campaignsFor(state: DataState, tenantId: string): Campaign[] {
  return CAMPAIGN_SEEDS.map((seed) => {
    const recipients = audienceOf(state, tenantId, seed.audience).length;
    const sent = seed.status === "scheduled" ? 0 : recipients;
    const openRate = 0.42 + hashRatio(`${tenantId}${seed.id}open`) * 0.34;
    const bookingRate = 0.06 + hashRatio(`${tenantId}${seed.id}book`) * 0.14;
    return {
      ...seed,
      name: "",
      recipients,
      sent,
      opens: Math.round(sent * openRate),
      bookings: Math.round(sent * bookingRate),
      message: "",
    };
  });
}

/* ------------------------------------------------------------------ */
/* Rooms                                                               */
/* ------------------------------------------------------------------ */

export interface RoomSegment {
  id: string;
  /** 0–100 offset inside the opening window. */
  left: number;
  width: number;
  label: string;
  color: Service["color"];
}

export interface RoomDay {
  minutes: number;
  capacity: number;
  occupancy: number;
  segments: RoomSegment[];
}

/** Today's bar for one room: segments positioned inside the opening window. */
export function roomDay(
  state: DataState,
  tenantId: string,
  roomId: string,
  openMin: number,
  closeMin: number,
  labelOf: (appointment: Appointment) => string,
): RoomDay {
  const span = Math.max(closeMin - openMin, 1);
  const todays = appointmentsOn(state, tenantId, TODAY).filter(
    (a) => a.roomId === roomId && a.status !== "cancelled",
  );

  const segments = todays.map((appointment) => {
    const from = Math.max(minutesOf(appointment.start), openMin);
    const to = Math.min(minutesOf(appointment.end), closeMin);
    const service = serviceById(state, appointment.serviceIds[0]);
    return {
      id: appointment.id,
      left: ((from - openMin) / span) * 100,
      width: Math.max(((to - from) / span) * 100, 1.5),
      label: `${timeOf(appointment.start)} · ${labelOf(appointment)}`,
      color: service?.color ?? "sand",
    };
  });

  const minutes = sum(
    todays.map((a) =>
      Math.max(
        Math.min(minutesOf(a.end), closeMin) -
          Math.max(minutesOf(a.start), openMin),
        0,
      ),
    ),
  );

  return {
    minutes,
    capacity: span,
    occupancy: Math.round((minutes / span) * 100),
    segments,
  };
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function inventoryValue(state: DataState, tenantId: string): number {
  return sum(productsOf(state, tenantId).map((p) => p.stock * p.price));
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Same text in all three languages — used for user-entered content. */
export function plainText(text: string): LocalizedText {
  return { pl: text, en: text, uk: text };
}

/** "08:00", "08:30", … for schedule selects. */
export function timeOptions(step = 30): string[] {
  const out: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += step) {
    out.push(
      `${`${Math.floor(minutes / 60)}`.padStart(2, "0")}:${`${minutes % 60}`.padStart(2, "0")}`,
    );
  }
  return out;
}
