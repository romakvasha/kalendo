"use client";

import { DEMO_CLIENT_ACCOUNT, useKalendo } from "@/lib/data";
import type { Account } from "@/lib/types";

/**
 * The client using the app. Falls back to the demo persona so the screens
 * stay populated when someone opens /app without signing in first.
 */
export function useClientAccount(): Account {
  const account = useKalendo((state) => state.account);
  return account && account.kind === "client" ? account : DEMO_CLIENT_ACCOUNT;
}

export function firstNameOf(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}
