/**
 * Kalendo domain model.
 *
 * Every date/time is an ISO-8601 string in local wall-clock form
 * ("2026-09-24T10:30:00") so the demo data stays timezone-stable.
 * Money is an integer number of minor units is NOT used — prices are
 * plain numbers of złoty, matching how the UI renders them.
 */

export type Locale = "pl" | "en" | "uk";

export const LOCALES: Locale[] = ["pl", "en", "uk"];

/** Text that exists in all three shipped languages. */
export type LocalizedText = Record<Locale, string>;

/* ------------------------------------------------------------------ */
/* Tenant (a company that bought Kalendo)                              */
/* ------------------------------------------------------------------ */

export type Industry =
  | "hair"
  | "beauty"
  | "physio"
  | "dental"
  | "auto"
  | "other";

/** Brand preset — drives --brand CSS variables. */
export type BrandKey = "cobalt" | "green" | "orange" | "violet" | "rose";

export interface BrandTheme {
  key: BrandKey;
  /** Solid brand colour, e.g. buttons. */
  base: string;
  /** Tinted background, e.g. selected rows. */
  soft: string;
  /** Text/icon colour on top of `base`. */
  fg: string;
  /** Darker shade for text on top of `soft`. */
  ink: string;
  /** The same four roles on a dark background. */
  baseDark: string;
  softDark: string;
  fgDark: string;
  inkDark: string;
}

export type TenantFeature =
  | "online-payment"
  | "video"
  | "invoices"
  | "vouchers"
  | "loyalty"
  | "waitlist"
  | "group-classes"
  | "products";

export type PlanKey = "start" | "pro" | "max";

export interface OpeningHours {
  /** 1 = Monday … 7 = Sunday */
  weekday: number;
  /** "08:00" — null when closed that day. */
  open: string | null;
  close: string | null;
}

/** A booking-form field that differs per industry (e.g. car plate). */
export interface CustomField {
  id: string;
  label: LocalizedText;
  type: "text" | "select" | "number";
  required: boolean;
  placeholder?: string;
  options?: string[];
  /** Renders side-by-side with the next field on desktop. */
  half?: boolean;
}

export interface TenantLocation {
  id: string;
  name: string;
  address: string;
  city: string;
}

/** Treatment rooms / bays / chairs. */
export interface Room {
  id: string;
  tenantId: string;
  name: LocalizedText;
  locationId: string;
}

export interface DepositPolicy {
  enabled: boolean;
  /** Fixed amount in zł, or percent of the service price. */
  mode: "fixed" | "percent";
  value: number;
}

