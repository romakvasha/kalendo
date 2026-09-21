import { cn } from "@/lib/utils";

const SPINNER_SIZES = { xs: 12, sm: 16, md: 20, lg: 24 } as const;

export type SpinnerSize = keyof typeof SPINNER_SIZES | number;

export interface SpinnerProps
  extends Omit<React.SVGProps<SVGSVGElement>, "width" | "height"> {
  size?: SpinnerSize;
}

export function Spinner({ size = "sm", className, ...props }: SpinnerProps) {
  const px = typeof size === "number" ? size : SPINNER_SIZES[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("animate-spin shrink-0", className)}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.22"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
