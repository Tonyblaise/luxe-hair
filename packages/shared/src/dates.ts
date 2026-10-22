export const TIME_ZONE = "Africa/Nairobi";
const DAY_MS = 86_400_000;

// Calendar dates are Postgres DATE columns, carried as UTC-midnight Date values.
export function todayDate(now: Date = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parseISODate(ymd);
}

export const parseISODate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
export const toISODate = (d: Date) => d.toISOString().slice(0, 10);
export const monthKey = (d: Date) => d.toISOString().slice(0, 7);
export const parseMonthKey = (key: string) => parseISODate(`${key}-01`);

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY_MS);

/** Pay weeks run Monday to Sunday; payouts go out on the Sunday. */
export function weekStart(d: Date): Date {
  return addDays(d, -((d.getUTCDay() + 6) % 7));
}

export const monthStart = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
export const addMonths = (d: Date, n: number) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
export const monthEnd = (d: Date) => addDays(addMonths(d, 1), -1);

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" });

const shortFmt = fmt({ month: "short", day: "numeric" });
const longFmt = fmt({ weekday: "long", month: "long", day: "numeric" });
const monthYearFmt = fmt({ month: "short", year: "numeric" });
const monthLongFmt = fmt({ month: "long" });
const monthShortFmt = fmt({ month: "short" });

/** "Oct 14" */
export const formatShortDate = (d: Date) => shortFmt.format(d);
/** "Wednesday, October 14" */
export const formatLongDate = (d: Date) => longFmt.format(d);
/** "Oct 2026" */
export const formatMonthYear = (d: Date) => monthYearFmt.format(d);
/** "October" */
export const formatMonthName = (d: Date) => monthLongFmt.format(d);
/** "Oct" */
export const formatMonthShort = (d: Date) => monthShortFmt.format(d);

/** "Oct 12–18" or "Sep 29–Oct 5" */
export function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);
  return start.getUTCMonth() === end.getUTCMonth()
    ? `${formatShortDate(start)}–${end.getUTCDate()}`
    : `${formatShortDate(start)}–${formatShortDate(end)}`;
}

/** Same day of month n months later, clamped to the month's last day (Jan 31 → Feb 28). */
export function addMonthsSameDay(d: Date, n: number): Date {
  const target = addMonths(d, n);
  const lastDay = monthEnd(target).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d.getUTCDate(), lastDay)));
}

/** "13:00" → "1:00" (appointment slots; the design shows no AM/PM) */
export function formatClock(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}`;
}

/** "16:00" → "4:00 PM" */
export function formatTime(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}
