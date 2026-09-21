import { addDays, minutesOf, TODAY, timeOf, weekdayOf } from "@/lib/format";
import { clamp, sum } from "@/lib/utils";
import type {
  Appointment,
  AppointmentStatus,
  BookingSource,
  CalendarBlock,
  Client,
  DailyMetric,
  Membership,
  PaymentRecord,
  Product,
  Review,
  Room,
  Service,
  ServiceCategory,
  SourceBreakdown,
  Staff,
  Tenant,
  TimeSlot,
  Voucher,
  WaitlistEntry,
  AiSuggestion,
  Account,
} from "@/lib/types";
import {
  DEMO_CLIENT_ACCOUNT,
  DEMO_CLIENT_IDS,
  NOW_MINUTES,
  SEED_APPOINTMENTS,
  SEED_BLOCKS,
  SEED_CATEGORIES,
  SEED_CLIENTS,
  SEED_MEMBERSHIPS,
  SEED_METRICS,
  SEED_PAYMENTS,
  SEED_PRODUCTS,
  SEED_REVIEWS,
  SEED_ROOMS,
  SEED_SERVICES,
  SEED_STAFF,
  SEED_SUGGESTIONS,
  SEED_TENANTS,
  SEED_VOUCHERS,
  SEED_WAITLIST,
} from "./seed";

/**
 * The read-only shape every query works against. The zustand store
 * implements it, and `SEED_STATE` provides it to server components.
 */
export interface DataState {
  tenants: Tenant[];
  categories: ServiceCategory[];
  services: Service[];
  staff: Staff[];
  rooms: Room[];
  clients: Client[];
  appointments: Appointment[];
  blocks: CalendarBlock[];
  reviews: Review[];
  vouchers: Voucher[];
  memberships: Membership[];
  products: Product[];
  payments: PaymentRecord[];
  waitlist: WaitlistEntry[];
  suggestions: AiSuggestion[];
  metrics: Record<string, DailyMetric[]>;
}

export const SEED_STATE: DataState = {
  tenants: SEED_TENANTS,
  categories: SEED_CATEGORIES,
  services: SEED_SERVICES,
  staff: SEED_STAFF,
  rooms: SEED_ROOMS,
  clients: SEED_CLIENTS,
  appointments: SEED_APPOINTMENTS,
  blocks: SEED_BLOCKS,
  reviews: SEED_REVIEWS,
  vouchers: SEED_VOUCHERS,
  memberships: SEED_MEMBERSHIPS,
  products: SEED_PRODUCTS,
  payments: SEED_PAYMENTS,
  waitlist: SEED_WAITLIST,
  suggestions: SEED_SUGGESTIONS,
  metrics: SEED_METRICS,
};

/** Statuses that still occupy a slot on the calendar. */
const BLOCKING: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "in-progress",
  "done",
];

/** Statuses that count towards money and utilisation. */
const COUNTING: AppointmentStatus[] = ["confirmed", "in-progress", "done"];

const SLOT_STEP = 15;

interface Interval {
  from: number;
  to: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = `${Math.floor(total / 60)}`.padStart(2, "0");
  const m = `${total % 60}`.padStart(2, "0");
  return `${h}:${m}`;
}

function dateOf(iso: string): string {
  return iso.slice(0, 10);
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.from < b.to && b.from < a.to;
}

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

export function getTenant(state: DataState, id: string): Tenant | undefined {
  return state.tenants.find((t) => t.id === id);
}

export function getTenantBySlug(
  state: DataState,
  slug: string,
): Tenant | undefined {
  return state.tenants.find((t) => t.slug === slug);
}

export function servicesOf(state: DataState, tenantId: string): Service[] {
  return state.services.filter((s) => s.tenantId === tenantId);
}

export function categoriesOf(
  state: DataState,
  tenantId: string,
): ServiceCategory[] {
  return state.categories.filter((c) => c.tenantId === tenantId);
}

export function staffOf(state: DataState, tenantId: string): Staff[] {
  return state.staff.filter((s) => s.tenantId === tenantId);
}

export function roomsOf(state: DataState, tenantId: string): Room[] {
  return state.rooms.filter((r) => r.tenantId === tenantId);
}

