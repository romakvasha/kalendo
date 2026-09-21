"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronRight, Plus, Search, Users } from "lucide-react";

import { usePanelSession } from "@/components/layout";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  Chip,
  ChipRow,
  EmptyState,
  Input,
  Select,
  Skeleton,
} from "@/components/ui";
import { useDataState, useHydrated } from "@/lib/data";
import { money, number as formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn, range } from "@/lib/utils";
import type { Tenant } from "@/lib/types";

import { ClientFormDialog } from "./client-form-dialog";
import {
  CLIENT_FILTERS,
  CLIENT_SORTS,
  TAG_BADGES,
  clientRows,
  isClientSort,
  matchesFilter,
  matchesQuery,
  orderedTags,
  primaryTag,
  shortDate,
  sortRows,
  type ClientFilter,
  type ClientRow,
  type ClientSort,
} from "./helpers";

export function ClientsScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <ClientsSkeleton />;
  return <Clients tenant={tenant} />;
}

function Clients({ tenant }: { tenant: Tenant }) {
  const { t, locale } = useI18n();
  const state = useDataState();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ClientFilter>("all");
  const [sort, setSort] = useState<ClientSort>("name");
  const [formOpen, setFormOpen] = useState(false);

  const rows = useMemo(() => clientRows(state, tenant.id), [state, tenant.id]);
  const visible = useMemo(() => {
    const matched = rows.filter(
      (row) =>
        matchesFilter(row.client, filter) && matchesQuery(row.client, query),
    );
    return sortRows(matched, sort, locale);
  }, [rows, filter, query, sort, locale]);

  const narrowed = query.trim().length > 0 || filter !== "all";

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <h1 className="font-display text-[28px] leading-[1.08] text-ink sm:text-[32px] lg:text-[38px]">
          {t("panel.clients.title")}{" "}
          <span className="tabular text-[0.7em] text-muted">
            {formatNumber(visible.length, locale)}
          </span>
        </h1>

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 lg:w-96 lg:flex-none">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-sand-400"
            />
            <Input
              type="search"
              value={query}
              className="pl-10"
              aria-label={t("panel.clients.searchFull")}
              placeholder={t("panel.clients.searchFull")}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <Button
            className="shrink-0"
            iconLeft={Plus}
            aria-label={t("panel.clients.newClient")}
            onClick={() => setFormOpen(true)}
          >
            <span className="hidden sm:inline">
              {t("panel.clients.newClient")}
            </span>
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <ChipRow bleed className="sm:min-w-0 sm:flex-1">
          {CLIENT_FILTERS.map((key) => (
            <Chip
              key={key}
              active={filter === key}
              onClick={() => setFilter(key)}
            >
              {t(`panel.clients.filters.${key}`)}
            </Chip>
          ))}
        </ChipRow>

        {/* Select renders its own full-width wrapper, so the sizing lives here. */}
        <div className="w-full shrink-0 sm:w-56">
          <Select
            className="h-9 text-[13px]"
            aria-label={t("panel.clients.sort.label")}
            value={sort}
            onChange={(event) => {
              if (isClientSort(event.target.value)) setSort(event.target.value);
            }}
            options={CLIENT_SORTS.map((key) => ({
              value: key,
              label: t(`panel.clients.sort.${key}`),
            }))}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={t("panel.clients.empty")}
            body={
              narrowed
                ? t("panel.clients.noMatchesBody")
                : t("panel.clients.emptyBody")
            }
            action={
              narrowed ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  {t("common.clear")}
                </Button>
              ) : (
                <Button iconLeft={Plus} onClick={() => setFormOpen(true)}>
                  {t("panel.clients.addClient")}
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          <ClientList rows={visible} className="lg:hidden" />
          <Card className="hidden lg:block">
            <CardBody className="px-5 py-3">
              <ClientTable rows={visible} />
            </CardBody>
          </Card>
        </>
      )}

      {formOpen && (
        <ClientFormDialog
          tenantId={tenant.id}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile list                                                         */
/* ------------------------------------------------------------------ */

function ClientList({
  rows,
  className,
}: {
  rows: ClientRow[];
  className?: string;
}) {
  const { t, locale } = useI18n();

  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {rows.map(({ client, lastVisit }) => {
        const tag = primaryTag(client);
        return (
          <li key={client.id}>
            <Link
              href={`/panel/clients/${client.id}`}
              className={cn(
                "surface-flat flex items-center gap-3 p-3.5 transition-colors",
                "hover:border-line-strong hover:bg-sand-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25",
              )}
            >
              <Avatar name={client.name} size="md" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-ink">
                  {client.name}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-muted">
                  {lastVisit
                    ? t("panel.clients.rowMeta", {
                        date: shortDate(lastVisit, locale),
                        count: client.visitCount,
                      })
                    : t("panel.clients.since", {
                        date: shortDate(client.since, locale),
                      })}
                </p>
              </div>

              {tag ? (
                <Badge size="sm" tone={TAG_BADGES[tag].tone}>
                  {t(TAG_BADGES[tag].key)}
                </Badge>
              ) : null}

              <ChevronRight
                aria-hidden
                className="size-4 shrink-0 text-sand-400"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop table                                                       */
/* ------------------------------------------------------------------ */

function ClientTable({ rows }: { rows: ClientRow[] }) {
  const { t, locale } = useI18n();

  return (
    <table className="w-full border-collapse text-[14px]">
      <caption className="sr-only">{t("panel.clients.title")}</caption>
      <thead>
        <tr className="border-b border-line">
          <Th>{t("common.client")}</Th>
          <Th width="w-28">{t("panel.clients.lastVisit")}</Th>
          <Th width="w-16" align="right">
            {t("panel.clients.visits")}
          </Th>
          <Th width="w-28" align="right">
            {t("panel.clients.spent")}
          </Th>
          <Th width="w-24" align="right">
            {t("panel.clients.noShows")}
          </Th>
          <Th width="w-40">{t("panel.clients.tags")}</Th>
          <th scope="col" className="w-8 pb-2.5 pl-3">
            <span className="sr-only">{t("common.details")}</span>
          </th>
        </tr>
      </thead>

      <tbody>
        {rows.map(({ client, lastVisit }) => (
          <tr
            key={client.id}
            className="relative border-b border-line/70 transition-colors last:border-0 hover:bg-sand-50/70 focus-within:bg-sand-50/70"
          >
            <td className="py-3 pr-3">
              <div className="flex items-center gap-3">
                <Avatar name={client.name} size="sm" />
                <div className="min-w-0">
                  <Link
                    href={`/panel/clients/${client.id}`}
                    className="rounded-xs font-medium whitespace-nowrap text-ink after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25"
                  >
                    {client.name}
                  </Link>
                  <p className="tabular mt-0.5 text-[12px] whitespace-nowrap text-muted">
                    {client.phone}
                  </p>
                </div>
              </div>
            </td>

            <td className="py-3 pr-3 whitespace-nowrap text-muted">
              {lastVisit ? shortDate(lastVisit, locale) : "—"}
            </td>

            <td className="tabular py-3 pr-3 text-right text-ink">
              {formatNumber(client.visitCount, locale)}
            </td>

            <td className="tabular py-3 pr-3 text-right font-medium text-ink">
              {money(client.totalSpent, locale)}
            </td>

            <td
              className={cn(
                "tabular py-3 pr-3 text-right",
                client.noShows > 0
                  ? "font-medium text-danger"
                  : "text-sand-400",
              )}
            >
              {client.noShows > 0 ? formatNumber(client.noShows, locale) : "—"}
            </td>

            <td className="py-3 pr-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {orderedTags(client)
                  .slice(0, 2)
                  .map((tag) => (
                    <Badge key={tag} size="sm" tone={TAG_BADGES[tag].tone}>
                      {t(TAG_BADGES[tag].key)}
                    </Badge>
                  ))}
              </div>
            </td>

            <td className="py-3 text-right">
              <ChevronRight
                aria-hidden
                className="inline size-4 text-sand-400"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({
  children,
  align = "left",
  width,
}: {
  children: ReactNode;
  align?: "left" | "right";
  width?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "pb-2.5 pr-3 text-[12px] font-medium whitespace-nowrap text-muted",
        align === "right" ? "text-right" : "text-left",
        width,
      )}
    >
      {children}
    </th>
  );
}

/* ------------------------------------------------------------------ */

function ClientsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-11 w-full max-w-md" />
      </div>
      <Skeleton className="h-9 w-full max-w-lg rounded-full" />
      <Card>
        <CardBody className="flex flex-col gap-4">
          {range(7).map((index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
