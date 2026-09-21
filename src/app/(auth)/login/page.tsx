import type { Metadata } from "next";

import { LoginForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Zaloguj się",
  description: "Zaloguj się kodem z SMS-a do aplikacji klienta albo panelu firmy.",
};

export default function LoginPage() {
  return <LoginForm />;
}
