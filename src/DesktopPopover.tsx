"use client";

import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from "react";
import type { TapGestureHandlers } from "./useTapVsScroll";

export type DesktopPopoverProps = {
  id: string;
  popoverRef: RefObject<HTMLDivElement | null>;
  style?: CSSProperties;
  className?: string;
  ariaLabel: string;
  onKeyDown: (e: KeyboardEvent) => void;
  gesture: TapGestureHandlers;
  toolbar: ReactNode;
  body: ReactNode;
  footer: ReactNode;
};

export function DesktopPopover({
  id,
  popoverRef,
  style,
  className,
  ariaLabel,
  onKeyDown,
  gesture,
  toolbar,
  body,
  footer,
}: DesktopPopoverProps) {
  return (
    <div
      id={id}
      ref={popoverRef}
      role="group"
      aria-label={ariaLabel}
      className={["wf-sdp-popover", "open", className].filter(Boolean).join(" ")}
      style={{ ...(style ?? { position: "fixed", top: -9999, left: -9999 }) }}
      onKeyDown={onKeyDown}
    >
      <div className="wf-sdp-month">
        {toolbar}
        <div className="wf-sdp-body" {...gesture}>
          {body}
        </div>
      </div>
      {footer}
    </div>
  );
}