export function clientsOf(state: DataState, tenantId: string): Client[] {
  return state.clients.filter((c) => c.tenantId === tenantId);
}

export function reviewsOf(state: DataState, tenantId: string): Review[] {
  return state.reviews
    .filter((r) => r.tenantId === tenantId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function vouchersOf(state: DataState, tenantId: string): Voucher[] {
  return state.vouchers.filter((v) => v.tenantId === tenantId);
}

export function membershipsOf(
  state: DataState,
  tenantId: string,
): Membership[] {
  return state.memberships.filter((m) => m.tenantId === tenantId);
}

export function productsOf(state: DataState, tenantId: string): Product[] {
  return state.products.filter((p) => p.tenantId === tenantId);
}

export function paymentsOf(
  state: DataState,
  tenantId: string,
): PaymentRecord[] {
  return state.payments
    .filter((p) => p.tenantId === tenantId)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function waitlistOf(
  state: DataState,
  tenantId: string,
): WaitlistEntry[] {
  return state.waitlist.filter((w) => w.tenantId === tenantId);
}

export function suggestionsOf(
  state: DataState,
  tenantId: string,
): AiSuggestion[] {
  return state.suggestions.filter((s) => s.tenantId === tenantId);
}

export function blocksOf(
  state: DataState,
  tenantId: string,
  isoDate?: string,
): CalendarBlock[] {
  return state.blocks.filter(
    (b) => b.tenantId === tenantId && (!isoDate || dateOf(b.start) === isoDate),
  );
}

export function serviceById(
  state: DataState,
  id: string,
): Service | undefined {
  return state.services.find((s) => s.id === id);
}

export function staffById(state: DataState, id: string): Staff | undefined {
  return state.staff.find((s) => s.id === id);
}

export function clientById(state: DataState, id: string): Client | undefined {
  return state.clients.find((c) => c.id === id);
}

export function roomById(state: DataState, id: string): Room | undefined {
  return state.rooms.find((r) => r.id === id);
}

export function appointmentById(
  state: DataState,
  id: string,
): Appointment | undefined {
  return state.appointments.find((a) => a.id === id);
}

export function servicesFor(state: DataState, ids: string[]): Service[] {
  return ids
    .map((id) => serviceById(state, id))
    .filter((s): s is Service => Boolean(s));
}

/** Total duration of a multi-service booking, in minutes. */
export function durationOf(state: DataState, serviceIds: string[]): number {
  const total = sum(servicesFor(state, serviceIds).map((s) => s.durationMin));
  return total || 30;
}

export function priceOf(state: DataState, serviceIds: string[]): number {
  return sum(servicesFor(state, serviceIds).map((s) => s.price));
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

export function appointmentsOn(
  state: DataState,
  tenantId: string,
  isoDate: string,
): Appointment[] {
  return state.appointments
    .filter((a) => a.tenantId === tenantId && dateOf(a.start) === isoDate)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function appointmentsForStaff(
  state: DataState,
  staffId: string,
  isoDate: string,
): Appointment[] {
  return state.appointments
    .filter((a) => a.staffId === staffId && dateOf(a.start) === isoDate)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function appointmentsBetween(
  state: DataState,
  tenantId: string,
  fromISO: string,
  toISO: string,
): Appointment[] {
  return state.appointments
    .filter((a) => {
      const day = dateOf(a.start);
      return a.tenantId === tenantId && day >= fromISO && day <= toISO;
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function pendingBookings(
  state: DataState,
  tenantId: string,
): Appointment[] {
  return state.appointments
    .filter((a) => a.tenantId === tenantId && a.status === "pending")
    .sort((a, b) => a.start.localeCompare(b.start));
}

/* ------------------------------------------------------------------ */
/* Client side                                                         */
/* ------------------------------------------------------------------ */

/** Anything starting after the pinned demo clock counts as upcoming. */
const NOW_ISO_BOUND = `${TODAY}T${fromMinutes(NOW_MINUTES)}:00`;

/** One human can be a client of several tenants — match them by phone. */
function relatedClientIds(state: DataState, id: string): string[] {
  const direct = state.clients.find((c) => c.id === id);
  if (direct) {
    return state.clients
      .filter((c) => c.phone === direct.phone)
      .map((c) => c.id);
  }
  if (id === DEMO_CLIENT_ACCOUNT.id) return DEMO_CLIENT_IDS;
  return [];
}

export function clientRecordsForAccount(
  state: DataState,
  account: Account | null,
): Client[] {
  if (!account) return [];
  const byPhone = account.phone
    ? state.clients.filter((c) => c.phone === account.phone)
    : [];
  if (byPhone.length) return byPhone;
  return state.clients.filter((c) => DEMO_CLIENT_IDS.includes(c.id));
}

export function appointmentsForClient(
  state: DataState,
  clientOrAccountId: string,
): Appointment[] {
  const ids = relatedClientIds(state, clientOrAccountId);
  return state.appointments
    .filter((a) => ids.includes(a.clientId))
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function upcomingForClient(
  state: DataState,
  clientOrAccountId: string,
): Appointment[] {
  return appointmentsForClient(state, clientOrAccountId).filter(
    (a) =>
      a.start >= NOW_ISO_BOUND &&
      a.status !== "cancelled" &&
      a.status !== "no-show" &&
      a.status !== "done",
  );
}

export function pastForClient(
  state: DataState,
  clientOrAccountId: string,
): Appointment[] {
  return appointmentsForClient(state, clientOrAccountId)
    .filter((a) => a.start < NOW_ISO_BOUND || a.status === "done")
    .reverse();
}

export function loyaltyOf(
  state: DataState,
  clientOrAccountId: string,
  tenantId: string,
): { points: number; rewardAt: number } | null {
  const tenant = getTenant(state, tenantId);
  if (!tenant?.loyalty) return null;
  const ids = relatedClientIds(state, clientOrAccountId);
  const record = state.clients.find(
    (c) => ids.includes(c.id) && c.tenantId === tenantId,
  );
  return {
    points: record?.loyaltyPoints ?? 0,
    rewardAt: tenant.loyalty.rewardAt,
  };
}

/* ------------------------------------------------------------------ */
/* Availability                                                        */
/* ------------------------------------------------------------------ */

function busyIntervalsFor(
  state: DataState,
  staffId: string,
  isoDate: string,
): Interval[] {
  const fromAppointments = state.appointments
    .filter(
      (a) =>
        a.staffId === staffId &&
        dateOf(a.start) === isoDate &&
        BLOCKING.includes(a.status),
    )
    .map((a) => ({ from: minutesOf(a.start), to: minutesOf(a.end) }));
  const fromBlocks = state.blocks
    .filter((b) => b.staffId === staffId && dateOf(b.start) === isoDate)
    .map((b) => ({ from: minutesOf(b.start), to: minutesOf(b.end) }));
  return [...fromAppointments, ...fromBlocks];
}

/** Staff able to perform every requested service. */
export function eligibleStaff(
  state: DataState,
  tenantId: string,
  serviceIds: string[],
): Staff[] {
  const team = staffOf(state, tenantId);
  const services = servicesFor(state, serviceIds);
  return team.filter((member) =>
    services.every(
      (service) =>
        service.staffIds.length === 0 || service.staffIds.includes(member.id),
    ),
  );
}

function openingFor(
  tenant: Tenant,
  isoDate: string,
): { open: number; close: number } | null {
  const hours = tenant.openingHours.find(
    (h) => h.weekday === weekdayOf(isoDate),
  );
  if (!hours?.open || !hours.close) return null;
  return { open: toMinutes(hours.open), close: toMinutes(hours.close) };
}

/**
 * Real availability: walks the opening hours in 15-minute steps and
 * subtracts booked time. With `staffId === null` a slot is offered when
 * anyone eligible is free.
 */
export function slotsFor(
  state: DataState,
  tenantId: string,
  serviceIds: string[],
  staffId: string | null,
  isoDate: string,
): TimeSlot[] {
  const tenant = getTenant(state, tenantId);
  if (!tenant) return [];

  const window = openingFor(tenant, isoDate);
  if (!window) return [];

  const duration = durationOf(state, serviceIds);
  const candidates = staffId
    ? staffOf(state, tenantId).filter((s) => s.id === staffId)
    : eligibleStaff(state, tenantId, serviceIds);
  if (!candidates.length) return [];

  const busy = new Map<string, Interval[]>(
    candidates.map((member) => [
      member.id,
      busyIntervalsFor(state, member.id, isoDate),
    ]),
  );

  const isPastDay = isoDate < TODAY;
  const isToday = isoDate === TODAY;

  const slots: TimeSlot[] = [];
  for (
    let start = window.open;
    start + duration <= window.close;
    start += SLOT_STEP
  ) {
    const wanted: Interval = { from: start, to: start + duration };
    const free = candidates.find(
      (member) =>
        !(busy.get(member.id) ?? []).some((interval) =>
          overlaps(interval, wanted),
        ),
    );
    const past = isPastDay || (isToday && start < NOW_MINUTES);
    slots.push({
      time: fromMinutes(start),
      available: Boolean(free) && !past,
      staffId: free?.id,
    });
  }

  const freeIndexes = slots.reduce<number[]>((acc, slot, index) => {
    if (slot.available) acc.push(index);
    return acc;
  }, []);
  const busyDay = slots.length > 0 && freeIndexes.length / slots.length <= 0.4;
  if (busyDay) {
    for (const index of freeIndexes.slice(-2)) {
      slots[index] = { ...slots[index], scarce: true };
    }
  }

  return slots;
}

/**
 * The first day from `fromISO` that still has a bookable slot, or `null`
 * when the whole window is full. Days the tenant is closed cost nothing —
 * `openingFor` rejects them before any slot is built — and the walk stops
 * at the first hit.
 */
export function firstAvailableDate(
  state: DataState,
  tenantId: string,
  serviceIds: string[],
  staffId: string | null,
  fromISO: string,
  maxDays = 30,
): string | null {
  const tenant = getTenant(state, tenantId);
  if (!tenant) return null;

  for (let offset = 0; offset < maxDays; offset += 1) {
    const date = addDays(fromISO, offset);
    if (!openingFor(tenant, date)) continue;
    const open = slotsFor(state, tenantId, serviceIds, staffId, date).some(
      (slot) => slot.available,
    );
    if (open) return date;
  }
  return null;
}

export interface FreeWindow {
  /** Local wall-clock ISO, e.g. "2026-09-21T14:00:00". */
  start: string;
  minutes: number;
  staffId?: string;
}

/** Gaps of at least `minMinutes` in the working day, per specialist. */
export function nextFreeWindows(
  state: DataState,
  tenantId: string,
  isoDate: string,
  minMinutes: number,
  staffId?: string,
): FreeWindow[] {
  const tenant = getTenant(state, tenantId);
  if (!tenant) return [];
  const window = openingFor(tenant, isoDate);
  if (!window) return [];

  const team = staffOf(state, tenantId).filter(
    (member) => !staffId || member.id === staffId,
  );

  const windows: FreeWindow[] = [];
  for (const member of team) {
    const intervals = busyIntervalsFor(state, member.id, isoDate).sort(
      (a, b) => a.from - b.from,
    );
    let cursor = window.open;
    for (const interval of intervals) {
      if (interval.from - cursor >= minMinutes) {
        windows.push({
          start: `${isoDate}T${fromMinutes(cursor)}:00`,
          minutes: interval.from - cursor,
          staffId: member.id,
        });
      }
      cursor = Math.max(cursor, interval.to);
    }
    if (window.close - cursor >= minMinutes) {
      windows.push({
        start: `${isoDate}T${fromMinutes(cursor)}:00`,
        minutes: window.close - cursor,
        staffId: member.id,
      });
    }
  }

  return windows.sort((a, b) => a.start.localeCompare(b.start));
}

/* ------------------------------------------------------------------ */
/* Money & performance                                                 */
/* ------------------------------------------------------------------ */

export function dayRevenue(
  state: DataState,
  tenantId: string,
  isoDate: string,
): number {
  return sum(
    appointmentsOn(state, tenantId, isoDate)
      .filter((a) => COUNTING.includes(a.status))
      .map((a) => a.total),
  );
}

/** Accepts "2026-09" or any ISO date inside the month. */
export function monthRevenue(
  state: DataState,
  tenantId: string,
  isoDate: string,
): number {
  const month = isoDate.slice(0, 7);
  return sum(
    state.appointments
      .filter(
        (a) =>
          a.tenantId === tenantId &&
          a.start.slice(0, 7) === month &&
          COUNTING.includes(a.status),
      )
      .map((a) => a.total),
  );
}

/**
 * Booked time against the team's real shift length, not the full opening
 * window — a salon open 12 h with staff working 8 h is not 33% busy.
 */
export function utilizationOn(
  state: DataState,
  tenantId: string,
  isoDate: string,
): number {
  const tenant = getTenant(state, tenantId);
  if (!tenant) return 0;
  const window = openingFor(tenant, isoDate);
  const team = staffOf(state, tenantId);
  if (!window || !team.length) return 0;

  const openMinutes = window.close - window.open;
  const capacity = sum(
    team.map((member) => {
      const shift = Math.min(openMinutes, member.availableHoursToday * 60);
      const away = sum(
        state.blocks
          .filter(
            (b) =>
              b.staffId === member.id &&
              dateOf(b.start) === isoDate &&
              b.kind !== "break",
          )
          .map((b) => minutesOf(b.end) - minutesOf(b.start)),
      );
      return Math.max(0, shift - Math.min(shift, away));
    }),
  );
  if (!capacity) return 0;

  const booked = sum(
    appointmentsOn(state, tenantId, isoDate)
      .filter((a) => COUNTING.includes(a.status))
      .map((a) => minutesOf(a.end) - minutesOf(a.start)),
  );
  return clamp(Math.round((booked / capacity) * 100), 0, 100);
}

export function sourceBreakdown(
  state: DataState,
  tenantId: string,
): SourceBreakdown[] {
  const relevant = state.appointments.filter((a) => a.tenantId === tenantId);
  if (!relevant.length) return [];
  const counts = new Map<BookingSource, number>();
  for (const appointment of relevant) {
    counts.set(appointment.source, (counts.get(appointment.source) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([source, count]) => ({
      source,
      share: Math.round((count / relevant.length) * 100),
    }))
    .sort((a, b) => b.share - a.share);
}

export interface StaffPerformance {
  staffId: string;
  name: string;
  appointments: number;
  revenue: number;
  rating: number;
  utilization: number;
  noShows: number;
}

export function staffPerformance(
  state: DataState,
  tenantId: string,
  fromISO: string,
  toISO: string,
): StaffPerformance[] {
  const range = appointmentsBetween(state, tenantId, fromISO, toISO);
  return staffOf(state, tenantId)
    .map((member) => {
      const mine = range.filter((a) => a.staffId === member.id);
      const counted = mine.filter((a) => COUNTING.includes(a.status));
      return {
        staffId: member.id,
        name: member.name,
        appointments: counted.length,
        revenue: sum(counted.map((a) => a.total)),
        rating: member.rating,
        utilization: member.utilization,
        noShows: mine.filter((a) => a.status === "no-show").length,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function metricsRange(
  state: DataState,
  tenantId: string,
  fromISO: string,
  toISO: string,
): DailyMetric[] {
  return (state.metrics[tenantId] ?? []).filter(
    (m) => m.date >= fromISO && m.date <= toISO,
  );
}

export function newClientsBetween(
  state: DataState,
  tenantId: string,
  fromISO: string,
  toISO: string,
): number {
  return clientsOf(state, tenantId).filter(
    (c) => c.since >= fromISO && c.since <= toISO,
  ).length;
}

export function lowStockProducts(
  state: DataState,
  tenantId: string,
): Product[] {
  return productsOf(state, tenantId).filter((p) => p.stock <= p.lowStockAt);
}

/** Convenience for the panel header: "next up" after the pinned clock. */
export function nextAppointment(
  state: DataState,
  tenantId: string,
): Appointment | undefined {
  return appointmentsOn(state, tenantId, TODAY).find(
    (a) => timeOf(a.start) >= fromMinutes(NOW_MINUTES) && a.status !== "cancelled",
  );
}
