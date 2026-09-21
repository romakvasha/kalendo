import type { Metadata } from "next";
import { ReportsScreen } from "@/components/panel/dashboard";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.reports };

export default function PanelReportsPage() {
  return <ReportsScreen />;
}
