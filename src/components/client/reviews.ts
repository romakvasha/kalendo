"use client";

import { useKalendo } from "@/lib/data";
import { TODAY } from "@/lib/format";
import { makeId } from "@/lib/utils";
import type { Review } from "@/lib/types";

export interface NewReview {
  tenantId: string;
  clientName: string;
  staffId?: string;
  rating: number;
  text: string;
}

/**
 * The store exposes replies but not new reviews, so the client app writes
 * through zustand's own setState rather than growing the shared store API.
 */
export function addClientReview(input: NewReview): Review {
  const review: Review = {
    id: makeId("rev"),
    tenantId: input.tenantId,
    clientName: input.clientName,
    staffId: input.staffId,
    rating: input.rating,
    text: { pl: input.text, en: input.text, uk: input.text },
    date: TODAY,
  };

  useKalendo.setState((state) => ({ reviews: [...state.reviews, review] }));
  return review;
}
