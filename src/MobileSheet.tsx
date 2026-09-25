"use client";

import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from "react";
import type { TapGestureHandlers } from "./useTapVsScroll";
import type { DatePickerStrings } from "./types";

export type MobileSheetProps = {
  id: string;
  popoverRef: RefObject<HTMLDivElement | null>;
  style?: CSSProperties;
  className?: string;
  onKeyDown: (e: KeyboardEvent) => void;
  gesture: TapGestureHandlers;
  onClose: () => void;
  strings: DatePickerStrings;
  toolbar: ReactNode;
  body: ReactNode;
  footer: ReactNode;
};

/**
 * Fullscreen mobile experience: sticky header with a close action, the
 * month/year toolbar, the calendar body (day grid or an overlaid month/year
 * pane), and a sticky footer with the live summary, shortcuts, and the CTA.
 */
export function MobileSheet({
  id,
  popoverRef,
  style,
  className,
  onKeyDown,
  gesture,
  onClose,
  strings,
  toolbar,
  body,
  footer,
}: MobileSheetProps) {
  return (
    <div
      id={id}
      ref={popoverRef}
      role="dialog"
      aria-modal="true"
      aria-label={strings.selectDate}
      className={["wf-sdp-popover", "wf-sdp-popover--mobile", "open", className]
        .filter(Boolean)
        .join(" ")}
      style={style}
      onKeyDown={onKeyDown}
    >
      <div className="wf-sdp-modal">
        <div className="wf-sdp-m-header">
          <div className="wf-sdp-m-title">{strings.selectDate}</div>
          <button type="button" className="wf-sdp-m-close" aria-label={strings.close} onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7a1 1 0 1 0-1.41 1.41L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" />
            </svg>
          </button>
        </div>

        <div className="wf-sdp-m-toolbar">{toolbar}</div>

        <div className="wf-sdp-m-body">
          <div className="wf-sdp-body" {...gesture}>
            {body}
          </div>
        </div>

        {footer}
      </div>
    </div>
  );
}
