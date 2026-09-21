import type { Metadata } from "next";
import { MoreScreen } from "@/components/panel/dashboard";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.more };

export default function PanelMorePage() {
  return <MoreScreen />;
}
