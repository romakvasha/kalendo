"use client";

import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stagger for items inside one block, in milliseconds. */
  delay?: number;
}

export function Reveal({
  delay = 0,
  className,
  style,
  children,
  ...props
}: RevealProps) {
  const [shown, setShown] = useState(false);

  // A ref callback, not an effect: the observer is tied to the node's lifetime.
  const observe = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={observe}
      className={cn(shown ? "animate-fade-up" : "motion-safe:opacity-0", className)}
      style={shown && delay ? { ...style, animationDelay: `${delay}ms` } : style}
      {...props}
    >
      {children}
    </div>
  );
}
