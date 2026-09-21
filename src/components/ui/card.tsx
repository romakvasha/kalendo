import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Drops the shadow — for cards sitting inside another surface. */
  flat?: boolean;
  /** Lifts on hover; use on cards that are links or open a sheet. */
  interactive?: boolean;
}

export function Card({
  flat = false,
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        flat ? "surface-flat" : "surface",
        interactive &&
          "transition-shadow duration-200 ease-out hover:shadow-md focus-within:shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rendered hard right, vertically centred — actions, badges, menus. */
  action?: React.ReactNode;
  /** Adds the hairline separating the header from the body. */
  bordered?: boolean;
}

export function CardHeader({
  action,
  bordered = false,
  className,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-5 pt-5",
        bordered && "border-b border-line pb-4",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h2" | "h3" | "h4";
  hint?: React.ReactNode;
}

export function CardTitle({
  as: Tag = "h3",
  hint,
  className,
  children,
  ...props
}: CardTitleProps) {
  return (
    <>
      <Tag
        className={cn("text-[15px] font-semibold text-ink", className)}
        {...props}
      >
        {children}
      </Tag>
      {hint ? <p className="mt-1 text-[13px] text-muted">{hint}</p> : null}
    </>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}
