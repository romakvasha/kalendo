"use client";

import Link from "next/link";
import { Store } from "lucide-react";

import { EmptyState } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

/**
 * The 404 body, shared by the route's `not-found.tsx` and by the client
 * fallback — a slug the seed does not know can only be ruled out in the
 * browser, once the persisted store is back.
 */
export function TenantNotFoundView() {
  const t = useI18n().t;

  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4">
      <div className="w-full max-w-md text-center">
        <EmptyState
          icon={Store}
          title={
            <span className="font-display text-[28px] leading-9 text-ink">
              {t("errors.notFound")}
            </span>
          }
          body={t("errors.notFoundBody")}
          action={
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-md bg-ink px-5 text-[14px] font-medium text-paper transition-opacity hover:opacity-90"
            >
              {t("errors.goHome")}
            </Link>
          }
        />
      </div>
    </main>
  );
}
