import { cn } from "@/lib/utils";

export interface BrowserFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Address shown in the fake omnibox. */
  url: string;
}

export function BrowserFrame({
  url,
  className,
  children,
  ...props
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-line bg-card shadow-lg sm:rounded-2xl",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 border-b border-line bg-sand-50 px-3 py-2.5">
        <span aria-hidden className="flex shrink-0 items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-sand-300" />
          <span className="size-2.5 rounded-full bg-sand-300" />
          <span className="size-2.5 rounded-full bg-sand-300" />
        </span>
        <span className="ml-1 flex h-6 min-w-0 flex-1 items-center rounded-full border border-line bg-card px-3 text-[11px] text-sand-500">
          <span className="truncate">{url}</span>
        </span>
      </div>
      {children}
    </div>
  );
}
