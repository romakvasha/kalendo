import type { Metadata } from "next";
import { InventoryScreen } from "@/components/panel/modules";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.inventory };

export default function PanelInventoryPage() {
  return <InventoryScreen />;
}
