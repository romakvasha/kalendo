import { cn, initialsOf } from "@/lib/utils";
import type { Tenant } from "@/lib/types";

type LogoSize = "sm" | "md" | "lg";

const MARK_SIZE: Record<LogoSize, string> = {
  sm: "size-6 rounded-xs",
  md: "size-8 rounded-sm",
  lg: "size-10 rounded-md",
};

const WORD_SIZE: Record<LogoSize, string> = {
  sm: "text-[15px]",
  md: "text-lg",
  lg: "text-2xl",
};

export interface KalendoLogoProps {
  size?: LogoSize;
  wordmark?: boolean;
  tone?: "ink" | "paper" | "brand";
  className?: string;
}

export function KalendoLogo({
  size = "md",
  wordmark = true,
  tone = "ink",
  className,
}: KalendoLogoProps) {
  const markTone =
    tone === "paper"
      ? "bg-paper text-ink"
      : tone === "brand"
        ? "bg-brand text-brand-fg"
        : "bg-cobalt text-paper";

  const wordTone = tone === "paper" ? "text-paper" : "text-ink";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center",
          MARK_SIZE[size],
          markTone,
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="h-[58%] w-[58%]"
        >
          <circle cx="7.5" cy="7.5" r="2.7" />
          <circle cx="16.5" cy="7.5" r="2.7" />
          <circle cx="7.5" cy="16.5" r="2.7" />
          <circle cx="16.5" cy="16.5" r="2.7" />
        </svg>
      </span>
      {wordmark ? (
        <span
          className={cn("font-semibold lowercase tracking-tight", WORD_SIZE[size], wordTone)}
        >
          kalendo
        </span>
      ) : (
        <span className="sr-only">kalendo</span>
      )}
    </span>
  );
}

const TENANT_MARK: Record<LogoSize, string> = {
  sm: "size-7 rounded-xs text-[11px]",
  md: "size-9 rounded-sm text-[13px]",
  lg: "size-11 rounded-md text-[15px]",
};

/** "Garaż 44" reads better as "44" than as "G4". */
function tenantMark(name: string): string {
  const digits = /\d{1,3}/.exec(name);
  if (digits) return digits[0];
  return initialsOf(name);
}

export interface TenantLogoProps {
  tenant: Pick<Tenant, "name">;
  size?: LogoSize;
  className?: string;
}

export function TenantLogo({ tenant, size = "md", className }: TenantLogoProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-brand font-semibold tracking-tight text-brand-fg tabular",
        TENANT_MARK[size],
        className,
      )}
    >
      {tenantMark(tenant.name)}
    </span>
  );
}
