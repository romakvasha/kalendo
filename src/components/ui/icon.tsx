import { cloneElement, isValidElement, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Icon slots accept either an element (`<Star className="…" />`) or the icon
 * component itself (`Star`), so callers never have to remember which.
 */
export type IconLike = ReactNode | LucideIcon;

const FORWARD_REF = Symbol.for("react.forward_ref");
const MEMO = Symbol.for("react.memo");

/** Lucide icons are `forwardRef` objects, so a `typeof === "function"` test misses them. */
function isComponentType(value: unknown): value is LucideIcon {
  if (typeof value === "function") return true;
  if (typeof value !== "object" || value === null) return false;
  const tag = (value as { $$typeof?: symbol }).$$typeof;
  return tag === FORWARD_REF || tag === MEMO;
}

export function renderIcon(
  icon: IconLike | undefined,
  className?: string,
): ReactNode {
  if (icon === undefined || icon === null || typeof icon === "boolean") {
    return null;
  }

  if (isValidElement<{ className?: string }>(icon)) {
    return cloneElement(icon, {
      className: cn(className, icon.props.className),
    });
  }

  if (isComponentType(icon)) {
    const Glyph = icon;
    return <Glyph className={className} aria-hidden />;
  }

  return icon;
}
