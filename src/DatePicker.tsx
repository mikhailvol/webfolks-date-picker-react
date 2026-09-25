"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { DayGrid } from "./DayGrid";
import { DesktopPopover } from "./DesktopPopover";
import { MobileSheet } from "./MobileSheet";
import { MonthGrid } from "./MonthGrid";
import { PickerFooter } from "./PickerFooter";
import { PickerToolbar } from "./PickerToolbar";
import { YearGrid } from "./YearGrid";
import {
  MONTH_DAY_BOUNDS,
  REF_YEAR,
  addDays,
  addMonthsClamped,
  addMonthsToMonth,
  clampDate,
  clampMonthToBounds,
  compareMonth,
  computeBounds,
  datesEqual,
  fromISODate,
  fromMonthDay,
  isDayDisabled,
  isMonthDisabled,
  isYearDisabled,
  monthKey,
  sameDay,
  startOfMonth,
  stripTime,
  toISODate,
  toMonthDay,
  toMonthDayString,
  yearsInBounds,
} from "./dateUtils";
import { formatMonthName, formatWithPattern, getMonthLabels, resolveLocale } from "./formatDate";
import { useIsMobile } from "./useIsMobile";
import { usePopoverPosition } from "./usePopoverPosition";
import { useTapVsScroll } from "./useTapVsScroll";
import {
  defaultStrings,
  type DatePickerProps,
  type DatePickerRef,
  type MonthDay,
  type PickerView,
} from "./types";

/** Ceiling for skip-disabled scans, spanning any gap up to a year. */
const MAX_SKIP_STEPS = 370;

/** useLayoutEffect that stays silent during SSR renders. */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type PendingFocus = "cell" | "month" | "year" | "cta" | null;

/**
 * WebFolks Date Picker — one input, one date, with quick month and year
 * selection. Desktop: popover anchored to the input, a pick commits and
 * closes. Mobile (<768px): fullscreen sheet, confirmed with the CTA.
 */
