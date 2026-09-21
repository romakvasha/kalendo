import type { Metadata } from "next";

import { SignupForm } from "@/components/auth";
import type { AccountKind } from "@/lib/types";

export const metadata: Metadata = {
  title: "Załóż konto",
  description:
    "Konto klienta albo konto firmy — rezerwuj wizyty lub przyjmuj je w panelu Kalendo.",
};

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  const raw = params.type;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const initialType: AccountKind = value === "company" ? "company" : "client";

  return <SignupForm initialType={initialType} />;
}
