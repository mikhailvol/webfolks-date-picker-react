"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";

/** Movement beyond this many pixels means the gesture was a scroll, not a tap. */
const TAP_MOVE_TOLERANCE = 6;

export type TapGestureHandlers = {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerCancel: (e: ReactPointerEvent) => void;
};

/**
 * Distinguishes intentional day taps from scroll gestures (critical on the
 * mobile fullscreen view): a pointer that moves more than 6px between down
 * and up never selects. Attach the returned handlers to the calendar container;
 * taps resolve against the nearest enabled `[data-date]` cell.
 */
export function useTapVsScroll(onTapDate: (iso: string) => void): TapGestureHandlers {
  const gesture = useRef({ active: false, x: 0, y: 0, moved: false, iso: null as string | null });

  return {
    onPointerDown: (e) => {
      if (e.button != null && e.button !== 0 && e.pointerType !== "touch") return;
      const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-date]");
      const enabled = !!cell && cell.getAttribute("aria-disabled") !== "true";
      gesture.current = {
        active: true,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        iso: enabled ? cell.getAttribute("data-date") : null,
      };
    },
    onPointerMove: (e) => {
      const g = gesture.current;
      if (!g.active || g.moved) return;
      if (
        Math.abs(e.clientX - g.x) > TAP_MOVE_TOLERANCE ||
        Math.abs(e.clientY - g.y) > TAP_MOVE_TOLERANCE
      ) {
        g.moved = true;
      }
    },
    onPointerUp: (e) => {
      const g = gesture.current;
      if (!g.active) return;
      const wasTap = !g.moved && g.iso;
      const iso = g.iso;
      gesture.current = { active: false, x: 0, y: 0, moved: false, iso: null };
      if (wasTap && iso) {
        e.preventDefault(); // avoid the synthetic click that follows
        onTapDate(iso);
      }
    },
    onPointerCancel: () => {
      gesture.current = { active: false, x: 0, y: 0, moved: false, iso: null };
    },
  };
}
