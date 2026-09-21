import type { Metadata } from "next";
import { VouchersScreen } from "@/components/panel/modules";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.vouchers };

export default function PanelVouchersPage() {
  return <VouchersScreen />;
}
