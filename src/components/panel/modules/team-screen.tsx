"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Minus, Plus, Trash, UserPlus } from "lucide-react";

import { usePanelSession } from "@/components/layout";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Field,
  IconButton,
  Input,
  Modal,
  Progress,
  Rating,
  Select,
  Switch,
} from "@/components/ui";
import { BRAND_THEMES } from "@/lib/brand";
import { staffOf, useDataState, useHydrated, useKalendo } from "@/lib/data";
import { dayMonth, weekdayHeaders } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { BrandKey, CalendarBlock, Staff, Tenant } from "@/lib/types";
import { hashRatio, initialsOf, makeId, range } from "@/lib/utils";

import { ModuleHeader } from "./module-header";
import { ModuleSkeleton } from "./module-skeleton";
import { plainText, timeOptions } from "./helpers";

/* ------------------------------------------------------------------ */

export function TeamScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <ModuleSkeleton rows={4} />;
  return <Team tenant={tenant} />;
}

/* ------------------------------------------------------------------ */

interface DayRow {
  weekday: number;
  enabled: boolean;
  open: string;
  close: string;
}

type ScheduleMap = Record<string, DayRow[]>;

const PERMISSION_ROLES = ["owner", "manager", "specialist", "reception"] as const;
type PermissionRole = (typeof PERMISSION_ROLES)[number];

const PERMISSION_ROWS: { key: string; labelKey: string; roles: PermissionRole[] }[] = [
  { key: "calendar", labelKey: "nav.calendar", roles: ["owner", "manager", "specialist", "reception"] },
  { key: "clients", labelKey: "nav.clients", roles: ["owner", "manager", "specialist", "reception"] },
  { key: "services", labelKey: "nav.services", roles: ["owner", "manager"] },
  { key: "payments", labelKey: "nav.payments", roles: ["owner", "manager", "reception"] },
  { key: "reports", labelKey: "nav.reports", roles: ["owner", "manager"] },
  { key: "settings", labelKey: "nav.settings", roles: ["owner"] },
];

const AVATAR_PALETTE: BrandKey[] = ["cobalt", "green", "orange", "violet", "rose"];

function scheduleFor(tenant: Tenant): DayRow[] {
  return range(7, 1).map((weekday) => {
    const hours = tenant.openingHours.find((item) => item.weekday === weekday);
    return {
      weekday,
      enabled: Boolean(hours?.open && hours.close),
      open: hours?.open ?? "09:00",
      close: hours?.close ?? "17:00",
    };
  });
}

