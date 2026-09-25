"use client";

import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";
import type { PopoverAlign, PopoverDrop } from "./types";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const GAP = 8;
const VIEWPORT_PAD = 8;
/** Below-space threshold under which `drop: "auto"` flips upward (original behavior). */
const AUTO_FLIP_THRESHOLD = 350;

type Options = {
  open: boolean;
  /** Positioning only applies to the desktop popover. */
  enabled: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  popoverRef: RefObject<HTMLElement | null>;
  drop: PopoverDrop;
  align: PopoverAlign;
  /** Any value whose change should trigger a re-measure (e.g. visible-month key). */
  recalcKey?: string;
};

/**
 * Fixed-position anchoring with the original picker's rules: 8px gap,
 * `drop` down/up/auto (auto flips up when less than 350px remains below and
 * there is more space above), `align` left/center/right, then clamping into
 * the viewport with 8px padding. Repositions on scroll and resize.
 */
export function usePopoverPosition({
  open,
  enabled,
  anchorRef,
  popoverRef,
  drop,
  align,
  recalcKey,
}: Options): CSSProperties | undefined {
  const [style, setStyle] = useState<CSSProperties>();

  useIsoLayoutEffect(() => {
    if (!open || !enabled) {
      setStyle(undefined);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      const pop = popoverRef.current;
      if (!anchor || !pop) return;

      const r = anchor.getBoundingClientRect();
      const popW = pop.offsetWidth || 0;
      const popH = pop.offsetHeight || 0;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;

      let direction = drop;
      if (direction === "auto") {
        const spaceBelow = vh - r.bottom;
        const spaceAbove = r.top;
        direction = spaceBelow < AUTO_FLIP_THRESHOLD && spaceAbove > spaceBelow ? "up" : "down";
      }

      let top = direction === "up" ? r.top - popH - GAP : r.bottom + GAP;
      top = Math.min(top, vh - popH - VIEWPORT_PAD);
      top = Math.max(VIEWPORT_PAD, top);

      let left =
        align === "center"
          ? r.left + r.width / 2 - popW / 2
          : align === "right"
            ? r.right - popW
            : r.left;
      left = Math.min(left, vw - popW - VIEWPORT_PAD);
      left = Math.max(VIEWPORT_PAD, left);

      setStyle({ position: "fixed", top, left });
    };

    update();
    // Re-measure once fonts/layout have settled after first paint.
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, enabled, drop, align, recalcKey, anchorRef, popoverRef]);

  return style;
}
