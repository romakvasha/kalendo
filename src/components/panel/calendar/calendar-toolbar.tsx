"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";

import { monthYear, weekdayDayMonth } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Button,
  IconButton,
  Input,
  Segmented,
  Select,
  type SegmentedOption,
  type SelectOption,
} from "@/components/ui";
import { shortDateLabel, type CalendarView } from "./calendar-model";

/** The active segment is ink-filled in the reference, not white. */
const SEGMENTED_DARK =
  "[&_[aria-checked=true]]:bg-ink [&_[aria-checked=true]]:text-paper";

export interface CalendarToolbarProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  date: string;
  onStep: (direction: -1 | 1) => void;
  onToday: () => void;
  staffOptions: SelectOption[];
  staffFilter: string;
  onStaffChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  pendingCount: number;
  onNewVisit: () => void;
  onFilter: () => void;
}

export function CalendarToolbar({
  view,
  onViewChange,
  date,
  onStep,
  onToday,
  staffOptions,
  staffFilter,
  onStaffChange,
  query,
  onQueryChange,
  pendingCount,
  onNewVisit,
  onFilter,
}: CalendarToolbarProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const desktopOptions: SegmentedOption[] = [
    { value: "day", label: t("panel.calendar.day") },
    ...(view === "days3"
      ? [{ value: "days3", label: t("panel.calendar.days3") }]
      : []),
    { value: "week", label: t("panel.calendar.week") },
    { value: "month", label: t("panel.calendar.month") },
  ];

  const mobileOptions: SegmentedOption[] = [
    { value: "day", label: t("panel.calendar.day") },
    { value: "days3", label: t("panel.calendar.days3") },
    { value: "week", label: t("panel.calendar.week") },
    { value: "month", label: t("panel.calendar.month") },
  ];

  const fullLabel =
    view === "month"
      ? monthYear(date, locale)
      : `${weekdayDayMonth(date, locale)} ${date.slice(0, 4)}`;

  const compactLabel =
    view === "month" ? monthYear(date, locale) : shortDateLabel(date, locale);

  return (
    <div className="border-b border-line px-3 py-3 lg:px-4">
      {/* Desktop */}
      <div className="hidden flex-wrap items-center justify-between gap-x-3 gap-y-2 lg:flex">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="font-display mr-1 text-[26px] leading-none text-ink xl:text-[30px]">
            {t("panel.calendar.title")}
          </h1>

          <IconButton
            size="sm"
            variant="secondary"
            aria-label={t("a11y.prevDay")}
            onClick={() => onStep(-1)}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            size="sm"
            variant="secondary"
            aria-label={t("a11y.nextDay")}
            onClick={() => onStep(1)}
          >
            <ChevronRight />
          </IconButton>

          <Button size="sm" variant="secondary" onClick={onToday}>
            {t("panel.calendar.today")}
          </Button>

          <p className="hidden truncate text-[15px] font-medium text-ink xl:block">
            {fullLabel}
          </p>
          <p className="truncate text-[15px] font-medium text-ink xl:hidden">
            {compactLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="relative w-[220px]">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sand-500"
              />
              <Input
                ref={searchRef}
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    onQueryChange("");
                    setSearchOpen(false);
                  }
                }}
                placeholder={t("panel.clients.searchPlaceholder")}
                aria-label={t("common.search")}
                className="h-10 rounded-full pr-9 pl-9 text-[13px]"
              />
              <button
                type="button"
                aria-label={t("common.clear")}
                onClick={() => {
                  onQueryChange("");
                  setSearchOpen(false);
                }}
                className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-sand-500 hover:bg-sand-100 hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : null}

          <Segmented
            options={desktopOptions}
            value={view}
            onChange={(value) => onViewChange(value as CalendarView)}
            className={SEGMENTED_DARK}
          />

          <div className="relative w-[168px]">
            <Users
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-sand-500"
            />
            <Select
              options={staffOptions}
              value={staffFilter}
              onChange={(event) => onStaffChange(event.target.value)}
              aria-label={t("common.staff")}
              className="h-10 rounded-full pl-9.5 text-[13px]"
            />
          </div>

          {!searchOpen ? (
            <IconButton
              size="sm"
              variant="secondary"
              aria-label={t("common.search")}
              onClick={() => setSearchOpen(true)}
              className="hidden rounded-full xl:inline-grid"
            >
              <Search />
            </IconButton>
          ) : null}

          <span className="relative hidden xl:inline-block">
            <IconButton
              size="sm"
              variant="secondary"
              aria-label={t("a11y.notifications")}
              onClick={() => router.push("/panel/bookings")}
              className="rounded-full"
            >
              <Bell />
            </IconButton>
            {pendingCount > 0 ? (
              <span
                aria-hidden
                className="absolute top-1 right-1 size-2 rounded-full bg-danger ring-2 ring-card"
              />
            ) : null}
          </span>

          <Button
            size="sm"
            variant="primary"
            iconLeft={Plus}
            onClick={onNewVisit}
            className="rounded-full px-4"
          >
            {t("panel.calendar.newVisit")}
          </Button>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            variant="ghost"
            aria-label={t("a11y.prevDay")}
            onClick={() => onStep(-1)}
          >
            <ChevronLeft />
          </IconButton>

          <h1 className="min-w-0 truncate text-[17px] leading-6 font-semibold text-ink">
            {compactLabel}
          </h1>

          <IconButton
            size="sm"
            variant="ghost"
            aria-label={t("a11y.nextDay")}
            onClick={() => onStep(1)}
          >
            <ChevronRight />
          </IconButton>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={onToday}
              className="rounded-full px-3.5"
            >
              {t("panel.calendar.today")}
            </Button>
            <IconButton
              size="sm"
              variant="secondary"
              aria-label={t("common.filters")}
              onClick={onFilter}
              className="rounded-full"
            >
              <SlidersHorizontal />
            </IconButton>
          </div>
        </div>

        <Segmented
          block
          options={mobileOptions}
          value={view}
          onChange={(value) => onViewChange(value as CalendarView)}
          className={cn("mt-3", SEGMENTED_DARK)}
        />
      </div>
    </div>
  );
}
