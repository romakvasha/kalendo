import type { DataState } from "@/lib/data";
import { monthShort, parseLocal } from "@/lib/format";
import type { Appointment, Locale, LocalizedText } from "@/lib/types";

const INTL_TAG: Record<Locale, string> = {
  pl: "pl-PL",
  en: "en-GB",
  uk: "uk-UA",
};

export type BookingsView = "pending" | "today" | "all";

export const BOOKINGS_VIEWS: BookingsView[] = ["pending", "today", "all"];

export const BOOKINGS_VIEW_KEYS: Record<BookingsView, string> = {
  pending: "panel.bookings.toAccept",
  today: "panel.bookings.today",
  all: "panel.bookings.all",
};

export function isBookingsView(value: string): value is BookingsView {
  return (BOOKINGS_VIEWS as string[]).includes(value);
}

/** "Czw, 24 wrz" — the three-letter weekday the reference uses on date rows. */
export function dayChip(iso: string, locale: Locale): string {
  const tag = INTL_TAG[locale];
  const weekday = new Intl.DateTimeFormat(tag, { weekday: "short" })
    .format(parseLocal(iso))
    .replace(".", "");
  const capitalised = weekday.charAt(0).toLocaleUpperCase(tag) + weekday.slice(1);
  const day = Number.parseInt(iso.slice(8, 10), 10);
  return `${capitalised}, ${day} ${monthShort(iso, locale)}`;
}

export function serviceLabel(
  state: DataState,
  appointment: Appointment,
  localize: (text: LocalizedText) => string,
): string {
  return appointment.serviceIds
    .map((id) => {
      const service = state.services.find((item) => item.id === id);
      return service ? localize(service.name) : id;
    })
    .join(" + ");
}

/** Cancelled requests drop out of the board; everything else stays visible. */
export function boardAppointments(
  appointments: readonly Appointment[],
): Appointment[] {
  return appointments
    .filter((appointment) => appointment.status !== "cancelled")
    .sort((a, b) => a.start.localeCompare(b.start));
}
