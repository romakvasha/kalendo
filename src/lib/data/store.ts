"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addMinutes, minutesOf, TODAY } from "@/lib/format";
import { initialsOf, makeId, sum } from "@/lib/utils";
import type {
  Account,
  Appointment,
  AppointmentStatus,
  BookingDraft,
  Client,
  LocalizedText,
  PaymentRecord,
  PaymentStatus,
  Service,
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

export interface KalendoState extends DataState {
  hydrated: boolean;
  account: Account | null;
  activeTenantId: string;

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

const IMMUTABLE = {
  tenants: SEED_TENANTS,
  categories: SEED_CATEGORIES,
  services: SEED_SERVICES,
  staff: SEED_STAFF,
  rooms: SEED_ROOMS,
  blocks: SEED_BLOCKS,
  memberships: SEED_MEMBERSHIPS,
  products: SEED_PRODUCTS,
  payments: SEED_PAYMENTS,
  metrics: SEED_METRICS,
};

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

export const useKalendo = create<KalendoState>()(
  persist(
    (set, get) => ({
      ...IMMUTABLE,
      ...freshMutable(),
      hydrated: false,

      markHydrated: () => set({ hydrated: true }),

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
        const account =
          DEMO_COMPANY_ACCOUNTS[tenantId] ?? DEMO_COMPANY_ACCOUNTS.t_aurora;
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

      resetDemo: () => set({ ...IMMUTABLE, ...freshMutable() }),
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
      }),
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
