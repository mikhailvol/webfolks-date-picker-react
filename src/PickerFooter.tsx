"use client";

import type { RefObject } from "react";
import type { DatePickerStrings } from "./types";

export type PickerFooterProps = {
  /** Live summary: the formatted draft, or the "Select date" prompt. */
  summary: string;
  /** Hide the summary (`showFooterDate={false}`). */
  showSummary: boolean;
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
  showSummary,
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
  const hasActions = showToday || showClear;
  const summaryNode = showSummary && (
    <div className="wf-sdp-footer-left" aria-live="polite">
      {summary}
    </div>
  );
  const actions = hasActions && (
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
        {(showSummary || hasActions) && (
          <div className="wf-sdp-m-footer-row">
            {summaryNode}
            {actions}
          </div>
        )}
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

  if (!showSummary && !hasActions) return null;

  return (
    <div className="wf-sdp-footer">
      {summaryNode}
      {actions}
    </div>
  );
}
