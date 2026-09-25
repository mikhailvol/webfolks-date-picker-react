"use client";

import type { RefObject } from "react";
import type { DatePickerStrings } from "./types";

export type PickerFooterProps = {
  /** Live summary: the formatted draft, or the "Select date" prompt. */
  summary: string;
  strings: DatePickerStrings;
  showToday: boolean;
  onToday: () => void;
  showClear: boolean;
  onClear: () => void;
  /** Mobile: stacked layout with a full-width confirm CTA. */
  mobile?: boolean;
  ctaDisabled?: boolean;
  ctaRef?: RefObject<HTMLButtonElement | null>;
  onCta?: () => void;
  ctaClassName?: string;
};

export function PickerFooter({
  summary,
  strings,
  showToday,
  onToday,
  showClear,
  onClear,
  mobile,
  ctaDisabled,
  ctaRef,
  onCta,
  ctaClassName,
}: PickerFooterProps) {
  const actions = (showToday || showClear) && (
    <div className="wf-sdp-footer-actions">
      {showClear && (
        <button type="button" className="wf-sdp-link wf-sdp-link--muted" onClick={onClear}>
          {strings.clear}
        </button>
      )}
      {showToday && (
        <button type="button" className="wf-sdp-link" onClick={onToday}>
          {strings.today}
        </button>
      )}
    </div>
  );

  if (mobile) {
    return (
      <div className="wf-sdp-m-footer">
        <div className="wf-sdp-m-footer-row">
          <div className="wf-sdp-footer-left" aria-live="polite">
            {summary}
          </div>
          {actions}
        </div>
        <button
          type="button"
          className={["wf-sdp-cta", ctaClassName].filter(Boolean).join(" ")}
          disabled={ctaDisabled}
          ref={ctaRef}
          onClick={onCta}
        >
          {strings.selectDate}
        </button>
      </div>
    );
  }

  return (
    <div className="wf-sdp-footer">
      <div className="wf-sdp-footer-left" aria-live="polite">
        {summary}
      </div>
      {actions}
    </div>
  );
}
