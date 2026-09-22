"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Lock } from "lucide-react";

import { LanguageSegmented } from "@/components/brand/language-switcher";
import { KalendoLogo } from "@/components/brand/logo";
import {
  Button,
  Checkbox,
  Divider,
  Field,
  Input,
  PhoneInput,
  Select,
} from "@/components/ui";
import { useKalendo } from "@/lib/data";
import { useT } from "@/lib/i18n";
import type { AccountKind, Industry } from "@/lib/types";
import { AccountTypeChoice } from "./account-type-choice";
import { PasswordInput } from "./password-input";
import { SocialButtons } from "./social-buttons";

const INDUSTRIES: Industry[] = [
  "hair",
  "beauty",
  "physio",
  "dental",
  "auto",
  "other",
];

const TEAM_SIZES = [
  { value: "solo", labelKey: "auth.teamSizeSolo" },
  { value: "small", labelKey: "auth.teamSizeSmall" },
  { value: "medium", labelKey: "auth.teamSizeMedium" },
  { value: "large", labelKey: "auth.teamSizeLarge" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

export interface SignupFormProps {
  initialType: AccountKind;
}

export function SignupForm({ initialType }: SignupFormProps) {
  const t = useT();
  const router = useRouter();
  const signInAsClient = useKalendo((state) => state.signInAsClient);

  // The company itself is created at the end of onboarding, so nothing is
  // signed in here — the form only carries what it collected into step 1.
  const onboardingHref = () => {
    const params = new URLSearchParams({ industry });
    if (companyName.trim()) params.set("name", companyName.trim());
    if (phone.trim()) params.set("phone", `${prefix} ${phone}`.trim());
    return `/onboarding?${params.toString()}`;
  };

  const ids = useId();
  const fieldId = (name: string) => `${ids}-${name}`;

  const [type, setType] = useState<AccountKind>(initialType);
  const [prefix, setPrefix] = useState("+48");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState<Industry>("hair");
  const [teamSize, setTeamSize] = useState("small");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const switchType = (next: AccountKind) => {
    setType(next);
    setErrors({});
    router.replace(`/signup?type=${next}`, { scroll: false });
  };

  const validate = (): Record<string, string> => {
    const found: Record<string, string> = {};
    const bare = digitsOf(phone);

    if (!bare) found.phone = t("errors.required");
    else if (bare.length < 9) found.phone = t("errors.phone");

    if (type === "company") {
      if (!companyName.trim()) found.companyName = t("errors.required");
      if (!email.trim()) found.email = t("errors.required");
      else if (!EMAIL_RE.test(email.trim())) found.email = t("errors.email");
      if (!password) found.password = t("errors.required");
      else if (password.length < 8) found.password = t("errors.minLength", { n: 8 });
      if (!terms) found.terms = t("errors.terms");
    } else {
      if (!name.trim()) found.name = t("errors.required");
      if (email.trim() && !EMAIL_RE.test(email.trim())) {
        found.email = t("errors.email");
      }
    }

    return found;
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    if (type === "company") {
      toast.success(t("toast.accountCreated"));
      router.push(onboardingHref());
    } else {
      signInAsClient(name, `${prefix} ${phone}`.trim());
      toast.success(t("toast.smsSent"));
      router.push("/app");
    }
  };

  const continueWithProvider = () => {
    if (type === "company") {
      toast.success(t("toast.accountCreated"));
      router.push(onboardingHref());
      return;
    }
    signInAsClient(name, `${prefix} ${phone}`.trim());
    toast.success(t("toast.signedIn"));
    router.push("/app");
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <KalendoLogo size="md" />
        <LanguageSegmented />
      </div>

      <h1 className="font-display mt-8 text-[32px] leading-tight text-ink sm:text-[38px]">
        {t("auth.createAccount")}
      </h1>
      <p className="mt-2 text-[14.5px] leading-6 text-muted">
        {t("auth.signupLead")}
      </p>

      <div className="mt-7">
        <AccountTypeChoice value={type} onChange={switchType} />
      </div>

      <form noValidate onSubmit={submit} className="mt-7">
        {type === "company" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("auth.companyName")}
              htmlFor={fieldId("companyName")}
              error={errors.companyName}
              required
            >
              <Input
                id={fieldId("companyName")}
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder={t("auth.companyNamePlaceholder")}
                autoComplete="organization"
                invalid={Boolean(errors.companyName)}
              />
            </Field>

            <Field label={t("auth.industry")} htmlFor={fieldId("industry")} required>
              <Select
                id={fieldId("industry")}
                value={industry}
                onChange={(event) => setIndustry(event.target.value as Industry)}
                options={INDUSTRIES.map((item) => ({
                  value: item,
                  label: t(`onboarding.industries.${item}`),
                }))}
              />
            </Field>

            <Field
              label={t("auth.email")}
              htmlFor={fieldId("email")}
              error={errors.email}
              required
            >
              <Input
                id={fieldId("email")}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete="email"
                invalid={Boolean(errors.email)}
              />
            </Field>

            <Field
              label={t("auth.phone")}
              htmlFor={fieldId("phone")}
              error={errors.phone}
              required
            >
              <PhoneInput
                id={fieldId("phone")}
                prefix={prefix}
                onPrefixChange={setPrefix}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="601 234 567"
                invalid={Boolean(errors.phone)}
              />
            </Field>

            <Field
              label={t("auth.password")}
              htmlFor={fieldId("password")}
              error={errors.password}
              hint={t("auth.passwordHint")}
              required
            >
              <PasswordInput
                id={fieldId("password")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                invalid={Boolean(errors.password)}
              />
            </Field>

            <Field label={t("auth.teamSize")} htmlFor={fieldId("teamSize")}>
              <Select
                id={fieldId("teamSize")}
                value={teamSize}
                onChange={(event) => setTeamSize(event.target.value)}
                options={TEAM_SIZES.map((item) => ({
                  value: item.value,
                  label: t(item.labelKey),
                }))}
              />
            </Field>

            <div className="sm:col-span-2">
              <Checkbox
                checked={terms}
                onChange={(event) => setTerms(event.target.checked)}
                label={t("auth.terms")}
              />
              {errors.terms ? (
                <p className="mt-1.5 text-xs font-medium text-danger">
                  {errors.terms}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              size="lg"
              block
              iconRight={ArrowRight}
              className="sm:col-span-2"
            >
              {t("auth.submitCompany")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Field
              label={t("auth.name")}
              htmlFor={fieldId("name")}
              error={errors.name}
              required
            >
              <Input
                id={fieldId("name")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                invalid={Boolean(errors.name)}
              />
            </Field>

            <Field
              label={t("auth.phone")}
              htmlFor={fieldId("clientPhone")}
              error={errors.phone}
              required
            >
              <PhoneInput
                id={fieldId("clientPhone")}
                prefix={prefix}
                onPrefixChange={setPrefix}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="512 340 118"
                invalid={Boolean(errors.phone)}
              />
            </Field>

            <Field
              label={`${t("auth.email")} · ${t("common.optional")}`}
              htmlFor={fieldId("clientEmail")}
              error={errors.email}
            >
              <Input
                id={fieldId("clientEmail")}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete="email"
                invalid={Boolean(errors.email)}
              />
            </Field>

            <Button type="submit" size="lg" block iconRight={ArrowRight}>
              {t("auth.sendSmsCode")}
            </Button>

            <p className="flex items-start gap-2 text-[13px] leading-5 text-muted">
              <Lock aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              {t("auth.smsTitle")}
            </p>
          </div>
        )}
      </form>

      <Divider label={t("common.or")} className="my-7" />

      <SocialButtons onProvider={continueWithProvider} />

      <p className="mt-8 text-center text-[13.5px] text-muted">
        {t("auth.haveAccount")}{" "}
        <Link
          href="/login"
          className="rounded-sm font-medium text-ink underline-offset-4 hover:underline"
        >
          {t("auth.loginLink")}
        </Link>
      </p>
    </div>
  );
}
