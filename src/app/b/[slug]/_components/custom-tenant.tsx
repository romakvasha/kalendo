"use client";

import type { ReactNode } from "react";

import { BookingFlow, CompanyPage, TenantChrome } from "@/components/booking";
import { BrandProvider } from "@/components/layout";
import { Spinner } from "@/components/ui";
import { useHydrated, useTenantBySlug } from "@/lib/data";
import { TenantNotFoundView } from "./tenant-not-found-view";

/**
 * A company created in this browser lives only in the persisted store, so the
 * server cannot resolve its slug. These three components pick the resolution
 * up on the client: the seed still renders on the server for the demo
 * companies, and only a slug that neither side knows falls through to the 404
 * — and only once the store has hydrated, so a custom link never flashes it.
 */

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper">
      <Spinner size="lg" />
    </div>
  );
}

export function CustomTenantChrome({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const tenant = useTenantBySlug(slug);
  const hydrated = useHydrated();

  // Before hydration — and for a slug nobody knows — the children render bare:
  // the spinner and the 404 body both bring their own full-height layout.
  if (!hydrated || !tenant) {
    return <div className="min-h-dvh bg-paper">{children}</div>;
  }

  return (
    <BrandProvider brand={tenant.brand}>
      <TenantChrome tenant={tenant}>{children}</TenantChrome>
    </BrandProvider>
  );
}

export function CustomTenantPage({ slug }: { slug: string }) {
  const tenant = useTenantBySlug(slug);
  const hydrated = useHydrated();

  if (!hydrated) return <Loading />;
  if (!tenant) return <TenantNotFoundView />;
  return <CompanyPage tenant={tenant} />;
}

export function CustomTenantBooking({ slug }: { slug: string }) {
  const tenant = useTenantBySlug(slug);
  const hydrated = useHydrated();

  if (!hydrated) return <Loading />;
  if (!tenant) return <TenantNotFoundView />;
  return <BookingFlow tenant={tenant} />;
}
