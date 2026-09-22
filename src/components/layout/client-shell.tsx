import type { ReactNode } from "react";
import { ClientHeader } from "./client-header";
import { MobileTabBar } from "./mobile-tab-bar";
import { cn } from "@/lib/utils";

export interface ClientShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Phone-first, but a real web app on a wide screen: below lg the bottom tab bar
 * drives navigation, from lg up the top header takes over and the content gets a
 * readable centred column rather than a 440px phone floating in empty space.
 */
export function ClientShell({ children, className }: ClientShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <ClientHeader />

      <main
        className={cn(
          "flex-1 pb-24 lg:mx-auto lg:w-full lg:max-w-[1080px] lg:px-6 lg:pb-16 lg:pt-8",
          className,
        )}
      >
        {children}
      </main>

      <MobileTabBar variant="client" className="lg:hidden" />
    </div>
  );
}
