"use client";

import type { DatePickerStrings, PickerMode, PickerView } from "./types";

export type PickerToolbarProps = {
  view: PickerView;
  mode: PickerMode;
  monthLabel: string;
  yearLabel: string;
  canPrev: boolean;
  canNext: boolean;
  /** Arrows step months in the day view and years in the month view. */
  onPrev: () => void;
  onNext: () => void;
  onToggleMonths: () => void;
  onToggleYears: () => void;
  strings: DatePickerStrings;
};

const Chevron = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 8l5 5 5-5" />
  </svg>
);

/**
 * Month/year navigation: prev/next arrows around two toggle buttons that open
 * the month and year panes. The arrows are hidden (not removed, so nothing
 * shifts) whenever stepping makes no sense for the current view.
 */
export function PickerToolbar({
  view,
  mode,
  monthLabel,
  yearLabel,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onToggleMonths,
  onToggleYears,
  strings,
}: PickerToolbarProps) {
  const stepsYears = view === "months";
  const arrowsHidden = view === "years" || (view === "months" && mode === "month-day");
  const prevLabel = stepsYears ? strings.previousYear : strings.previousMonth;
  const nextLabel = stepsYears ? strings.nextYear : strings.nextMonth;

  return (
    <div className="wf-sdp-toolbar">
      <button
        type="button"
        className={["wf-sdp-nav", "prev", arrowsHidden && "wf-sdp-nav--hidden"].filter(Boolean).join(" ")}
        disabled={arrowsHidden || !canPrev}
        aria-hidden={arrowsHidden || undefined}
        aria-label={prevLabel}
        onClick={onPrev}
      >
        <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden>
          <path d="M30.83 32.67L21.66 23.5L30.83 14.33L28 11.5L16 23.5L28 35.5L30.83 32.67Z" />
        </svg>
      </button>

      <div className="wf-sdp-title">
        <button
          type="button"
          className="wf-sdp-title-btn"
          aria-label={`${strings.chooseMonth}: ${monthLabel}`}
          aria-expanded={view === "months"}
          onClick={onToggleMonths}
        >
          <span>{monthLabel}</span>
          <Chevron />
        </button>
        {mode === "date" && (
          <button
            type="button"
            className="wf-sdp-title-btn"
            aria-label={`${strings.chooseYear}: ${yearLabel}`}
            aria-expanded={view === "years"}
            onClick={onToggleYears}
          >
            <span>{yearLabel}</span>
            <Chevron />
          </button>
        )}
      </div>

      <button
        type="button"
        className={["wf-sdp-nav", "next", arrowsHidden && "wf-sdp-nav--hidden"].filter(Boolean).join(" ")}
        disabled={arrowsHidden || !canNext}
        aria-hidden={arrowsHidden || undefined}
        aria-label={nextLabel}
        onClick={onNext}
      >
        <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden>
          <path d="M17.17 32.92L26.34 23.75L17.17 14.58L20 11.75L32 23.75L20 35.75L17.17 32.92Z" />
        </svg>
      </button>
    </div>
  );
}
