"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronRight, Plus } from "lucide-react";

import { Sheet } from "@/components/ui";
import { TenantLogo } from "@/components/brand/logo";
import { SEED_TENANTS, useKalendo } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/lib/types";

/**
 * Every company this browser can open the panel for: the ones the user
 * created (they live in the persisted `custom` slice) and, in a separate
 * group, the three seeded demo companies. Picking one calls signInAsCompany,
 * so the account and the active tenant always move together.
 */
function useSwitcherTenants(): { own: Tenant[]; demo: Tenant[] } {
  const own = useKalendo((state) => state.custom.tenants);
  return useMemo(() => ({ own, demo: SEED_TENANTS }), [own]);
}

/* ------------------------------------------------------------------ */

function TenantRow({
  tenant,
  current,
  onSelect,
}: {
  tenant: Tenant;
  current: boolean;
  onSelect: (tenant: Tenant) => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={current}
      onClick={() => onSelect(tenant)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left transition-colors",
        "hover:bg-sand-50 focus-visible:bg-sand-50",
        current && "bg-sand-50",
      )}
    >
      <TenantLogo tenant={tenant} size="sm" />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[13px] text-ink",
            current ? "font-medium" : "",
          )}
        >
          {tenant.name}
        </span>
        <span className="block truncate text-[11px] text-muted">{tenant.city}</span>
      </span>
      {current ? (
        <Check className="size-4 shrink-0 text-brand" strokeWidth={2.25} aria-hidden="true" />
      ) : null}
    </button>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
      {children}
    </p>
  );
}

/** The list body, shared by the desktop popover and the mobile sheet. */
function TenantSwitcherList({ onDone }: { onDone: () => void }) {
  const t = useT();
  const { own, demo } = useSwitcherTenants();
  const activeTenantId = useKalendo((state) => state.activeTenantId);
  const signInAsCompany = useKalendo((state) => state.signInAsCompany);

  const select = (tenant: Tenant) => {
    signInAsCompany(tenant.id);
    onDone();
  };

  return (
    <div role="menu" aria-label={t("panel.switcher.label")}>
      {own.length ? (
        <>
          <GroupLabel>{t("panel.switcher.yours")}</GroupLabel>
          {own.map((tenant) => (
            <TenantRow
              key={tenant.id}
              tenant={tenant}
              current={tenant.id === activeTenantId}
              onSelect={select}
            />
          ))}
        </>
      ) : null}

      <GroupLabel>{t("panel.switcher.demo")}</GroupLabel>
      {demo.map((tenant) => (
        <TenantRow
          key={tenant.id}
          tenant={tenant}
          current={tenant.id === activeTenantId}
          onSelect={select}
        />
      ))}

      <div className="mt-1 border-t border-line pt-1">
        <Link
          href="/onboarding"
          role="menuitem"
          onClick={onDone}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-sand-50 focus-visible:bg-sand-50"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-md border border-dashed border-sand-300 text-sand-500">
            <Plus className="size-4" aria-hidden="true" />
          </span>
          {t("panel.switcher.newCompany")}
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export interface TenantSwitcherProps {
  tenant?: Tenant;
  className?: string;
}

/** Desktop: the sidebar tenant card opens a small popover card below it. */
export function SidebarTenantSwitcher({ tenant, className }: TenantSwitcherProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("panel.switcher.label")}
        data-testid="tenant-switcher-trigger"
        className="flex w-full items-center gap-2.5 rounded-md border border-line px-2.5 py-2 text-left transition-colors hover:bg-sand-50"
      >
        {tenant ? <TenantLogo tenant={tenant} size="sm" /> : null}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-ink">
            {tenant?.name ?? "Kalendo"}
          </span>
          {tenant ? (
            <span className="block truncate text-[11px] text-muted">
              {tenant.locations.length > 1
                ? tenant.locations.map((location) => location.name).join(" · ")
                : tenant.city}
            </span>
          ) : null}
        </span>
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-sand-400 transition-transform",
            open && "rotate-90",
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          data-testid="tenant-switcher-menu"
          className="surface animate-scale-in absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[70vh] overflow-y-auto p-1"
        >
          <TenantSwitcherList
            onDone={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Mobile: the top-bar company button opens the list in a sheet. */
export function TopBarTenantSwitcher({
  tenant,
  showName = true,
  className,
}: TenantSwitcherProps & { showName?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("panel.switcher.label")}
        data-testid="tenant-switcher-trigger-mobile"
        className={cn(
          "-ml-1 flex min-w-0 shrink items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-sand-100",
          className,
        )}
      >
        {tenant ? <TenantLogo tenant={tenant} size="sm" /> : null}
        {showName ? (
          <>
            <span className="truncate text-sm font-medium text-ink">
              {tenant?.name ?? "Kalendo"}
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-sand-400 transition-transform",
                open && "rotate-180",
              )}
              aria-hidden="true"
            />
          </>
        ) : null}
      </button>

      <Sheet open={open} onOpenChange={setOpen} title={t("panel.switcher.title")}>
        <TenantSwitcherList onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
