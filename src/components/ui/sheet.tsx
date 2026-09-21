"use client";

import { Drawer } from "vaul";

import { cn } from "@/lib/utils";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Renders the sheet flush to the bottom without the safe-area padding. */
  bodyClassName?: string;
}

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className,
  bodyClassName,
}: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[3px]" />
        <Drawer.Content
          // Radix asks for a description; this sheet is labelled by its title.
          aria-describedby={undefined}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col",
            "rounded-t-3xl border-t border-line bg-paper shadow-xl outline-none",
            "mx-auto w-full sm:max-w-lg",
            className,
          )}
        >
          <div
            aria-hidden
            className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-sand-300"
          />

          <Drawer.Title
            className={cn(
              title
                ? "px-5 pt-3 pb-1 text-[17px] font-semibold text-ink"
                : "sr-only",
            )}
          >
            {title}
          </Drawer.Title>

          <div
            className={cn(
              "thin-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-5",
              !footer && "pb-safe",
              bodyClassName,
            )}
          >
            {children}
          </div>

          {footer ? (
            <div className="pb-safe shrink-0 border-t border-line bg-white/80 px-5 py-4 backdrop-blur-sm">
              {footer}
            </div>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
