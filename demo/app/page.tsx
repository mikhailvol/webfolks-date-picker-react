"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  DatePicker,
  toISODate,
  type DatePickerRef,
  type MonthDay,
  type PopoverAlign,
  type PopoverDrop,
} from "webfolks-date-picker-react";

const showDate = (d: Date | null) => (d ? toISODate(d) : "null");
const showMonthDay = (v: MonthDay | null) => (v ? `{ month: ${v.month}, day: ${v.day} }` : "null");

function Example({
  title,
  description,
  code,
  value,
  children,
}: {
  title: string;
  description: string;
  code: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="desc">{description}</p>
      <div className="demo">{children}</div>
      <pre>
        <code>{code}</code>
      </pre>
      {value && <span className="value">{value}</span>}
    </div>
  );
}

// Examples --------------------------------------------------------------------

function DefaultExample() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Example
      title="Default"
      description="Month, day and year. Tap the month or the year in the header to jump straight there; arrows step one month at a time. Selectable window: 30 years back, 10 ahead."
      code={`<DatePicker value={date} onChange={setDate} placeholder="Select date" />`}
      value={`value: ${showDate(date)}`}
    >
      <DatePicker value={date} onChange={setDate} placeholder="Select date" />
    </Example>
  );
}

function MonthDayExample() {
  const [value, setValue] = useState<MonthDay | null>({ month: 2, day: 29 });
  return (
    <Example
      title="Month and day only"
      description="mode=&quot;month-day&quot; drops the year: a birthday, an anniversary, a yearly renewal. The value is a { month, day } pair (month 1–12), February 29 included, and the grid has no weekdays because they change every year."
      code={`<DatePicker mode="month-day" value={value} onChange={setValue} />`}
      value={`value: ${showMonthDay(value)}`}
    >
      <DatePicker mode="month-day" value={value} onChange={setValue} placeholder="Select day" />
    </Example>
  );
}

function BirthdayExample() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Example
      title="Date of birth"
      description="yearsPast opens a century, disableFuture stops at today. The year pane scrolls to the current year; keyboard users can PageUp/PageDown by month and Shift+PageUp/PageDown by year."
      code={`<DatePicker yearsPast={100} disableFuture format="d MMMM yyyy" />`}
      value={`value: ${showDate(date)}`}
    >
      <DatePicker
        value={date}
        onChange={setDate}
        yearsPast={100}
        disableFuture
        format="d MMMM yyyy"
        placeholder="Date of birth"
      />
    </Example>
  );
}

function FutureExample() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Example
      title="Upcoming dates only"
      description="disablePast greys out everything before today, including whole months and years in the panes, and the prev arrow stops at the first month of the window."
      code={`<DatePicker disablePast yearsFuture={2} />`}
      value={`value: ${showDate(date)}`}
    >
      <DatePicker value={date} onChange={setDate} disablePast yearsFuture={2} placeholder="Pick a future date" />
    </Example>
  );
}

const SWATCHES = ["#2960e3", "#0f766e", "#c2410c", "#7c3aed", "#be185d", "#1b1c1f"];

function PrimaryColorExample() {
  const [color, setColor] = useState("#0f766e");
  const [date, setDate] = useState<Date | null>(new Date());
  return (
    <Example
      title="Primary color"
      description="primaryColor styles the selected day, active toggles, and the buttons — including the popover, which renders in a portal on <body>. Hover and tint colors are derived from it automatically."
      code={`<DatePicker primaryColor="${color}" />`}
      value={`value: ${showDate(date)}`}
    >
      <DatePicker value={date} onChange={setDate} primaryColor={color} placeholder="Select date" />
      <div className="swatches" role="group" aria-label="Primary color">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            className="swatch"
            style={{ background: c }}
            aria-label={c}
            aria-pressed={c === color}
            onClick={() => setColor(c)}
          />
        ))}
        <input
          type="color"
          className="swatch-input"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="Custom color"
        />
      </div>
    </Example>
  );
}

function LocaleExample() {
  const [uk, setUk] = useState<Date | null>(null);
  const [ja, setJa] = useState<Date | null>(null);
  return (
    <Example
      title="Locale and week start"
      description="Month, weekday and pane labels come from Intl. weekStartsOn={0} starts the week on Sunday. Every UI string is overridable."
      code={`<DatePicker locale="uk" format="d MMMM yyyy"
  strings={{ selectDate: "Оберіть дату", today: "Сьогодні", clear: "Очистити" }} />
<DatePicker locale="ja" weekStartsOn={0} format="yyyy/MM/dd" />`}
      value={`uk: ${showDate(uk)} · ja: ${showDate(ja)}`}
    >
      <DatePicker
        value={uk}
        onChange={setUk}
        locale="uk"
        format="d MMMM yyyy"
        placeholder="Оберіть дату"
        strings={{
          selectDate: "Оберіть дату",
          today: "Сьогодні",
          clear: "Очистити",
          close: "Закрити",
          previousMonth: "Попередній місяць",
          nextMonth: "Наступний місяць",
          previousYear: "Попередній рік",
          nextYear: "Наступний рік",
          chooseMonth: "Оберіть місяць",
          chooseYear: "Оберіть рік",
          errorRequired: "Будь ласка, оберіть дату.",
        }}
      />
      <DatePicker value={ja} onChange={setJa} locale="ja" weekStartsOn={0} format="yyyy/MM/dd" placeholder="日付を選択" />
    </Example>
  );
}

