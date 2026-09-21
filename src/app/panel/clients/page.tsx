import type { Metadata } from "next";
import { ClientsScreen } from "@/components/panel/clients";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.panel.clients.title };

export default function PanelClientsPage() {
  return <ClientsScreen />;
}
