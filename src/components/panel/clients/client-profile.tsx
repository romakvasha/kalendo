"use client";

import type { ComponentType } from "react";
import { Cake, CalendarPlus, Mail, MessageSquare, Phone } from "lucide-react";

import { Avatar, Badge } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/types";

import { TAG_BADGES, lowerMonthYear, orderedTags, shortDate } from "./helpers";

export interface ClientProfileProps {
  client: Client;
  /** Display name of the client's preferred specialist, when they have one. */
  staffName?: string;
  onBook: () => void;
  /** Centred on the phone, left-aligned inside the desktop profile card. */
  align?: "center" | "start";
  className?: string;
}

export function ClientProfile({
  client,
  staffName,
  onBook,
  align = "center",
  className,
}: ClientProfileProps) {
  const { t, locale } = useI18n();

  const since = lowerMonthYear(client.since, locale);
  const sinceLine = staffName
    ? t("panel.clients.sinceLine", { month: since, staff: staffName })
    : t("panel.clients.sinceLineShort", { month: since });

  const tags = orderedTags(client).filter(
    (tag) => tag !== "birthday" && tag !== "new",
  );
  const centred = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        centred ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3",
          centred ? "items-center" : "items-start",
        )}
      >
        <Avatar name={client.name} size="xl" />

        <div className={centred ? "text-center" : "text-left"}>
          <h2 className="font-display text-[26px] leading-[1.12] text-ink lg:text-[28px]">
            {client.name}
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-muted">{sinceLine}</p>
        </div>
      </div>

      {(tags.length > 0 || client.birthday) && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            centred && "justify-center",
          )}
        >
          {tags.map((tag) => (
            <Badge
              key={tag}
              tone={TAG_BADGES[tag].tone}
              iconLeft={TAG_BADGES[tag].icon}
            >
              {t(TAG_BADGES[tag].key)}
            </Badge>
          ))}

          {client.birthday ? (
            <Badge tone="warn" iconLeft={Cake}>
              {t("panel.clients.birthdayOn", {
                date: shortDate(client.birthday, locale),
              })}
            </Badge>
          ) : null}
        </div>
      )}

      <div className="grid w-full grid-cols-4 gap-2">
        <ActionTile
          href={`tel:${client.phone.replace(/\s/g, "")}`}
          icon={Phone}
          label={t("panel.clients.call")}
        />
        <ActionTile
          href={`sms:${client.phone.replace(/\s/g, "")}`}
          icon={MessageSquare}
          label={t("panel.clients.sms")}
        />
        <ActionTile
          href={client.email ? `mailto:${client.email}` : undefined}
          icon={Mail}
          label={t("panel.clients.email")}
        />
        <ActionTile
          onClick={onBook}
          icon={CalendarPlus}
          label={t("panel.clients.book")}
          primary
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface ActionTileProps {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

function ActionTile({
  icon: Icon,
  label,
  href,
  onClick,
  primary = false,
}: ActionTileProps) {
  const shell = cn(
    "flex h-16 flex-col items-center justify-center gap-1.5 rounded-lg border px-1 text-[11px] font-medium",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25 focus-visible:ring-offset-1 focus-visible:ring-offset-paper",
    primary
      ? "border-transparent bg-ink text-paper shadow-xs hover:bg-sand-800"
      : "border-line bg-card text-sand-700 shadow-xs hover:border-line-strong hover:bg-sand-50",
  );

  const inner = (
    <>
      <Icon aria-hidden className="size-[18px]" />
      <span className="max-w-full truncate">{label}</span>
    </>
  );

  if (!href && !onClick) {
    return (
      <span
        aria-disabled
        className={cn(shell, "pointer-events-none opacity-45")}
      >
        {inner}
      </span>
    );
  }

  if (href) {
    return (
      <a href={href} className={shell}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={shell}>
      {inner}
    </button>
  );
}
