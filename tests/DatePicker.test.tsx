import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { DatePicker } from "../src/DatePicker";
import type { DatePickerRef, MonthDay } from "../src/types";

// Fixed "today": Sunday, March 15, 2026. Only Date is faked so real timers
// (focus restoration timeouts, etc.) keep working.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 2, 15, 12, 0, 0));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const getInput = () => screen.getByRole("textbox") as HTMLInputElement;
const openPicker = () => fireEvent.click(getInput());

const cell = (iso: string) => {
  const el = document.querySelector<HTMLElement>(`[data-date="${iso}"]`);
  if (!el) throw new Error(`No cell for ${iso}`);
  return el;
};

/** Simulates the pointer tap gesture the picker listens for. */
const tap = (el: HTMLElement) => {
  fireEvent.pointerDown(el, { button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(el, { button: 0, clientX: 10, clientY: 10 });
};

const monthButton = () => screen.getByRole("button", { name: /^Choose month/ });
const yearButton = () => screen.getByRole("button", { name: /^Choose year/ });

describe("DatePicker (date mode)", () => {
  it("renders a closed, empty input", () => {
    render(<DatePicker placeholder="Select date" />);
    expect(getInput()).toHaveValue("");
    expect(getInput()).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector(".wf-sdp-popover")).toBeNull();
  });

  it("opens on the current month with month and year toggles", () => {
    render(<DatePicker />);
    openPicker();
    expect(getInput()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("grid", { name: "March 2026" })).toBeInTheDocument();
    expect(monthButton()).toHaveTextContent("March");
    expect(yearButton()).toHaveTextContent("2026");
    expect(cell("2026-03-15")).toHaveAttribute("aria-current", "date");
  });

  it("picks a date, commits, formats and closes", () => {
    const onChange = vi.fn();
    render(<DatePicker onChange={onChange} />);
    openPicker();
    tap(cell("2026-03-20"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const d = onChange.mock.calls[0]![0] as Date;
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 2, 20]);
    expect(getInput()).toHaveValue("Mar 20, 2026");
    expect(getInput()).toHaveAttribute("aria-expanded", "false");
  });

  it("the month pane jumps to a month of the viewed year", () => {
    render(<DatePicker />);
    openPicker();
    fireEvent.click(monthButton());
    expect(monthButton()).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Jun" }));
    expect(screen.getByRole("grid", { name: "June 2026" })).toBeInTheDocument();
    expect(monthButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("the year pane lists the whole window and keeps the month", () => {
    render(<DatePicker yearsPast={3} yearsFuture={1} />);
    openPicker();
    fireEvent.click(yearButton());
    const years = document.querySelectorAll("[data-year]");
    expect(years).toHaveLength(5);
    expect(years[0]).toHaveTextContent("2023");
    fireEvent.click(screen.getByRole("button", { name: "2024" }));
    expect(screen.getByRole("grid", { name: "March 2024" })).toBeInTheDocument();
  });

  it("arrows step months in the day view and years in the month view", () => {
    render(<DatePicker />);
    openPicker();
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("grid", { name: "April 2026" })).toBeInTheDocument();
    fireEvent.click(monthButton());
    fireEvent.click(screen.getByRole("button", { name: "Next year" }));
    expect(yearButton()).toHaveTextContent("2027");
    fireEvent.click(screen.getByRole("button", { name: "Jan" }));
    expect(screen.getByRole("grid", { name: "January 2027" })).toBeInTheDocument();
  });

  it("disablePast disables earlier days and months, hides the prev arrow at the bound", () => {
    render(<DatePicker disablePast yearsFuture={0} />);
    openPicker();
    expect(cell("2026-03-14")).toHaveAttribute("aria-disabled", "true");
    expect(cell("2026-03-15")).not.toHaveAttribute("aria-disabled");
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    fireEvent.click(monthButton());
    expect(screen.getByRole("button", { name: "Feb" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mar" })).not.toBeDisabled();
  });

  it("Today selects today; Clear commits null", () => {
    const onChange = vi.fn();
    render(<DatePicker onChange={onChange} defaultValue={new Date(2025, 0, 1)} />);
    openPicker();
    expect(screen.getByRole("grid", { name: "January 2025" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(getInput()).toHaveValue("Mar 15, 2026");
    openPicker();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(getInput()).toHaveValue("");
  });

  it("keyboard: arrows move focus, Enter selects, Escape backs out of a pane", () => {
    const onChange = vi.fn();
    render(<DatePicker onChange={onChange} />);
    act(() => {
      getInput().focus();
    });
    fireEvent.keyDown(getInput(), { key: "ArrowDown" });
    expect(document.activeElement).toBe(cell("2026-03-15"));
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(cell("2026-03-16"));
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(document.activeElement).toBe(cell("2026-03-23"));

    fireEvent.click(yearButton());
    expect(document.activeElement).toHaveAttribute("data-year", "2026");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(yearButton()).toHaveAttribute("aria-expanded", "false");
    expect(getInput()).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(document.activeElement!, { key: "Enter" });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(getInput()).toHaveAttribute("aria-expanded", "false");
  });

  it("required: closing empty shows the error; hidden input carries yyyy-mm-dd", () => {
    render(<DatePicker required name="dob" />);
    openPicker();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("alert")).toHaveTextContent("Please select a date.");
    openPicker();
    tap(cell("2026-03-02"));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(document.querySelector<HTMLInputElement>('input[name="dob"]')!.value).toBe("2026-03-02");
  });

  it("showFooterDate hides the summary; with no shortcuts the desktop footer is gone", () => {
    const { unmount } = render(<DatePicker showFooterDate={false} />);
    openPicker();
    expect(document.querySelector(".wf-sdp-footer-left")).toBeNull();
    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
    unmount();
    render(<DatePicker showFooterDate={false} showToday={false} showClear={false} />);
    openPicker();
    expect(document.querySelector(".wf-sdp-footer")).toBeNull();
  });

  it("primaryColor is applied to the field and the portaled popover", () => {
    render(<DatePicker primaryColor="#0f766e" />);
    expect(document.querySelector<HTMLElement>(".wf-sdp-field")!.style.getPropertyValue("--wf-sdp-primary")).toBe("#0f766e");
    openPicker();
    expect(document.querySelector<HTMLElement>(".wf-sdp-popover")!.style.getPropertyValue("--wf-sdp-primary")).toBe("#0f766e");
  });

  it("controlled: external value updates the input; ref exposes the value", () => {
    const ref = createRef<DatePickerRef>();
    const { rerender } = render(<DatePicker ref={ref} value={null} />);
    expect(getInput()).toHaveValue("");
    rerender(<DatePicker ref={ref} value={new Date(2026, 6, 4)} />);
    expect(getInput()).toHaveValue("Jul 4, 2026");
    expect((ref.current!.getValue() as Date).getMonth()).toBe(6);
  });
});

describe("DatePicker (month-day mode)", () => {
  it("shows month and day without a year, on a plain grid", () => {
    render(<DatePicker mode="month-day" defaultValue={{ month: 2, day: 29 }} />);
    expect(getInput()).toHaveValue("February 29");
    openPicker();
    expect(screen.queryByRole("button", { name: /^Choose year/ })).toBeNull();
    expect(document.querySelector(".wf-sdp-weekdays")).toBeNull();
    expect(cell("2000-02-29")).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(monthButton()).toHaveTextContent("January");
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
  });

  it("emits { month, day } and carries mm-dd in the hidden input", () => {
    const onChange = vi.fn();
    render(<DatePicker mode="month-day" onChange={onChange} name="anniversary" />);
    openPicker();
    fireEvent.click(monthButton());
    fireEvent.click(screen.getByRole("button", { name: "Dec" }));
    tap(cell("2000-12-24"));
    expect(onChange).toHaveBeenCalledWith({ month: 12, day: 24 } satisfies MonthDay);
    expect(getInput()).toHaveValue("December 24");
    expect(document.querySelector<HTMLInputElement>('input[name="anniversary"]')!.value).toBe("12-24");
  });
});
