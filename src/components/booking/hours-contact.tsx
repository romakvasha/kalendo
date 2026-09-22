"use client";

import { Mail, MapPin, Phone } from "lucide-react";

import { PhotoPlaceholder } from "@/components/ui";
import { TODAY, weekdayOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { mapsUrl, weekdayLong } from "./helpers";

export interface HoursAndContactProps {
  tenant: Tenant;
  className?: string;
}

export function HoursAndContact({ tenant, className }: HoursAndContactProps) {
  const { t, locale } = useI18n();
  const today = weekdayOf(TODAY);

  return (
    <section id="contact" className={cn("scroll-mt-24", className)}>
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div>
          <h2 className="font-display text-[26px] leading-8 text-ink lg:text-[32px]">
            {t("company.openingHours")}
          </h2>
          <dl className="mt-4 overflow-hidden rounded-xl border border-line bg-card">
            {tenant.openingHours.map((entry) => {
              const isToday = entry.weekday === today;
              return (
                <div
                  key={entry.weekday}
                  className={cn(
                    "flex items-center justify-between gap-4 border-b border-line px-4 py-2.5 text-[13.5px] last:border-b-0",
                    isToday && "bg-sand-50",
                  )}
                >
                  <dt
                    className={cn(
                      "capitalize",
                      isToday ? "font-medium text-ink" : "text-sand-700",
                    )}
                  >
                    {weekdayLong(entry.weekday, locale)}
                  </dt>
                  <dd
                    className={cn(
                      "tabular",
                      entry.open ? "text-ink" : "text-muted",
                    )}
                  >
                    {entry.open && entry.close
                      ? `${entry.open} – ${entry.close}`
                      : t("company.closed")}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        <div>
          <h2 className="font-display text-[26px] leading-8 text-ink lg:text-[32px]">
            {t("landing.footer.contact")}
          </h2>

          <div className="mt-4 flex flex-col gap-2">
            <ContactRow
              icon={<Phone aria-hidden strokeWidth={1.75} />}
              href={`tel:${tenant.phone.replace(/\s/g, "")}`}
              label={t("common.phone")}
              value={tenant.phone}
            />
            <ContactRow
              icon={<Mail aria-hidden strokeWidth={1.75} />}
              href={`mailto:${tenant.email}`}
              label={t("common.email")}
              value={tenant.email}
            />
            <ContactRow
              icon={<MapPin aria-hidden strokeWidth={1.75} />}
              href={mapsUrl(tenant)}
              external
              label={t("company.address")}
              value={`${tenant.address}, ${tenant.city}`}
            />
          </div>

          <a
            href={mapsUrl(tenant)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          >
            <PhotoPlaceholder
              tone="brand"
              label={`${tenant.address}, ${tenant.city}`}
              className="hatch aspect-[16/7] rounded-xl"
            />
          </a>
        </div>
      </div>
    </section>
  );
}

interface ContactRowProps {
  icon: React.ReactNode;
  href: string;
  external?: boolean;
  label: string;
  value: string;
}

function ContactRow({ icon, href, external, label, value }: ContactRowProps) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3 transition-colors hover:bg-sand-50"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-sand-100 text-sand-600 [&_svg]:size-[17px]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[11.5px] text-muted">{label}</span>
        <span className="block truncate text-[14px] font-medium text-ink">
          {value}
        </span>
      </span>
    </a>
  );
}
