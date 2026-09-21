"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Apple,
  Banknote,
  Coins,
  CreditCard,
  Download,
  FileText,
  Smartphone,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { usePanelSession } from "@/components/layout";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Modal,
  Segmented,
  Select,
  Stat,
} from "@/components/ui";
import {
  NOW_ISO,
  appointmentById,
  clientById,
  paymentsOf,
  serviceById,
  useDataState,
  useHydrated,
  useKalendo,
} from "@/lib/data";
import { TODAY, money, timeOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type {
  Appointment,
  Locale,
  PaymentRecord,
  Tenant,
} from "@/lib/types";
import { cn, makeId, sum } from "@/lib/utils";

import { DataTable, type DataColumn } from "./data-table";
import { ModuleHeader } from "./module-header";
import { ModuleSkeleton } from "./module-skeleton";
import { COUNTING, downloadCsv, toCsv } from "./helpers";

/* ------------------------------------------------------------------ */

const METHOD_ICONS: Record<PaymentRecord["method"], LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  blik: Smartphone,
  "apple-pay": Apple,
  "google-pay": Wallet,
  transfer: Coins,
};

const METHOD_KEYS: Record<PaymentRecord["method"], string> = {
  cash: "cash",
  card: "card",
  blik: "blik",
  "apple-pay": "applePay",
  "google-pay": "googlePay",
  transfer: "transfer",
};

const KIND_TONES: Record<
  PaymentRecord["kind"],
  "warn" | "success" | "danger" | "neutral" | "info"
> = {
  deposit: "warn",
  full: "success",
  refund: "danger",
  product: "neutral",
  voucher: "info",
};

type PaymentTab = "transactions" | "invoices" | "deposits";

/* ------------------------------------------------------------------ */

export function PaymentsScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <ModuleSkeleton rows={6} />;
  return <Payments tenant={tenant} />;
}

