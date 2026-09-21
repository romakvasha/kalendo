"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { brandTheme, brandVars } from "@/lib/brand";
import type { BrandKey, BrandTheme } from "@/lib/types";

const BrandContext = createContext<BrandTheme>(brandTheme("cobalt"));

export function useBrand(): BrandTheme {
  return useContext(BrandContext);
}

export interface BrandProviderProps {
  brand: BrandKey;
  children: ReactNode;
}

export function BrandProvider({ brand, children }: BrandProviderProps) {
  const theme = useMemo(() => brandTheme(brand), [brand]);
  const vars = useMemo(() => brandVars(brand), [brand]);

  return (
    <BrandContext value={theme}>
      {/* `contents` keeps the variable carrier out of the layout tree. */}
      <div className="contents" style={vars}>
        {children}
      </div>
    </BrandContext>
  );
}
