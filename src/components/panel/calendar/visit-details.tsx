"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  Check,
  ClipboardList,
  Clock,
  CreditCard,
  IdCard,
  MessageSquare,
  Phone,
  Receipt,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  clientById,
  roomById,
  servicesFor,
  staffById,
  type DataState,
} from "@/lib/data";
import {
  addDays,
  dayMonth,
  duration,
  minutesOf,
  money,
  monthYear,
  timeOf,
  weekdayDayMonth,
} from "@/lib/format";
import { useLocale, useT, useTl } from "@/lib/i18n";
import type { Appointment, PaymentRecord, Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, Button, IconButton, Modal, Progress } from "@/components/ui";

const METHOD_KEYS: Record<PaymentRecord["method"], string> = {
  cash: "cash",
  card: "card",
  blik: "blik",
  "apple-pay": "applePay",
  "google-pay": "googlePay",
  transfer: "transfer",
};

export interface VisitDetailsProps {
  state: DataState;
  tenant: Tenant;
  appointment: Appointment;
  onClose: () => void;
  onSettle: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  /** The sheet supplies its own title, so the inline rail hides the header row. */
  showHeader?: boolean;
  className?: string;
}

export function VisitDetails({
  state,
  tenant,
  appointment,
  onClose,
  onSettle,
  onReschedule,
  onCancel,
  showHeader = true,
  className,
}: VisitDetailsProps) {
  const t = useT();
  const tl = useTl();
  const locale = useLocale();
  const router = useRouter();
  const [surveyOpen, setSurveyOpen] = useState(false);

  const client = clientById(state, appointment.clientId);
  const staff = staffById(state, appointment.staffId);
  const room = appointment.roomId
    ? roomById(state, appointment.roomId)
    : undefined;
  const services = servicesFor(state, appointment.serviceIds);
  const membership =
    state.memberships.find((pass) => pass.id === appointment.membershipId) ??
    state.memberships.find(
      (pass) =>
        pass.clientId === appointment.clientId && pass.used < pass.total,
    );

  const depositRecord = state.payments.find(
    (payment) => payment.appointmentId === appointment.id,
  );
  const methodLabel = depositRecord
    ? t(`panel.payments.methods.${METHOD_KEYS[depositRecord.method]}`)
    : t("panel.payments.methods.blik");

  const paid =
    appointment.payment === "paid"
      ? appointment.total
      : appointment.payment === "deposit"
        ? (appointment.depositAmount ?? 0)
        : 0;
  const due = Math.max(appointment.total - paid, 0);

  const isoDate = appointment.start.slice(0, 10);
  const minutes = minutesOf(appointment.end) - minutesOf(appointment.start);
  const answers = Object.entries(appointment.customFields ?? {});
  const note =
    appointment.note ?? (client?.notes ? tl(client.notes) : undefined);

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div
        className={cn(
          "thin-scrollbar min-h-0 flex-1 overflow-y-auto pb-5",
          showHeader ? "px-4 lg:px-5" : "px-0",
        )}
      >
        {showHeader ? (
          <div className="flex items-center justify-between gap-3 pt-4 pb-3">
            <h2 className="text-[15px] font-semibold text-ink">
              {t("panel.calendar.visitDetails")}
            </h2>
            <IconButton
              size="sm"
              variant="ghost"
              aria-label={t("a11y.close")}
              onClick={onClose}
            >
              <X />
            </IconButton>
          </div>
        ) : null}

        <div className="flex items-center gap-3 pt-1">
          <Avatar name={client?.name ?? ""} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-[17px] leading-6 font-semibold text-ink">
              {client?.name ?? t("panel.clients.newClient")}
            </p>
            <p className="truncate text-[13px] text-muted">
              {t("panel.calendar.clientMeta", {
                n: (client?.visitCount ?? 0) + 1,
                since: client ? monthYear(client.since, locale) : "—",
              })}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="secondary"
            iconLeft={Phone}
            disabled={!client}
            onClick={() => {
              if (client)
                window.location.href = `tel:${client.phone.replace(/\s/g, "")}`;
            }}
          >
            {t("panel.calendar.call")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            iconLeft={MessageSquare}
            disabled={!client}
            onClick={() => {
              if (client)
                window.location.href = `sms:${client.phone.replace(/\s/g, "")}`;
            }}
          >
            {t("panel.calendar.sms")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            iconLeft={IdCard}
            disabled={!client}
            onClick={() => {
              if (client) router.push(`/panel/clients/${client.id}`);
            }}
          >
            {t("panel.calendar.card")}
          </Button>
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <h3 className="text-[17px] leading-6 font-semibold text-ink">
            {services.map((service) => tl(service.name)).join(" + ")}
          </h3>

          <div className="mt-3 space-y-3">
            <InfoRow icon={Clock}>
              <span className="text-[14px] text-ink">
                {`${weekdayDayMonth(isoDate, locale)} · ${timeOf(appointment.start)}–${timeOf(appointment.end)}`}
              </span>
              <span className="block text-[13px] text-muted">
                {duration(minutes, locale)}
              </span>
            </InfoRow>

            <InfoRow icon={User}>
              <span className="text-[14px] text-ink">
                {[staff?.name, room ? tl(room.name) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </InfoRow>

            <InfoRow icon={CreditCard}>
              <span className="tabular text-[14px] text-ink">
                {money(appointment.total, locale)}
              </span>
              <span className="block text-[13px] text-muted">
                {appointment.payment === "deposit" && appointment.depositAmount
                  ? `${t("panel.calendar.deposit")} ${money(appointment.depositAmount, locale)} · ${methodLabel} · ${t("panel.calendar.totalLabel")} ${money(due, locale)}`
                  : appointment.payment === "paid"
                    ? `${t("panel.calendar.paid")} · ${methodLabel}`
                    : `${t("panel.calendar.totalLabel")} ${money(due, locale)}`}
              </span>
            </InfoRow>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {appointment.smsReminderSent ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1.5 text-[12px] font-medium text-success">
                  <Check aria-hidden className="size-3.5" strokeWidth={2.5} />
                  {t("panel.calendar.smsConfirmed")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-2.5 py-1.5 text-[12px] font-medium text-sand-700">
                  <Bell aria-hidden className="size-3.5" />
                  {t("panel.calendar.reminderSent")}
                </span>
              </>
            ) : appointment.status === "pending" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warn px-2.5 py-1.5 text-[12px] font-medium text-warn-ink">
                <Clock aria-hidden className="size-3.5" />
                {t("panel.calendar.unconfirmed")}
              </span>
            ) : null}
          </div>

          {answers.length > 0 ? (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-line bg-white p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-cobalt-soft text-cobalt">
                <ClipboardList aria-hidden className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">
                  {t("panel.calendar.form")}
                </p>
                <p className="truncate text-[12px] text-muted">
                  {t("panel.calendar.formFilled", {
                    date: dayMonth(addDays(isoDate, -2), locale),
                    count: answers.length,
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSurveyOpen(true)}
                className="shrink-0 rounded-sm text-[13px] font-semibold text-cobalt hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/30"
              >
                {t("panel.calendar.view")}
              </button>
            </div>
          ) : null}

          {note ? (
            <div className="mt-4">
              <p className="text-[12px] font-medium text-muted">
                {t("panel.calendar.noteLabel")}
              </p>
              <p className="mt-1 text-[14px] leading-5 text-ink">{note}</p>
            </div>
          ) : null}

          {membership ? (
            <div className="mt-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-[13px] font-semibold text-ink">
                  {tl(membership.name)}
                </p>
                <p className="tabular shrink-0 text-[13px] text-muted">
                  {`${Math.min(membership.used + 1, membership.total)} ${t("common.of")} ${membership.total}`}
                </p>
              </div>
              <Progress
                value={
                  (Math.min(membership.used + 1, membership.total) /
                    membership.total) *
                  100
                }
                tone="ink"
                className="mt-2"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 space-y-2 border-t border-line bg-white/80 py-4 backdrop-blur-sm",
          showHeader ? "px-4 lg:px-5" : "px-0",
        )}
      >
        {appointment.status === "done" ? (
          <p className="flex items-center justify-center gap-2 rounded-md bg-success-soft py-3 text-[14px] font-medium text-success">
            <Check aria-hidden className="size-4" strokeWidth={2.5} />
            {t("panel.calendar.done")}
          </p>
        ) : (
          <Button block iconLeft={Receipt} onClick={onSettle}>
            {t("panel.calendar.settle", { amount: money(due, locale) })}
          </Button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            iconLeft={CalendarClock}
            onClick={onReschedule}
          >
            {t("panel.calendar.reschedule")}
          </Button>
          <Button
            variant="secondary"
            iconLeft={X}
            onClick={onCancel}
            className="text-danger hover:bg-danger-soft"
          >
            {t("panel.calendar.cancel")}
          </Button>
        </div>
      </div>

      <Modal
        open={surveyOpen}
        onOpenChange={setSurveyOpen}
        title={t("panel.calendar.form")}
        size="sm"
        closeLabel={t("common.close")}
      >
        <dl className="divide-y divide-line">
          {answers.map(([key, value]) => {
            const field = tenant.customFields.find((entry) => entry.id === key);
            return (
              <div key={key} className="py-3">
                <dt className="text-[12px] font-medium text-muted">
                  {field ? tl(field.label) : key}
                </dt>
                <dd className="mt-0.5 text-[14px] text-ink">{value}</dd>
              </div>
            );
          })}
        </dl>
      </Modal>
    </div>
  );
}

interface InfoRowProps {
  icon: LucideIcon;
  children: React.ReactNode;
}

function InfoRow({ icon: Glyph, children }: InfoRowProps) {
  return (
    <div className="flex items-start gap-2.5">
      <Glyph aria-hidden className="mt-0.5 size-4 shrink-0 text-sand-500" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
