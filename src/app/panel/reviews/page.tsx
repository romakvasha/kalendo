import type { Metadata } from "next";
import { ReviewsScreen } from "@/components/panel/modules";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.reviews };

export default function PanelReviewsPage() {
  return <ReviewsScreen />;
}
