"use client";

import { memo } from "react";
import {
  buildPlainDays,
  buildWeeks,
  isDayDisabled,
  sameDay,
  toISODate,
  type Bounds,
} from "./dateUtils";
import { formatFullDate, formatMonthDay, formatMonthYear, getWeekdayLabels } from "./formatDate";
import type { PickerMode, WeekStart } from "./types";

export type DayGridProps = {
  /** First day of the month to render. */
  month: Date;
  mode: PickerMode;
  bounds: Bounds;
  draft: Date | null;
  today: Date;
  locale: string;
  weekStartsOn: WeekStart;
  focusedDate: Date | null;
  /** Hidden (but still laid out) while the month or year pane is open. */
  hidden: boolean;
  registerCell: (iso: string, el: HTMLDivElement | null) => void;
};

/**
 * The day grid. In `date` mode: weekday header + 6 weeks. In `month-day`
 * mode: days 1…n in plain rows (no weekdays, since a day of the month lands on
 * a different weekday every year).
 */
export const DayGrid = memo(function DayGrid({
  month,
  mode,
  bounds,
  draft,
  today,
  locale,
  weekStartsOn,
  focusedDate,
  hidden,
  registerCell,
}: DayGridProps) {
  const monthDay = mode === "month-day";
  const rows = monthDay ? buildPlainDays(month) : buildWeeks(month, weekStartsOn);
  const title = monthDay
    ? formatMonthDay(month, locale).replace(/\s*\d+\s*/, "").trim() || String(month.getMonth() + 1)
    : formatMonthYear(month, locale);
  const label = (d: Date) => (monthDay ? formatMonthDay(d, locale) : formatFullDate(d, locale));

  return (
    <div
      role="grid"
      aria-label={title}
      className={["wf-sdp-days", hidden && "wf-sdp-days--hidden"].filter(Boolean).join(" ")}
    >
      {!monthDay && (
        <div className="wf-sdp-weekdays" role="row">
          {getWeekdayLabels(locale, weekStartsOn).map((w, i) => (
            <div key={i} role="columnheader" className="wf-sdp-weekday">
              {w}
            </div>
          ))}
        </div>
      )}
      <div className="wf-sdp-grid">
        {rows.map((row, ri) => (
          <div key={ri} role="row" className="wf-sdp-week">
            {row.map((date, di) => {
              if (!date) {
                return (
                  <div key={di} role="gridcell" aria-hidden className="wf-sdp-cell wf-sdp-empty" />
                );
              }
              const iso = toISODate(date);
              const disabled = isDayDisabled(date, bounds);
              const selected = sameDay(draft, date);
              const isToday = sameDay(today, date);
              const classes = [
                "wf-sdp-cell",
                disabled && "wf-sdp-disabled",
                isToday && "wf-sdp-today",
                selected && "wf-sdp-selected",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  key={di}
                  role="gridcell"
                  data-date={iso}
                  className={classes}
                  aria-label={label(date)}
                  aria-disabled={disabled || undefined}
                  aria-selected={selected || undefined}
                  aria-current={isToday ? "date" : undefined}
                  tabIndex={disabled || hidden ? -1 : sameDay(focusedDate, date) ? 0 : -1}
                  ref={(el) => registerCell(iso, el)}
                >
                  <span className="wf-sdp-day">{date.getDate()}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
