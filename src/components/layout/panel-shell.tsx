"use client";

import type { ReactNode } from "react";
import { BrandProvider } from "@/components/brand/brand-provider";
import { MobileTabBar } from "./mobile-tab-bar";
import { PanelSidebar } from "./panel-sidebar";
import { PanelTopBar } from "./panel-topbar";
import { useActiveTenant, useKalendo } from "@/lib/data";
import type { Account, Tenant } from "@/lib/types";

export interface PanelSession {
  tenant?: Tenant;
  account?: Account;
}

export function usePanelSession(): PanelSession {
  const tenant = useActiveTenant();
  const account = useKalendo((state) => state.account);
  return { tenant, account: account ?? undefined };
}

/* ------------------------------------------------------------------ */

export interface PanelShellProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function PanelShell({ title, action, children }: PanelShellProps) {
  const { tenant, account } = usePanelSession();

  return (
    <BrandProvider brand={tenant?.brand ?? "cobalt"}>
      <div className="flex min-h-dvh bg-paper">
        <PanelSidebar tenant={tenant} account={account} />

        <div className="flex min-w-0 flex-1 flex-col">
          <PanelTopBar
            tenant={tenant}
            account={account}
            title={title}
            action={action}
          />

          <main className="flex-1 pb-24 lg:pb-12">
            <div className="mx-auto w-full max-w-[1320px] px-4 py-5 lg:px-8 lg:py-7">
              {children}
            </div>
          </main>
        </div>

        <MobileTabBar variant="panel" className="lg:hidden" />
      </div>
    </BrandProvider>
  );
}
