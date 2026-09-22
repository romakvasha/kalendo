import type { Metadata } from "next";

import { TenantChrome } from "@/components/booking";
import { BrandProvider } from "@/components/layout";
import { SEED_STATE, getTenantBySlug } from "@/lib/data";
import { CustomTenantChrome } from "./_components/custom-tenant";

export async function generateMetadata(
  props: LayoutProps<"/b/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const tenant = getTenantBySlug(SEED_STATE, slug);

  // A company created in the browser is unknown here, so an unseeded slug gets
  // a generic title rather than a 404 one — the page decides which it is.
  // The dictionary is client-only, so this one stays a literal in the default
  // locale; the page itself is translated once it renders.
  if (!tenant) return { title: "Rezerwacja online" };

  const title = `${tenant.name} — rezerwacja online`;
  return {
    title,
    description: tenant.tagline.pl,
    openGraph: { title, description: tenant.tagline.pl, type: "website" },
  };
}

export default async function TenantLayout(props: LayoutProps<"/b/[slug]">) {
  const { slug } = await props.params;
  const tenant = getTenantBySlug(SEED_STATE, slug);

  // Seed first: the three demo companies keep their server-rendered chrome.
  // Anything else is resolved from the store in the browser.
  if (!tenant) {
    return <CustomTenantChrome slug={slug}>{props.children}</CustomTenantChrome>;
  }

  return (
    <BrandProvider brand={tenant.brand}>
      <TenantChrome tenant={tenant}>{props.children}</TenantChrome>
    </BrandProvider>
  );
}
