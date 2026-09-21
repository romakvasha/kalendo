"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  categoriesOf,
  eligibleStaff,
  firstAvailableDate,
  reviewsOf,
  roomsOf,
  servicesOf,
  slotsFor,
  staffOf,
  useDataState,
  useHydrated,
} from "@/lib/data";
import { TODAY, startOfMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Tenant } from "@/lib/types";
import { BookingRail, StepMark } from "./booking-rail";
import { CompanyHero } from "./company-hero";
import { GiftCard } from "./gift-card";
import { bookHref } from "./helpers";
import { HoursAndContact } from "./hours-contact";
import { ReviewsSection } from "./reviews-section";
import { ALL_CATEGORIES, CategoryChips, ServiceList } from "./service-list";
import { StaffCards } from "./staff-picker";

export interface CompanyPageProps {
  tenant: Tenant;
}

export function CompanyPage({ tenant }: CompanyPageProps) {
  const t = useI18n().t;
  const state = useDataState();
  const hydrated = useHydrated();

  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [pickedMonth, setPickedMonth] = useState<string | null>(null);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const categories = useMemo(
    () => categoriesOf(state, tenant.id),
    [state, tenant.id],
  );
  const allServices = useMemo(
    () => servicesOf(state, tenant.id),
    [state, tenant.id],
  );
  const team = useMemo(() => staffOf(state, tenant.id), [state, tenant.id]);
  const reviews = useMemo(() => reviewsOf(state, tenant.id), [state, tenant.id]);

  const services = useMemo(
    () =>
      category === ALL_CATEGORIES
        ? allServices
        : allServices.filter((service) => service.categoryId === category),
    [allServices, category],
  );

  const pickable = useMemo(
    () =>
      serviceIds.length ? eligibleStaff(state, tenant.id, serviceIds) : team,
    [state, tenant.id, serviceIds, team],
  );

  // Narrowing the services can drop the chosen specialist — fall back to "any".
  const effectiveStaffId =
    staffId && pickable.some((member) => member.id === staffId) ? staffId : null;
  const staff = team.find((member) => member.id === effectiveStaffId);
  const room = useMemo(() => roomsOf(state, tenant.id)[0], [state, tenant.id]);

  // Opening on an empty day is the worst first impression the rail can make,
  // so an untouched (or no longer bookable) date jumps to the first free one.
  const date = useMemo(() => {
    if (!hydrated) return null;
    const stillFree =
      pickedDate !== null &&
      slotsFor(state, tenant.id, serviceIds, effectiveStaffId, pickedDate).some(
        (slot) => slot.available,
      );
    return stillFree
      ? pickedDate
      : firstAvailableDate(state, tenant.id, serviceIds, effectiveStaffId, TODAY);
  }, [hydrated, pickedDate, state, tenant.id, serviceIds, effectiveStaffId]);

  const month = pickedMonth ?? startOfMonth(date ?? TODAY);

  function toggleService(id: string) {
    setServiceIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
    setTime(null);
  }

  function pickStaff(next: string | null) {
    setStaffId(next);
    setTime(null);
  }

  function pickDate(next: string) {
    setPickedDate(next);
    setTime(null);
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-28 lg:px-8 lg:pb-16">
        <CompanyHero tenant={tenant} categories={categories} />

        <div className="mt-10 lg:mt-14 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-10">
          <div className="flex flex-col gap-12 lg:gap-16">
            {/* ------------------------------------------- services */}
            <section id="services" className="scroll-mt-24">
              <h2 className="flex items-center gap-2.5 font-display text-[26px] leading-8 text-ink lg:text-[32px]">
                <StepMark className="size-6 text-[12px]">1</StepMark>
                {t("company.chooseService")}
              </h2>

              <CategoryChips
                className="mt-4"
                categories={categories}
                value={category}
                onChange={setCategory}
              />

              <ServiceList
                className="mt-4"
                tenant={tenant}
                services={services}
                team={team}
                selectedIds={serviceIds}
                onToggle={toggleService}
                hrefFor={(service) =>
                  bookHref(tenant.slug, {
                    serviceIds: [service.id],
                    step: "termin",
                  })
                }
              />
            </section>

            {/* ---------------------------------------------- team */}
            <section id="team" className="scroll-mt-24">
              <h2 className="flex items-center gap-2.5 font-display text-[26px] leading-8 text-ink lg:text-[32px]">
                <StepMark className="size-6 text-[12px]">2</StepMark>
                {t("company.chooseStaff")}
              </h2>
              <StaffCards
                className="mt-4"
                team={pickable}
                value={effectiveStaffId}
                onChange={pickStaff}
              />
            </section>

            {/* ------------------------------------------- reviews */}
            <ReviewsSection tenant={tenant} reviews={reviews} />

            {/* ------------------------------------------ vouchers */}
            <section id="vouchers" className="scroll-mt-24">
              <GiftCard tenant={tenant} className="lg:hidden" />
            </section>

            {/* -------------------------------------- hours/contact */}
            <HoursAndContact tenant={tenant} />
          </div>

          {/* ------------------------------------------------ rail */}
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <BookingRail
              tenant={tenant}
              serviceIds={serviceIds}
              staffId={effectiveStaffId}
              staff={staff}
              room={room}
              month={month}
              onMonthChange={setPickedMonth}
              date={date}
              onDateChange={pickDate}
              time={time}
              onTimeChange={setTime}
            />
            <GiftCard tenant={tenant} className="mt-4" />
          </aside>
        </div>
      </div>

      {/* ------------------------------------- mobile sticky action */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur-md lg:hidden">
        <div className="px-4 py-3">
          <Link
            href={bookHref(tenant.slug, {
              serviceIds,
              staffId: effectiveStaffId,
              step: serviceIds.length ? "termin" : "usluga",
            })}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand text-[15px] font-medium text-brand-fg shadow-xs transition-opacity active:opacity-90"
          >
            {t("company.book")}
            <ArrowRight aria-hidden className="size-[18px]" />
          </Link>
        </div>
      </div>
    </>
  );
}
