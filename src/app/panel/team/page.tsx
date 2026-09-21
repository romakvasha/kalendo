import type { Metadata } from "next";
import { TeamScreen } from "@/components/panel/modules";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.team };

export default function PanelTeamPage() {
  return <TeamScreen />;
}