function FormExample() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | boolean>(false);
  const ref = useRef<DatePickerRef>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const value = String(data.get("start_date") ?? "");
    if (!value) {
      setError("Start date is required.");
      setSubmitted(null);
      return;
    }
    setError(false);
    setSubmitted(`start_date=${value}`);
  };

  return (
    <Example
      title="Plain HTML form, validation, ref"
      description="name adds a hidden yyyy-mm-dd input, so a normal <form> submit just works. required shows the built-in message when the picker closes empty; error shows yours. The ref exposes open(), close(), clear(), focus(), getValue()."
      code={`<DatePicker ref={ref} name="start_date" required error={error} />
ref.current?.clear()`}
      value={submitted ? `submitted: ${submitted}` : undefined}
    >
      <form className="form-row" onSubmit={onSubmit}>
        <DatePicker ref={ref} name="start_date" required error={error} placeholder="Start date" disablePast />
        <button type="submit" className="demo-btn">
          Submit
        </button>
        <button
          type="button"
          className="demo-btn"
          onClick={() => {
            ref.current?.clear();
            setError(false);
            setSubmitted(null);
          }}
        >
          Clear
        </button>
        <button type="button" className="demo-btn" onClick={() => ref.current?.open()}>
          Open
        </button>
      </form>
    </Example>
  );
}

function ThemedExample() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Example
      title="CSS variables"
      description="Prefer CSS? Every color and radius is a --wf-sdp-* variable, with --wf-dp-* fallbacks so a theme written for the WebFolks Date Range Picker applies here too. Scope it on :root, or pass the class to both the field and the popover."
      code={`.themed { --wf-sdp-primary: #0f766e; --wf-sdp-radius-input: 0; --wf-sdp-radius-popover: 0; }

<DatePicker className="themed" classNames={{ popover: "themed" }} />`}
      value={`value: ${showDate(date)}`}
    >
      <DatePicker value={date} onChange={setDate} className="themed" classNames={{ popover: "themed" }} placeholder="Squared teal" />
    </Example>
  );
}

// Playground ------------------------------------------------------------------

type PlaygroundConfig = {
  mode: "date" | "month-day";
  yearsPast: number;
  yearsFuture: number;
  disablePast: boolean;
  disableFuture: boolean;
  format: string;
  locale: string;
  weekStartsOn: 0 | 1;
  primaryColor: string;
  compact: boolean;
  showFooter: boolean;
  showFooterDate: boolean;
  showToday: boolean;
  showClear: boolean;
  align: PopoverAlign;
  drop: PopoverDrop;
  required: boolean;
  placeholder: string;
};

const pgDefaults: PlaygroundConfig = {
  mode: "date",
  yearsPast: 30,
  yearsFuture: 10,
  disablePast: false,
  disableFuture: false,
  format: "",
  locale: "en",
  weekStartsOn: 1,
  primaryColor: "",
  compact: false,
  showFooter: true,
  showFooterDate: true,
  showToday: true,
  showClear: true,
  align: "center",
  drop: "down",
  required: false,
  placeholder: "Select date",
};