export const DatePicker = forwardRef<DatePickerRef, DatePickerProps>(function DatePicker(props, ref) {
  const {
    onOpenChange,
    onBlur,
    primaryColor,
    yearsPast = 30,
    yearsFuture = 10,
    minDate,
    maxDate,
    disablePast = false,
    disableFuture = false,
    format,
    locale = "en",
    weekStartsOn = 1,
    compact = false,
    showFooter = true,
    showFooterDate = true,
    showToday = true,
    showClear = true,
    align = "center",
    drop = "down",
    required = false,
    error,
    strings: stringsOverride,
    disabled = false,
    placeholder,
    id,
    name,
    className,
    classNames,
    style,
  } = props;
  const mode = props.mode ?? "date";
  const isMonthDay = mode === "month-day";

  const strings = useMemo(() => ({ ...defaultStrings, ...stringsOverride }), [stringsOverride]);
  const resolvedLocale = useMemo(() => resolveLocale(locale), [locale]);
  const pattern = format ?? (isMonthDay ? "MMMM d" : "MMM d, yyyy");

  const [today] = useState(() => stripTime(new Date()));
  /** "Today" in the picker's own coordinates (the reference year in month-day mode). */
  const todayRef = useMemo(
    () => (isMonthDay ? new Date(REF_YEAR, today.getMonth(), today.getDate()) : today),
    [isMonthDay, today]
  );
  const bounds = useMemo(
    () =>
      isMonthDay
        ? MONTH_DAY_BOUNDS
        : computeBounds({ today, yearsPast, yearsFuture, minDate, maxDate, disablePast, disableFuture }),
    [isMonthDay, today, yearsPast, yearsFuture, minDate, maxDate, disablePast, disableFuture]
  );
  const years = useMemo(() => yearsInBounds(bounds), [bounds]);

  // Committed value (what the form sees) ----------------------------------
  // Month-day values live internally as Dates in the reference year.
  const normalize = (v: Date | MonthDay | null | undefined): Date | null => {
    if (v == null) return null;
    if (v instanceof Date) {
      return isMonthDay ? new Date(REF_YEAR, v.getMonth(), v.getDate()) : stripTime(v);
    }
    return fromMonthDay(v);
  };

  const value = props.value;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<Date | null>(() => normalize(props.defaultValue));
  const committed = isControlled ? normalize(value) : internalValue;
  const committedRef = useRef(committed);
  committedRef.current = committed;

  // Working selection shown in the calendar -------------------------------
  const [draft, setDraft] = useState<Date | null>(committed);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // External value updates (form reset, programmatic set) re-seed the draft.
  const prevValueRef = useRef<Date | MonthDay | null | undefined>(value);
  useEffect(() => {
    if (isControlled) {
      const prev = normalize(prevValueRef.current);
      const next = normalize(value);
      if (!datesEqual(prev, next)) {
        setDraft(next);
        setInternalError(false);
      }
    }
    prevValueRef.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isControlled]);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PickerView>("days");
  const [internalError, setInternalError] = useState(false);
  const isMobile = useIsMobile();

  const [viewMonth, setViewMonth] = useState<Date>(() =>
    clampMonthToBounds(startOfMonth(committed ?? todayRef), bounds)
  );
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const [focusedMonth, setFocusedMonth] = useState<number>(viewMonth.getMonth());
  const [focusedYear, setFocusedYear] = useState<number>(viewMonth.getFullYear());

  const inputRef = useRef<HTMLInputElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const yearScrollerRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLButtonElement | null>(null);
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const monthBtnRefs = useRef(new Map<number, HTMLButtonElement>());
  const yearBtnRefs = useRef(new Map<number, HTMLButtonElement>());
  const suppressFocusOpenRef = useRef(false);
  const closedByPointerRef = useRef(false);
  const pendingFocusRef = useRef<PendingFocus>(null);
  const popoverId = useId();

  // Formatting -------------------------------------------------------------
  const fmt = (d: Date) => formatWithPattern(d, pattern, resolvedLocale);
  const displayValue = committed ? fmt(committed) : "";
  const footerSummary = draft ? fmt(draft) : strings.selectDate;

  // Error ------------------------------------------------------------------
  const externalErrorText = typeof error === "string" && error.trim() ? error : null;
  const errorShown = Boolean(error) || internalError;
  const errorText = errorShown ? (externalErrorText ?? strings.errorRequired) : null;

  // Open / close -----------------------------------------------------------
  const openPicker = () => {
    if (disabled || open) return;
    const current = committedRef.current;
    const anchor = current ?? todayRef;
    setDraft(current);
    setView("days");
    setViewMonth(clampMonthToBounds(startOfMonth(anchor), bounds));
    setFocusedDate(anchor);
    pendingFocusRef.current = "cell";
    setOpen(true);
    onOpenChange?.(true);
  };

  const closePicker = (validate = false, restoreFocus = true) => {
    setOpen(false);
    setView("days");
    // The mobile sheet is confirm-on-CTA: closing any other way discards the draft.
    setDraft(committedRef.current);
    onOpenChange?.(false);
    if (validate) setInternalError(required && !committedRef.current);
    if (restoreFocus) {
      suppressFocusOpenRef.current = true;
      inputRef.current?.focus();
      window.setTimeout(() => {
        suppressFocusOpenRef.current = false;
      }, 120);
    }
  };

  // Commit -----------------------------------------------------------------
  const commitValue = (next: Date | null) => {
    committedRef.current = next;
    if (!isControlled) setInternalValue(next);
    if (isMonthDay) {
      (props.onChange as ((v: MonthDay | null) => void) | undefined)?.(next ? toMonthDay(next) : null);
    } else {
      (props.onChange as ((d: Date | null) => void) | undefined)?.(next);
    }
  };

  // Selection --------------------------------------------------------------
  const selectDay = (date: Date, via: "pointer" | "keyboard") => {
    if (isDayDisabled(date, bounds)) return;
    setDraft(date);
    setInternalError(false);
    if (!isMobile) {
      commitValue(date);
      closePicker(true);
      return;
    }
    setFocusedDate(date);
    if (via === "keyboard") pendingFocusRef.current = "cell";
  };

  const gesture = useTapVsScroll((iso) => {
    const date = fromISODate(iso);
    if (date) selectDay(date, "pointer");
  });

  // Navigation -------------------------------------------------------------
  const minMonth = startOfMonth(bounds.min);
  const maxMonth = startOfMonth(bounds.max);
  const viewYear = viewMonth.getFullYear();
  const canPrev =
    view === "days"
      ? compareMonth(viewMonth, minMonth) > 0
      : view === "months"
        ? !isMonthDay && viewYear - 1 >= bounds.min.getFullYear()
        : false;
  const canNext =
    view === "days"
      ? compareMonth(viewMonth, maxMonth) < 0
      : view === "months"
        ? !isMonthDay && viewYear + 1 <= bounds.max.getFullYear()
        : false;

  const goPrev = () => {
    if (!canPrev) return;
    if (view === "days") setViewMonth(addMonthsToMonth(viewMonth, -1));
    else setViewMonth(clampMonthToBounds(new Date(viewYear - 1, viewMonth.getMonth(), 1), bounds));
  };
  const goNext = () => {
    if (!canNext) return;
    if (view === "days") setViewMonth(addMonthsToMonth(viewMonth, 1));
    else setViewMonth(clampMonthToBounds(new Date(viewYear + 1, viewMonth.getMonth(), 1), bounds));
  };

  /** Where keyboard focus lands after jumping to a month: the draft, today, or the first enabled day. */
  const focusIntoMonth = (month: Date) => {
    const candidate =
      draft && compareMonth(draft, month) === 0
        ? draft
        : compareMonth(todayRef, month) === 0
          ? todayRef
          : month;
    const resolved = skipDisabled(candidate, 1) ?? skipDisabled(candidate, -1);
    if (resolved) setFocusedDate(resolved);
    pendingFocusRef.current = "cell";
  };

  const showDays = () => {
    setView("days");
    focusIntoMonth(viewMonth);
  };

  const toggleMonths = () => {
    if (view === "months") return showDays();
    setView("months");
    const idx = viewMonth.getMonth();
    setFocusedMonth(isMonthDisabled(viewYear, idx, bounds) ? firstEnabledMonth(viewYear) : idx);
    pendingFocusRef.current = "month";
  };

  const toggleYears = () => {
    if (view === "years") return showDays();
    setView("years");
    setFocusedYear(viewYear);
    pendingFocusRef.current = "year";
  };

  const firstEnabledMonth = (year: number) => {
    for (let i = 0; i < 12; i++) if (!isMonthDisabled(year, i, bounds)) return i;
    return 0;
  };

  const pickMonth = (monthIndex: number) => {
    const next = clampMonthToBounds(new Date(viewYear, monthIndex, 1), bounds);
    setViewMonth(next);
    setView("days");
    focusIntoMonth(next);
  };

  const pickYear = (year: number) => {
    const next = clampMonthToBounds(new Date(year, viewMonth.getMonth(), 1), bounds);
    setViewMonth(next);
    setView("days");
    focusIntoMonth(next);
  };

  const ensureVisible = (date: Date) => {
    setViewMonth((prev) => (compareMonth(date, prev) === 0 ? prev : startOfMonth(date)));
  };

  // Keyboard navigation ----------------------------------------------------
  const skipDisabled = (target: Date, dir: 1 | -1): Date | null => {
    let cursor = clampDate(target, bounds.min, bounds.max);
    let steps = 0;
    while (steps < MAX_SKIP_STEPS && isDayDisabled(cursor, bounds)) {
      const next = clampDate(addDays(cursor, dir), bounds.min, bounds.max);
      if (sameDay(next, cursor)) return null; // stuck at a bound
      cursor = next;
      steps++;
    }
    return steps >= MAX_SKIP_STEPS ? null : cursor;
  };

  const moveFocusTo = (target: Date, dir: 1 | -1) => {
    const resolved = skipDisabled(target, dir);
    if (!resolved) return;
    ensureVisible(resolved);
    setFocusedDate(resolved);
    pendingFocusRef.current = "cell";
  };

  const moveFocusByDays = (delta: number) => {
    const base = focusedDate ?? draft ?? todayRef;
    moveFocusTo(addDays(base, delta), delta >= 0 ? 1 : -1);
  };

  const moveFocusByMonths = (delta: number) => {
    const base = focusedDate ?? draft ?? todayRef;
    moveFocusTo(addMonthsClamped(base, delta), delta >= 0 ? 1 : -1);
  };

  const moveMonthFocus = (delta: number) => {
    let i = focusedMonth + delta;
    const step = delta > 0 ? 1 : -1;
    while (i >= 0 && i <= 11 && isMonthDisabled(viewYear, i, bounds)) i += step;
    if (i < 0 || i > 11) return;
    setFocusedMonth(i);
    pendingFocusRef.current = "month";
  };

  const moveYearFocus = (delta: number) => {
    let i = years.indexOf(focusedYear) + delta;
    const step = delta > 0 ? 1 : -1;
    while (i >= 0 && i < years.length && isYearDisabled(years[i]!, bounds)) i += step;
    if (i < 0 || i >= years.length) return;
    setFocusedYear(years[i]!);
    pendingFocusRef.current = "year";
  };

  const onPopoverKeyDown = (e: ReactKeyboardEvent) => {
    const key = e.key;
    const active = document.activeElement as HTMLElement | null;

    if (view === "months" && active?.hasAttribute("data-month")) {
      const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
      if (key in moves) {
        e.preventDefault();
        moveMonthFocus(moves[key]!);
      } else if (key === "Home" || key === "End") {
        e.preventDefault();
        moveMonthFocus(key === "Home" ? -12 : 12);
      }
      return;
    }

    if (view === "years" && active?.hasAttribute("data-year")) {
      const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
      if (key in moves) {
        e.preventDefault();
        moveYearFocus(moves[key]!);
      } else if (key === "Home" || key === "End") {
        e.preventDefault();
        moveYearFocus(key === "Home" ? -years.length : years.length);
      }
      return;
    }

    const onCell = !!active?.getAttribute?.("data-date");
    if (!onCell) return;

    if ((key === "Enter" || key === " ") && focusedDate) {
      e.preventDefault();
      selectDay(focusedDate, "keyboard");
      return;
    }

    switch (key) {
      case "ArrowLeft":
        e.preventDefault();
        moveFocusByDays(-1);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveFocusByDays(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocusByDays(-7);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveFocusByDays(7);
        break;
      case "PageUp":
        e.preventDefault();
        moveFocusByMonths(e.shiftKey ? -12 : -1);
        break;
      case "PageDown":
        e.preventDefault();
        moveFocusByMonths(e.shiftKey ? 12 : 1);
        break;
      case "Home": {
        e.preventDefault();
        const base = focusedDate ?? todayRef;
        if (isMonthDay) moveFocusTo(startOfMonth(base), 1);
        else moveFocusByDays(-((base.getDay() - weekStartsOn + 7) % 7));
        break;
      }
      case "End": {
        e.preventDefault();
        const base = focusedDate ?? todayRef;
        if (isMonthDay) moveFocusTo(new Date(base.getFullYear(), base.getMonth() + 1, 0), -1);
        else moveFocusByDays(6 - ((base.getDay() - weekStartsOn + 7) % 7));
        break;
      }
    }
  };

  // Focus application (roving focus across views) -------------------------
  useEffect(() => {
    if (!open) return;
    const want = pendingFocusRef.current;
    if (!want) return;
    pendingFocusRef.current = null;
    const opts = { preventScroll: !isMobile };
    if (want === "cta") {
      ctaRef.current?.focus();
      return;
    }
    if (want === "month") {
      monthBtnRefs.current.get(focusedMonth)?.focus(opts);
      return;
    }
    if (want === "year") {
      yearBtnRefs.current.get(focusedYear)?.focus(opts);
      return;
    }
    const iso = focusedDate ? toISODate(focusedDate) : null;
    const el = iso ? cellRefs.current.get(iso) : null;
    if (el && el.getAttribute("aria-disabled") !== "true") {
      el.focus(opts);
      return;
    }
    const first = popoverRef.current?.querySelector<HTMLElement>('[data-date]:not([aria-disabled="true"])');
    if (first) {
      first.focus(opts);
      const d = fromISODate(first.getAttribute("data-date") ?? "");
      if (d) setFocusedDate(d);
    }
  });

  // Year pane: scroll the viewed year into the middle when it opens ----------
  useIsoLayoutEffect(() => {
    if (!open || view !== "years") return;
    const scroller = yearScrollerRef.current;
    const el = yearBtnRefs.current.get(viewYear);
    if (!scroller || !el) return;
    scroller.scrollTop = Math.max(0, el.offsetTop - scroller.clientHeight / 2 + el.offsetHeight / 2);
    // Only when the pane opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, view]);

  // Document-level dismissal (outside click, focus-out, Escape) -----------
  useEffect(() => {
    if (!open) return;
    const isOutside = (t: EventTarget | null) =>
      !(t instanceof Node) || (!popoverRef.current?.contains(t) && t !== inputRef.current);

    const onPointerDown = (e: PointerEvent) => {
      if (isOutside(e.target)) closePicker(true, false);
    };
    const onFocusIn = (e: FocusEvent) => {
      if (isOutside(e.target)) closePicker(true, false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" && e.key !== "Esc") return;
      e.preventDefault();
      // Escape backs out of a month/year pane first, then closes the picker.
      if (view !== "days") showDays();
      else closePicker(true);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  });

  // Mobile: body scroll lock ------------------------------------------------
  useEffect(() => {
    if (!open || !isMobile) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, isMobile]);

  // Positioning (desktop) --------------------------------------------------
  const positionStyle = usePopoverPosition({
    open,
    enabled: !isMobile,
    anchorRef: inputRef,
    popoverRef,
    drop,
    align,
    recalcKey: `${view}:${monthKey(viewMonth)}`,
  });

  // Imperative API ---------------------------------------------------------
  useImperativeHandle(ref, () => ({
    open: openPicker,
    close: () => closePicker(true),
    clear: () => {
      setDraft(null);
      draftRef.current = null;
      setInternalError(false);
      commitValue(null);
    },
    focus: () => inputRef.current?.focus(),
    getValue: () => {
      const v = committedRef.current;
      return isMonthDay ? (v ? toMonthDay(v) : null) : v;
    },
  }));

  // Footer actions ---------------------------------------------------------
  const todayAvailable = showToday && !isDayDisabled(todayRef, bounds);
  const onToday = () => {
    if (!isMobile) {
      selectDay(todayRef, "pointer");
      return;
    }
    setDraft(todayRef);
    setInternalError(false);
    setView("days");
    setViewMonth(startOfMonth(todayRef));
    setFocusedDate(todayRef);
  };
  const onClear = () => {
    setDraft(null);
    setInternalError(false);
    commitValue(null);
    closePicker(false);
  };
  const onCta = () => {
    if (draft) commitValue(draft);
    closePicker(true);
  };

  // Ref registries ---------------------------------------------------------
  const registerCell = (iso: string, el: HTMLDivElement | null) => {
    if (el) cellRefs.current.set(iso, el);
    else cellRefs.current.delete(iso);
  };
  const registerMonthBtn = (i: number, el: HTMLButtonElement | null) => {
    if (el) monthBtnRefs.current.set(i, el);
    else monthBtnRefs.current.delete(i);
  };
  const registerYearBtn = (y: number, el: HTMLButtonElement | null) => {
    if (el) yearBtnRefs.current.set(y, el);
    else yearBtnRefs.current.delete(y);
  };

  // Render -----------------------------------------------------------------
  const themeStyle = primaryColor
    ? ({ "--wf-sdp-primary": primaryColor } as CSSProperties)
    : undefined;

  const toolbar = (
    <PickerToolbar
      view={view}
      mode={mode}
      monthLabel={formatMonthName(viewMonth, resolvedLocale)}
      yearLabel={String(viewYear)}
      canPrev={canPrev}
      canNext={canNext}
      onPrev={goPrev}
      onNext={goNext}
      onToggleMonths={toggleMonths}
      onToggleYears={toggleYears}
      strings={strings}
    />
  );

  const body = (
    <>
      <DayGrid
        month={viewMonth}
        mode={mode}
        bounds={bounds}
        draft={draft}
        today={todayRef}
        locale={resolvedLocale}
        weekStartsOn={weekStartsOn}
        focusedDate={focusedDate}
        hidden={view !== "days"}
        registerCell={registerCell}
      />
      {view === "months" && (
        <MonthGrid
          labels={getMonthLabels(resolvedLocale, isMobile ? "long" : "short")}
          ariaLabel={strings.chooseMonth}
          isDisabled={(i) => isMonthDisabled(viewYear, i, bounds)}
          selectedIndex={draft && draft.getFullYear() === viewYear ? draft.getMonth() : null}
          todayIndex={todayRef.getFullYear() === viewYear ? todayRef.getMonth() : null}
          focusedIndex={focusedMonth}
          onPick={pickMonth}
          registerButton={registerMonthBtn}
        />
      )}
      {view === "years" && (
        <YearGrid
          years={years}
          ariaLabel={strings.chooseYear}
          isDisabled={(y) => isYearDisabled(y, bounds)}
          selectedYear={draft ? draft.getFullYear() : null}
          todayYear={todayRef.getFullYear()}
          focusedYear={focusedYear}
          scrollerRef={yearScrollerRef}
          onPick={pickYear}
          registerButton={registerYearBtn}
        />
      )}
    </>
  );

  const footer = (
    <PickerFooter
      summary={footerSummary}
      showSummary={showFooter && showFooterDate}
      strings={strings}
      showToday={showFooter && todayAvailable}
      onToday={onToday}
      showClear={showFooter && showClear && !!draft}
      onClear={onClear}
      mobile={isMobile}
      ctaDisabled={!draft}
      ctaRef={ctaRef}
      onCta={onCta}
      ctaClassName={classNames?.cta}
    />
  );

  const popover = isMobile ? (
    <MobileSheet
      id={popoverId}
      popoverRef={popoverRef}
      style={themeStyle}
      className={[compact && "wf-sdp-popover--compact", classNames?.popover].filter(Boolean).join(" ") || undefined}
      onKeyDown={onPopoverKeyDown}
      gesture={gesture}
      onClose={() => closePicker(true)}
      strings={strings}
      toolbar={toolbar}
      body={body}
      footer={footer}
    />
  ) : (
    <DesktopPopover
      id={popoverId}
      popoverRef={popoverRef}
      style={positionStyle ? { ...positionStyle, ...themeStyle } : themeStyle && { position: "fixed", top: -9999, left: -9999, ...themeStyle }}
      className={[compact && "wf-sdp-popover--compact", !showFooter && "wf-sdp-popover--no-footer", classNames?.popover].filter(Boolean).join(" ") || undefined}
      ariaLabel={strings.selectDate}
      onKeyDown={onPopoverKeyDown}
      gesture={gesture}
      toolbar={toolbar}
      body={body}
      footer={footer}
    />
  );

  const hiddenValue = committed ? (isMonthDay ? toMonthDayString(toMonthDay(committed)) : toISODate(committed)) : "";

  return (
    <span
      className={["wf-sdp-field", compact && "wf-sdp-field--compact", className, classNames?.root].filter(Boolean).join(" ")}
      style={themeStyle ? { ...themeStyle, ...style } : style}
    >
      <input
        ref={inputRef}
        type="text"
        readOnly
        inputMode="none"
        autoComplete="off"
        id={id}
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        className={["wf-sdp-input", errorShown && "wf-sdp-input-error", classNames?.input]
          .filter(Boolean)
          .join(" ")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-invalid={errorShown || undefined}
        onPointerDown={() => {
          if (disabled) return;
          if (open) {
            closedByPointerRef.current = true;
            closePicker(true);
          }
        }}
        onClick={() => {
          if (disabled) return;
          if (closedByPointerRef.current) {
            closedByPointerRef.current = false;
            return;
          }
          if (!open) openPicker();
        }}
        onFocus={(e) => {
          if (disabled || open || suppressFocusOpenRef.current) return;
          // Open only for keyboard-origin focus; mouse opens via click.
          let keyboardFocus = true;
          try {
            keyboardFocus = e.target.matches(":focus-visible");
          } catch {
            /* older engines: treat any focus as keyboard */
          }
          if (keyboardFocus) openPicker();
        }}
        onKeyDown={(e) => {
          if (disabled || open) return;
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            openPicker();
          }
        }}
        onBlur={onBlur}
      />
      {name && <input type="hidden" name={name} value={hiddenValue} />}
      {errorText && (
        <div className={["wf-sdp-error", classNames?.error].filter(Boolean).join(" ")} role="alert">
          {errorText}
        </div>
      )}
      {open && createPortal(popover, document.body)}
    </span>
  );
});
