import { CompanyPage } from "@/components/booking";
import { SEED_STATE, getTenantBySlug } from "@/lib/data";
import { CustomTenantPage } from "./_components/custom-tenant";

export default async function TenantPage(props: PageProps<"/b/[slug]">) {
  const { slug } = await props.params;
  const tenant = getTenantBySlug(SEED_STATE, slug);

  // Not in the seed: it may still be a company this browser created, so the
  // client resolves it and shows the 404 only once the store has hydrated.
  if (!tenant) return <CustomTenantPage slug={slug} />;

  return <CompanyPage tenant={tenant} />;
}
