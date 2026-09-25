import type { CSSProperties, FocusEventHandler } from "react";

/** A month/day pair without a year (e.g. a birthday or an anniversary). `month` is 1–12. */
export type MonthDay = { month: number; day: number };

/** `date` — month, day and year (default). `month-day` — month and day only, no year. */
export type PickerMode = "date" | "month-day";

/** Horizontal alignment of the desktop popover relative to the input. */
export type PopoverAlign = "left" | "center" | "right";

/** Vertical opening direction of the desktop popover. `auto` picks by viewport space. */
export type PopoverDrop = "down" | "up" | "auto";

/** First day of the week in the calendar grid: `1` = Monday (default), `0` = Sunday. */
export type WeekStart = 0 | 1;

/** The three calendar views: the day grid, the month picker, the year picker. */
export type PickerView = "days" | "months" | "years";

/** Every piece of UI text, overridable for i18n. */
export type DatePickerStrings = {
  /** Mobile header title, mobile CTA, and the footer prompt while nothing is selected. */
  selectDate: string;
  /** aria-label of the mobile close button. */
  close: string;
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
  /** aria-label of the month button in the toolbar. */
  chooseMonth: string;
  /** aria-label of the year button in the toolbar. */
  chooseYear: string;
  /** Footer "Today" shortcut. */
  today: string;
  /** Footer "Clear" action. */
  clear: string;
  /** Validation message when `required` and nothing is selected. */
  errorRequired: string;
};

export const defaultStrings: DatePickerStrings = {
  selectDate: "Select date",
  close: "Close",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  previousYear: "Previous year",
  nextYear: "Next year",
  chooseMonth: "Choose month",
  chooseYear: "Choose year",
  today: "Today",
  clear: "Clear",
  errorRequired: "Please select a date.",
};

/** Optional class overrides merged onto the library's own classes. */
export type DatePickerClassNames = Partial<{
  root: string;
  input: string;
  error: string;
  popover: string;
  cta: string;
}>;

type DatePickerBaseProps = {
  /** Fires when the popover/modal opens or closes. */
  onOpenChange?: (open: boolean) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;

  /**
   * Primary brand color used for the selected day, active states, and buttons.
   * Applied to both the input and the (portaled) popover, so it works without
   * any CSS. Any valid CSS color. Equivalent to setting `--wf-sdp-primary`.
   */
  primaryColor?: string;

  /** How many whole years back from today are selectable. Default `30`. `date` mode only. */
  yearsPast?: number;
  /** How many whole years ahead of today are selectable. Default `10`. `date` mode only. */
  yearsFuture?: number;
  /** Exact earliest selectable date. Overrides `yearsPast`. `date` mode only. */
  minDate?: Date;
  /** Exact latest selectable date. Overrides `yearsFuture`. `date` mode only. */
  maxDate?: Date;
  /** Disable dates before today. Default `false`. `date` mode only. */
  disablePast?: boolean;
  /** Disable dates after today. Default `false`. `date` mode only. */
  disableFuture?: boolean;

  /**
   * Display pattern for the input and footer. Tokens: `yyyy`, `yy`, `MMMM`,
   * `MMM`, `MM`, `M`, `dd`, `d`, `EEEE`, `EEE`. Defaults: `"MMM d, yyyy"`
   * in `date` mode, `"MMMM d"` in `month-day` mode.
   */
  format?: string;
  /** BCP-47 locale for month/weekday names, e.g. `"en"`, `"uk"`, `"de"`. Default `"en"`. */
  locale?: string;
  /** First day of the week: `1` = Monday (default), `0` = Sunday. */
  weekStartsOn?: WeekStart;

  /**
   * Show the calendar footer at all (summary, Today, Clear). Default `true`.
   * With `false`, the desktop popover ends right after the day grid; the
   * mobile sheet keeps only its confirm CTA.
   */
  showFooter?: boolean;
  /**
   * Show the selected date (or the "Select date" prompt) in the calendar
   * footer. Default `true`. With `false`, and `showToday` / `showClear`
   * off too, the desktop footer is omitted entirely; the mobile sheet keeps
   * its CTA. The input text is unaffected.
   */
  showFooterDate?: boolean;
  /** Show the "Today" shortcut in the footer. Default `true`. */
  showToday?: boolean;
  /** Show the "Clear" action in the footer once a date is selected. Default `true`. */
  showClear?: boolean;

  /** Desktop popover alignment. Default `"center"`. */
  align?: PopoverAlign;
  /** Desktop popover direction. Default `"down"`. */
  drop?: PopoverDrop;

  /** A date is required; closing without one shows the error. Default `false`. */
  required?: boolean;
  /**
   * External error, e.g. from your form library. A string is shown as the
   * message; `true` shows the default message; falsy hides it.
   */
  error?: string | boolean;
  /** Override any UI text. Merged over the English defaults. */
  strings?: Partial<DatePickerStrings>;

  disabled?: boolean;
  placeholder?: string;
  id?: string;
  /** Name for a hidden input for plain HTML forms: `yyyy-mm-dd` in `date` mode, `mm-dd` in `month-day` mode. */
  name?: string;
  className?: string;
  classNames?: DatePickerClassNames;
  style?: CSSProperties;
};

/** Props in `date` mode (the default): the value is a local-midnight `Date`. */
export type DatePickerDateProps = DatePickerBaseProps & {
  mode?: "date";
  /** Controlled value. Omit (and optionally pass `defaultValue`) for uncontrolled use. */
  value?: Date | null;
  /** Initial value when uncontrolled. */
  defaultValue?: Date | null;
  /** Fires when a date is committed (on pick on desktop, CTA on mobile, `clear()`). */
  onChange?: (date: Date | null) => void;
};

/** Props in `month-day` mode: the value is a `{ month, day }` pair, no year. */
export type DatePickerMonthDayProps = DatePickerBaseProps & {
  mode: "month-day";
  /** Controlled value. Omit (and optionally pass `defaultValue`) for uncontrolled use. */
  value?: MonthDay | null;
  /** Initial value when uncontrolled. */
  defaultValue?: MonthDay | null;
  /** Fires when a month/day is committed (on pick on desktop, CTA on mobile, `clear()`). */
  onChange?: (value: MonthDay | null) => void;
};

/** Public props of {@link DatePicker}. The `mode` prop decides the value type. */
export type DatePickerProps = DatePickerDateProps | DatePickerMonthDayProps;

/** Imperative API, exposed via `ref`. */
export type DatePickerRef = {
  open: () => void;
  close: () => void;
  /** Clears the selection and commits `null`. */
  clear: () => void;
  /** Focuses the input. */
  focus: () => void;
  /** Current committed value: a `Date` in `date` mode, a `MonthDay` in `month-day` mode. */
  getValue: () => Date | MonthDay | null;
};
