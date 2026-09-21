import type { Metadata } from "next";
import { SearchScreen } from "@/components/client";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.search };

export default function SearchPage() {
  return <SearchScreen />;
}
