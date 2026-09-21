"use client";

import { useEffect, useRef } from "react";

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LENGTH = 6;

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fires once all six digits are present. */
  onComplete?: (value: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  invalid = false,
  autoFocus = false,
}: OtpInputProps) {
  const t = useT();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const completed = useRef(false);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === LENGTH && !completed.current) {
      completed.current = true;
      onComplete?.(value);
    }
    if (value.length < LENGTH) completed.current = false;
  }, [value, onComplete]);

  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").replace(/\s/g, ""));
  };

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      setDigit(index, "");
      return;
    }
    // Typing over a filled box, or a paste landing mid-field, fills forward.
    const next = digits.slice();
    for (let i = 0; i < clean.length && index + i < LENGTH; i++) {
      next[index + i] = clean[i];
    }
    onChange(next.join(""));
    const landing = Math.min(index + clean.length, LENGTH - 1);
    refs.current[landing]?.focus();
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      setDigit(index - 1, "");
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const clean = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!clean) return;
    event.preventDefault();
    handleChange(index, clean);
  };

  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.currentTarget.select()}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          aria-label={t("a11y.codeDigit", { n: index + 1 })}
          aria-invalid={invalid || undefined}
          className={cn(
            "tabular h-13 w-full min-w-0 rounded-md border bg-white text-center text-[20px] font-medium text-ink",
            "transition-[border-color,box-shadow] duration-150",
            "focus-visible:border-cobalt focus-visible:ring-2 focus-visible:ring-cobalt/20 focus-visible:outline-none",
            invalid ? "border-danger bg-danger-soft/40" : "border-line",
          )}
        />
      ))}
    </div>
  );
}
