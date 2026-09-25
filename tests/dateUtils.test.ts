import { describe, expect, it } from "vitest";
import {
  REF_YEAR,
  buildPlainDays,
  buildWeeks,
  clampMonthToBounds,
  computeBounds,
  fromMonthDay,
  isMonthDisabled,
  isYearDisabled,
  toISODate,
  toMonthDay,
  toMonthDayString,
  yearsInBounds,
} from "../src/dateUtils";

const today = new Date(2026, 2, 15);

describe("computeBounds", () => {
  it("spans whole calendar years around today", () => {
    const b = computeBounds({ today, yearsPast: 30, yearsFuture: 10 });
    expect(toISODate(b.min)).toBe("1996-01-01");
    expect(toISODate(b.max)).toBe("2036-12-31");
    expect(yearsInBounds(b)).toHaveLength(41);
  });

  it("exact minDate/maxDate override the year window", () => {
    const b = computeBounds({
      today,
      yearsPast: 30,
      yearsFuture: 10,
      minDate: new Date(2026, 0, 10, 15, 30),
      maxDate: new Date(2026, 5, 20),
    });
    expect(toISODate(b.min)).toBe("2026-01-10");
    expect(toISODate(b.max)).toBe("2026-06-20");
  });

  it("disablePast / disableFuture clamp to today", () => {
    const past = computeBounds({ today, yearsPast: 5, yearsFuture: 5, disablePast: true });
    expect(toISODate(past.min)).toBe("2026-03-15");
    const future = computeBounds({ today, yearsPast: 5, yearsFuture: 5, disableFuture: true });
    expect(toISODate(future.max)).toBe("2026-03-15");
  });

  it("disables months and years that have no selectable day", () => {
    const b = computeBounds({ today, yearsPast: 0, yearsFuture: 0, disablePast: true });
    expect(isMonthDisabled(2026, 1, b)).toBe(true); // February 2026
    expect(isMonthDisabled(2026, 2, b)).toBe(false); // March (from the 15th)
    expect(isYearDisabled(2025, b)).toBe(true);
    expect(isYearDisabled(2026, b)).toBe(false);
    expect(toISODate(clampMonthToBounds(new Date(2025, 5, 1), b))).toBe("2026-03-01");
  });
});

describe("month/day values", () => {
  it("round-trips through the reference leap year", () => {
    const d = fromMonthDay({ month: 2, day: 29 })!;
    expect(d.getFullYear()).toBe(REF_YEAR);
    expect(toMonthDay(d)).toEqual({ month: 2, day: 29 });
    expect(toMonthDayString({ month: 2, day: 9 })).toBe("02-09");
  });

  it("rejects invalid pairs", () => {
    expect(fromMonthDay({ month: 13, day: 1 })).toBeNull();
    expect(fromMonthDay({ month: 4, day: 31 })).toBeNull();
    expect(fromMonthDay({ month: 2, day: 30 })).toBeNull();
    expect(fromMonthDay(null)).toBeNull();
  });
});

describe("grids", () => {
  it("always builds 6 weeks, honoring the week start", () => {
    const monday = buildWeeks(new Date(2026, 2, 1), 1); // March 2026 starts on a Sunday
    expect(monday).toHaveLength(6);
    expect(monday[0]!.slice(0, 6).every((c) => c === null)).toBe(true);
    expect(monday[0]![6]!.getDate()).toBe(1);
    const sunday = buildWeeks(new Date(2026, 2, 1), 0);
    expect(sunday[0]![0]!.getDate()).toBe(1);
  });

  it("builds plain 5-row grids for month-day mode", () => {
    const rows = buildPlainDays(new Date(REF_YEAR, 1, 1));
    expect(rows).toHaveLength(5);
    expect(rows[0]![0]!.getDate()).toBe(1);
    expect(rows[4]![0]!.getDate()).toBe(29);
    expect(rows[4]![1]).toBeNull();
  });
});
