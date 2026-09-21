"use client";

import { usePathname } from "next/navigation";

import { PublicHeader } from "@/components/layout";
import type { Tenant } from "@/lib/types";
import { PublicFooter } from "./public-footer";

export interface TenantChromeProps {
  tenant: Tenant;
  children: React.ReactNode;
}

/**
 * The booking flow brings its own header and stepper, so the public chrome
 * steps aside there instead of stacking two headers.
 */
export function TenantChrome({ tenant, children }: TenantChromeProps) {
  const pathname = usePathname();
  const inFlow = pathname.startsWith(`/b/${tenant.slug}/book`);

  if (inFlow) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <PublicHeader tenant={tenant} />
      <div className="flex-1">{children}</div>
      <PublicFooter tenant={tenant} />
    </div>
  );
}
