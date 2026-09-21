import type { ReactNode } from "react";
import { MobileTabBar } from "./mobile-tab-bar";
import { cn } from "@/lib/utils";

export interface ClientShellProps {
  children: ReactNode;
  className?: string;
}

export function ClientShell({ children, className }: ClientShellProps) {
  return (
    <div className="min-h-dvh bg-paper lg:flex lg:min-h-dvh lg:items-center lg:justify-center lg:bg-board lg:py-8">
      <div className="flex w-full flex-col lg:h-[calc(100dvh-4rem)] lg:max-h-[920px] lg:w-[440px] lg:overflow-hidden lg:rounded-3xl lg:border lg:border-line lg:bg-paper lg:shadow-xl">
        <main
          className={cn(
            "thin-scrollbar flex-1 pb-24 lg:overflow-y-auto lg:pb-4",
            className,
          )}
        >
          {children}
        </main>

        <MobileTabBar variant="client" className="lg:static lg:shrink-0" />
      </div>
    </div>
  );
}
