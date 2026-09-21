import { Suspense } from "react";
import { notFound } from "next/navigation";

import { BookingFlow } from "@/components/booking";
import { Spinner } from "@/components/ui";
import { SEED_STATE, getTenantBySlug } from "@/lib/data";

export default async function BookPage(props: PageProps<"/b/[slug]/book">) {
  const { slug } = await props.params;
  const tenant = getTenantBySlug(SEED_STATE, slug);
  if (!tenant) notFound();

  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center bg-paper">
          <Spinner size="lg" />
        </div>
      }
    >
      <BookingFlow tenant={tenant} />
    </Suspense>
  );
}
