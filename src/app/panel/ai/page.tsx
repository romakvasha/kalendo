import type { Metadata } from "next";
import { AiScreen } from "@/components/panel/modules";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.ai };

export default function PanelAiPage() {
  return <AiScreen />;
}
