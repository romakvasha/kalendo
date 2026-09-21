import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface StepperStep {
  key: string;
  label: string;
}

export interface StepperProps extends React.HTMLAttributes<HTMLOListElement> {
  steps: StepperStep[];
  /** Index of the active step, or its key. */
  current: number | string;
  /** Completed step keys, or how many leading steps are done. */
  done?: string[] | number;
}

function indexOfCurrent(steps: StepperStep[], current: number | string) {
  if (typeof current === "number") return current;
  const found = steps.findIndex((step) => step.key === current);
  return found === -1 ? 0 : found;
}

export function Stepper({
  steps,
  current,
  done,
  className,
  ...props
}: StepperProps) {
  const activeIndex = indexOfCurrent(steps, current);

  const isDone = (step: StepperStep, index: number) => {
    if (Array.isArray(done)) return done.includes(step.key);
    if (typeof done === "number") return index < done;
    return index < activeIndex;
  };

  return (
    <ol
      className={cn("flex w-full items-center gap-2", className)}
      {...props}
    >
      {steps.map((step, index) => {
        const complete = isDone(step, index);
        const active = index === activeIndex;
        const last = index === steps.length - 1;

        return (
          <li
            key={step.key}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-2",
              last ? "shrink-0" : "flex-1",
            )}
          >
            <span
              className={cn(
                "tabular inline-grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-semibold transition-colors duration-200",
                complete
                  ? "border-ink bg-ink text-paper"
                  : active
                    ? "border-ink bg-white text-ink"
                    : "border-line-strong bg-white text-sand-400",
              )}
            >
              {complete ? (
                <Check aria-hidden className="size-3" strokeWidth={3} />
              ) : (
                index + 1
              )}
            </span>

            <span
              className={cn(
                "truncate text-[12px] font-medium transition-colors duration-200",
                active ? "text-ink" : complete ? "text-sand-600" : "text-sand-400",
              )}
            >
              {step.label}
            </span>

            {!last && (
              <span
                aria-hidden
                className={cn(
                  "ml-1 h-px min-w-3 flex-1 transition-colors duration-200",
                  complete ? "bg-ink/30" : "bg-line",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
