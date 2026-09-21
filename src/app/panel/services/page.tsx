import type { Metadata } from "next";
import { ServicesScreen } from "@/components/panel/modules";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.services };

export default function PanelServicesPage() {
  return <ServicesScreen />;
}
