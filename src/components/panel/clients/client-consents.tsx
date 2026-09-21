"use client";

import { Check, Download, X } from "lucide-react";
import { toast } from "sonner";

import { Badge, Button, Card, CardBody, Switch } from "@/components/ui";
import { staffById, useDataState, useKalendo } from "@/lib/data";
import { TODAY } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Client, RodoConsent } from "@/lib/types";

import { buildClientExport, downloadJson, shortDate } from "./helpers";

export interface ClientConsentsProps {
  client: Client;
}

export function ClientConsents({ client }: ClientConsentsProps) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();
  const upsertClient = useKalendo((store) => store.upsertClient);

  function toggle(consent: RodoConsent, granted: boolean) {
    upsertClient({
      ...client,
      consents: client.consents.map((item) =>
        item.id === consent.id
          ? {
              ...item,
              granted,
              grantedAt: granted ? (item.grantedAt ?? TODAY) : undefined,
            }
          : item,
      ),
    });
    toast.success(t("toast.saved"));
  }

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

  return (
    <Card>
      <CardBody className="flex flex-col gap-1 px-4 py-2 sm:px-5">
        <ul className="divide-y divide-line">
          {client.consents.map((consent) => (
            <li
              key={consent.id}
              className="flex items-start gap-3 py-3.5 first:pt-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] leading-5 text-ink">
                  {tl(consent.label)}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge
                    size="sm"
                    tone={consent.granted ? "success" : "neutral"}
                    iconLeft={consent.granted ? Check : X}
                  >
                    {t(
                      consent.granted
                        ? "panel.clients.granted"
                        : "panel.clients.withheld",
                    )}
                  </Badge>
                  {consent.granted && consent.grantedAt ? (
                    <span className="tabular text-[12px] text-muted">
                      {t("panel.clients.grantedAt", {
                        date: shortDate(consent.grantedAt, locale),
                      })}
                    </span>
                  ) : null}
                </div>
              </div>

              <Switch
                className="mt-1 shrink-0"
                checked={consent.granted}
                aria-label={tl(consent.label)}
                onCheckedChange={(next) => toggle(consent, next)}
              />
            </li>
          ))}
        </ul>

        <div className="border-t border-line pt-4 pb-3">
          <p className="text-[12px] leading-5 text-muted">
            {t("panel.clients.retentionNote")}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            iconLeft={Download}
            onClick={exportData}
          >
            {t("panel.clients.exportClient")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export interface ConsentsSummaryProps {
  client: Client;
  onOpen: () => void;
  className?: string;
}

/** The compact read-out that sits in the desktop profile column. */
export function ConsentsSummary({
  client,
  onOpen,
  className,
}: ConsentsSummaryProps) {
  const { t, tl } = useI18n();
  const granted = client.consents.filter((consent) => consent.granted).length;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-ink">
          {t("panel.clients.consents")}
        </h3>
        <span className="tabular text-[12px] text-muted">
          {`${granted} ${t("common.of")} ${client.consents.length}`}
        </span>
      </div>

      <ul className="flex flex-col gap-1.5">
        {client.consents.map((consent) => (
          <li
            key={consent.id}
            className="flex items-start gap-2 text-[12px] leading-4"
          >
            {consent.granted ? (
              <Check aria-hidden className="mt-px size-3.5 shrink-0 text-success" />
            ) : (
              <X aria-hidden className="mt-px size-3.5 shrink-0 text-sand-400" />
            )}
            <span
              className={cn(
                "min-w-0",
                consent.granted ? "text-sand-700" : "text-sand-500",
              )}
            >
              {tl(consent.label)}
            </span>
          </li>
        ))}
      </ul>

      <Button size="sm" variant="ghost" className="self-start" onClick={onOpen}>
        {t("panel.clients.manageConsents")}
      </Button>
    </div>
  );
}
