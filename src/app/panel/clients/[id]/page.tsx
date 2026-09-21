import type { Metadata } from "next";
import { ClientCardScreen } from "@/components/panel/clients";
import { SEED_STATE, clientById } from "@/lib/data";
import { pl } from "@/lib/i18n/pl";

export async function generateMetadata({
  params,
}: PageProps<"/panel/clients/[id]">): Promise<Metadata> {
  const { id } = await params;
  const client = clientById(SEED_STATE, id);
  return { title: client ? client.name : pl.panel.clients.card };
}

export default async function PanelClientPage({
  params,
}: PageProps<"/panel/clients/[id]">) {
  const { id } = await params;

  // Clients created during the session live only in the persisted store, so the
  // lookup (and the notFound) happens once the screen has rehydrated.
  return <ClientCardScreen clientId={id} />;
}
