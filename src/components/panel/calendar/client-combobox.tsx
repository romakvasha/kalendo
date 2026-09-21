"use client";

import { useId, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";

import { useT } from "@/lib/i18n";
import type { Client } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, Button, Field, Input, PhoneInput } from "@/components/ui";

const MAX_MATCHES = 6;

export interface ClientPick {
  clientId: string | null;
  name: string;
  phone: string;
  email: string;
}

export const EMPTY_CLIENT: ClientPick = {
  clientId: null,
  name: "",
  phone: "",
  email: "",
};

export interface ClientComboboxProps {
  clients: Client[];
  value: ClientPick;
  onChange: (value: ClientPick) => void;
}

export function ClientCombobox({
  clients,
  value,
  onChange,
}: ClientComboboxProps) {
  const t = useT();
  const listId = useId();
  const inputId = useId();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState(false);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients.slice(0, MAX_MATCHES);
    return clients
      .filter(
        (client) =>
          client.name.toLowerCase().includes(needle) ||
          client.phone.replace(/\s/g, "").includes(needle.replace(/\s/g, "")),
      )
      .slice(0, MAX_MATCHES);
  }, [clients, query]);

  const optionCount = matches.length + 1;

  function pick(index: number) {
    if (index >= matches.length) {
      setCreating(true);
      setOpen(false);
      onChange({ clientId: null, name: query.trim(), phone: "", email: "" });
      return;
    }
    const client = matches[index];
    onChange({
      clientId: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email ?? "",
    });
    setOpen(false);
    setQuery("");
  }

  if (value.clientId) {
    const client = clients.find((entry) => entry.id === value.clientId);
    return (
      <Field label={t("common.client")} required>
        <div className="flex items-center gap-3 rounded-md border border-line bg-white px-3 py-2">
          <Avatar name={value.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-ink">
              {value.name}
            </p>
            <p className="tabular truncate text-[12px] text-muted">
              {client?.phone ?? value.phone}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onChange(EMPTY_CLIENT);
              setCreating(false);
              setQuery("");
            }}
          >
            {t("booking.change")}
          </Button>
        </div>
      </Field>
    );
  }

  if (creating) {
    return (
      <div className="space-y-3">
        <Field
          label={t("panel.clients.newClient")}
          required
          htmlFor={`${inputId}-name`}
        >
          <Input
            id={`${inputId}-name`}
            value={value.name}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
            placeholder={t("common.name")}
            autoComplete="off"
          />
        </Field>
        <Field label={t("common.phone")} required htmlFor={`${inputId}-phone`}>
          <PhoneInput
            id={`${inputId}-phone`}
            value={value.phone}
            onChange={(event) =>
              onChange({ ...value, phone: event.target.value })
            }
            placeholder="600 000 000"
          />
        </Field>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setCreating(false);
            onChange(EMPTY_CLIENT);
          }}
        >
          {t("common.back")}
        </Button>
      </div>
    );
  }

  return (
    <Field label={t("common.client")} required htmlFor={inputId}>
      <div className="relative">
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={query}
          placeholder={t("panel.clients.searchPlaceholder")}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((index) => (index + 1) % optionCount);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActive((index) => (index - 1 + optionCount) % optionCount);
            } else if (event.key === "Enter" && open) {
              event.preventDefault();
              pick(active);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />

        {open ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-[calc(100%+4px)] z-40 max-h-64 overflow-y-auto rounded-md border border-line bg-white py-1 shadow-lg"
          >
            {matches.map((client, index) => (
              <li key={client.id}>
                <button
                  type="button"
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={active === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(index)}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left",
                    active === index ? "bg-sand-100" : "hover:bg-sand-50",
                  )}
                >
                  <Avatar name={client.name} size="xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-ink">
                      {client.name}
                    </span>
                    <span className="tabular block truncate text-[12px] text-muted">
                      {client.phone}
                    </span>
                  </span>
                </button>
              </li>
            ))}

            <li>
              <button
                type="button"
                id={`${listId}-${matches.length}`}
                role="option"
                aria-selected={active === matches.length}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(matches.length)}
                onMouseEnter={() => setActive(matches.length)}
                className={cn(
                  "flex w-full items-center gap-2.5 border-t border-line px-3 py-2.5 text-left text-[14px] font-medium text-cobalt",
                  active === matches.length
                    ? "bg-cobalt-soft/50"
                    : "hover:bg-sand-50",
                )}
              >
                <UserPlus aria-hidden className="size-4" />
                {t("panel.clients.newClient")}
              </button>
            </li>
          </ul>
        ) : null}
      </div>
    </Field>
  );
}
