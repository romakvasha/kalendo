import type { Metadata } from "next";
import { MarketingScreen } from "@/components/panel/modules";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.marketing };

export default function PanelMarketingPage() {
  return <MarketingScreen />;
}