function Team({ tenant }: { tenant: Tenant }) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();

  const team = useMemo(() => staffOf(state, tenant.id), [state, tenant.id]);
  const blocks = state.blocks;

  const [schedules, setSchedules] = useState<ScheduleMap>({});
  const [editing, setEditing] = useState<Staff | null>(null);
  const [adding, setAdding] = useState(false);

  const averageUtilization = team.length
    ? Math.round(
        team.reduce((total, member) => total + member.utilization, 0) /
          team.length,
      )
    : 0;

  function scheduleOf(staffId: string): DayRow[] {
    return schedules[staffId] ?? scheduleFor(tenant);
  }

  function saveSchedule(staffId: string, rows: DayRow[]) {
    setSchedules((current) => ({ ...current, [staffId]: rows }));
    setEditing(null);
    toast.success(t("toast.saved"));
  }

  function addTimeOff(staffId: string, from: string, to: string, label: string) {
    const block: CalendarBlock = {
      id: makeId("blk"),
      tenantId: tenant.id,
      staffId,
      start: `${from}T00:00:00`,
      end: `${to}T23:59:00`,
      kind: "holiday",
      label: plainText(label.trim() || t("panel.calendar.holiday")),
    };
    useKalendo.setState((current) => ({ blocks: [...current.blocks, block] }));
    toast.success(t("toast.saved"));
  }

  function removeTimeOff(id: string) {
    useKalendo.setState((current) => ({
      blocks: current.blocks.filter((block) => block.id !== id),
    }));
    toast.success(t("common.done"));
  }

  function addMember(name: string, role: string) {
    const brand = AVATAR_PALETTE[
      Math.floor(hashRatio(name) * AVATAR_PALETTE.length) %
        AVATAR_PALETTE.length
    ];
    const member: Staff = {
      id: makeId("stf"),
      tenantId: tenant.id,
      name,
      initials: initialsOf(name),
      role: plainText(role.trim() || t("common.staff")),
      rating: 5,
      avatarColor: BRAND_THEMES[brand].base,
      utilization: 0,
      bookedHoursToday: 0,
      availableHoursToday: 8,
      locationId: tenant.locations[0]?.id ?? "",
    };
    useKalendo.setState((current) => ({ staff: [...current.staff, member] }));
    setAdding(false);
    toast.success(t("toast.saved"));
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <ModuleHeader
        title={
          <>
            {t("panel.team.title")} <em>{t("panel.team.andSchedule")}</em>
          </>
        }
        subtitle={t("panel.team.subtitle", {
          count: team.length,
          utilization: averageUtilization,
        })}
        action={
          <Button iconLeft={UserPlus} onClick={() => setAdding(true)}>
            {t("panel.team.addMember")}
          </Button>
        }
      />

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {team.map((member) => (
          <li key={member.id}>
            <button
              type="button"
              onClick={() => setEditing(member)}
              className="surface w-full p-5 text-left transition-shadow duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  name={member.name}
                  color={member.avatarColor}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-semibold text-ink">
                      {member.name}
                    </span>
                    {member.isOwner && (
                      <Badge size="sm" tone="ink">
                        {t("panel.team.owner")}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-[13px] text-muted">
                    {tl(member.role)}
                  </p>
                  <Rating
                    value={member.rating}
                    size="sm"
                    showValue
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[12px]">
                  <span className="text-muted">
                    {t("panel.team.utilization")}
                  </span>
                  <span className="tabular font-medium text-ink">
                    {t("panel.team.workload", {
                      booked: member.bookedHoursToday,
                      available: member.availableHoursToday,
                    })}
                  </span>
                </div>
                <Progress
                  value={member.utilization}
                  tone={member.utilization > 90 ? "ink" : "brand"}
                />
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Card>
        <CardHeader bordered>
          <CardTitle as="h2" hint={t("panel.team.permissionsHint")}>
            {t("panel.team.permissions")}
          </CardTitle>
        </CardHeader>
        {/* `relative` keeps the sr-only spans inside the scroller — absolutely
            positioned descendants otherwise widen the document. */}
        <CardBody className="relative overflow-x-auto p-0">
          <table className="w-full min-w-[520px] border-collapse text-[14px]">
            <caption className="sr-only">{t("panel.team.permissions")}</caption>
            <thead>
              <tr className="border-b border-line">
                <th
                  scope="col"
                  className="px-5 py-3 text-left text-[12px] font-medium text-muted"
                >
                  {t("panel.team.role")}
                </th>
                {PERMISSION_ROLES.map((role) => (
                  <th
                    key={role}
                    scope="col"
                    className="px-3 py-3 text-center text-[12px] font-medium text-muted"
                  >
                    {t(`panel.team.roles.${role}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_ROWS.map((row) => (
                <tr key={row.key} className="border-b border-line/70 last:border-0">
                  <th
                    scope="row"
                    className="px-5 py-3 text-left font-normal text-ink"
                  >
                    {t(row.labelKey)}
                  </th>
                  {PERMISSION_ROLES.map((role) => {
                    const allowed = row.roles.includes(role);
                    return (
                      <td key={role} className="px-3 py-3 text-center">
                        <span className="sr-only">
                          {allowed ? t("common.yes") : t("common.no")}
                        </span>
                        {allowed ? (
                          <Check
                            aria-hidden
                            className="mx-auto size-4 text-success"
                            strokeWidth={2.5}
                          />
                        ) : (
                          <Minus
                            aria-hidden
                            className="mx-auto size-4 text-sand-300"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {editing && (
        <ScheduleModal
          member={editing}
          rows={scheduleOf(editing.id)}
          timeOff={blocks.filter(
            (block) =>
              block.staffId === editing.id &&
              (block.kind === "holiday" || block.kind === "absence"),
          )}
          labelOf={(block) => tl(block.label)}
          dayLabels={weekdayHeaders(locale)}
          formatDate={(iso) => dayMonth(iso, locale)}
          onAddTimeOff={(from, to, label) =>
            addTimeOff(editing.id, from, to, label)
          }
          onRemoveTimeOff={removeTimeOff}
          onClose={() => setEditing(null)}
          onSave={(rows) => saveSchedule(editing.id, rows)}
        />
      )}

      {adding && (
        <AddMemberModal onClose={() => setAdding(false)} onSave={addMember} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface ScheduleModalProps {
  member: Staff;
  rows: DayRow[];
  timeOff: CalendarBlock[];
  labelOf: (block: CalendarBlock) => string;
  dayLabels: string[];
  formatDate: (iso: string) => string;
  onAddTimeOff: (from: string, to: string, label: string) => void;
  onRemoveTimeOff: (id: string) => void;
  onClose: () => void;
  onSave: (rows: DayRow[]) => void;
}

function ScheduleModal({
  member,
  rows,
  timeOff,
  labelOf,
  dayLabels,
  formatDate,
  onAddTimeOff,
  onRemoveTimeOff,
  onClose,
  onSave,
}: ScheduleModalProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(rows);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [label, setLabel] = useState("");

  const options = useMemo(
    () => timeOptions(30).map((time) => ({ value: time, label: time })),
    [],
  );

  function patch(weekday: number, next: Partial<DayRow>) {
    setDraft((current) =>
      current.map((row) =>
        row.weekday === weekday ? { ...row, ...next } : row,
      ),
    );
  }

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="lg"
      closeLabel={t("common.close")}
      title={`${t("panel.team.weeklySchedule")} — ${member.name}`}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" block onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button block onClick={() => onSave(draft)}>
            {t("common.saveChanges")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <ul className="flex flex-col gap-2">
          {draft.map((row, index) => (
            <li
              key={row.weekday}
              className="surface-flat flex flex-wrap items-center gap-3 p-3"
            >
              <span className="w-10 shrink-0 text-[13px] font-medium text-ink">
                {dayLabels[index]}
              </span>
              <Switch
                checked={row.enabled}
                onCheckedChange={(next) => patch(row.weekday, { enabled: next })}
                aria-label={`${dayLabels[index]} — ${t("panel.team.schedule")}`}
              />
              {row.enabled ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Select
                    className="h-9 text-[13px]"
                    aria-label={`${dayLabels[index]} — ${t("common.from")}`}
                    options={options}
                    value={row.open}
                    onChange={(event) =>
                      patch(row.weekday, { open: event.target.value })
                    }
                  />
                  <span aria-hidden className="text-muted">
                    –
                  </span>
                  <Select
                    className="h-9 text-[13px]"
                    aria-label={`${dayLabels[index]} — ${t("common.to")}`}
                    options={options}
                    value={row.close}
                    onChange={(event) =>
                      patch(row.weekday, { close: event.target.value })
                    }
                  />
                </div>
              ) : (
                <span className="flex-1 text-[13px] text-muted">
                  {t("panel.team.dayOff")}
                </span>
              )}
            </li>
          ))}
        </ul>

        <section className="flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold text-ink">
            {t("panel.team.timeOff")}
          </h3>

          {timeOff.length === 0 ? (
            <p className="text-[13px] text-muted">{t("panel.team.noTimeOff")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {timeOff.map((block) => (
                <li
                  key={block.id}
                  className="surface-flat flex items-center gap-3 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {labelOf(block)}
                    </p>
                    <p className="tabular text-[12px] text-muted">
                      {formatDate(block.start.slice(0, 10))} –{" "}
                      {formatDate(block.end.slice(0, 10))}
                    </p>
                  </div>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label={t("panel.team.removeTimeOff")}
                    onClick={() => onRemoveTimeOff(block.id)}
                  >
                    <Trash />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}

          <div className="surface-flat flex flex-col gap-3 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("common.from")} htmlFor="timeoff-from">
                <Input
                  id="timeoff-from"
                  type="date"
                  className="tabular"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </Field>
              <Field label={t("common.to")} htmlFor="timeoff-to">
                <Input
                  id="timeoff-to"
                  type="date"
                  className="tabular"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </Field>
            </div>
            <Field label={t("common.note")} htmlFor="timeoff-label">
              <Input
                id="timeoff-label"
                value={label}
                placeholder={t("panel.calendar.holiday")}
                onChange={(event) => setLabel(event.target.value)}
              />
            </Field>
            <Button
              variant="secondary"
              iconLeft={Plus}
              disabled={!from || !to || to < from}
              onClick={() => {
                onAddTimeOff(from, to, label);
                setFrom("");
                setTo("");
                setLabel("");
              }}
            >
              {t("panel.team.addTimeOff")}
            </Button>
          </div>
        </section>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */

interface AddMemberModalProps {
  onClose: () => void;
  onSave: (name: string, role: string) => void;
}

function AddMemberModal({ onClose, onSave }: AddMemberModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="sm"
      closeLabel={t("common.close")}
      title={t("panel.team.addMember")}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" block onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            block
            disabled={name.trim().length === 0}
            onClick={() => onSave(name.trim(), role)}
          >
            {t("common.add")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t("common.name")} htmlFor="member-name" required>
          <Input
            id="member-name"
            value={name}
            autoComplete="name"
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label={t("panel.team.role")} htmlFor="member-role">
          <Input
            id="member-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
        </Field>
        <Field
          label={t("common.email")}
          htmlFor="member-email"
          hint={t("panel.team.invite")}
        >
          <Input
            id="member-email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
