import type { Metadata } from "next";
import { ProfileScreen } from "@/components/client";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.profile };

export default function ProfilePage() {
  return <ProfileScreen />;
}
