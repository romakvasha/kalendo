"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DoorOpen, MapPin, Plus } from "lucide-react";

import { usePanelSession } from "@/components/layout";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Field,
  Input,
  Modal,
  Progress,
  Select,
} from "@/components/ui";
import { SERVICE_COLORS } from "@/lib/brand";
import {
  roomsOf,
  serviceById,
  useDataState,
  useHydrated,
  useKalendo,
} from "@/lib/data";
import { timeLabel } from "@/lib/calendar-geometry";
import { TODAY, duration as formatDuration, weekdayOf } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Room, Service, Tenant } from "@/lib/types";
import { cn, makeId } from "@/lib/utils";

import { ModuleHeader } from "./module-header";
import { ModuleSkeleton } from "./module-skeleton";
import { plainText, roomDay, toMinutes } from "./helpers";

/* ------------------------------------------------------------------ */

export function RoomsScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <ModuleSkeleton rows={3} />;
  return <Rooms tenant={tenant} />;
}

/* ------------------------------------------------------------------ */

function Rooms({ tenant }: { tenant: Tenant }) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();

  const rooms = useMemo(() => roomsOf(state, tenant.id), [state, tenant.id]);
  const [adding, setAdding] = useState(false);

  const hours = tenant.openingHours.find(
    (item) => item.weekday === weekdayOf(TODAY),
  );
  const openMin = hours?.open ? toMinutes(hours.open) : 8 * 60;
  const closeMin = hours?.close ? toMinutes(hours.close) : 20 * 60;
  const closedToday = !hours?.open || !hours.close;

  const days = useMemo(
    () =>
      new Map(
        rooms.map((room) => [
          room.id,
          roomDay(state, tenant.id, room.id, openMin, closeMin, (appointment) =>
            appointment.serviceIds
              .map((id) => {
                const service = serviceById(state, id);
                return service ? tl(service.name) : "";
              })
              .filter(Boolean)
              .join(" + "),
          ),
        ]),
      ),
    [rooms, state, tenant.id, openMin, closeMin, tl],
  );

  const servicesPerRoom = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const appointment of state.appointments) {
      if (appointment.tenantId !== tenant.id || !appointment.roomId) continue;
      const list = map.get(appointment.roomId) ?? [];
      for (const id of appointment.serviceIds) {
        if (!list.includes(id)) list.push(id);
      }
      map.set(appointment.roomId, list);
    }
    return map;
  }, [state.appointments, tenant.id]);

  function addRoom(name: string, locationId: string) {
    const room: Room = {
      id: makeId("rm"),
      tenantId: tenant.id,
      locationId,
      name: plainText(name.trim()),
    };
    useKalendo.setState((current) => ({ rooms: [...current.rooms, room] }));
    setAdding(false);
    toast.success(t("toast.saved"));
  }

  const ticks = [openMin, Math.round((openMin + closeMin) / 2), closeMin];

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <ModuleHeader
        title={
          <>
            {t("panel.rooms.title")} <em>{t("panel.rooms.andBays")}</em>
          </>
        }
        subtitle={t("panel.rooms.subtitle", {
          rooms: rooms.length,
          locations: tenant.locations.length,
        })}
        action={
          <Button iconLeft={Plus} onClick={() => setAdding(true)}>
            {t("panel.rooms.addRoom")}
          </Button>
        }
      />

      {rooms.length === 0 ? (
        <Card>
          <EmptyState
            icon={DoorOpen}
            title={t("panel.rooms.empty")}
            body={t("panel.rooms.emptyBody")}
            action={
              <Button iconLeft={Plus} onClick={() => setAdding(true)}>
                {t("panel.rooms.addRoom")}
              </Button>
            }
          />
        </Card>
      ) : (
        tenant.locations.map((location) => {
          const inLocation = rooms.filter(
            (room) => room.locationId === location.id,
          );
          if (inLocation.length === 0) return null;

          return (
            <section key={location.id} className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-[13px] font-medium text-muted">
                <MapPin aria-hidden className="size-4 shrink-0" />
                <span className="truncate">
                  {location.name} · {location.address}, {location.city}
                </span>
              </h2>

              <ul className="flex flex-col gap-3">
                {inLocation.map((room) => {
                  const day = days.get(room.id);
                  const allowed = (servicesPerRoom.get(room.id) ?? [])
                    .map((id) => serviceById(state, id))
                    .filter((service): service is Service => Boolean(service));

                  return (
                    <li key={room.id}>
                      <Card>
                        <CardBody className="flex flex-col gap-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-[15px] font-semibold text-ink">
                                {tl(room.name)}
                              </h3>
                              <p className="tabular mt-0.5 text-[12px] text-muted">
                                {closedToday
                                  ? t("panel.rooms.closedToday")
                                  : t("panel.rooms.visitsToday", {
                                      count: day?.segments.length ?? 0,
                                    })}
                              </p>
                            </div>
                            <Badge
                              tone={
                                (day?.occupancy ?? 0) >= 75
                                  ? "warn"
                                  : (day?.occupancy ?? 0) > 0
                                    ? "success"
                                    : "neutral"
                              }
                            >
                              {t("panel.rooms.todayOccupancy")} ·{" "}
                              {day?.occupancy ?? 0}%
                            </Badge>
                          </div>

                          {allowed.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                              <p className="text-[12px] text-muted">
                                {t("panel.rooms.assignedServices")}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {allowed.slice(0, 5).map((service) => (
                                  <span
                                    key={service.id}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[12px] text-ink"
                                  >
                                    <span
                                      aria-hidden
                                      className={cn(
                                        "size-2 rounded-full",
                                        SERVICE_COLORS[service.color].bg,
                                      )}
                                    />
                                    {tl(service.name)}
                                  </span>
                                ))}
                                {allowed.length > 5 && (
                                  <span className="inline-flex items-center rounded-full border border-line px-2.5 py-1 text-[12px] text-muted">
                                    +{allowed.length - 5}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <Progress
                            value={day?.occupancy ?? 0}
                            tone="brand"
                            aria-label={`${tl(room.name)} — ${t("panel.rooms.todayOccupancy")}`}
                          />

                          <div>
                            <div className="hatch relative h-9 w-full overflow-hidden rounded-sm border border-line bg-sand-50">
                              {day?.segments.map((segment) => (
                                <span
                                  key={segment.id}
                                  title={segment.label}
                                  className={cn(
                                    "absolute inset-y-1 rounded-xs border border-ink/5",
                                    SERVICE_COLORS[segment.color].bg,
                                  )}
                                  style={{
                                    left: `${segment.left}%`,
                                    width: `${segment.width}%`,
                                  }}
                                >
                                  <span className="sr-only">
                                    {segment.label}
                                  </span>
                                </span>
                              ))}
                            </div>
                            <div
                              aria-hidden
                              className="tabular mt-1 flex justify-between text-[10px] text-muted"
                            >
                              {ticks.map((tick) => (
                                <span key={tick}>{timeLabel(tick)}</span>
                              ))}
                            </div>
                          </div>

                          <p className="tabular text-[12px] text-muted">
                            {formatDuration(day?.minutes ?? 0, locale)} /{" "}
                            {formatDuration(closeMin - openMin, locale)}
                          </p>
                        </CardBody>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}

      {adding && (
        <AddRoomModal
          locations={tenant.locations.map((location) => ({
            value: location.id,
            label: location.name,
          }))}
          onClose={() => setAdding(false)}
          onSave={addRoom}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface AddRoomModalProps {
  locations: { value: string; label: string }[];
  onClose: () => void;
  onSave: (name: string, locationId: string) => void;
}

function AddRoomModal({ locations, onClose, onSave }: AddRoomModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState(locations[0]?.value ?? "");

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="sm"
      closeLabel={t("common.close")}
      title={t("panel.rooms.addRoom")}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" block onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            block
            disabled={name.trim().length === 0}
            onClick={() => onSave(name, locationId)}
          >
            {t("common.add")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t("panel.rooms.roomName")} htmlFor="room-name" required>
          <Input
            id="room-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label={t("panel.rooms.location")} htmlFor="room-location">
          <Select
            id="room-location"
            options={locations}
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
