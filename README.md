# WebFolks Date Picker — React

A single-date picker for **React + TypeScript** with the month and the year always one tap away. The compact sibling of the [WebFolks Date Range Picker](https://github.com/mikhailvol/webfolks-date-range-picker-react): same look, same mobile experience, same accessibility layer — one date instead of two, and quick month/year navigation instead of side-by-side months.

**Live demo:** [webfolks-date-picker-react.vercel.app](https://webfolks-date-picker-react.vercel.app/) — playground, examples, and the props reference. Open it on a phone (or narrow the window under 768px) for the fullscreen mobile experience.

- **Quick month & year selection** — the header shows `September ▾ 2026 ▾`. Tap the month for a 3×4 month pane, tap the year for a scrollable year pane (only the years you allow). Arrows step months in the day view and years in the month view.
- **Two modes** — `date` (month, day, year → `Date`) and `month-day` (month and day only → `{ month, day }`, for birthdays, anniversaries, yearly renewals; February 29 included).
- **Limited year window** — `yearsPast` / `yearsFuture` (default 30 / 10), or exact `minDate` / `maxDate`, plus `disablePast` / `disableFuture`. Months and years with nothing selectable are disabled in the panes.
- **Desktop** — popover anchored to the input with smart positioning (`align`, `drop`, viewport collision handling). A pick commits and closes.
- **Mobile** (<768px) — fullscreen sheet: sticky header with close, month/year toolbar, big touch targets, sticky footer with the live summary, Today / Clear shortcuts and a confirm CTA. Scrolling never selects a date.
- **Primary color as a prop** — `primaryColor="#0f766e"` themes the field *and* the portaled popover; hover and tint colors are derived automatically. Or use `--wf-sdp-*` CSS variables.
- **Accessible** — ARIA grid, roving focus, arrows / Home / End / PageUp / PageDown (Shift for years), Enter / Space, Escape backs out of a pane then closes, disabled dates skipped, live footer for screen readers.
- **Locale-aware** — month and weekday names via `Intl`, `weekStartsOn`, custom display pattern, every UI string overridable.
- **Zero dependencies** — React 18+ is the only peer. SSR-safe, Next.js App Router ready (`"use client"` is baked in).

## Installation

```bash
npm install github:mikhailvol/webfolks-date-picker-react
```

Import the stylesheet once — e.g. in `app/layout.tsx` for Next.js:

```tsx
import "webfolks-date-picker-react/styles.css";
```

## Quick start

```tsx
"use client";

import { useState } from "react";
import { DatePicker } from "webfolks-date-picker-react";

export function StartDate() {
  const [date, setDate] = useState<Date | null>(null);
  return <DatePicker value={date} onChange={setDate} placeholder="Select date" />;
}
```

Uncontrolled use works too — omit `value` and read the result from `onChange` (or pass `name` to get a hidden `yyyy-mm-dd` input for plain HTML forms).

### Month and day only

```tsx
import { DatePicker, type MonthDay } from "webfolks-date-picker-react";

const [birthday, setBirthday] = useState<MonthDay | null>(null); // { month: 1–12, day }

<DatePicker mode="month-day" value={birthday} onChange={setBirthday} placeholder="Birthday" />
```

The year button disappears, the grid shows days 1…n without weekdays (they differ every year), and the hidden form input carries `mm-dd`.

### Date of birth

```tsx
<DatePicker yearsPast={100} disableFuture format="d MMMM yyyy" />
```

### Brand color

```tsx
<DatePicker primaryColor="#0f766e" />
```

## Props

Everything is optional. The `mode` prop decides the value type: `Date | null` in `date` mode, `MonthDay | null` in `month-day` mode.

| Prop | Default | What it does |
|---|---|---|
| `mode` | `"date"` | `"date"` — month, day and year. `"month-day"` — month and day only, no year. |
| `value` / `defaultValue` | — | Controlled / uncontrolled value (`Date` or `MonthDay` depending on `mode`). |
| `onChange` | — | Fires when a value is committed: on pick on desktop, on the CTA on mobile, and on clear. |
| `primaryColor` | — | Any CSS color for the selected day, active toggles and buttons. Applied to the field and the portaled popover. |
| `yearsPast` | `30` | Whole calendar years back from today that are selectable (and listed in the year pane). `date` mode. |
| `yearsFuture` | `10` | Whole calendar years ahead. `date` mode. |
| `minDate` / `maxDate` | — | Exact bounds; override the year window. `date` mode. |
| `disablePast` / `disableFuture` | `false` | Clamp the window to today. |
| `format` | `"MMM d, yyyy"` · `"MMMM d"` | Display pattern for the input and footer (tokens below). |
| `locale` | `"en"` | BCP-47 tag for month and weekday names (`"uk"`, `"de"`, `"ja"`, …). |
| `weekStartsOn` | `1` | `1` = Monday, `0` = Sunday. |
| `compact` | `false` | Tighter spacing: slimmer input, smaller desktop popover (about 25% less tall). Mobile keeps full-size touch targets. |
| `showFooter` | `true` | The whole footer (summary, Today, Clear). Off, the desktop popover ends after the day grid; the mobile sheet keeps its confirm CTA. |
| `showFooterDate` | `true` | Selected date (or the prompt) in the calendar footer. Off, together with `showToday` / `showClear`, removes the desktop footer entirely. |
| `showToday` | `true` | "Today" shortcut in the footer. Hidden automatically when today is out of bounds. |
| `showClear` | `true` | "Clear" action in the footer once a date is selected. |
| `align` | `"center"` | Desktop popover alignment: `left` / `center` / `right`. |
| `drop` | `"down"` | Desktop popover direction: `down` / `up` / `auto` (flips up when there's no room below). |
| `required` | `false` | Closing without a date shows the error message. |
| `error` | — | External error: a string is shown as the message, `true` shows the default one. |
| `strings` | — | Override any UI text (see i18n). |
| `name` | — | Hidden input for plain forms: `yyyy-mm-dd` in `date` mode, `mm-dd` in `month-day` mode. |
| `placeholder` / `disabled` / `id` / `className` / `style` | — | Standard field props. |
| `classNames` | — | `{ root, input, error, popover, cta }` — your classes appended to the library's. |
| `onOpenChange` / `onBlur` | — | Open-state and blur callbacks. |

### Ref

```tsx
const ref = useRef<DatePickerRef>(null);
<DatePicker ref={ref} />

ref.current?.open();
ref.current?.close();
ref.current?.clear();     // commits null
ref.current?.focus();
ref.current?.getValue();  // Date | MonthDay | null
```

### Format tokens

`yyyy` `yy` `MMMM` `MMM` `MM` `M` `dd` `d` `EEEE` `EEE` — e.g. `"EEE, d MMM yyyy"` → `Fri, 25 Sep 2026`. Literal text survives; localized names are never re-scanned as tokens.

### Helpers

```ts
import { toISODate, fromISODate, toMonthDay, fromMonthDay, formatWithPattern } from "webfolks-date-picker-react";

toISODate(date);                      // "2026-09-25" (local calendar date, no UTC shift)
fromISODate("2026-09-25");            // Date at local midnight
toMonthDay(date);                     // { month: 9, day: 25 }
fromMonthDay({ month: 2, day: 29 });  // Date in a leap reference year, or null when invalid
```

## Theming

`primaryColor` is the quickest way. For everything else, override the CSS variables. Each `--wf-sdp-*` variable falls back to its `--wf-dp-*` twin from the Date Range Picker, so one theme covers both libraries:

```css
:root {
  --wf-sdp-primary: #2960e3;        /* selected day, active toggles, buttons */
  --wf-sdp-on-primary: #ffffff;     /* text on the primary color */
  --wf-sdp-primary-hover: …;        /* derived from primary unless set */
  --wf-sdp-primary-soft: …;         /* tint for active toggles; derived unless set */

  --wf-sdp-fg-strong: #1b1c1f;      /* titles, day cells */
  --wf-sdp-fg-medium: #3e4146;      /* weekdays, footer summary */
  --wf-sdp-fg-weak: #818996;        /* icons */

  --wf-sdp-border: #e5e7eb;
  --wf-sdp-bg: #ffffff;
  --wf-sdp-error: #e53935;
  --wf-sdp-hover: #f3f4f6;
  --wf-sdp-shadow: 0 10px 25px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06);

  --wf-sdp-radius-popover: 14px;
  --wf-sdp-radius-input: 10px;
  --wf-sdp-z-index: 9999;
}
```

**Scoped themes:** the popover / mobile sheet renders in a portal on `<body>`, so a variable set on a wrapper element won't reach it. Use `primaryColor`, override on `:root`, or put your theme class on both the field and the popover:

```tsx
<DatePicker className="teal-theme" classNames={{ popover: "teal-theme" }} />
```

## i18n

```tsx
<DatePicker
  locale="uk"
  format="d MMMM yyyy"
  strings={{
    selectDate: "Оберіть дату",
    close: "Закрити",
    previousMonth: "Попередній місяць",
    nextMonth: "Наступний місяць",
    previousYear: "Попередній рік",
    nextYear: "Наступний рік",
    chooseMonth: "Оберіть місяць",
    chooseYear: "Оберіть рік",
    today: "Сьогодні",
    clear: "Очистити",
    errorRequired: "Будь ласка, оберіть дату.",
  }}
/>
```

## Keyboard

| Keys | Day view | Month / year pane |
|---|---|---|
| `← →` `↑ ↓` | Move by day / week | Move between options |
| `Home` / `End` | First / last day of the week (of the month in `month-day` mode) | First / last option |
| `PageUp` / `PageDown` | Previous / next month (`Shift` = year) | — |
| `Enter` / `Space` | Select the focused day | Pick the option |
| `Tab` | Toolbar → grid → footer actions | |
| `Escape` | Close | Back to the day view |

Focusing the input from the keyboard (or pressing `Enter`, `Space`, `↓`) opens the picker; a mouse click toggles it.

## Development

```bash
npm install
npm test          # vitest: date logic + component interactions
npm run build     # tsup → dist (ESM + CJS + d.ts) + styles.css
cd demo && npm install && npm run dev   # Next.js App Router demo on :3998
```

## Credits

Built by [WebFolks.io](https://www.webfolks.io/). Sibling of the [WebFolks Date Range Picker for React](https://github.com/mikhailvol/webfolks-date-range-picker-react).

## License

[MIT](LICENSE.md) — free to use in commercial and private projects; keep the copyright notice with the code.
