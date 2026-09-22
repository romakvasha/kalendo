"use client";

import { useMemo } from "react";
import { Check, Clock, Hourglass, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button, renderIcon } from "@/components/ui";
import {
  DEMO_CLIENT_PHONE,
  clientsOf,
  durationOf,
  eligibleStaff,
  priceOf,
  servicesFor,
  useDataState,
  useKalendo,
} from "@/lib/data";
import { duration, money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Tenant } from "@/lib/types";
import { SERVICE_COLORS } from "@/lib/brand";
import { cn } from "@/lib/utils";
import {
  hasModeQuestion,
  serviceIcon,
  serviceNoteKey,
  type ServiceMode,
} from "./helpers";
import { WeekStrip } from "./month-calendar";
import { SlotGrid } from "./slot-grid";
import { StaffRow } from "./staff-picker";

export interface StepTimeProps {
  tenant: Tenant;
  serviceIds: string[];
  staffId: string | null;
  onStaffChange: (staffId: string | null) => void;
  weekAnchor: string;
  onWeekAnchorChange: (isoDate: string) => void;
  date: string | null;
  onDateChange: (isoDate: string) => void;
  time: string | null;
  onTimeChange: (time: string) => void;
  mode: ServiceMode | null;
  onModeChange: (mode: ServiceMode) => void;
  onEditServices: () => void;
}

export function StepTime({
  tenant,
  serviceIds,
  staffId,
  onStaffChange,
  weekAnchor,
  onWeekAnchorChange,
  date,
  onDateChange,
  time,
  onTimeChange,
  mode,
  onModeChange,
  onEditServices,
}: StepTimeProps) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();
  const addWaitlistEntry = useKalendo((store) => store.addWaitlistEntry);

  const services = useMemo(
    () => servicesFor(state, serviceIds),
    [state, serviceIds],
  );
  const team = useMemo(
    () => eligibleStaff(state, tenant.id, serviceIds),
    [state, tenant.id, serviceIds],
  );

  const minutes = durationOf(state, serviceIds);
  const total = priceOf(state, serviceIds);
  const lead = services[0];
  const swatch = lead ? SERVICE_COLORS[lead.color] : SERVICE_COLORS.sand;
  const noteKey = serviceNoteKey(tenant, services);
  const closing = tenant.openingHours.find((h) => h.weekday === 5)?.close ?? "18:00";

  function joinWaitlist() {
    const roster = clientsOf(state, tenant.id);
    const client =
      roster.find((entry) => entry.phone === DEMO_CLIENT_PHONE) ?? roster[0];
    if (!client || !lead) return;
    addWaitlistEntry({
      tenantId: tenant.id,
      clientId: client.id,
      serviceId: lead.id,
      preferredDate: date ?? weekAnchor,
    });
    toast.success(t("toast.waitlistAdded"));
  }

  return (
    <div className="animate-fade-up flex flex-col gap-7">
      {/* ------------------------------------------ summary strip */}
      <div className="flex items-center gap-3 rounded-lg border border-line bg-card px-3.5 py-3">
        <span
          aria-hidden
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-md",
            swatch.bg,
            swatch.ink,
          )}
        >
          {renderIcon(
            lead ? serviceIcon(tenant, lead) : Clock,
            "size-[18px] stroke-[1.75]",
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-ink">
            {services.map((service) => tl(service.name)).join(" + ")}
          </p>
          <p className="tabular mt-0.5 text-[12.5px] text-muted">
            {duration(minutes, locale)} · {money(total, locale)}
          </p>
        </div>
        <button
          type="button"
          onClick={onEditServices}
          className="shrink-0 rounded-sm text-[13px] font-medium text-brand-ink underline underline-offset-2 hover:opacity-80"
        >
          {t("booking.change")}
        </button>
      </div>

      {/* --------------------------------------- service-mode cards */}
      {hasModeQuestion(tenant) && (
        <section>
          <h2 className="text-[15px] font-semibold text-ink">
            {t("booking.mode.title")}
          </h2>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <ModeCard
              selected={mode === "wait"}
              onSelect={() => onModeChange("wait")}
              title={t("booking.mode.wait")}
              note={t("booking.mode.waitNote", {
                duration: duration(minutes, locale),
              })}
            />
            <ModeCard
              selected={mode === "leave"}
              onSelect={() => onModeChange("leave")}
              title={t("booking.mode.leave")}
              note={t("booking.mode.leaveNote", { time: closing })}
            />
          </div>
        </section>
      )}

      {/* ------------------------------------------------- staff */}
      <section>
        <h2 className="text-[15px] font-semibold text-ink">
          {t("booking.specialist")}
        </h2>
        <StaffRow
          className="mt-3"
          team={team}
          value={staffId}
          onChange={onStaffChange}
        />
      </section>

      {/* -------------------------------------------------- days */}
      <section>
        <WeekStrip
          tenantId={tenant.id}
          serviceIds={serviceIds}
          staffId={staffId}
          anchor={weekAnchor}
          onAnchorChange={onWeekAnchorChange}
          value={date}
          onChange={onDateChange}
        />
      </section>

      {/* ------------------------------------------------- slots */}
      <section>
        <SlotGrid
          grouped
          tenantId={tenant.id}
          serviceIds={serviceIds}
          staffId={staffId}
          date={date}
          value={time}
          onChange={onTimeChange}
        />
      </section>

      {/* ---------------------------------------------- waitlist */}
      <div className="flex items-center gap-3 rounded-lg border border-line bg-sand-50 px-3.5 py-3">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-md bg-card text-sand-600"
        >
          <Hourglass className="size-[17px]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-medium text-ink">
            {t("booking.noTime")}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-4 text-muted">
            {t("booking.waitlistNote")}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0"
          onClick={joinWaitlist}
        >
          {t("booking.joinWaitlist")}
        </Button>
      </div>

      {/* ------------------------------------------ service note */}
      {noteKey && (
        <p className="flex items-start gap-2.5 rounded-lg border border-warn-ink/20 bg-warn px-3.5 py-3 text-[13px] leading-5 text-warn-ink">
          <TriangleAlert
            aria-hidden
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.75}
          />
          {t(noteKey)}
        </p>
      )}
    </div>
  );
}

interface ModeCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  note: string;
}

function ModeCard({ selected, onSelect, title, note }: ModeCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "relative rounded-lg border px-4 py-3.5 text-left transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
        selected
          ? "border-ink bg-sand-50"
          : "border-line bg-card hover:border-line-strong",
      )}
    >
      <span className="block pr-7 text-[14px] font-medium text-ink">{title}</span>
      <span className="mt-0.5 block text-[12.5px] text-muted">{note}</span>
      {selected && (
        <span
          aria-hidden
          className="absolute top-3.5 right-3.5 grid size-5 place-items-center rounded-full bg-ink text-paper"
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
