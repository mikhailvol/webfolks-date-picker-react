import type { MonthDay, WeekStart } from "./types";

/** Reference year for `month-day` values: a leap year, so February 29 is representable. */
export const REF_YEAR = 2000;

/** Local-midnight copy of a date (calendar day only, no time component). */
export function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function sameDay(a?: Date | null, b?: Date | null): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Equal dates, or both `null`. */
export function datesEqual(a: Date | null, b: Date | null): boolean {
  return (!a && !b) || sameDay(a, b);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** First day of the month `n` months away from the given month. */
export function addMonthsToMonth(month: Date, n: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + n, 1);
}

/** Move a date by whole months, clamping the day to the target month's length. */
export function addMonthsClamped(date: Date, n: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const lastDay = endOfMonth(target).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

/** Compare two dates by month only (<0, 0, >0). */
export function compareMonth(a: Date, b: Date): number {
  return a.getFullYear() * 12 + a.getMonth() - (b.getFullYear() * 12 + b.getMonth());
}

export function clampDate(d: Date, min: Date, max: Date): Date {
  if (d < min) return stripTime(min);
  if (d > max) return stripTime(max);
  return d;
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** `"YYYY-MM"` key for a month. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

/**
 * Serialize a local calendar date as `yyyy-mm-dd`.
 * Never use `Date#toISOString()` for calendar dates — the UTC shift can move the day.
 */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Parse `yyyy-mm-dd` into a local-midnight Date; `null` when invalid. */
export function fromISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  return date.getFullYear() === Number(y) &&
    date.getMonth() === Number(mo) - 1 &&
    date.getDate() === Number(d)
    ? date
    : null;
}

// Month/day values -----------------------------------------------------------

/** `{ month: 1–12, day }` of a date. */
export function toMonthDay(d: Date): MonthDay {
  return { month: d.getMonth() + 1, day: d.getDate() };
}

/** A `MonthDay` as a Date in the reference (leap) year; `null` when invalid. */
export function fromMonthDay(v: MonthDay | null | undefined): Date | null {
  if (!v) return null;
  const { month, day } = v;
  if (!Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(REF_YEAR, month - 1)) return null;
  return new Date(REF_YEAR, month - 1, day);
}

export function monthDayEqual(a: MonthDay | null, b: MonthDay | null): boolean {
  return (!a && !b) || (!!a && !!b && a.month === b.month && a.day === b.day);
}

/** `"mm-dd"` for hidden form inputs. */
export function toMonthDayString(v: MonthDay): string {
  return `${pad2(v.month)}-${pad2(v.day)}`;
}

// Bounds ---------------------------------------------------------------------

export type Bounds = {
  /** Earliest selectable day (local midnight). */
  min: Date;
  /** Latest selectable day (local midnight). */
  max: Date;
};

/**
 * Selectable window: whole calendar years around today (`yearsPast` /
 * `yearsFuture`), or exact `minDate` / `maxDate`, then clamped to today by
 * `disablePast` / `disableFuture`.
 */
export function computeBounds(opts: {
  today: Date;
  yearsPast: number;
  yearsFuture: number;
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
  disableFuture?: boolean;
}): Bounds {
  const t = stripTime(opts.today);
  let min = opts.minDate
    ? stripTime(opts.minDate)
    : new Date(t.getFullYear() - Math.max(0, Math.floor(opts.yearsPast)), 0, 1);
  let max = opts.maxDate
    ? stripTime(opts.maxDate)
    : new Date(t.getFullYear() + Math.max(0, Math.floor(opts.yearsFuture)), 11, 31);
  if (opts.disablePast && min < t) min = t;
  if (opts.disableFuture && max > t) max = t;
  if (max < min) max = min;
  return { min, max };
}

/** The bounds used in `month-day` mode: every day of the reference year. */
export const MONTH_DAY_BOUNDS: Bounds = {
  min: new Date(REF_YEAR, 0, 1),
  max: new Date(REF_YEAR, 11, 31),
};

export function isDayDisabled(date: Date, bounds: Bounds): boolean {
  return date < bounds.min || date > bounds.max;
}

/** No selectable day in this month. */
export function isMonthDisabled(year: number, monthIndex: number, bounds: Bounds): boolean {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  return last < bounds.min || first > bounds.max;
}

/** No selectable day in this year. */
export function isYearDisabled(year: number, bounds: Bounds): boolean {
  return new Date(year, 11, 31) < bounds.min || new Date(year, 0, 1) > bounds.max;
}

/** Nearest month (first-of-month) inside the bounds. */
export function clampMonthToBounds(month: Date, bounds: Bounds): Date {
  const m = startOfMonth(month);
  const minMonth = startOfMonth(bounds.min);
  const maxMonth = startOfMonth(bounds.max);
  if (compareMonth(m, minMonth) < 0) return minMonth;
  if (compareMonth(m, maxMonth) > 0) return maxMonth;
  return m;
}

/** Every year from the first to the last selectable one, ascending. */
export function yearsInBounds(bounds: Bounds): number[] {
  const years: number[] = [];
  for (let y = bounds.min.getFullYear(); y <= bounds.max.getFullYear(); y++) years.push(y);
  return years;
}

// Day grids ------------------------------------------------------------------

/**
 * Weeks of a month as rows of 7, padded with `null` and always 6 rows tall so
 * the popover never changes height while navigating.
 */
export function buildWeeks(month: Date, weekStartsOn: WeekStart = 1): (Date | null)[][] {
  const first = startOfMonth(month);
  const total = endOfMonth(month).getDate();
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= total; d++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  while (cells.length < 42) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * `month-day` mode has no weekday alignment (a day of the month falls on a
 * different weekday every year), so days run 1…n in plain rows of 7, always
 * 5 rows tall.
 */
export function buildPlainDays(month: Date): (Date | null)[][] {
  const total = endOfMonth(month).getDate();
  const cells: (Date | null)[] = [];
  for (let d = 1; d <= total; d++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  while (cells.length < 35) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}
