"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

import {
  Card,
  EmptyState,
  IconButton,
  Modal,
  PhotoPlaceholder,
} from "@/components/ui";
import { useDataState } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { range } from "@/lib/utils";
import type { Client, Locale } from "@/lib/types";

import { fullDate, pastVisitsOf, shortDate } from "./helpers";

interface Shot {
  id: string;
  kind: "before" | "after";
  date: string;
}

export interface ClientPhotosProps {
  client: Client;
}

export function ClientPhotos({ client }: ClientPhotosProps) {
  const { t, locale } = useI18n();
  const state = useDataState();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const past = useMemo(
    () => pastVisitsOf(state, client.id),
    [state, client.id],
  );

  const shots = useMemo<Shot[]>(
    () =>
      range(client.photoCount).map((index) => ({
        id: `${client.id}-${index}`,
        kind: index % 2 === 0 ? "before" : "after",
        date: past[Math.floor(index / 2)]?.start ?? client.since,
      })),
    [client.photoCount, client.id, client.since, past],
  );

  if (shots.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={ImageIcon}
          title={t("panel.clients.noPhotos")}
          body={t("panel.clients.noPhotosBody")}
        />
      </Card>
    );
  }

  const active = openIndex === null ? null : shots[openIndex];

  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {shots.map((shot, index) => (
          <li key={shot.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={captionOf(shot, locale, t)}
              className="block w-full rounded-xl transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <PhotoPlaceholder
                tone={shot.kind === "after" ? "brand" : "neutral"}
                label={`${t(`panel.clients.${shot.kind}`)} · ${shortDate(shot.date, locale)}`}
                className="aspect-[3/4]"
              />
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <Modal
          open
          onOpenChange={() => setOpenIndex(null)}
          size="md"
          title={captionOf(active, locale, t)}
          closeLabel={t("common.close")}
          footer={
            <div className="flex items-center justify-between">
              <IconButton
                variant="secondary"
                aria-label={t("a11y.prevPhoto")}
                disabled={openIndex === 0}
                onClick={() =>
                  setOpenIndex((current) =>
                    current === null ? null : Math.max(0, current - 1),
                  )
                }
              >
                <ChevronLeft />
              </IconButton>

              <span className="tabular text-[13px] text-muted">
                {`${(openIndex ?? 0) + 1} ${t("common.of")} ${shots.length}`}
              </span>

              <IconButton
                variant="secondary"
                aria-label={t("a11y.nextPhoto")}
                disabled={openIndex === shots.length - 1}
                onClick={() =>
                  setOpenIndex((current) =>
                    current === null
                      ? null
                      : Math.min(shots.length - 1, current + 1),
                  )
                }
              >
                <ChevronRight />
              </IconButton>
            </div>
          }
        >
          <PhotoPlaceholder
            tone={active.kind === "after" ? "brand" : "neutral"}
            label={t(`panel.clients.${active.kind}`)}
            className="aspect-[3/4] w-full"
          />
        </Modal>
      ) : null}
    </>
  );
}

function captionOf(
  shot: Shot,
  locale: Locale,
  t: (key: string) => string,
): string {
  return `${t(`panel.clients.${shot.kind}`)} · ${fullDate(shot.date, locale)}`;
}