function Payments({ tenant }: { tenant: Tenant }) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();

  const payments = useMemo(
    () => paymentsOf(state, tenant.id),
    [state, tenant.id],
  );
  const [tab, setTab] = useState<PaymentTab>("transactions");
  const [invoicing, setInvoicing] = useState(false);

  const month = TODAY.slice(0, 7);
  const todayTotal = sum(
    payments.filter((p) => p.at.slice(0, 10) === TODAY).map((p) => p.amount),
  );
  const monthTotal = sum(
    payments.filter((p) => p.at.slice(0, 7) === month).map((p) => p.amount),
  );

  const upcomingDeposits = useMemo(
    () =>
      state.appointments.filter(
        (appointment) =>
          appointment.tenantId === tenant.id &&
          appointment.payment === "deposit" &&
          appointment.start.slice(0, 10) >= TODAY &&
          COUNTING.includes(appointment.status),
      ),
    [state.appointments, tenant.id],
  );
  const depositTotal = sum(
    upcomingDeposits.map((appointment) => appointment.depositAmount ?? 0),
  );

  const toSettle = useMemo(
    () =>
      state.appointments.filter(
        (appointment) =>
          appointment.tenantId === tenant.id &&
          appointment.status === "done" &&
          appointment.payment !== "paid",
      ),
    [state.appointments, tenant.id],
  );
  const settleTotal = sum(
    toSettle.map(
      (appointment) => appointment.total - (appointment.depositAmount ?? 0),
    ),
  );

  const invoices = payments.filter((payment) => payment.invoiceNumber);

  function nameOf(payment: PaymentRecord): string {
    const appointment = payment.appointmentId
      ? appointmentById(state, payment.appointmentId)
      : undefined;
    const client = appointment ? clientById(state, appointment.clientId) : undefined;
    return client?.name ?? "—";
  }

  function serviceOf(payment: PaymentRecord): string {
    const appointment = payment.appointmentId
      ? appointmentById(state, payment.appointmentId)
      : undefined;
    if (!appointment) return t(`panel.payments.kinds.${payment.kind}`);
    return appointment.serviceIds
      .map((id) => {
        const service = serviceById(state, id);
        return service ? tl(service.name) : "";
      })
      .filter(Boolean)
      .join(" + ");
  }

  function exportCsv() {
    const rows: (string | number)[][] = [
      [
        t("common.date"),
        t("common.time"),
        t("common.client"),
        t("common.service"),
        t("panel.payments.method"),
        t("common.status"),
        t("panel.payments.amount"),
      ],
      ...payments.map((payment) => [
        payment.at.slice(0, 10),
        timeOf(payment.at),
        nameOf(payment),
        serviceOf(payment),
        t(`panel.payments.methods.${METHOD_KEYS[payment.method]}`),
        t(`panel.payments.kinds.${payment.kind}`),
        payment.amount,
      ]),
    ];
    downloadCsv(`${tenant.slug}-${month}-payments.csv`, toCsv(rows));
    toast.success(t("toast.saved"));
  }

  function issueInvoice(appointmentId: string) {
    const appointment = appointmentById(state, appointmentId);
    if (!appointment) return;

    const next = `FV ${TODAY.slice(0, 4)}/${TODAY.slice(5, 7)}/${`${invoices.length + 1}`.padStart(3, "0")}`;
    const existing = payments.find(
      (payment) => payment.appointmentId === appointmentId,
    );

    useKalendo.setState((current) => ({
      payments: existing
        ? current.payments.map((payment) =>
            payment.id === existing.id
              ? { ...payment, invoiceNumber: next }
              : payment,
          )
        : [
            ...current.payments,
            {
              id: makeId("pay"),
              tenantId: tenant.id,
              appointmentId,
              amount: appointment.total,
              method: "transfer" as const,
              at: NOW_ISO,
              kind: "full" as const,
              invoiceNumber: next,
            },
          ],
    }));

    setInvoicing(false);
    toast.success(`${t("panel.payments.invoice")} ${next}`);
  }

  const transactionColumns: DataColumn<PaymentRecord>[] = [
    {
      key: "at",
      header: t("common.date"),
      primary: true,
      sortValue: (row) => row.at,
      cell: (row) => (
        <span className="tabular whitespace-nowrap">
          {row.at.slice(0, 10)} · {timeOf(row.at)}
        </span>
      ),
    },
    {
      key: "client",
      header: t("common.client"),
      sortValue: (row) => nameOf(row),
      cell: (row) => <span className="truncate">{nameOf(row)}</span>,
    },
    {
      key: "service",
      header: t("common.service"),
      cell: (row) => (
        <span className="block max-w-[22ch] truncate text-muted lg:max-w-none">
          {serviceOf(row)}
        </span>
      ),
    },
    {
      key: "method",
      header: t("panel.payments.method"),
      sortValue: (row) => row.method,
      cell: (row) => {
        const Icon = METHOD_ICONS[row.method];
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Icon aria-hidden className="size-4 shrink-0 text-sand-500" />
            {t(`panel.payments.methods.${METHOD_KEYS[row.method]}`)}
          </span>
        );
      },
    },
    {
      key: "kind",
      header: t("common.status"),
      sortValue: (row) => row.kind,
      cell: (row) => (
        <Badge size="sm" tone={KIND_TONES[row.kind]}>
          {t(`panel.payments.kinds.${row.kind}`)}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: t("panel.payments.amount"),
      align: "right",
      trailing: true,
      sortValue: (row) => row.amount,
      cell: (row) => (
        <span
          className={cn(
            "tabular font-medium whitespace-nowrap",
            row.amount < 0 ? "text-danger" : "text-ink",
          )}
        >
          {money(row.amount, locale)}
        </span>
      ),
    },
  ];

  const invoiceColumns: DataColumn<PaymentRecord>[] = [
    {
      key: "number",
      header: t("panel.payments.invoiceNumber"),
      primary: true,
      sortValue: (row) => row.invoiceNumber ?? "",
      cell: (row) => <span className="tabular">{row.invoiceNumber}</span>,
    },
    {
      key: "at",
      header: t("common.date"),
      sortValue: (row) => row.at,
      cell: (row) => <span className="tabular">{row.at.slice(0, 10)}</span>,
    },
    {
      key: "client",
      header: t("common.client"),
      sortValue: (row) => nameOf(row),
      cell: (row) => nameOf(row),
    },
    {
      key: "amount",
      header: t("panel.payments.amount"),
      align: "right",
      trailing: true,
      sortValue: (row) => row.amount,
      cell: (row) => (
        <span className="tabular font-medium">{money(row.amount, locale)}</span>
      ),
    },
  ];

  const depositColumns: DataColumn<Appointment>[] = [
    {
      key: "start",
      header: t("common.date"),
      primary: true,
      sortValue: (row) => row.start,
      cell: (row) => (
        <span className="tabular whitespace-nowrap">
          {row.start.slice(0, 10)} · {timeOf(row.start)}
        </span>
      ),
    },
    {
      key: "client",
      header: t("common.client"),
      sortValue: (row) => clientById(state, row.clientId)?.name ?? "",
      cell: (row) => clientById(state, row.clientId)?.name ?? "—",
    },
    {
      key: "service",
      header: t("common.service"),
      cell: (row) => (
        <span className="text-muted">
          {row.serviceIds
            .map((id) => {
              const service = serviceById(state, id);
              return service ? tl(service.name) : "";
            })
            .filter(Boolean)
            .join(" + ")}
        </span>
      ),
    },
    {
      key: "total",
      header: t("common.total"),
      align: "right",
      sortValue: (row) => row.total,
      cell: (row) => (
        <span className="tabular text-muted">{money(row.total, locale)}</span>
      ),
    },
    {
      key: "deposit",
      header: t("panel.payments.kinds.deposit"),
      align: "right",
      trailing: true,
      sortValue: (row) => row.depositAmount ?? 0,
      cell: (row) => (
        <span className="tabular font-medium">
          {money(row.depositAmount ?? 0, locale)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <ModuleHeader
        title={
          <>
            {t("panel.payments.title")} <em>{t("panel.payments.andCash")}</em>
          </>
        }
        subtitle={t("panel.payments.subtitle", {
          count: payments.length,
          month: month,
        })}
        action={
          <>
            <Button
              variant="secondary"
              iconLeft={Download}
              onClick={exportCsv}
            >
              {t("panel.reports.export")}
            </Button>
            <Button iconLeft={FileText} onClick={() => setInvoicing(true)}>
              {t("panel.payments.issueInvoice")}
            </Button>
          </>
        }
      />

      <Card className="grid grid-cols-2 gap-5 p-5 lg:grid-cols-4 lg:gap-6">
        <Stat
          label={t("panel.payments.today")}
          value={money(todayTotal, locale)}
        />
        <Stat
          label={t("panel.reports.month")}
          value={money(monthTotal, locale)}
        />
        <Stat
          label={t("panel.payments.pendingDeposits")}
          value={money(depositTotal, locale)}
          hint={t("panel.payments.depositCount", {
            count: upcomingDeposits.length,
          })}
        />
        <Stat
          label={t("panel.payments.toSettle")}
          value={money(settleTotal, locale)}
          hint={t("panel.payments.settleCount", { count: toSettle.length })}
        />
      </Card>

      <Card>
        <CardHeader bordered className="[&>div]:w-full">
          <CardTitle as="h2">{t("panel.payments.title")}</CardTitle>
          <div className="no-scrollbar -mx-5 mt-3 overflow-x-auto px-5">
            <Segmented
              size="sm"
              value={tab}
              onChange={(next) => setTab(next as PaymentTab)}
              options={[
                {
                  value: "transactions",
                  label: t("panel.payments.transactions"),
                },
                { value: "invoices", label: t("panel.payments.invoices") },
                { value: "deposits", label: t("panel.payments.deposits") },
              ]}
            />
          </div>
        </CardHeader>

        <CardBody>
          {tab === "transactions" && (
            <DataTable
              rows={payments}
              rowKey={(row) => row.id}
              columns={transactionColumns}
              caption={t("panel.payments.transactions")}
              initialSort={{ key: "at", direction: "desc" }}
              emptyIcon={CreditCard}
              emptyTitle={t("panel.payments.empty")}
            />
          )}

          {tab === "invoices" && (
            <DataTable
              rows={invoices}
              rowKey={(row) => row.id}
              columns={invoiceColumns}
              caption={t("panel.payments.invoices")}
              initialSort={{ key: "at", direction: "desc" }}
              emptyIcon={FileText}
              emptyTitle={t("panel.payments.emptyInvoices")}
              emptyBody={t("panel.payments.emptyInvoicesBody")}
            />
          )}

          {tab === "deposits" && (
            <DataTable
              rows={upcomingDeposits}
              rowKey={(row) => row.id}
              columns={depositColumns}
              caption={t("panel.payments.deposits")}
              initialSort={{ key: "start", direction: "asc" }}
              emptyIcon={Coins}
              emptyTitle={t("panel.payments.emptyDeposits")}
            />
          )}
        </CardBody>
      </Card>

      {invoicing && (
        <InvoiceModal
          options={toSettleOptions(state, tenant.id, locale, (ids) =>
            ids
              .map((id) => {
                const service = serviceById(state, id);
                return service ? tl(service.name) : "";
              })
              .filter(Boolean)
              .join(" + "),
          )}
          onClose={() => setInvoicing(false)}
          onIssue={issueInvoice}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function toSettleOptions(
  state: ReturnType<typeof useDataState>,
  tenantId: string,
  locale: Locale,
  serviceNames: (ids: string[]) => string,
): { value: string; label: string }[] {
  return state.appointments
    .filter(
      (appointment) =>
        appointment.tenantId === tenantId &&
        COUNTING.includes(appointment.status),
    )
    .sort((a, b) => b.start.localeCompare(a.start))
    .slice(0, 40)
    .map((appointment) => {
      const client = clientById(state, appointment.clientId);
      return {
        value: appointment.id,
        label: `${appointment.start.slice(0, 10)} · ${client?.name ?? "—"} · ${serviceNames(
          appointment.serviceIds,
        )} · ${money(appointment.total, locale)}`,
      };
    });
}

interface InvoiceModalProps {
  options: { value: string; label: string }[];
  onClose: () => void;
  onIssue: (appointmentId: string) => void;
}

function InvoiceModal({ options, onClose, onIssue }: InvoiceModalProps) {
  const { t } = useI18n();
  const [appointmentId, setAppointmentId] = useState(options[0]?.value ?? "");
  const [taxId, setTaxId] = useState("");
  const [buyer, setBuyer] = useState("");

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="md"
      closeLabel={t("common.close")}
      title={t("panel.payments.issueInvoice")}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" block onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            block
            disabled={!appointmentId}
            onClick={() => onIssue(appointmentId)}
          >
            {t("panel.payments.issueInvoice")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t("panel.payments.selectVisit")} htmlFor="invoice-visit">
          <Select
            id="invoice-visit"
            options={options}
            value={appointmentId}
            onChange={(event) => setAppointmentId(event.target.value)}
          />
        </Field>
        <Field label={t("panel.payments.buyer")} htmlFor="invoice-buyer">
          <Input
            id="invoice-buyer"
            value={buyer}
            onChange={(event) => setBuyer(event.target.value)}
          />
        </Field>
        <Field
          label={t("panel.payments.taxId")}
          htmlFor="invoice-tax"
          hint={t("panel.payments.taxIdHint")}
        >
          <Input
            id="invoice-tax"
            inputMode="numeric"
            className="tabular"
            value={taxId}
            onChange={(event) => setTaxId(event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
