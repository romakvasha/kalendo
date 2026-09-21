"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

import { LanguageDropdown } from "@/components/brand/language-switcher";
import { KalendoLogo } from "@/components/brand/logo";
import { Button, IconButton } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Container } from "./section";

interface LandingLink {
  href: string;
  labelKey: string;
}

const LINKS: LandingLink[] = [
  { href: "#features", labelKey: "landing.footer.features" },
  { href: "#audience", labelKey: "landing.nav.audience" },
  { href: "#pricing", labelKey: "landing.footer.pricing" },
  { href: "#contact", labelKey: "landing.footer.contact" },
];

export function SiteHeader() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <Container className="flex h-15 items-center justify-between gap-4 lg:h-16">
        <Link
          href="/"
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25"
        >
          <KalendoLogo size="md" />
        </Link>

        <nav
          aria-label={t("common.menu")}
          className="hidden items-center gap-7 lg:flex"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm text-[14px] font-medium text-sand-700 transition-colors hover:text-ink"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageDropdown className="hidden sm:block" />
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => router.push("/login")}
          >
            {t("landing.login")}
          </Button>
          <Button
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => router.push("/signup?type=company")}
          >
            {t("auth.createAccount")}
          </Button>

          <IconButton
            className="sm:hidden"
            size="sm"
            aria-label={open ? t("a11y.closeMenu") : t("a11y.openMenu")}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </IconButton>
        </div>
      </Container>

      <div
        className={cn(
          "overflow-hidden border-t border-line bg-paper sm:hidden",
          open ? "block" : "hidden",
        )}
      >
        <Container className="flex flex-col gap-1 py-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-sm px-1 py-2.5 text-[15px] font-medium text-sand-700"
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            <Button
              variant="secondary"
              block
              onClick={() => {
                setOpen(false);
                router.push("/login");
              }}
            >
              {t("landing.login")}
            </Button>
            <Button
              block
              onClick={() => {
                setOpen(false);
                router.push("/signup?type=company");
              }}
            >
              {t("auth.createAccount")}
            </Button>
          </div>
          <LanguageDropdown align="left" className="mt-2 self-start" />
        </Container>
      </div>
    </header>
  );
}
