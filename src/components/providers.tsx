"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        {children}
        <Toaster
          position="top-center"
          offset={16}
          toastOptions={{
            className:
              "!bg-ink !text-paper !border-0 !rounded-2xl !shadow-lg !font-sans !text-sm",
          }}
        />
      </I18nProvider>
    </ThemeProvider>
  );
}
