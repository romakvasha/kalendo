"use client";

import type { ReactNode } from "react";

import { Tabs, type TabItem } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface ModuleHeaderProps {
  /** Display heading — mixes roman and italic via an inner <em>. */
  title: ReactNode;
  subtitle?: ReactNode;
  /** Primary action, rendered hard right on desktop. */
  action?: ReactNode;
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  className?: string;
}

export function ModuleHeader({
  title,
  subtitle,
  action,
  tabs,
  activeTab,
  onTabChange,
  className,
}: ModuleHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] leading-[1.08] text-ink sm:text-[32px] lg:text-[38px]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-[14px] leading-5 text-muted lg:text-[15px]">
              {subtitle}
            </p>
          ) : null}
        </div>

        {action ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {action}
          </div>
        ) : null}
      </div>

      {tabs && tabs.length > 0 && activeTab !== undefined && onTabChange ? (
        <Tabs tabs={tabs} value={activeTab} onChange={onTabChange} />
      ) : null}
    </header>
  );
}