export interface Tenant {
  id: string;
  /** Sub-domain: `${slug}.kalendo.pl` and the in-app route /b/${slug}. */
  slug: string;
  name: string;
  industry: Industry;
  brand: BrandKey;
  plan: PlanKey;
  tagline: LocalizedText;
  about: LocalizedText;
  city: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  /** Approximate distance shown to the client, in km. */
  distanceKm?: number;
  openingHours: OpeningHours[];
  features: TenantFeature[];
  locations: TenantLocation[];
  /** Extra booking-form fields for this industry. */
  customFields: CustomField[];
  deposit: DepositPolicy;
  /** Free cancellation window, in hours. */
  cancellationHours: number;
  /** Number of decorative gallery slots on the public page. */
  photoCount: number;
  /** Owner's display name, used in panel greetings. */
  ownerName: string;
  /** Loyalty programme, when the tenant runs one. */
  loyalty?: {
    pointsPerVisit: number;
    rewardAt: number;
    rewardLabel: LocalizedText;
  };
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export type ServiceColor =
  | "peach"
  | "rose"
  | "violet"
  | "sky"
  | "mint"
  | "sand";

export interface ServiceCategory {
  id: string;
  tenantId: string;
  name: LocalizedText;
}

export interface Service {
  id: string;
  tenantId: string;
  categoryId: string;
  name: LocalizedText;
  description?: LocalizedText;
  durationMin: number;
  price: number;
  /** Renders as "od 250 zł" — price is a starting point. */
  priceFrom?: boolean;
  color: ServiceColor;
  /** Staff able to perform it. Empty = everybody. */
  staffIds: string[];
  /** Delivered over video rather than on site. */
  online?: boolean;
  /** Group class: total seats and seats already taken. */
  group?: { capacity: number; taken: number };
  /** Overrides the tenant deposit for this service. */
  depositAmount?: number;
  /** Frequently-added extras offered at checkout. */
  addonIds?: string[];
  /** Highlighted in the catalogue. */
  popular?: boolean;
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export interface Staff {
  id: string;
  tenantId: string;
  name: string;
  initials: string;
  role: LocalizedText;
  rating: number;
  /** Tailwind-free hex used for the avatar chip. */
  avatarColor: string;
  /** Booked hours / available hours today, as a 0–100 percentage. */
  utilization: number;
  /** "6,5 / 8 h" style workload label is derived from these. */
  bookedHoursToday: number;
  availableHoursToday: number;
  locationId: string;
  isOwner?: boolean;
}

export type ClientTag =
  | "regular"
  | "new"
  | "birthday"
  | "vip"
  | "no-show-risk";

export interface RodoConsent {
  id: string;
  label: LocalizedText;
  granted: boolean;
  grantedAt?: string;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  initials: string;
  phone: string;
  email?: string;
  /** ISO date the client first booked. */
  since: string;
  tags: ClientTag[];
  /** Preferred specialist. */
  preferredStaffId?: string;
  visitCount: number;
  totalSpent: number;
  noShows: number;
  birthday?: string;
  /** Free-text treatment notes (colour formulas, allergies…). */
  notes?: LocalizedText;
  /** Rendered with a warning icon on the client card. */
  alert?: LocalizedText;
  consents: RodoConsent[];
  photoCount: number;
  loyaltyPoints?: number;
}

/* ------------------------------------------------------------------ */
/* Appointments                                                        */
/* ------------------------------------------------------------------ */

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "done"
  | "cancelled"
  | "no-show";

export type PaymentStatus = "unpaid" | "deposit" | "paid";

export type BookingSource =
  | "app"
  | "site"
  | "google"
  | "instagram"
  | "phone"
  | "walk-in";

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string;
  staffId: string;
  serviceIds: string[];
  roomId?: string;
  /** Local wall-clock ISO, e.g. "2026-09-24T10:30:00". */
  start: string;
  end: string;
  status: AppointmentStatus;
  payment: PaymentStatus;
  depositAmount?: number;
  total: number;
  source: BookingSource;
  note?: string;
  smsReminderSent?: boolean;
  isFirstVisit?: boolean;
  /** Answers to the tenant's custom booking fields. */
  customFields?: Record<string, string>;
  /** Paid from a multi-visit pass instead of cash. */
  membershipId?: string;
}

/** Non-bookable blocks on the calendar: breaks, holidays, training. */
export type BlockKind = "break" | "absence" | "training" | "holiday";

export interface CalendarBlock {
  id: string;
  tenantId: string;
  staffId: string;
  start: string;
  end: string;
  kind: BlockKind;
  label: LocalizedText;
}

/** A client who wants a slot that is currently full. */
export interface WaitlistEntry {
  id: string;
  tenantId: string;
  clientId: string;
  serviceId: string;
  /** ISO date they are hoping for. */
  preferredDate: string;
  note?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Commerce                                                            */
/* ------------------------------------------------------------------ */

export interface Review {
  id: string;
  tenantId: string;
  clientName: string;
  staffId?: string;
  rating: number;
  text: LocalizedText;
  /** ISO date. */
  date: string;
  reply?: LocalizedText;
}

export interface Voucher {
  id: string;
  tenantId: string;
  code: string;
  /** Gift card value, or discount percentage. */
  kind: "gift" | "discount";
  value: number;
  validUntil: string;
  usedAt?: string;
  buyerName?: string;
}

/** Karnet — a prepaid block of visits. */
export interface Membership {
  id: string;
  tenantId: string;
  clientId: string;
  name: LocalizedText;
  total: number;
  used: number;
  validUntil: string;
  price: number;
}

export interface Product {
  id: string;
  tenantId: string;
  name: LocalizedText;
  sku: string;
  stock: number;
  lowStockAt: number;
  price: number;
}

export interface PaymentRecord {
  id: string;
  tenantId: string;
  appointmentId?: string;
  amount: number;
  method: "cash" | "card" | "blik" | "apple-pay" | "google-pay" | "transfer";
  /** ISO datetime. */
  at: string;
  kind: "deposit" | "full" | "refund" | "product" | "voucher";
  invoiceNumber?: string;
}

/* ------------------------------------------------------------------ */
/* Insights                                                            */
/* ------------------------------------------------------------------ */

export interface DailyMetric {
  /** ISO date, "2026-09-21". */
  date: string;
  revenue: number;
  appointments: number;
  /** 0–100. */
  utilization: number;
  newClients: number;
}

export interface SourceBreakdown {
  source: BookingSource | "widget";
  /** 0–100 share of bookings. */
  share: number;
}

/** A suggestion surfaced by the built-in assistant. */
export interface AiSuggestion {
  id: string;
  tenantId: string;
  kind: "fill-gaps" | "reactivate" | "pricing" | "reminder" | "review";
  title: LocalizedText;
  body: LocalizedText;
  /** Label of the primary action button. */
  cta: LocalizedText;
  /** Label of the dismissive secondary action. */
  secondaryCta?: LocalizedText;
}

/* ------------------------------------------------------------------ */
/* Accounts & session                                                  */
/* ------------------------------------------------------------------ */

export type AccountKind = "client" | "company";

export interface Account {
  id: string;
  kind: AccountKind;
  name: string;
  initials: string;
  email?: string;
  phone?: string;
  /** Set when kind === "company". */
  tenantId?: string;
  /** Client's home city, used by the discovery feed. */
  city?: string;
  locale: Locale;
}

/** A booking made by a client, across tenants (client-side "Moje wizyty"). */
export interface ClientBooking {
  appointmentId: string;
  tenantId: string;
}

/* ------------------------------------------------------------------ */
/* Booking flow                                                        */
/* ------------------------------------------------------------------ */

export type BookingStep = "service" | "staff" | "time" | "details" | "done";

export interface BookingDraft {
  tenantId: string;
  serviceIds: string[];
  /** null = "any available specialist". */
  staffId: string | null;
  date: string | null;
  time: string | null;
  customFields: Record<string, string>;
  contact: { name: string; phone: string; email: string };
  /** Pay a deposit now, or the whole amount. */
  paymentChoice: "deposit" | "full" | "on-site";
  paymentMethod?: PaymentRecord["method"];
  voucherCode?: string;
  marketingConsent: boolean;
  termsAccepted: boolean;
  createAccount: boolean;
}

/** A bookable slot produced by the availability engine. */
export interface TimeSlot {
  /** "10:30" */
  time: string;
  available: boolean;
  staffId?: string;
  /** Few slots left around this time — rendered as "ostatnie". */
  scarce?: boolean;
}

/* ------------------------------------------------------------------ */
/* Panel navigation                                                    */
/* ------------------------------------------------------------------ */

export type PanelModuleKey =
  | "dashboard"
  | "calendar"
  | "bookings"
  | "clients"
  | "services"
  | "team"
  | "rooms"
  | "payments"
  | "vouchers"
  | "inventory"
  | "marketing"
  | "reviews"
  | "reports"
  | "ai"
  | "settings";

export interface PanelModule {
  key: PanelModuleKey;
  href: string;
  /** i18n key under `nav.` */
  labelKey: string;
  /** lucide-react icon name. */
  icon: string;
  group: "booking" | "sales" | "growth" | "system";
  badge?: number;
  isNew?: boolean;
}
