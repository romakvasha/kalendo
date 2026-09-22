"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet } from "@/components/ui";
import { LanguageDropdown } from "@/components/brand/language-switcher";
import { TenantLogo } from "@/components/brand/logo";
import { PUBLIC_NAV } from "@/lib/nav";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/lib/types";

const GHOST_LINK =
  "inline-flex items-center rounded-md px-3 py-2 text-[13px] font-medium text-sand-700 transition-colors hover:bg-sand-100 hover:text-ink";

const SECONDARY_LINK =
  "inline-flex items-center rounded-md border border-line bg-card px-3.5 py-2 text-[13px] font-medium text-ink shadow-xs transition-colors hover:bg-sand-50";

export interface PublicHeaderProps {
  tenant: Tenant;
  className?: string;
}

export function PublicHeader({ tenant, className }: PublicHeaderProps) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-line bg-card/85 pt-safe backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-3 px-4 lg:px-8">
        <Link
          href={`/b/${tenant.slug}`}
          className="flex min-w-0 shrink items-center gap-2.5 rounded-sm"
        >
          <TenantLogo tenant={tenant} size="sm" />
          <span className="truncate text-[15px] font-medium tracking-tight text-ink">
            {tenant.name}
          </span>
        </Link>

        <nav
          aria-label={t("common.menu")}
          className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
        >
          {PUBLIC_NAV.map((item) => (
            <Link key={item.key} href={item.href} className={GHOST_LINK}>
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <LanguageDropdown align="right" />

          <Link href="/app/visits" className={cn(GHOST_LINK, "hidden lg:inline-flex")}>
            {t("visits.title")}
          </Link>
          <Link href="/login" className={cn(SECONDARY_LINK, "hidden lg:inline-flex")}>
            {t("auth.login")}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("a11y.openMenu")}
            aria-expanded={menuOpen}
            className="flex size-9 items-center justify-center rounded-md text-sand-700 transition-colors hover:bg-sand-100 hover:text-ink lg:hidden"
          >
            <Menu className="size-[19px]" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </div>

      <Sheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title={t("common.menu")}
        footer={
          <div className="flex flex-col gap-2">
            <Link
              href="/app/visits"
              onClick={() => setMenuOpen(false)}
              className={cn(SECONDARY_LINK, "justify-center py-2.5")}
            >
              {t("visits.title")}
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center justify-center rounded-md bg-ink px-3.5 py-2.5 text-[13px] font-medium text-paper transition-opacity hover:opacity-90"
            >
              {t("auth.login")}
            </Link>
          </div>
        }
      >
        <nav aria-label={t("common.menu")} className="flex flex-col pb-2">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-2 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-sand-50"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </Sheet>
    </header>
  );
}
