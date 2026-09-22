"use client";

import { forwardRef, useId } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared control shell                                                */
/* ------------------------------------------------------------------ */

const CONTROL_BASE =
  "w-full rounded-md border border-line bg-card px-3.5 text-[15px] text-ink " +
  "placeholder:text-sand-400 transition-[border-color,box-shadow] duration-150 " +
  "focus-visible:outline-none focus-visible:border-cobalt focus-visible:ring-2 focus-visible:ring-cobalt/20 " +
  "disabled:cursor-not-allowed disabled:bg-sand-50 disabled:text-sand-500";

const CONTROL_INVALID =
  "border-danger bg-danger-soft/40 focus-visible:border-danger focus-visible:ring-danger/20";

/* ------------------------------------------------------------------ */
/* Field                                                               */
/* ------------------------------------------------------------------ */

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  className,
  children,
  ...props
}: FieldProps) {
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)} {...props}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1 text-[13px] font-medium text-sand-700"
        >
          {label}
          {required && (
            <span aria-hidden className="text-danger">
              *
            </span>
          )}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs leading-4 font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-4 text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL_BASE, "h-11", invalid && CONTROL_INVALID, className)}
      {...props}
    />
  );
});

/* ------------------------------------------------------------------ */
/* Textarea                                                            */
/* ------------------------------------------------------------------ */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid = false, className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(
          CONTROL_BASE,
          "resize-y py-2.5 leading-6",
          invalid && CONTROL_INVALID,
          className,
        )}
        {...props}
      />
    );
  },
);

/* ------------------------------------------------------------------ */
/* Select                                                              */
/* ------------------------------------------------------------------ */

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options: SelectOption[];
  invalid?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ options, invalid = false, placeholder, className, ...props }, ref) {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            CONTROL_BASE,
            "h-11 cursor-pointer appearance-none pr-10",
            invalid && CONTROL_INVALID,
            className,
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-sand-500"
        />
      </div>
    );
  },
);

/* ------------------------------------------------------------------ */
/* PhoneInput                                                          */
/* ------------------------------------------------------------------ */

const PREFIX_OPTIONS = ["+48", "+380", "+44", "+49", "+420", "+1"];

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  prefix?: string;
  onPrefixChange?: (prefix: string) => void;
  invalid?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    { prefix = "+48", onPrefixChange, invalid = false, className, ...props },
    ref,
  ) {
    const prefixId = useId();
    const options = PREFIX_OPTIONS.includes(prefix)
      ? PREFIX_OPTIONS
      : [prefix, ...PREFIX_OPTIONS];

    return (
      <div
        className={cn(
          "flex h-11 w-full items-stretch overflow-hidden rounded-md border border-line bg-card",
          "transition-[border-color,box-shadow] duration-150",
          "focus-within:border-cobalt focus-within:ring-2 focus-within:ring-cobalt/20",
          invalid &&
            "border-danger focus-within:border-danger focus-within:ring-danger/20",
          className,
        )}
      >
        <div className="relative shrink-0">
          <label htmlFor={prefixId} className="sr-only">
            {prefix}
          </label>
          <select
            id={prefixId}
            value={prefix}
            onChange={(event) => onPrefixChange?.(event.target.value)}
            disabled={!onPrefixChange}
            className="tabular h-full cursor-pointer appearance-none bg-transparent pr-6 pl-3.5 text-[15px] text-sand-700 focus-visible:outline-none disabled:cursor-default"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-1.5 size-3.5 -translate-y-1/2 text-sand-400"
          />
        </div>
        <span aria-hidden className="my-2.5 w-px bg-line" />
        <input
          ref={ref}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          aria-invalid={invalid || undefined}
          className="tabular h-full min-w-0 flex-1 bg-transparent px-3.5 text-[15px] text-ink placeholder:text-sand-400 focus-visible:outline-none"
          {...props}
        />
      </div>
    );
  },
);

/* ------------------------------------------------------------------ */
/* Checkbox / Radio                                                    */
/* ------------------------------------------------------------------ */

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, className, disabled, ...props }, ref) {
    return (
      <label
        className={cn(
          "inline-flex cursor-pointer items-start gap-2.5 select-none",
          disabled && "cursor-not-allowed opacity-55",
          className,
        )}
      >
        <span className="relative inline-grid size-5 shrink-0 place-items-center">
          <input
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className={cn(
              "peer size-5 cursor-pointer appearance-none rounded-xs border border-line-strong bg-card",
              "transition-colors duration-150 checked:border-ink checked:bg-ink",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25 focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:bg-sand-100",
            )}
            {...props}
          />
          <Check
            aria-hidden
            strokeWidth={3}
            className="pointer-events-none absolute size-3.5 text-paper opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
          />
        </span>
        {label ? (
          <span className="text-[14px] leading-5 text-ink">{label}</span>
        ) : null}
      </label>
    );
  },
);

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, className, disabled, ...props },
  ref,
) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-start gap-2.5 select-none",
        disabled && "cursor-not-allowed opacity-55",
        className,
      )}
    >
      <input
        ref={ref}
        type="radio"
        disabled={disabled}
        className={cn(
          "mt-px size-5 shrink-0 cursor-pointer appearance-none rounded-full border border-line-strong bg-card",
          "transition-all duration-150 checked:border-[6px] checked:border-ink",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25 focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:bg-sand-100",
        )}
        {...props}
      />
      {label ? (
        <span className="text-[14px] leading-5 text-ink">{label}</span>
      ) : null}
    </label>
  );
});

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */

export interface SwitchProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onChange" | "type" | "value"
  > {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: React.ReactNode;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  className,
  disabled,
  id,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  const control = (
    <button
      id={switchId}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent p-0.5",
        "transition-colors duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/25 focus-visible:ring-offset-1 focus-visible:ring-offset-paper",
        "disabled:cursor-not-allowed disabled:opacity-45",
        checked ? "bg-ink" : "bg-sand-300",
        !label && className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "size-5 rounded-full bg-card shadow-sm transition-transform duration-200 ease-out",
          // On the dark unchecked track a card-coloured knob all but disappears.
          !checked && "dark:bg-sand-600",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );

  if (!label) return control;

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <label
        htmlFor={switchId}
        className={cn(
          "text-[14px] leading-5 text-ink",
          disabled ? "opacity-55" : "cursor-pointer",
        )}
      >
        {label}
      </label>
      {control}
    </div>
  );
}
