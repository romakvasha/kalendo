import { Suspense } from "react";

import { BookingFlow } from "@/components/booking";
import { Spinner } from "@/components/ui";
import { SEED_STATE, getTenantBySlug } from "@/lib/data";
import { CustomTenantBooking } from "../_components/custom-tenant";

export default async function BookPage(props: PageProps<"/b/[slug]/book">) {
  const { slug } = await props.params;
  const tenant = getTenantBySlug(SEED_STATE, slug);

  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center bg-paper">
          <Spinner size="lg" />
        </div>
      }
    >
      {tenant ? (
        <BookingFlow tenant={tenant} />
      ) : (
        <CustomTenantBooking slug={slug} />
      )}
    </Suspense>
  );
}
