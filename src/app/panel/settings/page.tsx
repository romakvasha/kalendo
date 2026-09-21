import type { Metadata } from "next";
import { SettingsScreen } from "@/components/panel/modules";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.settings };

export default function PanelSettingsPage() {
  return <SettingsScreen />;
}
