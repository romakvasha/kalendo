import type { Metadata } from "next";

import { TenantChrome } from "@/components/booking";
import { BrandProvider } from "@/components/layout";
import { SEED_STATE, getTenantBySlug } from "@/lib/data";
import { translate } from "@/lib/i18n";

export async function generateMetadata(
  props: LayoutProps<"/b/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const tenant = getTenantBySlug(SEED_STATE, slug);
  if (!tenant) return { title: translate("pl", "errors.notFound") };

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

  // The pages below throw notFound() for an unknown slug. Rendering their
  // output bare here keeps this segment's not-found.tsx as the 404 boundary —
  // throwing from the layout would escape it and fall back to the root page.
  if (!tenant) return <div className="min-h-dvh bg-paper">{props.children}</div>;

  return (
    <BrandProvider brand={tenant.brand}>
      <TenantChrome tenant={tenant}>{props.children}</TenantChrome>
    </BrandProvider>
  );
}
