"use client";

import { useMemo } from "react";
import { TODAY } from "@/lib/format";
import type { Appointment, Tenant, TimeSlot } from "@/lib/types";
import {
  appointmentsOn,
  getTenantBySlug,
  slotsFor,
  upcomingForClient,
  type DataState,
} from "./queries";
import { useKalendo } from "./store";

/** The whole store as a plain query state — identity is stable per update. */
export function useDataState(): DataState {
  return useKalendo();
}

export function useActiveTenant(): Tenant | undefined {
  const tenants = useKalendo((state) => state.tenants);
  const activeTenantId = useKalendo((state) => state.activeTenantId);
  return useMemo(
    () => tenants.find((t) => t.id === activeTenantId),
    [tenants, activeTenantId],
  );
}

export function useTenantBySlug(slug: string): Tenant | undefined {
  const state = useDataState();
  return useMemo(() => getTenantBySlug(state, slug), [state, slug]);
}

export function useAppointmentsOn(
  tenantId: string,
  isoDate: string = TODAY,
): Appointment[] {
  const state = useDataState();
  return useMemo(
    () => appointmentsOn(state, tenantId, isoDate),
    [state, tenantId, isoDate],
  );
}

export function useSlots(
  tenantId: string,
  serviceIds: string[],
  staffId: string | null,
  isoDate: string | null,
): TimeSlot[] {
  const state = useDataState();
  const key = serviceIds.join(",");
  return useMemo(
    () =>
      isoDate ? slotsFor(state, tenantId, key ? key.split(",") : [], staffId, isoDate) : [],
    [state, tenantId, key, staffId, isoDate],
  );
}

export function useUpcomingForClient(
  clientOrAccountId: string | undefined,
): Appointment[] {
  const state = useDataState();
  return useMemo(
    () =>
      clientOrAccountId ? upcomingForClient(state, clientOrAccountId) : [],
    [state, clientOrAccountId],
  );
}
