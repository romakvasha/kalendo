"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, FolderPlus, Pencil, Plus, Star, Tag } from "lucide-react";

import { ShareBars } from "@/components/charts";
import { usePanelSession } from "@/components/layout";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  Segmented,
  Select,
  Switch,
  Tooltip,
} from "@/components/ui";
import { SERVICE_COLORS, SERVICE_COLOR_KEYS } from "@/lib/brand";
import {
  categoriesOf,
  servicesOf,
  staffOf,
  useDataState,
  useHydrated,
  useKalendo,
} from "@/lib/data";
import { duration as formatDuration, money } from "@/lib/format";
import { LOCALE_LABELS, useI18n } from "@/lib/i18n";
import { LOCALES, type Locale, type LocalizedText, type Service, type ServiceColor, type Tenant } from "@/lib/types";
import { cn, makeId } from "@/lib/utils";

import { ModuleHeader } from "./module-header";
import { ModuleSkeleton } from "./module-skeleton";
import { plainText, serviceRevenue } from "./helpers";

/* ------------------------------------------------------------------ */

export function ServicesScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <ModuleSkeleton rows={5} />;
  return <Services tenant={tenant} />;
}

/* ------------------------------------------------------------------ */

interface ServiceDraft {
  id: string | null;
  categoryId: string;
  name: LocalizedText;
  durationMin: number;
  price: number;
  priceFrom: boolean;
  color: ServiceColor;
  staffIds: string[];
  deposit: string;
  online: boolean;
  popular: boolean;
}

function emptyDraft(categoryId: string): ServiceDraft {
  return {
    id: null,
    categoryId,
    name: { pl: "", en: "", uk: "" },
    durationMin: 60,
    price: 100,
    priceFrom: false,
    color: "sky",
    staffIds: [],
    deposit: "",
    online: false,
    popular: false,
  };
}

function draftOf(service: Service): ServiceDraft {
  return {
    id: service.id,
    categoryId: service.categoryId,
    name: { ...service.name },
    durationMin: service.durationMin,
    price: service.price,
    priceFrom: service.priceFrom ?? false,
    color: service.color,
    staffIds: [...service.staffIds],
    deposit: service.depositAmount ? String(service.depositAmount) : "",
    online: service.online ?? false,
    popular: service.popular ?? false,
  };
}

