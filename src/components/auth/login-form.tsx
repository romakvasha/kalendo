"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

import { LanguageSegmented } from "@/components/brand/language-switcher";
import { KalendoLogo } from "@/components/brand/logo";
import { Button, Divider, Field, Input, Segmented } from "@/components/ui";
import { DEMO_COMPANY_ACCOUNTS, SEED_STATE, useKalendo } from "@/lib/data";
import { useT } from "@/lib/i18n";
import type { AccountKind } from "@/lib/types";
import { OtpInput } from "./otp-input";
import { SocialButtons } from "./social-buttons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 30;

function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

/** Signing in with a seeded owner's e-mail opens that company's panel. */
function tenantForIdentifier(identifier: string): string {
  const normalized = identifier.trim().toLowerCase();
  const match = Object.values(DEMO_COMPANY_ACCOUNTS).find(
    (account) => account.email?.toLowerCase() === normalized,
  );
  return match?.tenantId ?? SEED_STATE.tenants[0].id;
}

export function LoginForm() {
  const t = useT();
  const router = useRouter();
  const signInAsClient = useKalendo((state) => state.signInAsClient);
  const signInAsCompany = useKalendo((state) => state.signInAsCompany);

  const ids = useId();
  const [kind, setKind] = useState<AccountKind>("client");
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [identifierError, setIdentifierError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const validateIdentifier = (): string | undefined => {
    const value = identifier.trim();
    if (!value) return t("errors.required");
    if (looksLikeEmail(value)) {
      return EMAIL_RE.test(value) ? undefined : t("errors.email");
    }
    return value.replace(/\D/g, "").length >= 9 ? undefined : t("errors.phone");
  };

  const sendCode = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const problem = validateIdentifier();
    setIdentifierError(problem);
    if (problem) return;
    setSent(true);
    setCode("");
    setCodeError(undefined);
    setSeconds(RESEND_SECONDS);
    toast.success(t("toast.smsSent"));
  };

  const signIn = useCallback(() => {
    if (kind === "company") {
      signInAsCompany(tenantForIdentifier(identifier));
      toast.success(t("toast.signedIn"));
      router.push("/panel");
      return;
    }
    signInAsClient("", looksLikeEmail(identifier) ? "" : identifier.trim());
    toast.success(t("toast.signedIn"));
    router.push("/app");
  }, [identifier, kind, router, signInAsClient, signInAsCompany, t]);

  const confirm = useCallback(
    (value: string) => {
      if (value.replace(/\D/g, "").length !== 6) {
        setCodeError(t("errors.code"));
        return;
      }
      setCodeError(undefined);
      signIn();
    },
    [signIn, t],
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <KalendoLogo size="md" />
        <LanguageSegmented />
      </div>

      <h1 className="font-display mt-8 text-[32px] leading-tight text-ink sm:text-[38px]">
        {t("auth.login")}
      </h1>
      <p className="mt-2 text-[14.5px] leading-6 text-muted">
        {t("auth.loginSubtitle")}
      </p>

      <Segmented
        block
        className="mt-6 sm:w-[260px]"
        value={kind}
        onChange={(value) => setKind(value as AccountKind)}
        options={[
          { value: "client", label: t("auth.typeClient.title") },
          { value: "company", label: t("auth.typeCompany.title") },
        ]}
      />

      {sent ? (
        <div className="mt-7">
          <Field
            label={t("auth.codeLabel")}
            hint={t("auth.codeSent", { phone: identifier.trim() })}
            error={codeError}
          >
            <OtpInput
              autoFocus
              value={code}
              onChange={(value) => {
                setCode(value);
                setCodeError(undefined);
              }}
              onComplete={confirm}
              invalid={Boolean(codeError)}
            />
          </Field>

          <Button
            size="lg"
            block
            className="mt-5"
            iconRight={ArrowRight}
            onClick={() => confirm(code)}
          >
            {t("auth.login")}
          </Button>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <button
              type="button"
              disabled={seconds > 0}
              onClick={() => sendCode()}
              className="rounded-sm font-medium text-ink underline-offset-4 hover:underline disabled:text-sand-400 disabled:no-underline"
            >
              {seconds > 0 ? t("auth.resendIn", { seconds }) : t("auth.resend")}
            </button>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setCode("");
                setCodeError(undefined);
              }}
              className="rounded-sm text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              {t("auth.backToLogin")}
            </button>
          </div>
        </div>
      ) : (
        <form noValidate onSubmit={sendCode} className="mt-7">
          <Field
            label={t("auth.phoneOrEmail")}
            htmlFor={`${ids}-identifier`}
            error={identifierError}
            hint={t("auth.smsBody")}
            required
          >
            <Input
              id={`${ids}-identifier`}
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setIdentifierError(undefined);
              }}
              placeholder="+48 512 340 118"
              autoComplete="username"
              invalid={Boolean(identifierError)}
            />
          </Field>

          <Button type="submit" size="lg" block className="mt-5" iconRight={ArrowRight}>
            {t("auth.sendSmsCode")}
          </Button>
        </form>
      )}

      <Divider label={t("common.or")} className="my-7" />

      <SocialButtons onProvider={signIn} />

      <p className="mt-8 text-center text-[13.5px] text-muted">
        {t("auth.noAccount")}{" "}
        <Link
          href="/signup"
          className="rounded-sm font-medium text-ink underline-offset-4 hover:underline"
        >
          {t("auth.signupLink")}
        </Link>
      </p>
    </div>
  );
}
