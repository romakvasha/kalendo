"use client";

import Link from "next/link";

import { KalendoLogo } from "@/components/layout";
import { useI18n } from "@/lib/i18n";
import type { Tenant } from "@/lib/types";

export interface PublicFooterProps {
  tenant: Tenant;
}

export function PublicFooter({ tenant }: PublicFooterProps) {
  const t = useI18n().t;

  return (
    <footer className="mt-12 border-t border-line bg-white lg:mt-20">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-7 text-[12.5px] text-muted sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>
          © 2026 {tenant.name} · {tenant.address}, {tenant.city}
        </p>

        <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5">
            {t("company.poweredBy")}
            <Link href="/" className="rounded-sm">
              <KalendoLogo size="sm" />
            </Link>
          </span>
          <span aria-hidden className="text-sand-300">
            ·
          </span>
          <Link href="/terms" className="transition-colors hover:text-ink">
            {t("landing.footer.terms")}
          </Link>
          <span aria-hidden className="text-sand-300">
            ·
          </span>
          <Link href="/privacy" className="transition-colors hover:text-ink">
            {t("landing.footer.privacy")}
          </Link>
        </p>
      </div>
    </footer>
  );
}