function Field({ label, children, off }: { label: string; children: ReactNode; off?: boolean }) {
  return (
    <label className={off ? "pg-field off" : "pg-field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="pg-field pg-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Playground() {
  const [c, setC] = useState<PlaygroundConfig>(pgDefaults);
  const [date, setDate] = useState<Date | null>(null);
  const [monthDay, setMonthDay] = useState<MonthDay | null>(null);
  const set = <K extends keyof PlaygroundConfig>(key: K, value: PlaygroundConfig[K]) =>
    setC((prev) => ({ ...prev, [key]: value }));
  const isDate = c.mode === "date";

  const shared = {
    format: c.format.trim() || undefined,
    locale: c.locale,
    weekStartsOn: c.weekStartsOn,
    primaryColor: c.primaryColor.trim() || undefined,
    compact: c.compact,
    showFooter: c.showFooter,
    showFooterDate: c.showFooterDate,
    showToday: c.showToday,
    showClear: c.showClear,
    align: c.align,
    drop: c.drop,
    required: c.required,
    placeholder: c.placeholder,
  } as const;

  const codeProps = [
    !isDate && `mode="month-day"`,
    isDate && c.yearsPast !== 30 && `yearsPast={${c.yearsPast}}`,
    isDate && c.yearsFuture !== 10 && `yearsFuture={${c.yearsFuture}}`,
    isDate && c.disablePast && "disablePast",
    isDate && c.disableFuture && "disableFuture",
    shared.format && `format="${shared.format}"`,
    c.locale !== "en" && `locale="${c.locale}"`,
    c.weekStartsOn !== 1 && `weekStartsOn={${c.weekStartsOn}}`,
    shared.primaryColor && `primaryColor="${shared.primaryColor}"`,
    c.compact && "compact",
    !c.showFooter && "showFooter={false}",
    c.showFooter && !c.showFooterDate && "showFooterDate={false}",
    !c.showToday && "showToday={false}",
    !c.showClear && "showClear={false}",
    c.align !== "center" && `align="${c.align}"`,
    c.drop !== "down" && `drop="${c.drop}"`,
    c.required && "required",
    `placeholder="${c.placeholder}"`,
  ].filter(Boolean) as string[];
  const code = `<DatePicker\n  ${codeProps.join("\n  ")}\n/>`;

  return (
    <div className="card">
      <h3>Configure it live</h3>
      <p className="desc">Every control maps to a prop. The picker below and the generated code update as you change them.</p>

      <div className="pg-controls">
        <Field label="mode">
          <select
            value={c.mode}
            onChange={(e) => {
              const mode = e.target.value as PlaygroundConfig["mode"];
              setC((prev) => ({ ...prev, mode, placeholder: mode === "date" ? "Select date" : "Select day" }));
              setDate(null);
              setMonthDay(null);
            }}
          >
            <option value="date">date</option>
            <option value="month-day">month-day</option>
          </select>
        </Field>
        <Field label="yearsPast" off={!isDate}>
          <input type="number" min={0} max={200} value={c.yearsPast} onChange={(e) => set("yearsPast", Math.max(0, Number(e.target.value) || 0))} />
        </Field>
        <Field label="yearsFuture" off={!isDate}>
          <input type="number" min={0} max={200} value={c.yearsFuture} onChange={(e) => set("yearsFuture", Math.max(0, Number(e.target.value) || 0))} />
        </Field>
        <Field label="format">
          <input type="text" placeholder={isDate ? "MMM d, yyyy" : "MMMM d"} value={c.format} onChange={(e) => set("format", e.target.value)} />
        </Field>
        <Field label="locale">
          <select value={c.locale} onChange={(e) => set("locale", e.target.value)}>
            {["en", "uk", "de", "pl", "fr", "es", "it", "ja"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="weekStartsOn" off={!isDate}>
          <select value={c.weekStartsOn} onChange={(e) => set("weekStartsOn", Number(e.target.value) as 0 | 1)}>
            <option value={1}>1 (Monday)</option>
            <option value={0}>0 (Sunday)</option>
          </select>
        </Field>
        <Field label="primaryColor">
          <input type="text" placeholder="#2960e3" value={c.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} />
        </Field>
        <Field label="align">
          <select value={c.align} onChange={(e) => set("align", e.target.value as PopoverAlign)}>
            <option value="left">left</option>
            <option value="center">center</option>
            <option value="right">right</option>
          </select>
        </Field>
        <Field label="drop">
          <select value={c.drop} onChange={(e) => set("drop", e.target.value as PopoverDrop)}>
            <option value="down">down</option>
            <option value="up">up</option>
            <option value="auto">auto</option>
          </select>
        </Field>
        <Field label="placeholder">
          <input type="text" value={c.placeholder} onChange={(e) => set("placeholder", e.target.value)} />
        </Field>
        <Check label="disablePast" checked={c.disablePast} onChange={(v) => set("disablePast", v)} />
        <Check label="disableFuture" checked={c.disableFuture} onChange={(v) => set("disableFuture", v)} />
        <Check label="compact" checked={c.compact} onChange={(v) => set("compact", v)} />
        <Check label="showFooter" checked={c.showFooter} onChange={(v) => set("showFooter", v)} />
        <Check label="showFooterDate" checked={c.showFooterDate} onChange={(v) => set("showFooterDate", v)} />
        <Check label="showToday" checked={c.showToday} onChange={(v) => set("showToday", v)} />
        <Check label="showClear" checked={c.showClear} onChange={(v) => set("showClear", v)} />
        <Check label="required" checked={c.required} onChange={(v) => set("required", v)} />
      </div>

      <div className="pg-live">
        {isDate ? (
          <DatePicker
            key="date"
            value={date}
            onChange={setDate}
            yearsPast={c.yearsPast}
            yearsFuture={c.yearsFuture}
            disablePast={c.disablePast}
            disableFuture={c.disableFuture}
            {...shared}
          />
        ) : (
          <DatePicker key="month-day" mode="month-day" value={monthDay} onChange={setMonthDay} {...shared} />
        )}
        <span className="value">{isDate ? `value: ${showDate(date)}` : `value: ${showMonthDay(monthDay)}`}</span>
      </div>

      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Props reference ---------------------------------------------------------------

const PROPS: [string, string, string][] = [
  ["mode", `"date"`, `"date" — month, day, year (value: Date | null). "month-day" — no year (value: { month, day } | null).`],
  ["value / defaultValue / onChange", "—", "Controlled or uncontrolled value. onChange fires on pick (desktop), on the CTA (mobile), and on clear."],
  ["primaryColor", "—", "Any CSS color. Applied to the field and the portaled popover; hover and tint colors are derived from it."],
  ["yearsPast / yearsFuture", "30 / 10", "Whole calendar years around today that are selectable and listed in the year pane (date mode)."],
  ["minDate / maxDate", "—", "Exact bounds; override the year window (date mode)."],
  ["disablePast / disableFuture", "false", "Clamp the window to today. Whole months and years outside it are disabled in the panes."],
  ["format", `"MMM d, yyyy" · "MMMM d"`, "Display pattern: yyyy, yy, MMMM, MMM, MM, M, dd, d, EEEE, EEE."],
  ["locale", `"en"`, "BCP-47 tag for month and weekday names."],
  ["weekStartsOn", "1", "1 = Monday, 0 = Sunday."],
  ["compact", "false", "Tighter spacing: slimmer input, smaller desktop popover (about 25% less tall). Mobile keeps full-size touch targets."],
  ["showFooter", "true", "The whole footer (summary, Today, Clear). Off, the desktop popover ends after the day grid; the mobile sheet keeps its confirm CTA."],
  ["showFooterDate", "true", "Selected date (or the prompt) in the calendar footer. Off, together with showToday / showClear, removes the desktop footer entirely."],
  ["showToday / showClear", "true", "Footer shortcuts. Today is hidden automatically when today is out of bounds."],
  ["align / drop", `"center" / "down"`, "Desktop popover placement; drop \"auto\" flips up when there is no room below."],
  ["required / error", "false / —", "required validates on close; error shows a message from your form library (string) or the default (true)."],
  ["strings", "—", "Override any UI text (selectDate, today, clear, close, chooseMonth, chooseYear, …)."],
  ["name", "—", "Hidden input for plain forms: yyyy-mm-dd in date mode, mm-dd in month-day mode."],
  ["placeholder / disabled / id / className / classNames / style", "—", "Standard field props. classNames targets root, input, error, popover, cta."],
  ["onOpenChange / onBlur", "—", "Open-state and blur callbacks."],
  ["ref", "—", "open(), close(), clear(), focus(), getValue()."],
];

function PropsTable() {
  return (
    <div className="card">
      <h3>Props</h3>
      <p className="desc">The full list, with defaults. Everything is optional.</p>
      <table className="props">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Default</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          {PROPS.map(([name, def, desc]) => (
            <tr key={name}>
              <td>
                {name.split(" / ").map((n) => (
                  <code key={n}>{n}</code>
                ))}
              </td>
              <td>
                <code>{def}</code>
              </td>
              <td>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Page ------------------------------------------------------------------------

export default function Page() {
  return (
    <main>
      <header className="hero">
        <h1>WebFolks Date Picker for React</h1>
        <p className="lead">
          One input, one date — with the month and the year a tap away. Desktop popover, fullscreen mobile
          sheet, keyboard and screen-reader friendly, zero dependencies.
        </p>
        <div className="hero-links">
          <a href="https://github.com/mikhailvol/webfolks-date-picker-react">GitHub</a>
          <a href="https://github.com/mikhailvol/webfolks-date-range-picker-react">Date Range Picker (sibling)</a>
          <a href="https://www.webfolks.io/">WebFolks.io</a>
        </div>
        <code className="install">npm install github:mikhailvol/webfolks-date-picker-react</code>
        <p className="hint">Resize the window below 768px (or open on a phone) to see the fullscreen mobile experience.</p>
      </header>

      <section className="group">
        <h2>Playground</h2>
        <Playground />
      </section>

      <section className="group">
        <h2>Examples</h2>
        <DefaultExample />
        <MonthDayExample />
        <BirthdayExample />
        <FutureExample />
        <PrimaryColorExample />
        <LocaleExample />
        <FormExample />
        <ThemedExample />
      </section>

      <section className="group">
        <h2>Reference</h2>
        <PropsTable />
      </section>

      <footer>
        Built by <a href="https://www.webfolks.io/">WebFolks.io</a> · MIT License
      </footer>
    </main>
  );
}
