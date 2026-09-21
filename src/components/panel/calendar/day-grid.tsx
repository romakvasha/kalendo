"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Coffee, Plus, SlidersHorizontal } from "lucide-react";

import {
  dayHeight,
  freeGaps,
  heightFor,
  hourLabels,
  layoutDay,
  minutesFromY,
  nowLine,
  snapMinutes,
  timeLabel,
  yFor,
} from "@/lib/calendar-geometry";
import {
  NOW_ISO,
  NOW_MINUTES,
  clientById,
  servicesFor,
  type DataState,
} from "@/lib/data";
import { TODAY, dayMonth, minutesOf, number, weekdayShort } from "@/lib/format";
import { useLocale, useT, useTl } from "@/lib/i18n";
import type { Appointment, CalendarBlock, Tenant } from "@/lib/types";
import { clamp, cn } from "@/lib/utils";
import { Avatar, IconButton } from "@/components/ui";
import { AppointmentBlock } from "./appointment-block";
import { chipsForAppointment } from "./block-chips";
import {
  DRAG_STEP_MINUTES,
  GAP_MIN_MINUTES,
  isOpenOn,
  itemRange,
  itemsForColumn,
  type ComposerSeed,
  type DateGroup,
  type DayWindow,
  type GridColumn,
  type MoveRequest,
} from "./calendar-model";
import { useIsDesktop } from "./use-media-query";

/** "Weronika Lis" -> "Weronika L." so a 108px phone column still reads. */
function shortenName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return name;
  return `${parts[0]} ${parts[1][0]}.`;
}

interface DragState {
  id: string;
  pointerId: number;
  originKey: string;
  originStartMin: number;
  durationMin: number;
  grabOffsetMin: number;
  active: boolean;
  originX: number;
  originY: number;
  targetKey: string;
  startMin: number;
}

export interface DayGridProps {
  state: DataState;
  tenant: Tenant;
  columns: GridColumn[];
  groups: DateGroup[];
  showDateHeaders: boolean;
  window: DayWindow;
  appointments: Appointment[];
  blocks: CalendarBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (seed: ComposerSeed) => void;
  onMove: (move: MoveRequest) => void;
  onFilter: () => void;
}

