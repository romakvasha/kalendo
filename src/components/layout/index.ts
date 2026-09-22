export { MobileTabBar, type MobileTabBarProps } from "./mobile-tab-bar";
export { PanelSidebar, type PanelSidebarProps } from "./panel-sidebar";
export { PanelTopBar, type PanelTopBarProps } from "./panel-topbar";
export {
  SidebarTenantSwitcher,
  TopBarTenantSwitcher,
  type TenantSwitcherProps,
} from "./tenant-switcher";
export {
  PanelShell,
  usePanelSession,
  type PanelShellProps,
  type PanelSession,
} from "./panel-shell";
export { ClientShell, type ClientShellProps } from "./client-shell";
export { ClientHeader } from "./client-header";
export { PublicHeader, type PublicHeaderProps } from "./public-header";

// Brand chrome is re-exported here so shells and pages share one import path.
export {
  BrandProvider,
  useBrand,
  type BrandProviderProps,
} from "@/components/brand/brand-provider";
export {
  KalendoLogo,
  TenantLogo,
  type KalendoLogoProps,
  type TenantLogoProps,
} from "@/components/brand/logo";
export { PhoneFrame, type PhoneFrameProps } from "@/components/brand/phone-frame";
export {
  LanguageSegmented,
  LanguageDropdown,
  type LanguageSegmentedProps,
  type LanguageDropdownProps,
} from "@/components/brand/language-switcher";
export { ThemeToggle, type ThemeToggleProps } from "@/components/brand/theme-toggle";
