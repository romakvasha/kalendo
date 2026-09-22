"use client";

import { Plus, X } from "lucide-react";

import { Button, IconButton, Input, Select } from "@/components/ui";
import { duration as formatDuration } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { makeId } from "@/lib/utils";
import type { ServiceDraft } from "./draft";

const DURATIONS = [15, 20, 30, 45, 60, 90, 120, 150, 180];

export interface StepServicesProps {
  services: ServiceDraft[];
  onChange: (services: ServiceDraft[]) => void;
}

export function StepServices({ services, onChange }: StepServicesProps) {
  const { t, locale } = useI18n();

  const patch = (id: string, next: Partial<ServiceDraft>) =>
    onChange(
      services.map((service) =>
        service.id === id ? { ...service, ...next } : service,
      ),
    );

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {services.map((service) => (
          <li
            key={service.id}
            className="rounded-lg border border-line bg-card p-3 sm:flex sm:items-end sm:gap-3 sm:p-3.5"
          >
            <div className="min-w-0 flex-1">
              <label
                htmlFor={`${service.id}-name`}
                className="mb-1.5 block text-[12px] font-medium text-sand-600"
              >
                {t("common.service")}
              </label>
              <Input
                id={`${service.id}-name`}
                value={service.name}
                onChange={(event) => patch(service.id, { name: event.target.value })}
                className="h-10"
              />
            </div>

            <div className="mt-3 flex items-end gap-3 sm:mt-0 sm:shrink-0">
              <div className="w-1/2 sm:w-[124px]">
                <label
                  htmlFor={`${service.id}-duration`}
                  className="mb-1.5 block text-[12px] font-medium text-sand-600"
                >
                  {t("common.duration")}
                </label>
                <Select
                  id={`${service.id}-duration`}
                  value={String(service.durationMin)}
                  onChange={(event) =>
                    patch(service.id, { durationMin: Number(event.target.value) })
                  }
                  className="h-10"
                  options={DURATIONS.map((minutes) => ({
                    value: String(minutes),
                    label: formatDuration(minutes, locale),
                  }))}
                />
              </div>

              <div className="w-1/2 sm:w-[108px]">
                <label
                  htmlFor={`${service.id}-price`}
                  className="mb-1.5 block text-[12px] font-medium text-sand-600"
                >
                  {t("common.price")}
                </label>
                <div className="relative">
                  <Input
                    id={`${service.id}-price`}
                    type="number"
                    min={0}
                    step={5}
                    inputMode="numeric"
                    value={service.price}
                    onChange={(event) =>
                      patch(service.id, { price: Number(event.target.value) || 0 })
                    }
                    className="tabular h-10 pr-8"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px] text-sand-500"
                  >
                    zł
                  </span>
                </div>
              </div>

              <IconButton
                size="sm"
                className="mb-0.5 shrink-0"
                aria-label={`${t("common.remove")} — ${service.name}`}
                onClick={() =>
                  onChange(services.filter((item) => item.id !== service.id))
                }
              >
                <X />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        className="mt-3"
        iconLeft={Plus}
        onClick={() =>
          onChange([
            ...services,
            { id: makeId("svc"), name: "", durationMin: 60, price: 0 },
          ])
        }
      >
        {t("onboarding.addService")}
      </Button>
    </div>
  );
}
