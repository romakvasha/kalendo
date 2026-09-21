"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input, type InputProps } from "@/components/ui";
import { useT } from "@/lib/i18n";

export function PasswordInput({ className, ...props }: InputProps) {
  const t = useT();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={className ? `${className} pr-11` : "pr-11"}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
        aria-pressed={visible}
        className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-sm text-sand-500 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25"
      >
        {visible ? (
          <EyeOff aria-hidden className="size-4" strokeWidth={1.75} />
        ) : (
          <Eye aria-hidden className="size-4" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}
