"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bell,
  ChevronRight,
  CircleQuestionMark,
  CreditCard,
  Languages,
  Link2,
  LogOut,
  QrCode as QrCodeIcon,
  Share,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge, Button, Card, IconButton, Modal, Skeleton } from "@/components/ui";
import { LanguageSegmented, TenantLogo, usePanelSession } from "@/components/layout";
import { staffOf, useDataState, useHydrated, useKalendo } from "@/lib/data";
import { LOCALE_LABELS, useI18n } from "@/lib/i18n";
import { iconFor } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/lib/types";

import { directoryModules } from "./helpers";
import { QrCode } from "./qr-code";

interface SettingRow {
  key: string;
  labelKey: string;
  icon: LucideIcon;
}

const SETTING_ROWS: SettingRow[] = [
  { key: "language", labelKey: "settings.language", icon: Languages },
  { key: "notifications", labelKey: "settings.notifications", icon: Bell },
  { key: "plan", labelKey: "settings.plan", icon: CreditCard },
  { key: "help", labelKey: "settings.help", icon: CircleQuestionMark },
];

export function MoreScreen() {
  const hydrated = useHydrated();
  const { tenant } = usePanelSession();

  if (!hydrated || !tenant) return <MoreSkeleton />;
  return <More tenant={tenant} />;
}

function More({ tenant }: { tenant: Tenant }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const state = useDataState();
  const signOut = useKalendo((store) => store.signOut);

  const [qrOpen, setQrOpen] = useState(false);
  const modules = useMemo(() => directoryModules(), []);
  const teamSize = staffOf(state, tenant.id).length;

  const host = `${tenant.slug}.kalendo.pl`;
  const url = `https://${host}`;

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: tenant.name, url });
        return;
      } catch {
        // Dismissed by the user — fall through to the clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("toast.linkCopied"));
    } catch {
      toast.error(t("errors.generic"));
    }
  }

  function logOut() {
    signOut();
    router.push("/login");
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[32px] leading-[1.05] text-ink lg:text-[40px]">
          {t("panel.modules.title")}
        </h1>
        <LanguageSegmented />
      </header>

      <Card flat className="overflow-hidden">
        <div className="flex items-center gap-3.5 p-4">
          <TenantLogo tenant={tenant} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-ink">
              {tenant.name}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-muted">
              {t("panel.modules.planTeam", {
                plan: t(`landing.plans.${tenant.plan}.name`),
                count: teamSize,
              })}
            </p>
          </div>
          <IconButton
            variant="secondary"
            aria-label={t("panel.modules.qrCode")}
            onClick={() => setQrOpen(true)}
          >
            <QrCodeIcon />
          </IconButton>
        </div>

        <div className="flex items-center gap-2.5 border-t border-line bg-sand-50 px-4 py-3">
          <Link2 className="size-4 shrink-0 text-cobalt" aria-hidden />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate rounded-sm text-[14px] font-medium text-cobalt hover:underline"
          >
            {host}
          </a>
          <Button
            size="sm"
            variant="secondary"
            iconLeft={Share}
            onClick={share}
            className="shrink-0"
          >
            {t("common.share")}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        {modules.map((module) => {
          const Icon = iconFor(module.icon);
          const featured = module.key === "ai";
          return (
            <Link
              key={module.key}
              href={module.href}
              className={cn(
                "relative flex flex-col gap-3 rounded-md border p-3 transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25 focus-visible:ring-offset-1 focus-visible:ring-offset-paper",
                featured
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-white text-ink hover:border-line-strong hover:bg-sand-50",
              )}
            >
              <span
                className={cn(
                  "inline-grid size-9 place-items-center rounded-sm",
                  featured ? "bg-cobalt text-white" : "bg-sand-100 text-ink",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={1.7} aria-hidden />
              </span>
              <span className="min-h-9 text-[13px] leading-[18px] font-semibold">
                {t(module.labelKey)}
              </span>
              {featured ? (
                <Badge
                  size="sm"
                  className="absolute top-2.5 right-2.5 border-transparent bg-cobalt text-white"
                >
                  {t("panel.modules.newBadge")}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </div>

      <Card flat className="overflow-hidden">
        <ul className="divide-y divide-line">
          {SETTING_ROWS.map(({ key, labelKey, icon: Icon }) => (
            <li key={key}>
              <Link
                href="/panel/settings"
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-sand-50"
              >
                <Icon
                  className="size-[18px] shrink-0 text-sand-600"
                  strokeWidth={1.7}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-[15px] text-ink">
                  {t(labelKey)}
                </span>
                {key === "language" ? (
                  <span className="shrink-0 text-[13px] text-muted">
                    {LOCALE_LABELS[locale].name}
                  </span>
                ) : null}
                <ChevronRight
                  className="size-4 shrink-0 text-sand-400"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Button
        variant="ghost"
        block
        iconLeft={LogOut}
        onClick={logOut}
        className="text-danger hover:bg-danger-soft"
      >
        {t("settings.logOut")}
      </Button>

      <Modal
        open={qrOpen}
        onOpenChange={setQrOpen}
        size="sm"
        title={t("panel.modules.qrCode")}
        closeLabel={t("common.close")}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-[16rem] rounded-lg border border-line bg-white p-4">
            <QrCode value={url} title={t("panel.modules.qrCode")} />
          </div>
          <p className="text-center text-[14px] font-medium text-ink">{host}</p>
          <p className="text-center text-[13px] leading-5 text-muted">
            {t("panel.modules.qrHint")}
          </p>
        </div>
      </Modal>
    </div>
  );
}

function MoreSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy>
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 9 }, (_, index) => (
          <Skeleton key={index} className="h-[6.5rem] w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
