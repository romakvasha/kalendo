import type { Metadata } from "next";
import { DiscoverScreen } from "@/components/client";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.home };

export default function DiscoverPage() {
  return <DiscoverScreen />;
}
