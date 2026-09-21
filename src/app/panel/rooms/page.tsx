import type { Metadata } from "next";
import { RoomsScreen } from "@/components/panel/modules";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.rooms };

export default function PanelRoomsPage() {
  return <RoomsScreen />;
}