function Services({ tenant }: { tenant: Tenant }) {
  const { t, tl, locale } = useI18n();
  const state = useDataState();

  const categories = useMemo(
    () => categoriesOf(state, tenant.id),
    [state, tenant.id],
  );
  const services = useMemo(
    () => servicesOf(state, tenant.id),
    [state, tenant.id],
  );
  const team = useMemo(() => staffOf(state, tenant.id), [state, tenant.id]);
  const ranking = useMemo(
    () => serviceRevenue(state, tenant.id).filter((item) => item.revenue > 0).slice(0, 8),
    [state, tenant.id],
  );

  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [draft, setDraft] = useState<ServiceDraft | null>(null);
  const [categoryName, setCategoryName] = useState<LocalizedText | null>(null);

  function toggleCategory(id: string) {
    setCollapsed((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function saveService(next: ServiceDraft) {
    const deposit = Number(next.deposit);
    const patch = {
      categoryId: next.categoryId,
      name: next.name,
      durationMin: next.durationMin,
      price: next.price,
      priceFrom: next.priceFrom || undefined,
      color: next.color,
      staffIds: next.staffIds,
      online: next.online || undefined,
      popular: next.popular || undefined,
      depositAmount: Number.isFinite(deposit) && deposit > 0 ? deposit : undefined,
    };

    useKalendo.setState((current) => ({
      services: next.id
        ? current.services.map((service) =>
            service.id === next.id ? { ...service, ...patch } : service,
          )
        : [
            ...current.services,
            { id: makeId("svc"), tenantId: tenant.id, ...patch },
          ],
    }));

    setDraft(null);
    toast.success(t("toast.saved"));
  }

  function saveCategory(name: LocalizedText) {
    useKalendo.setState((current) => ({
      categories: [
        ...current.categories,
        { id: makeId("cat"), tenantId: tenant.id, name },
      ],
    }));
    setCategoryName(null);
    toast.success(t("toast.saved"));
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <ModuleHeader
        title={
          <>
            {t("panel.services.title")} <em>{t("panel.services.andPricing")}</em>
          </>
        }
        subtitle={t("panel.services.subtitle", {
          services: services.length,
          categories: categories.length,
        })}
        action={
          <>
            <Button
              variant="secondary"
              iconLeft={FolderPlus}
              onClick={() => setCategoryName({ pl: "", en: "", uk: "" })}
            >
              {t("panel.services.addCategory")}
            </Button>
            <Button
              variant="primary"
              iconLeft={Plus}
              onClick={() => setDraft(emptyDraft(categories[0]?.id ?? ""))}
            >
              {t("panel.services.addService")}
            </Button>
          </>
        }
      />

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={Tag}
            title={t("panel.services.empty")}
            body={t("panel.services.emptyBody")}
            action={
              <Button
                iconLeft={Plus}
                onClick={() => setCategoryName({ pl: "", en: "", uk: "" })}
              >
                {t("panel.services.addCategory")}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((category) => {
            const rows = services.filter(
              (service) => service.categoryId === category.id,
            );
            const open = !collapsed.includes(category.id);

            return (
              <Card key={category.id} className="overflow-hidden">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-sand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt/25 lg:px-5"
                >
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "size-4 shrink-0 text-sand-500 transition-transform duration-200",
                      !open && "-rotate-90",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
                    {tl(category.name)}
                  </span>
                  <span className="tabular shrink-0 text-[12px] text-muted">
                    {rows.length}
                  </span>
                </button>

                {open && (
                  <ul className="border-t border-line">
                    {rows.length === 0 ? (
                      <li className="px-4 py-6 text-center text-[13px] text-muted lg:px-5">
                        {t("panel.services.emptyCategory")}
                      </li>
                    ) : (
                      rows.map((service) => (
                        <li
                          key={service.id}
                          className="flex items-center gap-3 border-b border-line/70 px-4 py-3 last:border-0 lg:px-5"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "h-9 w-1.5 shrink-0 rounded-full",
                              SERVICE_COLORS[service.color].bg,
                            )}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-[14px] font-medium text-ink">
                                {tl(service.name)}
                              </span>
                              {service.popular && (
                                <Tooltip content={t("panel.services.popular")}>
                                  <Star
                                    className="size-3.5 shrink-0 text-svc-sand-ink"
                                    fill="currentColor"
                                    strokeWidth={0}
                                  />
                                  <span className="sr-only">
                                    {t("panel.services.popular")}
                                  </span>
                                </Tooltip>
                              )}
                              {service.online && (
                                <Badge size="sm" tone="info">
                                  {t("panel.services.online")}
                                </Badge>
                              )}
                            </div>
                            <p className="tabular mt-0.5 text-[12px] text-muted">
                              {formatDuration(service.durationMin, locale)} ·{" "}
                              {service.priceFrom
                                ? t("common.priceFrom", {
                                    price: money(service.price, locale),
                                  })
                                : money(service.price, locale)}
                            </p>
                          </div>

                          <div className="hidden shrink-0 -space-x-2 sm:flex">
                            {(service.staffIds.length
                              ? team.filter((member) =>
                                  service.staffIds.includes(member.id),
                                )
                              : team
                            )
                              .slice(0, 4)
                              .map((member) => (
                                <Avatar
                                  key={member.id}
                                  name={member.name}
                                  color={member.avatarColor}
                                  size="xs"
                                  className="ring-2 ring-white"
                                />
                              ))}
                          </div>

                          <IconButton
                            size="sm"
                            variant="ghost"
                            aria-label={`${t("common.edit")} — ${tl(service.name)}`}
                            onClick={() => setDraft(draftOf(service))}
                          >
                            <Pencil />
                          </IconButton>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {ranking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle as="h2" hint={t("panel.services.revenueHint")}>
              {t("panel.services.revenueByService")}
            </CardTitle>
          </CardHeader>
          <CardBody className="pt-4">
            <ShareBars
              items={ranking.map((item) => ({
                label: tl(item.service.name),
                value: item.revenue,
              }))}
              format={(value) => money(value, locale)}
            />
          </CardBody>
        </Card>
      )}

      {draft && (
        <ServiceModal
          draft={draft}
          tenant={tenant}
          categories={categories.map((category) => ({
            value: category.id,
            label: tl(category.name),
          }))}
          team={team.map((member) => ({
            id: member.id,
            name: member.name,
            color: member.avatarColor,
            role: tl(member.role),
          }))}
          onClose={() => setDraft(null)}
          onSave={saveService}
        />
      )}

      {categoryName && (
        <CategoryModal
          value={categoryName}
          onChange={setCategoryName}
          onClose={() => setCategoryName(null)}
          onSave={saveCategory}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface TeamOption {
  id: string;
  name: string;
  color: string;
  role: string;
}

interface ServiceModalProps {
  draft: ServiceDraft;
  tenant: Tenant;
  categories: { value: string; label: string }[];
  team: TeamOption[];
  onClose: () => void;
  onSave: (draft: ServiceDraft) => void;
}

function ServiceModal({
  draft,
  tenant,
  categories,
  team,
  onClose,
  onSave,
}: ServiceModalProps) {
  const { t, locale } = useI18n();
  const [value, setValue] = useState(draft);
  const [tab, setTab] = useState<Locale>(locale);

  const invalid = value.name.pl.trim().length === 0;

  function patch(next: Partial<ServiceDraft>) {
    setValue((current) => ({ ...current, ...next }));
  }

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="lg"
      closeLabel={t("common.close")}
      title={
        draft.id ? t("common.edit") : t("panel.services.addService")
      }
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" block onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button block disabled={invalid} onClick={() => onSave(value)}>
            {t("common.save")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Segmented
            size="sm"
            value={tab}
            onChange={(next) => setTab(next as Locale)}
            options={LOCALES.map((item) => ({
              value: item,
              label: LOCALE_LABELS[item].short,
            }))}
          />
          <Field
            label={t("panel.services.name")}
            required
            htmlFor="service-name"
            hint={t("panel.services.nameHint")}
          >
            <Input
              id="service-name"
              value={value.name[tab]}
              invalid={tab === "pl" && invalid}
              placeholder={LOCALE_LABELS[tab].name}
              onChange={(event) =>
                patch({ name: { ...value.name, [tab]: event.target.value } })
              }
            />
          </Field>
        </div>

        <Field label={t("panel.services.categories")} htmlFor="service-category">
          <Select
            id="service-category"
            options={categories}
            value={value.categoryId}
            onChange={(event) => patch({ categoryId: event.target.value })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("panel.services.durationMin")} htmlFor="service-duration">
            <Input
              id="service-duration"
              type="number"
              min={5}
              step={5}
              className="tabular"
              value={value.durationMin}
              onChange={(event) =>
                patch({ durationMin: Number(event.target.value) || 0 })
              }
            />
          </Field>
          <Field label={t("panel.services.price")} htmlFor="service-price">
            <Input
              id="service-price"
              type="number"
              min={0}
              step={5}
              className="tabular"
              value={value.price}
              onChange={(event) =>
                patch({ price: Number(event.target.value) || 0 })
              }
            />
          </Field>
        </div>

        <div className="surface-flat flex flex-col gap-3 p-4">
          <Switch
            label={t("panel.services.priceFrom")}
            checked={value.priceFrom}
            onCheckedChange={(next) => patch({ priceFrom: next })}
          />
          <Switch
            label={t("panel.services.online")}
            checked={value.online}
            onCheckedChange={(next) => patch({ online: next })}
          />
          <Switch
            label={t("panel.services.popular")}
            checked={value.popular}
            onCheckedChange={(next) => patch({ popular: next })}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-medium text-sand-700">
            {t("panel.services.color")}
          </legend>
          <div className="flex flex-wrap gap-2">
            {SERVICE_COLOR_KEYS.map((key) => {
              const active = key === value.color;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  aria-label={t(`panel.services.colors.${key}`)}
                  onClick={() => patch({ color: key })}
                  className={cn(
                    "size-10 rounded-full border transition-transform",
                    SERVICE_COLORS[key].bg,
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/30 focus-visible:ring-offset-2",
                    active
                      ? "scale-105 border-ink ring-2 ring-ink/70 ring-offset-2 ring-offset-paper"
                      : "border-line hover:scale-105",
                  )}
                />
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-medium text-sand-700">
            {t("panel.services.staff")}
          </legend>
          <div className="flex flex-col gap-2">
            {team.map((member) => (
              <label
                key={member.id}
                className="surface-flat flex cursor-pointer items-center gap-3 p-3"
              >
                <Checkbox
                  checked={value.staffIds.includes(member.id)}
                  onChange={(event) =>
                    patch({
                      staffIds: event.target.checked
                        ? [...value.staffIds, member.id]
                        : value.staffIds.filter((id) => id !== member.id),
                    })
                  }
                />
                <Avatar name={member.name} color={member.color} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-ink">
                    {member.name}
                  </span>
                  <span className="block truncate text-[12px] text-muted">
                    {member.role}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted">{t("panel.services.staffHint")}</p>
        </fieldset>

        <Field
          label={t("panel.services.depositAmount")}
          htmlFor="service-deposit"
          hint={
            tenant.deposit.enabled
              ? t("panel.services.depositHint", {
                  value:
                    tenant.deposit.mode === "percent"
                      ? `${tenant.deposit.value}%`
                      : money(tenant.deposit.value, locale),
                })
              : t("panel.services.depositOff")
          }
        >
          <Input
            id="service-deposit"
            type="number"
            min={0}
            step={10}
            className="tabular"
            placeholder={t("common.none")}
            value={value.deposit}
            onChange={(event) => patch({ deposit: event.target.value })}
          />
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */

interface CategoryModalProps {
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  onClose: () => void;
  onSave: (value: LocalizedText) => void;
}

function CategoryModal({
  value,
  onChange,
  onClose,
  onSave,
}: CategoryModalProps) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<Locale>(locale);
  const invalid = value.pl.trim().length === 0;

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="sm"
      closeLabel={t("common.close")}
      title={t("panel.services.addCategory")}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" block onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            block
            disabled={invalid}
            onClick={() =>
              onSave(
                invalid
                  ? plainText(value.pl)
                  : {
                      pl: value.pl,
                      en: value.en.trim() || value.pl,
                      uk: value.uk.trim() || value.pl,
                    },
              )
            }
          >
            {t("common.add")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <Segmented
          size="sm"
          value={tab}
          onChange={(next) => setTab(next as Locale)}
          options={LOCALES.map((item) => ({
            value: item,
            label: LOCALE_LABELS[item].short,
          }))}
        />
        <Field
          label={t("panel.services.categoryName")}
          htmlFor="category-name"
          required
        >
          <Input
            id="category-name"
            value={value[tab]}
            placeholder={LOCALE_LABELS[tab].name}
            onChange={(event) =>
              onChange({ ...value, [tab]: event.target.value })
            }
          />
        </Field>
      </div>
    </Modal>
  );
}
