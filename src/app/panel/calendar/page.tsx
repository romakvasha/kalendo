import type { Metadata } from "next";
import { CalendarScreen } from "@/components/panel/calendar";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.panel.calendar.title };

export default function PanelCalendarPage() {
  return <CalendarScreen />;
}
