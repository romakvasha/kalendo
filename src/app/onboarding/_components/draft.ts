import { SEED_STATE, servicesOf } from "@/lib/data";
import type { Localize } from "@/lib/i18n";
import type { Industry } from "@/lib/types";

export interface ServiceDraft {
  id: string;
  name: string;
  durationMin: number;
  price: number;
}

export interface HoursDraft {
  weekday: number;
  open: boolean;
  from: string;
  to: string;
}

export interface MemberDraft {
  id: string;
  name: string;
  role: string;
  owner: boolean;
}

export interface OnboardingDraft {
  companyName: string;
  city: string;
  address: string;
  phone: string;
  industry: Industry;
  slug: string;
  /** Once the link is edited by hand the company name stops driving it. */
  slugEdited: boolean;
  services: ServiceDraft[];
  hours: HoursDraft[];
}

const PL_LETTERS: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
};

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (letter) => PL_LETTERS[letter] ?? letter)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug || "twoja-firma";
}

/** The seeded company whose catalogue matches the industry the user picked. */
export function demoTenantId(industry: Industry): string {
  return (
    SEED_STATE.tenants.find((tenant) => tenant.industry === industry)?.id ??
    SEED_STATE.tenants[0].id
  );
}

export function seededServices(industry: Industry, tl: Localize): ServiceDraft[] {
  return servicesOf(SEED_STATE, demoTenantId(industry))
    .slice(0, 5)
    .map((service) => ({
      id: service.id,
      name: tl(service.name),
      durationMin: service.durationMin,
      price: service.price,
    }));
}

export function seededHours(industry: Industry): HoursDraft[] {
  const tenant = SEED_STATE.tenants.find(
    (item) => item.id === demoTenantId(industry),
  );
  return (tenant?.openingHours ?? []).map((day) => ({
    weekday: day.weekday,
    open: Boolean(day.open && day.close),
    from: day.open ?? "09:00",
    to: day.close ?? "17:00",
  }));
}

/** 06:00 … 22:00 in half-hour steps, for the opening-hours selects. */
export const TIME_OPTIONS: string[] = Array.from({ length: 33 }, (_, index) => {
  const minutes = 6 * 60 + index * 30;
  const hour = `${Math.floor(minutes / 60)}`.padStart(2, "0");
  return `${hour}:${minutes % 60 === 0 ? "00" : "30"}`;
});
