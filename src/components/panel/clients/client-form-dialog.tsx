"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useIsDesktop } from "@/components/panel/calendar";
import {
  Button,
  Checkbox,
  Field,
  Input,
  Modal,
  PhoneInput,
  Select,
  Sheet,
  Textarea,
} from "@/components/ui";
import { staffOf, useDataState, useKalendo } from "@/lib/data";
import { TODAY } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { initialsOf, makeId } from "@/lib/utils";
import type { Client, RodoConsent } from "@/lib/types";

import { consentTemplates } from "./helpers";

const PHONE_PREFIX = /^(\+\d{1,3})\s*(.*)$/;

function splitPhone(phone: string): { prefix: string; rest: string } {
  const match = PHONE_PREFIX.exec(phone.trim());
  if (!match) return { prefix: "+48", rest: phone.trim() };
  return { prefix: match[1], rest: match[2] };
}

export interface ClientFormDialogProps {
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent for a brand-new record. */
  client?: Client;
  onSaved?: (client: Client) => void;
}

export function ClientFormDialog({
  tenantId,
  open,
  onOpenChange,
  client,
  onSaved,
}: ClientFormDialogProps) {
  const { t, tl } = useI18n();
  const isDesktop = useIsDesktop();
  const state = useDataState();
  const upsertClient = useKalendo((store) => store.upsertClient);

  const initialPhone = splitPhone(client?.phone ?? "");
  const templates = useMemo(
    () => consentTemplates(state, tenantId, client),
    [state, tenantId, client],
  );
  const team = useMemo(() => staffOf(state, tenantId), [state, tenantId]);

  const [name, setName] = useState(client?.name ?? "");
  const [prefix, setPrefix] = useState(initialPhone.prefix);
  const [phone, setPhone] = useState(initialPhone.rest);
  const [email, setEmail] = useState(client?.email ?? "");
  const [birthday, setBirthday] = useState(client?.birthday ?? "");
  const [staffId, setStaffId] = useState(client?.preferredStaffId ?? "");
  const [note, setNote] = useState(client?.notes ? tl(client.notes) : "");
  const [granted, setGranted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      templates.map((template, index) => [
        template.id,
        client ? template.granted : index === 0,
      ]),
    ),
  );

  const requiredConsentId = templates[0]?.id;
  const ready =
    name.trim().length > 1 &&
    phone.trim().length > 4 &&
    (!requiredConsentId || granted[requiredConsentId]);

  function close() {
    onOpenChange(false);
  }

  function submit() {
    if (!ready) return;

    const trimmedNote = note.trim();
    const consents: RodoConsent[] = templates.map((template) => {
      const isGranted = granted[template.id] ?? false;
      const previous = client?.consents.find((item) => item.id === template.id);
      return {
        id: template.id,
        label: template.label,
        granted: isGranted,
        grantedAt: isGranted ? (previous?.grantedAt ?? TODAY) : undefined,
      };
    });

    const next: Client = {
      id: client?.id ?? makeId("cl"),
      tenantId,
      name: name.trim(),
      initials: initialsOf(name.trim()),
      phone: `${prefix} ${phone.trim()}`.trim(),
      email: email.trim() || undefined,
      since: client?.since ?? TODAY,
      tags: client?.tags ?? ["new"],
      preferredStaffId: staffId || undefined,
      visitCount: client?.visitCount ?? 0,
      totalSpent: client?.totalSpent ?? 0,
      noShows: client?.noShows ?? 0,
      birthday: birthday || undefined,
      notes: trimmedNote
        ? { pl: trimmedNote, en: trimmedNote, uk: trimmedNote }
        : undefined,
      alert: client?.alert,
      consents,
      photoCount: client?.photoCount ?? 0,
      loyaltyPoints: client?.loyaltyPoints,
    };

    upsertClient(next);
    toast.success(t(client ? "toast.saved" : "toast.clientAdded"));
    onSaved?.(next);
    close();
  }

  const title = t(client ? "panel.clients.editClient" : "panel.clients.newClient");

  const body = (
    <div className="flex flex-col gap-4">
      <Field label={t("common.name")} htmlFor="client-name" required>
        <Input
          id="client-name"
          value={name}
          autoComplete="name"
          placeholder={t("common.name")}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>

      <Field label={t("common.phone")} htmlFor="client-phone" required>
        <PhoneInput
          id="client-phone"
          value={phone}
          prefix={prefix}
          onPrefixChange={setPrefix}
          placeholder="512 340 118"
          onChange={(event) => setPhone(event.target.value)}
        />
      </Field>

      <Field label={t("common.email")} htmlFor="client-email">
        <Input
          id="client-email"
          type="email"
          value={email}
          autoComplete="email"
          placeholder="klient@example.com"
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("panel.clients.birthday")} htmlFor="client-birthday">
          <Input
            id="client-birthday"
            type="date"
            value={birthday}
            onChange={(event) => setBirthday(event.target.value)}
          />
        </Field>

        <Field
          label={t("panel.clients.preferredStaff")}
          htmlFor="client-staff"
        >
          <Select
            id="client-staff"
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
            options={[
              { value: "", label: t("common.none") },
              ...team.map((member) => ({
                value: member.id,
                label: member.name,
              })),
            ]}
          />
        </Field>
      </div>

      <Field label={t("panel.clients.notes")} htmlFor="client-note">
        <Textarea
          id="client-note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>

      {templates.length > 0 && (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-line bg-sand-50 p-4">
          <legend className="px-1 text-[13px] font-medium text-sand-700">
            {t("panel.clients.consents")}
          </legend>
          {templates.map((template, index) => (
            <Checkbox
              key={template.id}
              checked={granted[template.id] ?? false}
              label={tl(template.label)}
              onChange={(event) =>
                setGranted((current) => ({
                  ...current,
                  [template.id]: event.target.checked,
                }))
              }
              required={index === 0}
            />
          ))}
        </fieldset>
      )}
    </div>
  );

  const footer = (
    <div className="flex gap-2">
      <Button variant="secondary" block onClick={close}>
        {t("common.cancel")}
      </Button>
      <Button block disabled={!ready} onClick={submit}>
        {t("common.save")}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        size="md"
        footer={footer}
        closeLabel={t("common.close")}
      >
        {body}
      </Modal>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} footer={footer}>
      {body}
    </Sheet>
  );
}
