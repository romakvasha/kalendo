"use client";

import { useMemo, useState } from "react";
import { Download, Merge, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";

import {
  Avatar,
  Button,
  EmptyState,
  Modal,
  Sheet,
} from "@/components/ui";
import { clientsOf, useDataState, useKalendo } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { cn, initialsOf } from "@/lib/utils";
import type { Client } from "@/lib/types";

import { normalizePhone } from "./helpers";

export interface ClientActionsSheetProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onExport: () => void;
  /** Fired once the card has been anonymised, so the caller can navigate away. */
  onDeleted: () => void;
}

export function ClientActionsSheet({
  client,
  open,
  onOpenChange,
  onEdit,
  onExport,
  onDeleted,
}: ClientActionsSheetProps) {
  const { t } = useI18n();
  const state = useDataState();
  const upsertClient = useKalendo((store) => store.upsertClient);

  const [mergeOpen, setMergeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const duplicates = useMemo(() => {
    const phone = normalizePhone(client.phone);
    const name = client.name.trim().toLocaleLowerCase();
    return clientsOf(state, client.tenantId).filter(
      (candidate) =>
        candidate.id !== client.id &&
        ((phone.length > 5 && normalizePhone(candidate.phone) === phone) ||
          candidate.name.trim().toLocaleLowerCase() === name),
    );
  }, [state, client]);

  /** RODO erasure keeps the booking history but strips every identifier. */
  function redact(target: Client): Client {
    const name = t("panel.clients.redactedName");
    return {
      ...target,
      name,
      initials: initialsOf(name),
      phone: "",
      email: undefined,
      birthday: undefined,
      notes: undefined,
      alert: undefined,
      tags: [],
      photoCount: 0,
      consents: target.consents.map((consent) => ({
        ...consent,
        granted: false,
        grantedAt: undefined,
      })),
    };
  }

  function merge(duplicate: Client) {
    upsertClient({
      ...client,
      visitCount: client.visitCount + duplicate.visitCount,
      totalSpent: client.totalSpent + duplicate.totalSpent,
      noShows: client.noShows + duplicate.noShows,
      photoCount: client.photoCount + duplicate.photoCount,
      loyaltyPoints:
        (client.loyaltyPoints ?? 0) + (duplicate.loyaltyPoints ?? 0) ||
        undefined,
      email: client.email ?? duplicate.email,
      birthday: client.birthday ?? duplicate.birthday,
      notes: client.notes ?? duplicate.notes,
      since:
        client.since < duplicate.since ? client.since : duplicate.since,
    });
    upsertClient(redact(duplicate));
    toast.success(t("toast.clientMerged"));
    setMergeOpen(false);
    onOpenChange(false);
  }

  function remove() {
    upsertClient(redact(client));
    toast.success(t("toast.clientDeleted"));
    setDeleteOpen(false);
    onOpenChange(false);
    onDeleted();
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title={t("a11y.more")}
        footer={
          <Button variant="secondary" block onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
        }
      >
        <ul className="flex flex-col">
          <ActionRow
            icon={<Pencil aria-hidden className="size-[18px]" />}
            label={t("common.edit")}
            onClick={() => {
              onOpenChange(false);
              onEdit();
            }}
          />
          <ActionRow
            icon={<Merge aria-hidden className="size-[18px]" />}
            label={t("panel.clients.merge")}
            onClick={() => setMergeOpen(true)}
          />
          <ActionRow
            icon={<Download aria-hidden className="size-[18px]" />}
            label={t("panel.clients.export")}
            onClick={() => {
              onOpenChange(false);
              onExport();
            }}
          />
          <ActionRow
            danger
            icon={<Trash aria-hidden className="size-[18px]" />}
            label={t("common.delete")}
            onClick={() => setDeleteOpen(true)}
          />
        </ul>
      </Sheet>

      <Modal
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        size="md"
        title={t("panel.clients.merge")}
        closeLabel={t("common.close")}
      >
        <p className="text-[13px] leading-5 text-muted">
          {t("panel.clients.mergeBody")}
        </p>

        {duplicates.length === 0 ? (
          <EmptyState compact title={t("panel.clients.noDuplicates")} />
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {duplicates.map((duplicate) => (
              <li
                key={duplicate.id}
                className="flex items-center gap-3 rounded-lg border border-line bg-white p-3"
              >
                <Avatar name={duplicate.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">
                    {duplicate.name}
                  </p>
                  <p className="tabular truncate text-[12px] text-muted">
                    {duplicate.phone || "—"}
                  </p>
                </div>
                <Button size="sm" onClick={() => merge(duplicate)}>
                  {t("panel.clients.mergeAction")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        size="sm"
        title={t("panel.clients.deleteTitle")}
        closeLabel={t("common.close")}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              block
              onClick={() => setDeleteOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="danger" block onClick={remove}>
              {t("common.delete")}
            </Button>
          </div>
        }
      >
        <p className="text-[14px] leading-5 text-muted">
          {t("panel.clients.deleteBody")}
        </p>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */

function ActionRow({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-1 py-3.5 text-left text-[15px] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25",
          danger
            ? "text-danger hover:bg-danger-soft"
            : "text-ink hover:bg-sand-100",
        )}
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-md",
            danger ? "bg-danger-soft text-danger" : "bg-sand-100 text-sand-600",
          )}
        >
          {icon}
        </span>
        {label}
      </button>
    </li>
  );
}
