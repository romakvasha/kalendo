import { cn } from "@/lib/utils";
import { renderIcon, type IconLike } from "./icon";

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: IconLike;
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  /** Tightens the padding for empty states inside small panels. */
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className="mb-4 inline-grid size-12 place-items-center rounded-full border border-line bg-sand-50 text-sand-500">
          {renderIcon(icon, "size-5")}
        </span>
      ) : null}

      <p className="text-[15px] font-semibold text-ink">{title}</p>

      {body ? (
        <p className="mt-1.5 max-w-xs text-[13px] leading-5 text-muted">
          {body}
        </p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
