import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  /** Rendered as the italic tail on the same display line. */
  titleItalic?: string;
  lead?: string;
  tone?: "ink" | "paper";
  align?: "start" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  titleItalic,
  lead,
  tone = "ink",
  align = "start",
  className,
}: SectionHeadingProps) {
  const onPaper = tone === "paper";

  return (
    <div
      className={cn(
        "max-w-[42ch]",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 text-[11px] font-medium tracking-[0.14em] uppercase",
            onPaper ? "text-paper/55" : "text-sand-500",
          )}
        >
          {eyebrow}
        </p>
      ) : null}

      <h2
        className={cn(
          "font-display text-[30px] leading-[1.1] sm:text-[38px] lg:text-[44px]",
          onPaper ? "text-paper" : "text-ink",
        )}
      >
        {title}
        {titleItalic ? (
          <>
            {" "}
            <em className={onPaper ? "text-paper/70" : "text-cobalt"}>
              {titleItalic}
            </em>
          </>
        ) : null}
      </h2>

      {lead ? (
        <p
          className={cn(
            "mt-3 text-[15px] leading-6 sm:text-base sm:leading-7",
            onPaper ? "text-paper/70" : "text-muted",
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}
