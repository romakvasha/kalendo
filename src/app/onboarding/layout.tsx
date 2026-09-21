import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Konfiguracja firmy",
  description:
    "Pięć kroków do gotowej strony rezerwacji: dane, branża, usługi, godziny i zespół.",
};

export default function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  return <div className="flex min-h-dvh flex-col bg-paper">{children}</div>;
}
