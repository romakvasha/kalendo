"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Package, PackagePlus, TriangleAlert } from "lucide-react";

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
  Select,
  Stat,
} from "@/components/ui";
import {
  lowStockProducts,
  productsOf,
  useDataState,
  useHydrated,
  useKalendo,
} from "@/lib/data";
import { money, number as formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Product, Tenant } from "@/lib/types";
import { cn, sum } from "@/lib/utils";

import { DataTable, type DataColumn } from "./data-table";
import { ModuleHeader } from "./module-header";
import { ModuleSkeleton } from "./module-skeleton";

/* ------------------------------------------------------------------ */

export function InventoryScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <ModuleSkeleton rows={5} />;
  return <Inventory tenant={tenant} />;
}

/* ------------------------------------------------------------------ */

function Inventory({ tenant }: { tenant: Tenant }) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();

  const products = useMemo(
    () => productsOf(state, tenant.id),
    [state, tenant.id],
  );
  const low = useMemo(
    () => lowStockProducts(state, tenant.id),
    [state, tenant.id],
  );
  const totalValue = sum(products.map((p) => p.stock * p.price));

  const [receiving, setReceiving] = useState<Product | null>(null);

  function changeStock(productId: string, delta: number) {
    useKalendo.setState((current) => ({
      products: current.products.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(0, product.stock + delta) }
          : product,
      ),
    }));
  }

  function receive(product: Product, quantity: number) {
    changeStock(product.id, quantity);
    setReceiving(null);
    toast.success(
      t("panel.inventory.received", {
        count: quantity,
        name: tl(product.name),
      }),
    );
  }

  function issue(product: Product) {
    if (product.stock <= 0) return;
    changeStock(product.id, -1);
    toast.success(t("panel.inventory.issued", { name: tl(product.name) }));
  }

  const columns: DataColumn<Product>[] = [
    {
      key: "name",
      header: t("panel.inventory.product"),
      primary: true,
      sortValue: (row) => tl(row.name),
      cell: (row) => (
        <span className="block min-w-0 truncate font-medium">
          {tl(row.name)}
        </span>
      ),
    },
    {
      key: "sku",
      header: t("panel.inventory.sku"),
      sortValue: (row) => row.sku,
      cell: (row) => (
        <span className="tabular text-muted">{row.sku}</span>
      ),
    },
    {
      key: "stock",
      header: t("panel.inventory.stock"),
      sortValue: (row) => row.stock,
      cell: (row) => {
        const short = row.stock <= row.lowStockAt;
        return (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span
              className={cn(
                "tabular font-medium",
                short ? "text-danger" : "text-ink",
              )}
            >
              {row.stock} {t("panel.inventory.unit")}
            </span>
            {short && (
              <Badge size="sm" tone="danger">
                {row.stock === 0
                  ? t("panel.inventory.outOfStock")
                  : t("panel.inventory.lowStock")}
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      key: "price",
      header: t("panel.inventory.price"),
      align: "right",
      sortValue: (row) => row.price,
      cell: (row) => (
        <span className="tabular text-muted">{money(row.price, locale)}</span>
      ),
    },
    {
      key: "value",
      header: t("panel.inventory.value"),
      align: "right",
      trailing: true,
      sortValue: (row) => row.stock * row.price,
      cell: (row) => (
        <span className="tabular font-medium">
          {money(row.stock * row.price, locale)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <ModuleHeader
        title={
          <>
            {t("panel.inventory.title")}{" "}
            <em>{t("panel.inventory.andSupply")}</em>
          </>
        }
        subtitle={t("panel.inventory.subtitle", {
          count: products.length,
          value: money(totalValue, locale),
        })}
        action={
          <Button
            iconLeft={PackagePlus}
            disabled={products.length === 0}
            onClick={() => setReceiving(low[0] ?? products[0] ?? null)}
          >
            {t("panel.inventory.receive")}
          </Button>
        }
      />

      {low.length > 0 && (
        <Card className="border-danger/25 bg-danger-soft/50">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <span
              aria-hidden
              className="inline-grid size-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger"
            >
              <TriangleAlert className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-ink">
                {t("panel.inventory.lowStockTitle", { count: low.length })}
              </p>
              <p className="mt-0.5 text-[13px] leading-5 text-muted">
                {low
                  .slice(0, 3)
                  .map((product) => tl(product.name))
                  .join(" · ")}
                {low.length > 3 ? ` · +${low.length - 3}` : ""}
              </p>
            </div>
            <Button
              variant="secondary"
              className="shrink-0"
              onClick={() => setReceiving(low[0])}
            >
              {t("panel.inventory.orderRefill")}
            </Button>
          </CardBody>
        </Card>
      )}

      <Card className="grid grid-cols-2 gap-5 p-5 lg:grid-cols-3 lg:gap-6">
        <Stat
          label={t("panel.inventory.items")}
          value={formatNumber(products.length, locale)}
          hint={t("panel.inventory.unitsHint", {
            count: sum(products.map((p) => p.stock)),
          })}
        />
        <Stat
          label={t("panel.inventory.totalValue")}
          value={money(totalValue, locale)}
        />
        <Stat
          label={t("panel.inventory.lowStock")}
          value={formatNumber(low.length, locale)}
          hint={low.length > 0 ? t("panel.inventory.refillHint") : undefined}
        />
      </Card>

      <Card>
        <CardHeader bordered>
          <CardTitle as="h2" hint={t("panel.inventory.tableHint")}>
            {t("panel.inventory.products")}
          </CardTitle>
        </CardHeader>
        <CardBody>
          <DataTable
            rows={products}
            rowKey={(row) => row.id}
            columns={columns}
            caption={t("panel.inventory.products")}
            initialSort={{ key: "stock", direction: "asc" }}
            emptyIcon={Package}
            emptyTitle={t("panel.inventory.empty")}
            emptyBody={t("panel.inventory.emptyBody")}
            rowAction={(row) => (
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={row.stock <= 0}
                  onClick={() => issue(row)}
                >
                  {t("panel.inventory.issue")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setReceiving(row)}
                >
                  {t("common.add")}
                </Button>
              </div>
            )}
          />
        </CardBody>
      </Card>

      {receiving && (
        <ReceiveModal
          product={receiving}
          options={products.map((product) => ({
            value: product.id,
            label: `${tl(product.name)} · ${product.sku}`,
          }))}
          onSelect={(id) =>
            setReceiving(products.find((p) => p.id === id) ?? receiving)
          }
          onClose={() => setReceiving(null)}
          onReceive={receive}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface ReceiveModalProps {
  product: Product;
  options: { value: string; label: string }[];
  onSelect: (id: string) => void;
  onClose: () => void;
  onReceive: (product: Product, quantity: number) => void;
}

function ReceiveModal({
  product,
  options,
  onSelect,
  onClose,
  onReceive,
}: ReceiveModalProps) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState("10");

  const parsed = Number(quantity);
  const invalid = !Number.isFinite(parsed) || parsed <= 0;

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="sm"
      closeLabel={t("common.close")}
      title={t("panel.inventory.receive")}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" block onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            block
            disabled={invalid}
            onClick={() => onReceive(product, Math.round(parsed))}
          >
            {t("common.confirm")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t("panel.inventory.product")} htmlFor="receive-product">
          <Select
            id="receive-product"
            options={options}
            value={product.id}
            onChange={(event) => onSelect(event.target.value)}
          />
        </Field>

        <Field
          label={t("panel.inventory.quantity")}
          htmlFor="receive-quantity"
          hint={t("panel.inventory.stockNow", { count: product.stock })}
        >
          <Input
            id="receive-quantity"
            type="number"
            min={1}
            step={1}
            className="tabular"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </Field>

        <p className="surface-flat p-3 text-[13px] text-muted">
          {t("panel.inventory.afterDelivery", {
            count: invalid ? product.stock : product.stock + Math.round(parsed),
          })}
        </p>
      </div>
    </Modal>
  );
}
