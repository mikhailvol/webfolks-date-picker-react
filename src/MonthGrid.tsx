"use client";

export type MonthGridProps = {
  /** Twelve labels, January first. */
  labels: string[];
  ariaLabel: string;
  isDisabled: (monthIndex: number) => boolean;
  /** Month of the draft value when it falls in the viewed year. */
  selectedIndex: number | null;
  /** Current calendar month when the viewed year is this year. */
  todayIndex: number | null;
  /** Roving tabindex target. */
  focusedIndex: number;
  onPick: (monthIndex: number) => void;
  registerButton: (monthIndex: number, el: HTMLButtonElement | null) => void;
};

/** 3×4 month pane, overlaid on the day grid. */
export function MonthGrid({
  labels,
  ariaLabel,
  isDisabled,
  selectedIndex,
  todayIndex,
  focusedIndex,
  onPick,
  registerButton,
}: MonthGridProps) {
  return (
    <div className="wf-sdp-pane wf-sdp-months" role="group" aria-label={ariaLabel}>
      {labels.map((label, i) => {
        const disabled = isDisabled(i);
        const selected = i === selectedIndex;
        return (
          <button
            key={i}
            type="button"
            data-month={i}
            className={[
              "wf-sdp-option",
              selected && "wf-sdp-option--selected",
              i === todayIndex && "wf-sdp-option--today",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={disabled}
            aria-pressed={selected}
            tabIndex={!disabled && i === focusedIndex ? 0 : -1}
            onClick={() => onPick(i)}
            ref={(el) => registerButton(i, el)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
