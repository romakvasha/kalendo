"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { IconButton } from "./button";

export type ModalSize = "sm" | "md" | "lg";

const SIZES: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const noopSubscribe = () => () => {};

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  className?: string;
  /** Hides the top-right close control (e.g. a blocking confirmation). */
  hideClose?: boolean;
  closeLabel?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  footer,
  size = "md",
  className,
  hideClose = false,
  closeLabel,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  // Kept in a ref so an inline `onOpenChange` never re-runs the effect below,
  // which would re-steal focus and thrash the body scroll lock on every render.
  const changeRef = useRef(onOpenChange);
  useEffect(() => {
    changeRef.current = onOpenChange;
  });

  const close = useCallback(() => changeRef.current(false), []);

  useEffect(() => {
    if (!open) return;

    restoreRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    const panel = panelRef.current;
    panel?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const targets = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((node) => node.offsetParent !== null);
      if (targets.length === 0) {
        event.preventDefault();
        return;
      }
      const first = targets[0];
      const last = targets[targets.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      restoreRef.current?.focus({ preventScroll: true });
    };
  }, [open, close]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-end justify-center sm:items-center">
      <div
        aria-hidden
        onClick={close}
        className="animate-fade-in absolute inset-0 bg-ink/35 backdrop-blur-[3px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "animate-scale-in relative z-10 flex max-h-[90vh] w-full flex-col",
          "rounded-t-3xl border border-line bg-paper shadow-xl outline-none sm:rounded-2xl",
          SIZES[size],
          className,
        )}
      >
        {(title || !hideClose) && (
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5 pb-3">
            {title ? (
              <h2
                id={titleId}
                className="text-[17px] leading-6 font-semibold text-ink"
              >
                {title}
              </h2>
            ) : (
              <span />
            )}
            {!hideClose && (
              <IconButton
                size="sm"
                variant="ghost"
                onClick={close}
                aria-label={closeLabel ?? "Close"}
                className="-mt-1 -mr-1.5"
              >
                <X />
              </IconButton>
            )}
          </div>
        )}

        <div className="thin-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          {children}
        </div>

        {footer ? (
          <div className="pb-safe shrink-0 border-t border-line bg-white/80 px-5 py-4 backdrop-blur-sm sm:pb-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
