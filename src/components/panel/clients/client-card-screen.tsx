"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Ellipsis } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardBody,
  IconButton,
  Skeleton,
  Tabs,
  type TabItem,
} from "@/components/ui";
import { clientById, staffById, useDataState, useHydrated } from "@/lib/data";
import { money, number as formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn, range } from "@/lib/utils";
import type { Client } from "@/lib/types";

import { BookVisitDialog } from "./book-visit-dialog";
import { ClientActionsSheet } from "./client-actions-sheet";
import { ClientConsents, ConsentsSummary } from "./client-consents";
import { ClientFormDialog } from "./client-form-dialog";
import { ClientHistory } from "./client-history";
import { ClientOverview, StatTile } from "./client-overview";
import { ClientPhotos } from "./client-photos";
import { ClientProfile } from "./client-profile";
import { buildClientExport, downloadJson, visitsOf } from "./helpers";

type TabKey = "overview" | "history" | "photos" | "consents";

export interface ClientCardScreenProps {
  clientId: string;
}

export function ClientCardScreen({ clientId }: ClientCardScreenProps) {
  const hydrated = useHydrated();
  const state = useDataState();

  if (!hydrated) return <ClientCardSkeleton />;

  const client = clientById(state, clientId);
  if (!client) notFound();

  return <ClientCard client={client} />;
}

/* ------------------------------------------------------------------ */

interface BookSeed {
  serviceId?: string;
}

function ClientCard({ client }: { client: Client }) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();
  const router = useRouter();

  const [tab, setTab] = useState<TabKey>("overview");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bookSeed, setBookSeed] = useState<BookSeed | null>(null);

  const staffName = client.preferredStaffId
    ? staffById(state, client.preferredStaffId)?.name
    : undefined;

  const visitCount = useMemo(
    () => visitsOf(state, client.id).length,
    [state, client.id],
  );

  const tabs: TabItem[] = [
    { key: "overview", label: t("panel.clients.overview") },
    { key: "history", label: t("panel.clients.history"), count: visitCount },
    { key: "photos", label: t("panel.clients.photos"), count: client.photoCount },
    { key: "consents", label: t("panel.clients.consents") },
  ];

  function exportData() {
    downloadJson(
      `${client.name.replace(/\s+/g, "-").toLowerCase()}.json`,
      buildClientExport(
        state,
        client,
        (id) => {
          const service = state.services.find((item) => item.id === id);
          return service ? tl(service.name) : id;
        },
        (id) => staffById(state, id)?.name ?? id,
        (consent) => tl(consent.label),
      ),
    );
    toast.success(t("toast.exported"));
  }

  const profileProps = {
    client,
    staffName,
    onBook: () => setBookSeed({}),
  };

  const stats = (
    <div className="grid grid-cols-3 gap-2">
      <StatTile
        label={t("panel.clients.visits")}
        value={formatNumber(client.visitCount, locale)}
      />
      <StatTile
        label={t("panel.clients.spent")}
        value={money(client.totalSpent, locale)}
      />
      <StatTile
        label={t("panel.clients.noShows")}
        value={formatNumber(client.noShows, locale)}
        alarm={client.noShows > 0}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Mobile header */}
      <div className="flex items-center gap-2 lg:hidden">
        <Link
          href="/panel/clients"
          aria-label={t("a11y.back")}
          className={BACK_LINK}
        >
          <ArrowLeft aria-hidden className="size-[18px]" />
        </Link>

        <h1 className="min-w-0 flex-1 truncate text-center text-[15px] font-medium text-ink">
          {t("panel.clients.card")}
        </h1>

        <IconButton
          variant="secondary"
          aria-label={t("a11y.more")}
          onClick={() => setActionsOpen(true)}
        >
          <Ellipsis />
        </IconButton>
      </div>

      {/* Desktop header */}
      <div className="hidden items-center justify-between gap-4 lg:flex">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/panel/clients"
            className="inline-flex items-center gap-1.5 rounded-xs text-[13px] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {t("panel.clients.title")}
          </Link>

          <span aria-hidden className="h-4 w-px bg-line" />

          <h1 className="truncate text-[14px] font-medium text-ink">
            {t("panel.clients.card")}
          </h1>
        </div>

        <IconButton
          variant="secondary"
          aria-label={t("a11y.more")}
          onClick={() => setActionsOpen(true)}
        >
          <Ellipsis />
        </IconButton>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <ClientProfile {...profileProps} align="center" className="lg:hidden" />

        <aside className="hidden lg:block">
          <div className="sticky top-6 flex flex-col gap-4">
            <Card>
              <CardBody className="flex flex-col gap-5">
                <ClientProfile {...profileProps} align="start" />
                {stats}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <ConsentsSummary
                  client={client}
                  onOpen={() => setTab("consents")}
                />
              </CardBody>
            </Card>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <Tabs
            tabs={tabs}
            value={tab}
            onChange={(key) => setTab(key as TabKey)}
          />

          {tab === "overview" && (
            <ClientOverview
              client={client}
              onBook={() => setBookSeed({})}
              onShowHistory={() => setTab("history")}
              onEditNotes={() => setEditOpen(true)}
            />
          )}

          {tab === "history" && (
            <ClientHistory
              client={client}
              onBookAgain={(serviceId) => setBookSeed({ serviceId })}
            />
          )}

          {tab === "photos" && <ClientPhotos client={client} />}

          {tab === "consents" && <ClientConsents client={client} />}
        </div>
      </div>

      <ClientActionsSheet
        client={client}
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        onEdit={() => setEditOpen(true)}
        onExport={exportData}
        onDeleted={() => router.push("/panel/clients")}
      />

      {editOpen && (
        <ClientFormDialog
          tenantId={client.tenantId}
          client={client}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      {bookSeed && (
        <BookVisitDialog
          key={bookSeed.serviceId ?? "new"}
          tenantId={client.tenantId}
          client={client}
          serviceId={bookSeed.serviceId}
          open
          onOpenChange={(next) => {
            if (!next) setBookSeed(null);
          }}
        />
      )}
    </div>
  );
}

const BACK_LINK = cn(
  "inline-grid size-11 shrink-0 place-items-center rounded-md border border-line bg-white text-ink shadow-xs",
  "transition-colors duration-150 hover:border-line-strong hover:bg-sand-50",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25 focus-visible:ring-offset-1 focus-visible:ring-offset-paper",
);

/* ------------------------------------------------------------------ */

function ClientCardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="size-11 rounded-md" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="size-11 rounded-md" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-56" />
      </div>

      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-9 w-full max-w-sm" />

      <div className="grid grid-cols-3 gap-2.5">
        {range(3).map((index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
    </div>
  );
}
