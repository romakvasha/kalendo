import type { Metadata } from "next";
import { PaymentsScreen } from "@/components/panel/modules";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.payments };

export default function PanelPaymentsPage() {
  return <PaymentsScreen />;
}
