"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AuthAside } from "./auth-aside";

/**
 * A layout cannot receive props from the page it wraps, so the dark panel
 * picks its variant from the route instead.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const compact = pathname?.startsWith("/login") ?? false;

  return (
    <div className="min-h-dvh bg-paper lg:bg-sand-50">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col px-4 py-6 sm:px-6 lg:min-h-dvh lg:flex-row lg:items-stretch lg:gap-8 lg:px-8 lg:py-8">
        <div className="flex w-full justify-center lg:flex-1">
          <div className="w-full max-w-[560px] lg:rounded-3xl lg:border lg:border-line lg:bg-white lg:p-10 lg:shadow-sm">
            {children}
          </div>
        </div>

        <aside className="hidden lg:block lg:w-[46%] lg:max-w-[600px]">
          <div className="sticky top-8 rounded-3xl bg-ink p-8 text-paper xl:p-10">
            <AuthAside compact={compact} />
          </div>
        </aside>
      </div>
    </div>
  );
}
