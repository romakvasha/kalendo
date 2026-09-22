"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addMinutes, minutesOf, TODAY } from "@/lib/format";
import { initialsOf, makeId, sum } from "@/lib/utils";
import { SERVICE_COLOR_KEYS } from "@/lib/brand";
import type {
  Account,
  Appointment,
  AppointmentStatus,
  BookingDraft,
  BrandKey,
  Client,
  Industry,
  LocalizedText,
  OpeningHours,
  PaymentRecord,
  PaymentStatus,
  Room,
  Service,
  ServiceCategory,
  Staff,
  Tenant,
  Voucher,
  WaitlistEntry,
} from "@/lib/types";
import type { DataState } from "./queries";
import {
  DEMO_CLIENT_ACCOUNT,
  DEMO_COMPANY_ACCOUNTS,
  NOW_ISO,
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

/** What the onboarding wizard collected, in store terms. */
export interface NewTenantInput {
  name: string;
  slug: string;
  city: string;
  address: string;
  phone: string;
  industry: Industry;
  services: { name: string; durationMin: number; price: number }[];
  hours: { weekday: number; open: boolean; from: string; to: string }[];
  team: { name: string; role: string; owner: boolean }[];
}

/**
 * Records the user created, kept apart from the seed so that persistence stays
 * small and a later seed change still reaches existing browsers. The catalogue
 * the app reads is always seed + custom.
 */
export interface CustomData {
  tenants: Tenant[];
  categories: ServiceCategory[];
  services: Service[];
  staff: Staff[];
  rooms: Room[];
  accounts: Account[];
}

export interface KalendoState extends DataState {
  hydrated: boolean;
  account: Account | null;
  activeTenantId: string;
  custom: CustomData;

  /** Every company this browser can open the panel for. */
  createTenant: (input: NewTenantInput) => Tenant;

  markHydrated: () => void;
  signInAsClient: (name: string, phone: string) => void;
  signInAsCompany: (tenantId: string) => void;
  signOut: () => void;
  setActiveTenant: (id: string) => void;

  createBooking: (draft: BookingDraft) => Appointment;
  cancelAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, startISO: string) => void;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  setAppointmentPayment: (id: string, payment: PaymentStatus) => void;
  acceptBooking: (id: string) => void;
  declineBooking: (id: string) => void;

  upsertClient: (client: Client) => void;
  addWaitlistEntry: (
    entry: Omit<WaitlistEntry, "id" | "createdAt">,
  ) => WaitlistEntry;
  redeemVoucher: (code: string) => Voucher | null;
  dismissSuggestion: (id: string) => void;
  addReviewReply: (reviewId: string, text: string) => void;
  resetDemo: () => void;
}

export const EMPTY_CUSTOM: CustomData = {
  tenants: [],
  categories: [],
  services: [],
  staff: [],
  rooms: [],
  accounts: [],
};

/** The catalogue the app reads: the seed first, then anything the user made. */
function catalogueFrom(custom: CustomData) {
  return {
    tenants: [...SEED_TENANTS, ...custom.tenants],
    categories: [...SEED_CATEGORIES, ...custom.categories],
    services: [...SEED_SERVICES, ...custom.services],
    staff: [...SEED_STAFF, ...custom.staff],
    rooms: [...SEED_ROOMS, ...custom.rooms],
    blocks: SEED_BLOCKS,
    memberships: SEED_MEMBERSHIPS,
    products: SEED_PRODUCTS,
    payments: SEED_PAYMENTS,
    metrics: SEED_METRICS,
  };
}

function freshMutable() {
  return {
    account: null as Account | null,
    activeTenantId: SEED_TENANTS[0].id,
    clients: SEED_CLIENTS,
    appointments: SEED_APPOINTMENTS,
    reviews: SEED_REVIEWS,
    vouchers: SEED_VOUCHERS,
    waitlist: SEED_WAITLIST,
    suggestions: SEED_SUGGESTIONS,
  };
}

function plainReply(text: string): LocalizedText {
  return { pl: text, en: text, uk: text };
}

