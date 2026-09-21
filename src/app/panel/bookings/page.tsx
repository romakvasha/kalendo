import type { Metadata } from "next";
import { BookingsScreen } from "@/components/panel/bookings";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.bookings };

export default function PanelBookingsPage() {
  return <BookingsScreen />;
}
