"use client";

import type { RefObject } from "react";

export type YearGridProps = {
  years: number[];
  ariaLabel: string;
  isDisabled: (year: number) => boolean;
  selectedYear: number | null;
  todayYear: number;
  /** Roving tabindex target. */
  focusedYear: number;
  scrollerRef: RefObject<HTMLDivElement | null>;
  onPick: (year: number) => void;
  registerButton: (year: number, el: HTMLButtonElement | null) => void;
};

/** Scrollable 4-column year pane, overlaid on the day grid. */
export function YearGrid({
  years,
  ariaLabel,
  isDisabled,
  selectedYear,
  todayYear,
  focusedYear,
  scrollerRef,
  onPick,
  registerButton,
}: YearGridProps) {
  return (
    <div className="wf-sdp-pane wf-sdp-years" role="group" aria-label={ariaLabel} ref={scrollerRef}>
      {years.map((y) => {
        const disabled = isDisabled(y);
        const selected = y === selectedYear;
        return (
          <button
            key={y}
            type="button"
            data-year={y}
            className={[
              "wf-sdp-option",
              selected && "wf-sdp-option--selected",
              y === todayYear && "wf-sdp-option--today",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={disabled}
            aria-pressed={selected}
            tabIndex={!disabled && y === focusedYear ? 0 : -1}
            onClick={() => onPick(y)}
            ref={(el) => registerButton(y, el)}
          >
            {y}
          </button>
        );
      })}
    </div>
  );
}