/** The user types one string; a new company has no translations yet. */
function localized(text: string): LocalizedText {
  return { pl: text, en: text, uk: text };
}

const BRAND_FOR_INDUSTRY: Record<Industry, BrandKey> = {
  hair: "cobalt",
  beauty: "rose",
  physio: "green",
  dental: "cobalt",
  auto: "orange",
  other: "violet",
};

const AVATAR_COLORS = ["#1b5bda", "#167645", "#e8802a", "#6d4bd6", "#c23e6b"];

export const useKalendo = create<KalendoState>()(
  persist(
    (set, get) => ({
      ...catalogueFrom(EMPTY_CUSTOM),
      ...freshMutable(),
      custom: EMPTY_CUSTOM,
      hydrated: false,

      markHydrated: () => set({ hydrated: true }),

      createTenant: (input) => {
        const state = get();
        const taken = new Set(state.tenants.map((item) => item.slug));
        let slug = input.slug;
        for (let n = 2; taken.has(slug); n++) slug = `${input.slug}-${n}`;

        const id = makeId("t");
        const brand = BRAND_FOR_INDUSTRY[input.industry] ?? "cobalt";
        const locationId = `${id}_loc`;
        const categoryId = `${id}_cat`;

        const tenant: Tenant = {
          id,
          slug,
          name: input.name,
          industry: input.industry,
          brand,
          plan: "start",
          tagline: localized(input.name),
          about: localized(""),
          city: input.city,
          address: input.address,
          phone: input.phone,
          email: `kontakt@${slug}.pl`,
          rating: 0,
          reviewCount: 0,
          openingHours: input.hours.map<OpeningHours>((day) => ({
            weekday: day.weekday,
            open: day.open ? day.from : null,
            close: day.open ? day.to : null,
          })),
          features: ["online-payment"],
          locations: [
            { id: locationId, name: input.name, address: input.address, city: input.city },
          ],
          customFields: [],
          deposit: { enabled: false, mode: "fixed", value: 0 },
          cancellationHours: 24,
          photoCount: 0,
          ownerName: input.team.find((member) => member.owner)?.name ?? input.name,
        };

        const category: ServiceCategory = {
          id: categoryId,
          tenantId: id,
          name: localized(input.name),
        };

        const staff: Staff[] = input.team
          .filter((member) => member.name.trim())
          .map((member, index) => ({
            id: `${id}_stf_${index}`,
            tenantId: id,
            name: member.name.trim(),
            initials: initialsOf(member.name.trim()),
            role: localized(member.role),
            rating: 0,
            avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
            utilization: 0,
            bookedHoursToday: 0,
            availableHoursToday: 8,
            locationId,
            isOwner: member.owner,
          }));

        const services: Service[] = input.services
          .filter((service) => service.name.trim())
          .map((service, index) => ({
            id: `${id}_svc_${index}`,
            tenantId: id,
            categoryId,
            name: localized(service.name.trim()),
            durationMin: service.durationMin,
            price: service.price,
            color: SERVICE_COLOR_KEYS[index % SERVICE_COLOR_KEYS.length],
            staffIds: staff.map((member) => member.id),
          }));

        const rooms: Room[] = [
          { id: `${id}_room`, tenantId: id, name: localized(input.name), locationId },
        ];

        const account: Account = {
          id: makeId("acc"),
          kind: "company",
          name: tenant.ownerName,
          initials: initialsOf(tenant.ownerName),
          phone: input.phone,
          tenantId: id,
          city: input.city,
          locale: "pl",
        };

        const custom: CustomData = {
          tenants: [...state.custom.tenants, tenant],
          categories: [...state.custom.categories, category],
          services: [...state.custom.services, ...services],
          staff: [...state.custom.staff, ...staff],
          rooms: [...state.custom.rooms, ...rooms],
          accounts: [...state.custom.accounts, account],
        };

        set({ custom, ...catalogueFrom(custom), account, activeTenantId: id });
        return tenant;
      },

      // The demo persona already has history in all three tenants, so we
      // reuse its id and only swap the display name and phone.
      signInAsClient: (name, phone) =>
        set({
          account: {
            ...DEMO_CLIENT_ACCOUNT,
            name: name.trim() || DEMO_CLIENT_ACCOUNT.name,
            initials: initialsOf(name.trim() || DEMO_CLIENT_ACCOUNT.name),
            phone: phone.trim() || DEMO_CLIENT_ACCOUNT.phone,
          },
        }),

      signInAsCompany: (tenantId) => {
        const custom = get().custom.accounts.find(
          (item) => item.tenantId === tenantId,
        );
        const account =
          custom ?? DEMO_COMPANY_ACCOUNTS[tenantId] ?? DEMO_COMPANY_ACCOUNTS.t_aurora;
        set({ account, activeTenantId: account.tenantId ?? tenantId });
      },

      signOut: () => set({ account: null }),

      setActiveTenant: (id) => set({ activeTenantId: id }),

      createBooking: (draft) => {
        const state = get();
        const services = draft.serviceIds
          .map((id) => state.services.find((s) => s.id === id))
          .filter((s): s is Service => Boolean(s));
        const minutes = sum(services.map((s) => s.durationMin)) || 30;
        const total = sum(services.map((s) => s.price));
        const tenant = state.tenants.find((t) => t.id === draft.tenantId);

        const start = `${draft.date ?? TODAY}T${draft.time ?? "09:00"}:00`;

        const existing = state.clients.find(
          (c) => c.tenantId === draft.tenantId && c.phone === draft.contact.phone,
        );
        const client: Client = existing ?? {
          id: makeId("cl"),
          tenantId: draft.tenantId,
          name: draft.contact.name || "Nowy klient",
          initials: initialsOf(draft.contact.name || "Nowy klient"),
          phone: draft.contact.phone,
          email: draft.contact.email || undefined,
          since: draft.date ?? TODAY,
          tags: ["new"],
          visitCount: 0,
          totalSpent: 0,
          noShows: 0,
          consents: [
            {
              id: "rodo",
              label: {
                pl: "Przetwarzanie danych osobowych (RODO)",
                en: "Processing of personal data (GDPR)",
                uk: "Обробка персональних даних (GDPR)",
              },
              granted: draft.termsAccepted,
              grantedAt: draft.date ?? TODAY,
            },
            {
              id: "marketing",
              label: {
                pl: "Powiadomienia SMS i e-mail o promocjach",
                en: "SMS and e-mail marketing messages",
                uk: "SMS та e-mail про акції",
              },
              granted: draft.marketingConsent,
              grantedAt: draft.marketingConsent
                ? (draft.date ?? TODAY)
                : undefined,
            },
          ],
          photoCount: 0,
        };

        const staffId =
          draft.staffId ??
          services[0]?.staffIds[0] ??
          state.staff.find((s) => s.tenantId === draft.tenantId)?.id ??
          "";

        const depositAmount =
          draft.paymentChoice === "deposit" && tenant?.deposit.enabled
            ? tenant.deposit.mode === "percent"
              ? Math.round((total * tenant.deposit.value) / 100)
              : tenant.deposit.value
            : undefined;

        const appointment: Appointment = {
          id: makeId("apt"),
          tenantId: draft.tenantId,
          clientId: client.id,
          staffId,
          serviceIds: draft.serviceIds,
          start,
          end: addMinutes(start, minutes),
          status: draft.paymentChoice === "on-site" ? "pending" : "confirmed",
          payment:
            draft.paymentChoice === "full"
              ? "paid"
              : draft.paymentChoice === "deposit"
                ? "deposit"
                : "unpaid",
          depositAmount,
          total,
          source: "app",
          isFirstVisit: !existing,
          customFields: draft.customFields,
          smsReminderSent: false,
        };

        const payment: PaymentRecord | null =
          draft.paymentChoice === "on-site"
            ? null
            : {
                id: makeId("pay"),
                tenantId: draft.tenantId,
                appointmentId: appointment.id,
                amount:
                  draft.paymentChoice === "full" ? total : (depositAmount ?? 0),
                method: draft.paymentMethod ?? "blik",
                at: NOW_ISO,
                kind: draft.paymentChoice === "full" ? "full" : "deposit",
              };

        set((current) => ({
          appointments: [...current.appointments, appointment],
          clients: existing
            ? current.clients
            : [...current.clients, client],
          payments: payment
            ? [...current.payments, payment]
            : current.payments,
          vouchers: draft.voucherCode
            ? current.vouchers.map((v) =>
                v.code.toUpperCase() === draft.voucherCode?.toUpperCase()
                  ? { ...v, usedAt: draft.date ?? TODAY }
                  : v,
              )
            : current.vouchers,
        }));

        return appointment;
      },

      cancelAppointment: (id) =>
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status: "cancelled" } : a,
          ),
        })),

      rescheduleAppointment: (id, startISO) =>
        set((state) => ({
          appointments: state.appointments.map((a) => {
            if (a.id !== id) return a;
            const minutes = minutesOf(a.end) - minutesOf(a.start);
            return {
              ...a,
              start: startISO,
              end: addMinutes(startISO, minutes || 30),
              status: a.status === "cancelled" ? "confirmed" : a.status,
            };
          }),
        })),

      setAppointmentStatus: (id, status) =>
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status } : a,
          ),
        })),

      setAppointmentPayment: (id, payment) =>
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, payment } : a,
          ),
        })),

      acceptBooking: (id) => get().setAppointmentStatus(id, "confirmed"),

      declineBooking: (id) => get().setAppointmentStatus(id, "cancelled"),

      upsertClient: (client) =>
        set((state) => ({
          clients: state.clients.some((c) => c.id === client.id)
            ? state.clients.map((c) => (c.id === client.id ? client : c))
            : [...state.clients, client],
        })),

      addWaitlistEntry: (entry) => {
        const created: WaitlistEntry = {
          ...entry,
          id: makeId("wl"),
          createdAt: NOW_ISO,
        };
        set((state) => ({ waitlist: [...state.waitlist, created] }));
        return created;
      },

      redeemVoucher: (code) => {
        const normalized = code.trim().toUpperCase();
        const match = get().vouchers.find(
          (v) => v.code.toUpperCase() === normalized && !v.usedAt,
        );
        if (!match) return null;
        set((state) => ({
          vouchers: state.vouchers.map((v) =>
            v.id === match.id ? { ...v, usedAt: TODAY } : v,
          ),
        }));
        return { ...match, usedAt: TODAY };
      },

      dismissSuggestion: (id) =>
        set((state) => ({
          suggestions: state.suggestions.filter((s) => s.id !== id),
        })),

      addReviewReply: (reviewId, text) =>
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === reviewId ? { ...r, reply: plainReply(text) } : r,
          ),
        })),

      resetDemo: () =>
        set({
          ...catalogueFrom(EMPTY_CUSTOM),
          ...freshMutable(),
          custom: EMPTY_CUSTOM,
        }),
    }),
    {
      name: "kalendo.state",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        account: state.account,
        activeTenantId: state.activeTenantId,
        appointments: state.appointments,
        clients: state.clients,
        waitlist: state.waitlist,
        vouchers: state.vouchers,
        custom: state.custom,
      }),
      /**
       * The catalogue is rebuilt from the current seed plus the user's own
       * records, so a company created in this browser survives a reload while
       * a change to the demo data still reaches everyone.
       */
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<KalendoState>;
        const custom: CustomData = { ...EMPTY_CUSTOM, ...saved.custom };
        return {
          ...current,
          ...saved,
          custom,
          ...catalogueFrom(custom),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

const subscribeToHydration = (onChange: () => void) =>
  useKalendo.persist.onFinishHydration(onChange);
const readHydrated = () => useKalendo.persist.hasHydrated();
const readServerHydrated = () => false;

/**
 * False on the server and through React's hydration pass, then true once the
 * persisted slices are back — so the first client render matches the server
 * HTML. Screens render skeletons while this is false.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    readHydrated,
    readServerHydrated,
  );
}
