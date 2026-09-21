"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDownUp, ChevronDown, ChevronUp } from "lucide-react";

import {
  EmptyState,
  IconButton,
  Select,
  type IconLike,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface DataColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Present makes the column sortable. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  /** Becomes the heading of the stacked card below lg. */
  primary?: boolean;
  /** Sits opposite the heading on the stacked card (amounts, badges). */
  trailing?: boolean;
  /** Table-cell width, e.g. "w-28". */
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
  initialSort?: { key: string; direction: SortDirection };
  emptyTitle?: ReactNode;
  emptyBody?: ReactNode;
  emptyIcon?: IconLike;
  /** Trailing controls on the stacked card, e.g. a row action button. */
  rowAction?: (row: T) => ReactNode;
  className?: string;
}

function compare(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pl");
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  initialSort,
  emptyTitle,
  emptyBody,
  emptyIcon,
  rowAction,
  className,
}: DataTableProps<T>) {
  const { t } = useI18n();
  const [sortKey, setSortKey] = useState(initialSort?.key ?? "");
  const [direction, setDirection] = useState<SortDirection>(
    initialSort?.direction ?? "asc",
  );

  const sortable = columns.filter((column) => column.sortValue);
  const active = columns.find(
    (column) => column.key === sortKey && column.sortValue,
  );

  const sorted = useMemo(() => {
    if (!active?.sortValue) return rows;
    const read = active.sortValue;
    const factor = direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => compare(read(a), read(b)) * factor);
  }, [rows, active, direction]);

  function toggle(key: string) {
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection("asc");
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle ?? t("common.none")}
        body={emptyBody}
      />
    );
  }

  const primary = columns.find((column) => column.primary) ?? columns[0];
  const trailing = columns.find((column) => column.trailing);
  const rest = columns.filter(
    (column) => column !== primary && column !== trailing,
  );

  return (
    <div className={className}>
      {/* Mobile sort control */}
      {sortable.length > 0 && (
        <div className="mb-3 flex items-center gap-2 lg:hidden">
          <span className="shrink-0 text-[12px] text-muted">
            {t("panel.table.sortBy")}
          </span>
          <Select
            className="h-9 text-[13px]"
            aria-label={t("panel.table.sortBy")}
            value={active?.key ?? ""}
            onChange={(event) => toggle(event.target.value)}
            options={sortable.map((column) => ({
              value: column.key,
              label: column.header,
            }))}
            placeholder={t("common.select")}
          />
          <IconButton
            size="sm"
            variant="secondary"
            aria-label={
              direction === "asc"
                ? t("panel.table.sortAsc")
                : t("panel.table.sortDesc")
            }
            onClick={() =>
              setDirection((current) => (current === "asc" ? "desc" : "asc"))
            }
          >
            {active ? (
              direction === "asc" ? (
                <ChevronUp />
              ) : (
                <ChevronDown />
              )
            ) : (
              <ArrowDownUp />
            )}
          </IconButton>
        </div>
      )}

      {/* Stacked cards below lg */}
      <ul className="flex flex-col gap-2.5 lg:hidden">
        {sorted.map((row) => (
          <li key={rowKey(row)} className="surface-flat p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 text-[14px] font-medium text-ink">
                {primary.cell(row)}
              </div>
              {trailing ? (
                <div className="shrink-0 text-right text-[14px] font-medium text-ink">
                  {trailing.cell(row)}
                </div>
              ) : null}
            </div>

            {rest.length > 0 && (
              <dl className="mt-3 flex flex-col gap-1.5">
                {rest.map((column) => (
                  <div
                    key={column.key}
                    className="flex items-baseline justify-between gap-4 text-[13px]"
                  >
                    <dt className="shrink-0 text-muted">{column.header}</dt>
                    <dd className="min-w-0 text-right text-ink">
                      {column.cell(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {rowAction ? (
              <div className="mt-3 flex justify-end gap-2">{rowAction(row)}</div>
            ) : null}
          </li>
        ))}
      </ul>

      {/* Table from lg up */}
      <div className="hidden lg:block">
        <table className="w-full border-collapse text-[14px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line">
              {columns.map((column) => {
                const isActive = column.key === active?.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      isActive
                        ? direction === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={cn(
                      "pb-2.5 text-[12px] font-medium text-muted",
                      column.align === "right" ? "text-right" : "text-left",
                      column.width,
                    )}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggle(column.key)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-xs transition-colors hover:text-ink",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25",
                          isActive && "text-ink",
                        )}
                      >
                        {column.header}
                        {isActive ? (
                          direction === "asc" ? (
                            <ChevronUp aria-hidden className="size-3.5" />
                          ) : (
                            <ChevronDown aria-hidden className="size-3.5" />
                          )
                        ) : (
                          <ArrowDownUp
                            aria-hidden
                            className="size-3 opacity-40"
                          />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {rowAction ? (
                <th scope="col" className="w-12 pb-2.5">
                  <span className="sr-only">{t("a11y.more")}</span>
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {sorted.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-line/70 last:border-0 hover:bg-sand-50/60"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "py-3 align-middle text-ink",
                      column.align === "right" ? "text-right" : "text-left",
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {rowAction ? (
                  <td className="py-3 text-right">{rowAction(row)}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
