"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Lock, X } from "lucide-react";
import { toast } from "sonner";

import { TenantLogo } from "@/components/layout";
import { Button, IconButton, Stepper } from "@/components/ui";
import {
  durationOf,
  eligibleStaff,
  firstAvailableDate,
  priceOf,
  servicesFor,
  slotsFor,
  useDataState,
  useHydrated,
  useKalendo,
} from "@/lib/data";
import { TODAY, money, startOfWeek, weekdayDayMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Appointment, PaymentRecord, Tenant } from "@/lib/types";
import {
  FLOW_STEPS,
  FLOW_STEP_KEYS,
  MODE_FIELD_ID,
  hasModeQuestion,
  isFlowStep,
  type FlowStep,
  type ServiceMode,
} from "./helpers";
import {
  StepDetails,
  type ContactDraft,
  type PaymentOption,
} from "./step-details";
import { StepDone } from "./step-done";
import { StepService, useSelectionSummary } from "./step-service";
import { StepTime } from "./step-time";

const ONLINE_METHODS: PaymentRecord["method"][] = [
  "blik",
  "card",
  "apple-pay",
  "google-pay",
];

export interface BookingFlowProps {
  tenant: Tenant;
}

export function BookingFlow({ tenant }: BookingFlowProps) {
  const { t, tl, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const state = useDataState();
  const hydrated = useHydrated();
  const createBooking = useKalendo((store) => store.createBooking);

  /* ------------------------------------------------ url-held draft */
  const serviceIds = useMemo(() => {
    const raw = params.get("service");
    if (!raw) return [];
    const known = new Set(
      state.services.filter((s) => s.tenantId === tenant.id).map((s) => s.id),
    );
    return raw.split(",").filter((id) => known.has(id));
  }, [params, state.services, tenant.id]);

  const rawStaffId = params.get("staff");
  const rawDate = params.get("date");
  /** Only a date the visitor put in the URL themselves. */
  const pickedDate = rawDate && rawDate >= TODAY ? rawDate : null;
  const time = pickedDate ? params.get("time") : null;

  /* ---------------------------------------------------- local state */
  const [created, setCreated] = useState<Appointment | null>(null);
  const [weekOverride, setWeekOverride] = useState<string | null>(null);
  const [mode, setMode] = useState<ServiceMode | null>(
    hasModeQuestion(tenant) ? "wait" : null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [local, setLocal] = useState<ContactDraft>(() => ({
    customFields: {},
    contact: { name: "", phone: "", email: "" },
    paymentChoice: tenant.deposit.enabled ? "deposit" : "on-site",
    paymentMethod: tenant.deposit.enabled ? "blik" : undefined,
    voucherCode: undefined,
    marketingConsent: false,
    termsAccepted: false,
    createAccount: false,
  }));

  const services = useMemo(
    () => servicesFor(state, serviceIds),
    [state, serviceIds],
  );
  // A specialist carried in the URL may not perform every chosen service.
  const eligible = useMemo(
    () => eligibleStaff(state, tenant.id, serviceIds),
    [state, tenant.id, serviceIds],
  );
  const staffId =
    rawStaffId && eligible.some((member) => member.id === rawStaffId)
      ? rawStaffId
      : null;

  /* --------------------------------------------------- opening date */
  // Today is often already booked out, so the step opens on the first day
  // that has something to offer. Gated on hydration so the server HTML and
  // the first client render agree.
  const autoDate = useMemo(
    () =>
      hydrated && !pickedDate
        ? firstAvailableDate(state, tenant.id, serviceIds, staffId, TODAY)
        : null,
    [hydrated, pickedDate, state, tenant.id, serviceIds, staffId],
  );

  const date = pickedDate ?? autoDate;
  const weekAnchor = weekOverride ?? startOfWeek(date ?? TODAY);

  /* ------------------------------------------------------ step guard */
  const requested = params.get("step");
  const wanted: FlowStep = isFlowStep(requested)
    ? requested
    : serviceIds.length
      ? "termin"
      : "usluga";

  const reachable: FlowStep = created
    ? "gotowe"
    : !serviceIds.length
      ? "usluga"
      : !date || !time
        ? "termin"
        : "dane";

  const step: FlowStep =
    FLOW_STEPS.indexOf(wanted) > FLOW_STEPS.indexOf(reachable) ? reachable : wanted;

  /* ---------------------------------------------------- url helpers */
  const urlFor = useCallback(
    (next: {
      serviceIds?: string[];
      staffId?: string | null;
      date?: string | null;
      time?: string | null;
      step?: FlowStep;
    }) => {
      const query = new URLSearchParams();
      const ids = next.serviceIds ?? serviceIds;
      const nextStaff = next.staffId === undefined ? staffId : next.staffId;
      // The auto-picked date is deliberately not carried over: leaving it out
      // lets the search re-run when the service or the specialist changes.
      const nextDate = next.date === undefined ? pickedDate : next.date;
      const nextTime = next.time === undefined ? time : next.time;
      if (ids.length) query.set("service", ids.join(","));
      if (nextStaff) query.set("staff", nextStaff);
      if (nextDate) query.set("date", nextDate);
      if (nextTime) query.set("time", nextTime);
      query.set("step", next.step ?? step);
      return `${pathname}?${query.toString()}`;
    },
    [pathname, serviceIds, staffId, pickedDate, time, step],
  );

  const goTo = useCallback(
    (next: FlowStep) => router.push(urlFor({ step: next })),
    [router, urlFor],
  );

  const patchDraft = useCallback(
    (next: Parameters<typeof urlFor>[0]) => router.replace(urlFor(next)),
    [router, urlFor],
  );

  /* ------------------------------------------------------- derived */
  const minutes = serviceIds.length ? durationOf(state, serviceIds) : 0;
  const total = priceOf(state, serviceIds);
  const serviceSummary = services.map((service) => tl(service.name)).join(" + ");
  const selectionSummary = useSelectionSummary(serviceIds);

  const depositAmount = tenant.deposit.enabled
    ? tenant.deposit.mode === "percent"
      ? Math.round((total * tenant.deposit.value) / 100)
      : tenant.deposit.value
    : 0;

  const voucher = useMemo(
    () =>
      local.voucherCode
        ? state.vouchers.find(
            (entry) =>
              entry.tenantId === tenant.id &&
              entry.code.toUpperCase() === local.voucherCode?.toUpperCase(),
          )
        : undefined,
    [local.voucherCode, state.vouchers, tenant.id],
  );

  const discount = voucher
    ? voucher.kind === "gift"
      ? Math.min(voucher.value, total)
      : Math.round((total * voucher.value) / 100)
    : 0;

  const payable = Math.max(total - discount, 0);
  const payingNow = local.paymentChoice !== "on-site";
  const dueNow =
    local.paymentChoice === "full"
      ? payable
      : local.paymentChoice === "deposit"
        ? Math.min(depositAmount, payable)
        : payable;

  const paymentOptions: PaymentOption[] = tenant.deposit.enabled
    ? [
        {
          choice: "deposit",
          title: t("booking.depositNow", {
            amount: money(Math.min(depositAmount, payable), locale),
          }),
          note: t("booking.payRest"),
        },
        {
          choice: "full",
          title: t("booking.payFullTitle", { amount: money(payable, locale) }),
          note: t("booking.payFullNote"),
        },
      ]
    : [
        {
          choice: "on-site",
          title: t("booking.payOnSite"),
          note: t("booking.payOnSiteNote"),
        },
        {
          choice: "full",
          title: t("booking.payOnlineNow", { amount: money(payable, locale) }),
          note: t("booking.payOnlineNowNote"),
        },
      ];

  const customSummary = useMemo(() => {
    const parts = tenant.customFields
      .map((field) => local.customFields[field.id])
      .filter((value): value is string => Boolean(value && value.trim()));
    if (mode) parts.push(t(`booking.mode.${mode}`).toLowerCase());
    return parts.join(" · ");
  }, [tenant.customFields, local.customFields, mode, t]);

  /* -------------------------------------------------------- actions */
  // `undefined` keeps a date the visitor picked, `null` drops it so the
  // first-free-day search runs again for the new selection.
  function keepDate(ids: string[], staff: string | null): string | null | undefined {
    if (!pickedDate) return null;
    const free = slotsFor(state, tenant.id, ids, staff, pickedDate).some(
      (slot) => slot.available,
    );
    return free ? undefined : null;
  }

  function toggleService(id: string) {
    const next = serviceIds.includes(id)
      ? serviceIds.filter((value) => value !== id)
      : [...serviceIds, id];
    patchDraft({
      serviceIds: next,
      date: keepDate(next, staffId),
      time: null,
    });
  }

  function applyCode(code: string): boolean {
    const normalized = code.trim().toUpperCase();
    const match = state.vouchers.find(
      (entry) =>
        entry.tenantId === tenant.id &&
        entry.code.toUpperCase() === normalized &&
        !entry.usedAt,
    );
    if (!match) return false;
    setLocal((current) => ({ ...current, voucherCode: match.code }));
    return true;
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!local.contact.name.trim()) next.name = t("errors.required");
    if (local.contact.phone.replace(/\D/g, "").length < 9) {
      next.phone = t("errors.phone");
    }
    if (local.contact.email && !/.+@.+\..+/.test(local.contact.email)) {
      next.email = t("errors.email");
    }
    for (const field of tenant.customFields) {
      if (field.required && !(local.customFields[field.id] ?? "").trim()) {
        next[`custom.${field.id}`] = t("errors.required");
      }
    }
    if (!local.termsAccepted) next.terms = t("errors.terms");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit() {
    if (!validate()) return;
    const customFields = { ...local.customFields };
    if (mode) customFields[MODE_FIELD_ID] = mode;

    const appointment = createBooking({
      tenantId: tenant.id,
      serviceIds,
      staffId,
      date,
      time,
      customFields,
      contact: local.contact,
      paymentChoice: local.paymentChoice,
      paymentMethod: local.paymentMethod,
      voucherCode: local.voucherCode,
      marketingConsent: local.marketingConsent,
      termsAccepted: local.termsAccepted,
      createAccount: local.createAccount,
    });

    setCreated(appointment);
    toast.success(t("toast.bookingConfirmed"));
    router.push(urlFor({ step: "gotowe" }));
  }

  /* ----------------------------------------------------------- view */
  const stepperSteps = FLOW_STEPS.map((key) => ({
    key,
    label: t(FLOW_STEP_KEYS[key]),
  }));

  const backStep = FLOW_STEPS[Math.max(FLOW_STEPS.indexOf(step) - 1, 0)];

  return (
    <div className="min-h-dvh bg-paper">
      {/* --------------------------------------------------- header */}
      <header className="pt-safe sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[880px] items-center gap-3 px-4 lg:px-8">
          {step === "gotowe" ? (
            <span className="size-11 shrink-0" />
          ) : (
            <IconButton
              aria-label={t("a11y.back")}
              disabled={step === "usluga"}
              onClick={() => goTo(backStep)}
            >
              <ArrowLeft />
            </IconButton>
          )}

          <span className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
            <TenantLogo tenant={tenant} size="sm" />
            <span className="truncate text-[15px] font-medium text-ink">
              {t("company.book")}
            </span>
          </span>

          <Link
            href={`/b/${tenant.slug}`}
            aria-label={t("a11y.close")}
            className="inline-grid size-11 shrink-0 place-items-center rounded-md text-sand-600 transition-colors hover:bg-sand-100 hover:text-ink"
          >
            <X className="size-[18px]" aria-hidden />
          </Link>
        </div>

        <div className="mx-auto w-full max-w-[880px] px-4 pb-3 lg:px-8">
          <Stepper
            steps={stepperSteps}
            current={step}
            done={FLOW_STEPS.slice(0, FLOW_STEPS.indexOf(step))}
          />
        </div>
      </header>

      {/* ----------------------------------------------------- body */}
      <main className="mx-auto w-full max-w-[880px] px-4 pt-6 pb-40 lg:px-8 lg:pt-10">
        {step === "usluga" && (
          <StepService
            tenant={tenant}
            serviceIds={serviceIds}
            onToggle={toggleService}
          />
        )}

        {step === "termin" && (
          <StepTime
            tenant={tenant}
            serviceIds={serviceIds}
            staffId={staffId}
            onStaffChange={(next) =>
              patchDraft({
                staffId: next,
                date: keepDate(serviceIds, next),
                time: null,
              })
            }
            weekAnchor={weekAnchor}
            onWeekAnchorChange={setWeekOverride}
            date={date}
            onDateChange={(next) => patchDraft({ date: next, time: null })}
            time={time}
            onTimeChange={(next) => patchDraft({ date, time: next })}
            mode={mode}
            onModeChange={setMode}
            onEditServices={() => goTo("usluga")}
          />
        )}

        {step === "dane" && (
          <StepDetails
            tenant={tenant}
            draft={{
              tenantId: tenant.id,
              serviceIds,
              staffId,
              date,
              time,
              ...local,
            }}
            onDraftChange={(patch) =>
              setLocal((current) => ({ ...current, ...patch }))
            }
            paymentOptions={paymentOptions}
            methods={ONLINE_METHODS}
            serviceSummary={serviceSummary}
            total={total}
            dueNow={dueNow}
            discount={discount}
            onApplyCode={applyCode}
            errors={errors}
          />
        )}

        {step === "gotowe" && created && (
          <StepDone
            tenant={tenant}
            appointment={created}
            serviceSummary={serviceSummary}
            customSummary={customSummary}
            minutes={minutes}
            paidNow={dueNow}
            manageHref="/app/visits"
          />
        )}
      </main>

      {/* ------------------------------------------- sticky actions */}
      {step !== "gotowe" && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[880px] items-center gap-3 px-4 py-3 lg:px-8">
            <div className="min-w-0 flex-1">
              {step === "dane" ? (
                <>
                  <p className="text-[11.5px] text-muted">
                    {payingNow ? t("booking.toPay") : t("booking.toPayOnSite")}
                  </p>
                  <p className="tabular text-[17px] leading-6 font-medium text-ink">
                    {money(dueNow, locale)}
                  </p>
                </>
              ) : (
                <p className="truncate text-[12.5px] text-muted">
                  {step === "usluga"
                    ? selectionSummary
                    : date && time
                      ? `${weekdayDayMonth(date, locale)}, ${time}`
                      : t("company.chooseSlot")}
                </p>
              )}
            </div>

            {step === "dane" ? (
              <Button
                variant="brand"
                size="lg"
                className="shrink-0"
                iconLeft={payingNow ? Lock : Check}
                onClick={submit}
              >
                {payingNow ? t("booking.bookAndPay") : t("booking.confirmBooking")}
              </Button>
            ) : (
              <Button
                variant="brand"
                size="lg"
                className="shrink-0"
                iconRight={ArrowRight}
                disabled={
                  step === "usluga" ? serviceIds.length === 0 : !date || !time
                }
                onClick={() => goTo(step === "usluga" ? "termin" : "dane")}
              >
                {t("common.next")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