export function DayGrid({
  state,
  tenant,
  columns,
  groups,
  showDateHeaders,
  window: dayWindow,
  appointments,
  blocks,
  selectedId,
  onSelect,
  onCreate,
  onMove,
  onFilter,
}: DayGridProps) {
  const t = useT();
  const tl = useTl();
  const locale = useLocale();
  const isDesktop = useIsDesktop();

  const columnRefs = useRef(new Map<string, HTMLDivElement>());
  const draggedRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const gutterPx = isDesktop ? 58 : 48;
  const columnPx = showDateHeaders
    ? isDesktop
      ? 128
      : 104
    : isDesktop
      ? 184
      : 108;
  const template = `${gutterPx}px repeat(${columns.length}, minmax(0, 1fr))`;
  const totalPx = gutterPx + columns.length * columnPx;
  const bodyHeight = dayHeight(dayWindow.startMin, dayWindow.endMin);
  const hours = useMemo(
    () => hourLabels(dayWindow.startMin, dayWindow.endMin),
    [dayWindow.startMin, dayWindow.endMin],
  );

  const columnByKey = useMemo(
    () => new Map(columns.map((column) => [column.key, column])),
    [columns],
  );

  const laidOut = useMemo(
    () =>
      columns.map((column) => {
        const items = itemsForColumn(column, appointments, blocks);
        const placed = layoutDay(
          items,
          itemRange,
          dayWindow.startMin,
          dayWindow.endMin,
        );
        const past = column.date < TODAY;
        const floor =
          column.date === TODAY
            ? snapMinutes(NOW_MINUTES + DRAG_STEP_MINUTES, DRAG_STEP_MINUTES)
            : dayWindow.startMin;

        const gaps = past
          ? []
          : freeGaps(
              items,
              itemRange,
              dayWindow.startMin,
              dayWindow.endMin,
              GAP_MIN_MINUTES,
            )
              .map((gap) => {
                const from = Math.max(gap.startMin, floor);
                return {
                  startMin: from,
                  minutes: gap.startMin + gap.minutes - from,
                };
              })
              .filter((gap) => gap.minutes >= GAP_MIN_MINUTES);

        return { column, placed, gaps };
      }),
    [columns, appointments, blocks, dayWindow.startMin, dayWindow.endMin],
  );

  const nowY = nowLine(NOW_ISO, dayWindow.startMin, dayWindow.endMin);

  /* ---------------------------------------------------------------- */
  /* Drag to reschedule                                                */
  /* ---------------------------------------------------------------- */

  const beginDrag = useCallback(
    (
      event: React.PointerEvent<HTMLElement>,
      appointment: Appointment,
      columnKey: string,
    ) => {
      if (event.button !== 0) return;
      const element = columnRefs.current.get(columnKey);
      if (!element) return;

      draggedRef.current = false;
      const rect = element.getBoundingClientRect();
      const startMin = minutesOf(appointment.start);
      const durationMin = Math.max(
        minutesOf(appointment.end) - startMin,
        DRAG_STEP_MINUTES,
      );
      const next: DragState = {
        id: appointment.id,
        pointerId: event.pointerId,
        originKey: columnKey,
        originStartMin: startMin,
        durationMin,
        grabOffsetMin:
          minutesFromY(event.clientY - rect.top, dayWindow.startMin) - startMin,
        active: false,
        originX: event.clientX,
        originY: event.clientY,
        targetKey: columnKey,
        startMin,
      };
      dragRef.current = next;
      setDrag(next);
    },
    [dayWindow.startMin],
  );

  const dragging = drag !== null;

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current || event.pointerId !== current.pointerId) return;

      const moved = Math.hypot(
        event.clientX - current.originX,
        event.clientY - current.originY,
      );
      if (!current.active && moved < 5) return;

      let targetKey = current.targetKey;
      for (const [key, element] of columnRefs.current) {
        const rect = element.getBoundingClientRect();
        if (event.clientX >= rect.left && event.clientX < rect.right) {
          targetKey = key;
          break;
        }
      }

      const target = columnRefs.current.get(targetKey);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const raw =
        minutesFromY(event.clientY - rect.top, dayWindow.startMin) -
        current.grabOffsetMin;
      const startMin = clamp(
        snapMinutes(raw, DRAG_STEP_MINUTES),
        dayWindow.startMin,
        dayWindow.endMin - current.durationMin,
      );

      const next: DragState = { ...current, active: true, targetKey, startMin };
      dragRef.current = next;
      setDrag(next);
    };

    const handleUp = (event: PointerEvent) => {
      const current = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!current || event.pointerId !== current.pointerId || !current.active)
        return;

      draggedRef.current = true;
      const column = columnByKey.get(current.targetKey);
      if (!column) return;
      if (
        current.targetKey === current.originKey &&
        current.startMin === current.originStartMin
      ) {
        return;
      }
      onMove({
        id: current.id,
        date: column.date,
        staffId: column.staff.id,
        startMin: current.startMin,
      });
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [dragging, dayWindow.startMin, dayWindow.endMin, columnByKey, onMove]);

  const handleSelect = useCallback(
    (id: string) => {
      if (draggedRef.current) {
        draggedRef.current = false;
        return;
      }
      onSelect(id);
    },
    [onSelect],
  );

  /* ---------------------------------------------------------------- */

  return (
    <div className="thin-scrollbar relative h-[calc(100dvh-20rem)] min-h-[360px] overflow-auto overscroll-contain lg:h-[calc(100dvh-14rem)]">
      <div className="min-w-full" style={{ width: totalPx }}>
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm">
          {showDateHeaders ? (
            <div
              className="grid border-b border-line"
              style={{ gridTemplateColumns: template }}
            >
              <div className="sticky left-0 z-10 bg-white" />
              {groups.map((group, index) => (
                <div
                  key={group.date}
                  style={{ gridColumn: `span ${group.span}` }}
                  className={cn(
                    "flex items-baseline gap-1.5 px-3 py-2",
                    index > 0 && "border-l border-line",
                    group.date === TODAY && "bg-cobalt-soft/40",
                  )}
                >
                  <span className="text-[11px] tracking-wide text-muted uppercase">
                    {weekdayShort(group.date, locale)}
                  </span>
                  <span className="tabular text-[13px] font-semibold text-ink">
                    {dayMonth(group.date, locale)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div
            className="grid border-b border-line"
            style={{ gridTemplateColumns: template }}
          >
            <div className="sticky left-0 z-10 grid place-items-center border-r border-line bg-white">
              <IconButton
                size="sm"
                variant="ghost"
                aria-label={t("common.filters")}
                onClick={onFilter}
              >
                <SlidersHorizontal />
              </IconButton>
            </div>

            {columns.map((column, index) => (
              <div
                key={column.key}
                className={cn(
                  "flex min-w-0 items-center gap-2 px-2 py-2.5 lg:px-3",
                  index > 0 && "border-l border-line",
                )}
              >
                <Avatar
                  name={column.staff.name}
                  color={column.staff.avatarColor}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] leading-4 font-semibold text-ink">
                    <span className="lg:hidden">
                      {column.staff.name.split(" ")[0]}
                    </span>
                    <span className="hidden lg:inline">
                      {column.staff.name}
                    </span>
                  </p>
                  <p className="hidden truncate text-[11px] leading-4 text-muted lg:block">
                    {tl(column.staff.role)} ·{" "}
                    {t("panel.team.workload", {
                      booked: number(column.staff.bookedHoursToday, locale),
                      available: number(
                        column.staff.availableHoursToday,
                        locale,
                      ),
                    })}
                  </p>
                  <p className="text-[11px] leading-4 text-muted lg:hidden">
                    {`${t("panel.team.utilization")} ${column.staff.utilization}%`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="relative grid"
          style={{ gridTemplateColumns: template, height: bodyHeight }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {hours.map((hour) => (
              <div key={hour.minutes}>
                <div
                  className="absolute inset-x-0 border-t border-line"
                  style={{ top: yFor(hour.minutes, dayWindow.startMin) }}
                />
                {hour.minutes + 30 < dayWindow.endMin ? (
                  <div
                    className="absolute inset-x-0 border-t border-sand-100"
                    style={{ top: yFor(hour.minutes + 30, dayWindow.startMin) }}
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="sticky left-0 z-20 border-r border-line bg-white">
            {hours.map((hour) => (
              <span
                key={hour.minutes}
                className="tabular absolute right-2 text-[11px] leading-4 text-muted"
                style={{
                  top: Math.max(yFor(hour.minutes, dayWindow.startMin) - 8, 2),
                }}
              >
                {hour.label}
              </span>
            ))}

            {nowY !== null ? (
              <span
                className="tabular absolute left-1 rounded-xs bg-cobalt px-1.5 py-0.5 text-[10px] leading-4 font-semibold text-white"
                style={{ top: nowY - 11 }}
              >
                {timeLabel(NOW_MINUTES)}
              </span>
            ) : null}
          </div>

          {laidOut.map(({ column, placed, gaps }, index) => {
            const closed = !isOpenOn(tenant, column.date);
            const isTarget = drag?.active && drag.targetKey === column.key;

            return (
              <div
                key={column.key}
                ref={(element) => {
                  if (element) columnRefs.current.set(column.key, element);
                  else columnRefs.current.delete(column.key);
                }}
                className={cn(
                  "relative",
                  index > 0 && "border-l border-line",
                  closed && "bg-sand-50/70",
                  isTarget && "bg-cobalt-soft/30",
                )}
              >
                {gaps.map((gap) => (
                  <button
                    key={`${column.key}-gap-${gap.startMin}`}
                    type="button"
                    onClick={() =>
                      onCreate({
                        date: column.date,
                        staffId: column.staff.id,
                        time: timeLabel(gap.startMin),
                      })
                    }
                    style={{
                      top: yFor(gap.startMin, dayWindow.startMin) + 2,
                      height: Math.max(heightFor(gap.minutes) - 4, 22),
                    }}
                    className={cn(
                      "absolute inset-x-1 grid place-items-center rounded-md border border-dashed border-line-strong",
                      "text-[11px] font-medium text-muted transition-colors duration-150",
                      "hover:border-cobalt/40 hover:bg-cobalt-soft/50 hover:text-cobalt",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/30",
                    )}
                  >
                    <span className="inline-flex items-center gap-1 px-1">
                      <Plus aria-hidden className="size-3.5" />
                      <span className="truncate">
                        {t("panel.calendar.freeSlot", { min: gap.minutes })}
                      </span>
                    </span>
                  </button>
                ))}

                {placed.map((entry) => {
                  const item = entry.item;

                  if (item.kind === "block") {
                    const isBreak = item.block.kind === "break";
                    return (
                      <div
                        key={item.id}
                        style={{
                          top: entry.top,
                          height: entry.height,
                          left: `calc(${(entry.column / entry.columns) * 100}% + 2px)`,
                          width: `calc(${100 / entry.columns}% - 4px)`,
                        }}
                        className="hatch absolute z-10 overflow-hidden rounded-md border border-line bg-sand-50/80 px-2 py-1.5"
                      >
                        <p className="flex items-center gap-1 text-[11px] leading-4 font-medium text-muted">
                          {isBreak ? (
                            <Coffee aria-hidden className="size-3 shrink-0" />
                          ) : null}
                          <span className="truncate">
                            {isBreak
                              ? t("panel.calendar.break")
                              : `${t("panel.calendar.absence")} · ${tl(item.block.label)}`}
                          </span>
                        </p>
                      </div>
                    );
                  }

                  const appointment = item.appointment;
                  const services = servicesFor(state, appointment.serviceIds);
                  const client = clientById(state, appointment.clientId);
                  const membership = appointment.membershipId
                    ? state.memberships.find(
                        (pass) => pass.id === appointment.membershipId,
                      )
                    : undefined;
                  const fullName = client?.name ?? t("panel.clients.newClient");
                  const clientName = isDesktop
                    ? fullName
                    : shortenName(fullName);
                  const serviceLabel = services
                    .map((service) => tl(service.name))
                    .join(" + ");

                  return (
                    <AppointmentBlock
                      key={appointment.id}
                      appointment={appointment}
                      clientName={clientName}
                      serviceLabel={serviceLabel}
                      color={services[0]?.color ?? "sand"}
                      chips={chipsForAppointment({
                        appointment,
                        services,
                        membership,
                        t,
                      })}
                      top={entry.top}
                      height={entry.height}
                      column={entry.column}
                      columns={entry.columns}
                      maxChips={
                        isDesktop && !showDateHeaders && entry.columns === 1
                          ? 2
                          : 1
                      }
                      showTime={isDesktop && entry.columns === 1}
                      selected={selectedId === appointment.id}
                      dragging={
                        drag?.active === true && drag.id === appointment.id
                      }
                      label={`${clientName} · ${serviceLabel} · ${timeLabel(minutesOf(appointment.start))}`}
                      onSelect={() => handleSelect(appointment.id)}
                      onDragStart={(event) =>
                        beginDrag(event, appointment, column.key)
                      }
                      onNudge={(delta) =>
                        onMove({
                          id: appointment.id,
                          date: column.date,
                          staffId: column.staff.id,
                          startMin: clamp(
                            minutesOf(appointment.start) + delta,
                            dayWindow.startMin,
                            dayWindow.endMin -
                              (minutesOf(appointment.end) -
                                minutesOf(appointment.start)),
                          ),
                        })
                      }
                    />
                  );
                })}

                {isTarget && drag ? (
                  <div
                    aria-hidden
                    style={{
                      top: yFor(drag.startMin, dayWindow.startMin),
                      height: heightFor(drag.durationMin),
                    }}
                    className="pointer-events-none absolute inset-x-1 z-30 rounded-md border-2 border-dashed border-cobalt bg-cobalt-soft/70"
                  >
                    <span className="tabular absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-ink px-2.5 py-1 text-[11px] leading-none font-semibold whitespace-nowrap text-paper shadow-md">
                      {timeLabel(drag.startMin)}–
                      {timeLabel(drag.startMin + drag.durationMin)}
                    </span>
                  </div>
                ) : null}

                {nowY !== null && column.date === TODAY ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 z-20 border-t border-cobalt"
                    style={{ top: nowY }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
