import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatScreen, ScreenSkeleton } from "@/components/client";
import { pl } from "@/lib/i18n/pl";

export const metadata: Metadata = { title: pl.nav.chat };

export default function ChatPage() {
  return (
    <Suspense fallback={<ScreenSkeleton hero={false} rows={4} />}>
      <ChatScreen />
    </Suspense>
  );
}
