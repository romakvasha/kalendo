"use client";

import { Plus, X } from "lucide-react";

import { Avatar, Badge, Button, Card, IconButton, Input, KeyValue } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { makeId } from "@/lib/utils";
import type { MemberDraft, OnboardingDraft } from "./draft";

export interface StepTeamProps {
  draft: OnboardingDraft;
  team: MemberDraft[];
  onChange: (team: MemberDraft[]) => void;
}

export function StepTeam({ draft, team, onChange }: StepTeamProps) {
  const t = useT();

  const patch = (id: string, next: Partial<MemberDraft>) =>
    onChange(team.map((member) => (member.id === id ? { ...member, ...next } : member)));

  const openDays = draft.hours.filter((day) => day.open).length;

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {team.map((member) => (
          <li
            key={member.id}
            className="rounded-lg border border-line bg-white p-3 sm:flex sm:items-end sm:gap-3 sm:p-3.5"
          >
            <div className="flex items-center gap-3 sm:hidden">
              <Avatar name={member.name || "?"} size="sm" />
              {member.owner ? (
                <Badge tone="neutral" size="sm">
                  {t("onboarding.owner")}
                </Badge>
              ) : null}
            </div>

            <div className="mt-3 min-w-0 flex-1 sm:mt-0">
              <label
                htmlFor={`${member.id}-name`}
                className="mb-1.5 block text-[12px] font-medium text-sand-600"
              >
                {t("common.name")}
              </label>
              <Input
                id={`${member.id}-name`}
                value={member.name}
                onChange={(event) => patch(member.id, { name: event.target.value })}
                className="h-10"
                autoComplete="off"
              />
            </div>

            <div className="mt-3 flex items-end gap-3 sm:mt-0 sm:w-[210px] sm:shrink-0">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor={`${member.id}-role`}
                  className="mb-1.5 block text-[12px] font-medium text-sand-600"
                >
                  {t("onboarding.memberRole")}
                </label>
                <Input
                  id={`${member.id}-role`}
                  value={member.role}
                  onChange={(event) => patch(member.id, { role: event.target.value })}
                  className="h-10"
                  autoComplete="off"
                />
              </div>

              {member.owner ? (
                <span className="hidden size-9 shrink-0 sm:block" aria-hidden />
              ) : (
                <IconButton
                  size="sm"
                  className="mb-0.5 shrink-0"
                  aria-label={`${t("common.remove")} — ${member.name}`}
                  onClick={() =>
                    onChange(team.filter((item) => item.id !== member.id))
                  }
                >
                  <X />
                </IconButton>
              )}
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
            ...team,
            { id: makeId("stf"), name: "", role: "", owner: false },
          ])
        }
      >
        {t("onboarding.addMember")}
      </Button>

      <Card flat className="mt-6 p-5">
        <h2 className="font-display text-[20px] leading-tight text-ink">
          {t("booking.summary")}
        </h2>
        <div className="mt-3 divide-y divide-line">
          <KeyValue
            label={t("onboarding.companyName")}
            value={draft.companyName || "—"}
          />
          <KeyValue
            label={t("auth.industry")}
            value={t(`onboarding.industries.${draft.industry}`)}
          />
          <KeyValue
            label={t("onboarding.linkTitle")}
            value={`${draft.slug}.kalendo.pl`}
          />
          <KeyValue label={t("nav.services")} value={draft.services.length} />
          <KeyValue label={t("onboarding.steps.hours")} value={openDays} />
          <KeyValue label={t("nav.team")} value={team.length} />
        </div>
      </Card>
    </div>
  );
}
