"use client";

import Link from "next/link";

import { LanguageDropdown } from "@/components/brand/language-switcher";
import { KalendoLogo } from "@/components/brand/logo";
import { TODAY } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Container } from "./section";

interface FooterColumn {
  key: string;
  titleKey: string;
  links: { href: string; labelKey: string }[];
}

const COLUMNS: FooterColumn[] = [
  {
    key: "product",
    titleKey: "landing.footer.product",
    links: [
      { href: "#features", labelKey: "landing.footer.features" },
      { href: "#pricing", labelKey: "landing.footer.pricing" },
      { href: "#audience", labelKey: "landing.nav.audience" },
      { href: "/b/aurora", labelKey: "landing.footer.demo" },
    ],
  },
  {
    key: "business",
    titleKey: "landing.footer.forBusiness",
    links: [
      { href: "/signup?type=company", labelKey: "auth.createAccount" },
      { href: "/login", labelKey: "landing.login" },
      { href: "/panel", labelKey: "nav.panel" },
      { href: "/app", labelKey: "landing.forClientsCta" },
    ],
  },
  {
    key: "company",
    titleKey: "landing.footer.company",
    links: [
      { href: "#contact", labelKey: "landing.footer.about" },
      { href: "#contact", labelKey: "landing.footer.blog" },
      { href: "#contact", labelKey: "landing.footer.careers" },
      { href: "#contact", labelKey: "landing.footer.status" },
    ],
  },
  {
    key: "legal",
    titleKey: "landing.footer.legal",
    links: [
      { href: "#contact", labelKey: "landing.footer.terms" },
      { href: "#contact", labelKey: "landing.footer.privacy" },
      { href: "#contact", labelKey: "landing.footer.cookies" },
      { href: "#contact", labelKey: "landing.footer.rodo" },
    ],
  },
];

export function SiteFooter() {
  const t = useT();

  return (
    <footer id="contact" className="scroll-mt-20 border-t border-line bg-paper">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-16">
          <div>
            <KalendoLogo size="md" />
            <p className="mt-4 max-w-[34ch] text-[13px] leading-6 text-muted">
              {t("landing.subtitle")}
            </p>
            <div className="mt-5">
              <LanguageDropdown align="left" />
            </div>
          </div>

          <nav aria-label={t("landing.footer.product")}>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {COLUMNS.map((column) => (
                <div key={column.key}>
                  <p className="text-[11px] font-medium tracking-[0.1em] text-sand-500 uppercase">
                    {t(column.titleKey)}
                  </p>
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {column.links.map((link) => (
                      <li key={`${column.key}-${link.labelKey}`}>
                        <Link
                          href={link.href}
                          className="rounded-sm text-[13.5px] text-sand-700 transition-colors hover:text-ink"
                        >
                          {t(link.labelKey)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>

        <p className="mt-12 border-t border-line pt-6 text-[12px] text-sand-500">
          {t("landing.footer.rights", { year: TODAY.slice(0, 4) })}
        </p>
      </Container>
    </footer>
  );
}
