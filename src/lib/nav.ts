import {
  ArrowRight,
  BadgePercent,
  Bell,
  BookOpen,
  Bot,
  Boxes,
  Briefcase,
  Building,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Camera,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUser,
  ClipboardList,
  Clock,
  Contact,
  CreditCard,
  DoorOpen,
  Ellipsis,
  ExternalLink,
  Gift,
  Globe,
  House,
  IdCard,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  Package,
  Phone,
  Plus,
  Scissors,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Tag,
  Ticket,
  User,
  UserCog,
  Users,
  Wallet,
  WandSparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PanelModule } from "./types";

/* ------------------------------------------------------------------ */
/* Panel modules                                                       */
/* ------------------------------------------------------------------ */

export type PanelGroup = PanelModule["group"];

/** Render order of the sidebar groups. `booking` carries no heading. */
export const PANEL_GROUPS: PanelGroup[] = ["booking", "sales", "growth", "system"];

export const PANEL_MODULES: PanelModule[] = [
  {
    key: "dashboard",
    href: "/panel",
    labelKey: "nav.dashboard",
    icon: "LayoutDashboard",
    group: "booking",
  },
  {
    key: "calendar",
    href: "/panel/calendar",
    labelKey: "nav.calendar",
    icon: "CalendarDays",
    group: "booking",
  },
  {
    key: "bookings",
    href: "/panel/bookings",
    labelKey: "nav.bookings",
    icon: "CalendarCheck",
    group: "booking",
    badge: 3,
  },
  {
    key: "clients",
    href: "/panel/clients",
    labelKey: "nav.clients",
    icon: "Users",
    group: "booking",
  },
  {
    key: "services",
    href: "/panel/services",
    labelKey: "nav.services",
    icon: "Tag",
    group: "booking",
  },
  {
    key: "team",
    href: "/panel/team",
    labelKey: "nav.team",
    icon: "UserCog",
    group: "booking",
  },
  {
    key: "rooms",
    href: "/panel/rooms",
    labelKey: "nav.rooms",
    icon: "DoorOpen",
    group: "booking",
  },
  {
    key: "payments",
    href: "/panel/payments",
    labelKey: "nav.payments",
    icon: "CreditCard",
    group: "sales",
  },
  {
    key: "vouchers",
    href: "/panel/vouchers",
    labelKey: "nav.vouchers",
    icon: "Ticket",
    group: "sales",
  },
  {
    key: "inventory",
    href: "/panel/inventory",
    labelKey: "nav.inventory",
    icon: "Package",
    group: "sales",
  },
  {
    key: "marketing",
    href: "/panel/marketing",
    labelKey: "nav.marketing",
    icon: "Megaphone",
    group: "growth",
  },
  {
    key: "reviews",
    href: "/panel/reviews",
    labelKey: "nav.reviews",
    icon: "Star",
    group: "growth",
  },
  {
    key: "reports",
    href: "/panel/reports",
    labelKey: "nav.reports",
    icon: "ChartColumn",
    group: "growth",
  },
  {
    key: "ai",
    href: "/panel/ai",
    labelKey: "nav.ai",
    icon: "Sparkles",
    group: "growth",
    isNew: true,
  },
  {
    key: "settings",
    href: "/panel/settings",
    labelKey: "nav.settings",
    icon: "Settings",
    group: "system",
  },
];

export function panelModulesInGroup(group: PanelGroup): PanelModule[] {
  return PANEL_MODULES.filter((module) => module.group === group);
}

/* ------------------------------------------------------------------ */
/* Bottom tab bars                                                     */
/* ------------------------------------------------------------------ */

export type PanelTabKey = "dashboard" | "calendar" | "clients" | "reports" | "more";

export type ClientTabKey = "home" | "search" | "visits" | "chat" | "profile";

export interface NavTab<K extends string = string> {
  key: K;
  href: string;
  /** i18n key under `nav.` */
  labelKey: string;
  /** lucide-react icon name, resolved through `iconFor`. */
  icon: string;
  /** Index routes must match exactly, otherwise every child would light up. */
  exact?: boolean;
}

export const PANEL_TABS: NavTab<PanelTabKey>[] = [
  { key: "dashboard", href: "/panel", labelKey: "nav.dashboard", icon: "LayoutDashboard", exact: true },
  { key: "calendar", href: "/panel/calendar", labelKey: "nav.calendar", icon: "CalendarDays" },
  { key: "clients", href: "/panel/clients", labelKey: "nav.clients", icon: "Users" },
  { key: "reports", href: "/panel/reports", labelKey: "nav.reports", icon: "ChartColumn" },
  { key: "more", href: "/panel/more", labelKey: "nav.more", icon: "Ellipsis" },
];

export const CLIENT_TABS: NavTab<ClientTabKey>[] = [
  { key: "home", href: "/app", labelKey: "nav.home", icon: "House", exact: true },
  { key: "search", href: "/app/search", labelKey: "nav.search", icon: "Search" },
  { key: "visits", href: "/app/visits", labelKey: "nav.visits", icon: "CalendarCheck" },
  { key: "chat", href: "/app/chat", labelKey: "nav.chat", icon: "MessageCircle" },
  { key: "profile", href: "/app/profile", labelKey: "nav.profile", icon: "User" },
];

/* ------------------------------------------------------------------ */
/* Public booking page                                                 */
/* ------------------------------------------------------------------ */

export interface PublicNavItem {
  key: string;
  /** In-page anchor — the public page sections carry these ids. */
  href: string;
  labelKey: string;
}

export const PUBLIC_NAV: PublicNavItem[] = [
  { key: "services", href: "#services", labelKey: "company.services" },
  { key: "team", href: "#team", labelKey: "company.team" },
  { key: "reviews", href: "#reviews", labelKey: "company.reviews" },
  { key: "vouchers", href: "#vouchers", labelKey: "nav.vouchers" },
  { key: "contact", href: "#contact", labelKey: "landing.footer.contact" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const ICONS: Readonly<Record<string, LucideIcon | undefined>> = {
  ArrowRight,
  BadgePercent,
  Bell,
  BookOpen,
  Bot,
  Boxes,
  Briefcase,
  Building,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Camera,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUser,
  ClipboardList,
  Clock,
  Contact,
  CreditCard,
  DoorOpen,
  Ellipsis,
  ExternalLink,
  Gift,
  Globe,
  House,
  IdCard,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  Package,
  Phone,
  Plus,
  Scissors,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Tag,
  Ticket,
  User,
  UserCog,
  Users,
  Wallet,
  WandSparkles,
  X,
};

export function iconFor(name: string): LucideIcon {
  return ICONS[name] ?? LayoutGrid;
}

export function isActivePath(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The panel module that owns `pathname` — longest href wins. */
export function panelModuleFor(pathname: string): PanelModule | undefined {
  return [...PANEL_MODULES]
    .sort((a, b) => b.href.length - a.href.length)
    .find((module) => isActivePath(pathname, module.href, module.href === "/panel"));
}
