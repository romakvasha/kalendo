"use client";

import { useMemo, useState } from "react";

import {
  durationOf,
  eligibleStaff,
  priceOf,
  roomsOf,
  servicesOf,
  useSlots,
  type DataState,
} from "@/lib/data";
import { duration as formatDuration, money } from "@/lib/format";
import { useLocale, useT, useTl } from "@/lib/i18n";
import type { Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Button,
  Chip,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Sheet,
  Switch,
  Textarea,
} from "@/components/ui";
import {
  ClientCombobox,
  EMPTY_CLIENT,
  type ClientPick,
} from "./client-combobox";
import type { ComposerSeed } from "./calendar-model";
import { useIsDesktop } from "./use-media-query";

export interface NewVisitInput {
  client: ClientPick;
  serviceIds: string[];
  staffId: string;
  roomId: string | null;
  date: string;
  time: string;
  note: string;
  deposit: boolean;
}

export interface NewVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: DataState;
  tenant: Tenant;
  seed: ComposerSeed;
  onCreate: (input: NewVisitInput) => void;
}

export function NewVisitDialog({
  open,
  onOpenChange,
  state,
  tenant,
  seed,
  onCreate,
}: NewVisitDialogProps) {
  const t = useT();
  const tl = useTl();
  const locale = useLocale();
  const isDesktop = useIsDesktop();

  // The dialog is mounted per composer seed, so plain initial state is the reset.
  const [client, setClient] = useState<ClientPick>(EMPTY_CLIENT);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState(seed.staffId ?? "");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState(seed.date);
  const [time, setTime] = useState<string | null>(seed.time);
  const [note, setNote] = useState("");
  const [deposit, setDeposit] = useState(false);

  const services = useMemo(
    () => servicesOf(state, tenant.id),
    [state, tenant.id],
  );
  const rooms = useMemo(() => roomsOf(state, tenant.id), [state, tenant.id]);
  const team = useMemo(
    () => eligibleStaff(state, tenant.id, serviceIds),
    [state, tenant.id, serviceIds],
  );

  // Derived rather than stored: the service mix can narrow who may perform it.
  const activeStaffId = team.some((member) => member.id === staffId)
    ? staffId
    : (team[0]?.id ?? "");

  const slots = useSlots(tenant.id, serviceIds, activeStaffId || null, date);
  const available = slots.filter((slot) => slot.available);

  const minutes = durationOf(state, serviceIds);
  const total = priceOf(state, serviceIds);
  const depositAmount = tenant.deposit.enabled
    ? tenant.deposit.mode === "percent"
      ? Math.round((total * tenant.deposit.value) / 100)
      : tenant.deposit.value
    : 0;

  const clientValid = Boolean(
    client.clientId ?? (client.name.trim() && client.phone.trim()),
  );
  const valid =
    clientValid &&
    serviceIds.length > 0 &&
    Boolean(time) &&
    Boolean(activeStaffId);

  function toggleService(id: string) {
    setServiceIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
    setTime(null);
  }

  const title = t("panel.calendar.newVisit");

  const body = (
    <div className="space-y-5">
      <ClientCombobox
        clients={state.clients.filter((entry) => entry.tenantId === tenant.id)}
        value={client}
        onChange={setClient}
      />

      <Field
        label={t("common.service")}
        required
        hint={
          serviceIds.length > 0
            ? `${formatDuration(minutes, locale)} · ${money(total, locale)}`
            : undefined
        }
      >
        <div className="thin-scrollbar flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
          {services.map((service) => (
            <Chip
              key={service.id}
              active={serviceIds.includes(service.id)}
              onClick={() => toggleService(service.id)}
            >
              {tl(service.name)}
            </Chip>
          ))}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("common.staff")} required htmlFor="visit-staff">
          <Select
            id="visit-staff"
            value={activeStaffId}
            onChange={(event) => {
              setStaffId(event.target.value);
              setTime(null);
            }}
            placeholder={t("common.select")}
            options={team.map((member) => ({
              value: member.id,
              label: member.name,
            }))}
          />
        </Field>

        {rooms.length > 0 ? (
          <Field label={t("panel.calendar.room")} htmlFor="visit-room">
            <Select
              id="visit-room"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              options={[
                { value: "", label: t("common.none") },
                ...rooms.map((room) => ({
                  value: room.id,
                  label: tl(room.name),
                })),
              ]}
            />
          </Field>
        ) : null}
      </div>

      <Field label={t("common.date")} required htmlFor="visit-date">
        <Input
          id="visit-date"
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setTime(null);
          }}
        />
      </Field>

      <Field label={t("common.time")} required>
        {available.length === 0 ? (
          <EmptyState compact title={t("company.noSlots")} />
        ) : (
          <div className="thin-scrollbar grid max-h-48 grid-cols-4 gap-2 overflow-y-auto pr-1">
            {available.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => setTime(slot.time)}
                aria-pressed={time === slot.time}
                className={cn(
                  "tabular h-10 rounded-md border text-[13px] font-medium transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25",
                  time === slot.time
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-card text-ink hover:border-line-strong hover:bg-sand-50",
                )}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </Field>

      <Field label={t("common.note")} htmlFor="visit-note">
        <Textarea
          id="visit-note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("booking.notePlaceholder")}
        />
      </Field>

      {tenant.deposit.enabled ? (
        <Switch
          checked={deposit}
          onCheckedChange={setDeposit}
          label={`${t("panel.calendar.deposit")} · ${money(depositAmount, locale)}`}
        />
      ) : null}
    </div>
  );

  const footer = (
    <div className="flex gap-2">
      <Button variant="secondary" block onClick={() => onOpenChange(false)}>
        {t("common.cancel")}
      </Button>
      <Button
        block
        disabled={!valid}
        onClick={() => {
          if (!valid || !time) return;
          onCreate({
            client,
            serviceIds,
            staffId: activeStaffId,
            roomId: roomId || null,
            date,
            time,
            note: note.trim(),
            deposit,
          });
        }}
      >
        {t("common.add")}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        size="lg"
        footer={footer}
        closeLabel={t("common.close")}
      >
        {body}
      </Modal>
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={footer}
    >
      {body}
    </Sheet>
  );
}
