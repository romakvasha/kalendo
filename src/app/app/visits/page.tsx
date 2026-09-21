import type { Metadata } from "next";
import { VisitsScreen } from "@/components/client";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.visits.title };

export default function VisitsPage() {
  return <VisitsScreen />;
}
