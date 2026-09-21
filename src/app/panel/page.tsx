import type { Metadata } from "next";
import { DashboardScreen } from "@/components/panel/dashboard";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.dashboard };

export default function PanelDashboardPage() {
  return <DashboardScreen />;
}
