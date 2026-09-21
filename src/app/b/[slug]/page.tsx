import { notFound } from "next/navigation";

import { CompanyPage } from "@/components/booking";
import { SEED_STATE, getTenantBySlug } from "@/lib/data";

export default async function TenantPage(props: PageProps<"/b/[slug]">) {
  const { slug } = await props.params;
  const tenant = getTenantBySlug(SEED_STATE, slug);
  if (!tenant) notFound();

  return <CompanyPage tenant={tenant} />;
}
