/**
 * Display formatting for the simulated record set.
 *
 * Every mock timestamp in this prototype is a human-readable string such as
 * `27 Sep 2026, 10:42`, written exactly as it should appear on screen. These
 * helpers parse that shape without touching the host clock or the browser
 * locale, so a static export renders identically on every machine.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_INDEX = new Map<string, number>(
  MONTHS.map((month, index) => [month, index]),
);

/** The day the simulated environment is frozen on. */
export const DEMO_TODAY = "27 Sep 2026";

interface ParsedStamp {
  day: number;
  month: number;
  year: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function parseStamp(value: string): ParsedStamp | null {
  const match = /^(\d{1,2})\s([A-Z][a-z]{2})\s(\d{4})(?:,\s(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(
    value.trim(),
  );
  if (!match) return null;

  const month = MONTH_INDEX.get(match[2] ?? "");
  if (month === undefined) return null;

  return {
    day: Number(match[1]),
    month,
    year: Number(match[3]),
    hours: match[4] ? Number(match[4]) : 0,
    minutes: match[5] ? Number(match[5]) : 0,
    seconds: match[6] ? Number(match[6]) : 0,
  };
}

/**
 * Comparable number for a display timestamp. Newest timestamps sort first when
 * the list is sorted descending. Unparseable input sorts last.
 */
export function stampOrder(value: string): number {
  const stamp = parseStamp(value);
  if (!stamp) return Number.NEGATIVE_INFINITY;
  return (
    stamp.year * 10_000_000 +
    stamp.month * 1_000_000 +
    stamp.day * 100_000 +
    stamp.hours * 1_000 +
    stamp.minutes * 100 +
    stamp.seconds
  );
}

function dayIndex(value: string, reference: string): number | null {
  const stamp = parseStamp(value);
  const anchor = parseStamp(reference);
  if (!stamp || !anchor) return null;

  const toOrdinal = (target: ParsedStamp): number =>
    Date.UTC(target.year, target.month, target.day) / 86_400_000;

  return toOrdinal(anchor) - toOrdinal(stamp);
}

/** `Today`, `Yesterday`, or the date itself, relative to the frozen day. */
export function relativeDay(value: string, reference: string = DEMO_TODAY): string {
  const distance = dayIndex(value, reference);
  if (distance === null) return value;
  if (distance === 0) return "Today";
  if (distance === 1) return "Yesterday";
  return value.split(",")[0] ?? value;
}

/** `10:42 AM` from `27 Sep 2026, 10:42`. */
export function formatClock(value: string): string {
  const stamp = parseStamp(value);
  if (!stamp) return value;
  const suffix = stamp.hours < 12 ? "AM" : "PM";
  const hours = stamp.hours % 12 === 0 ? 12 : stamp.hours % 12;
  const minutes = String(stamp.minutes).padStart(2, "0");
  return `${hours}:${minutes} ${suffix}`;
}

/** `27 Sep 2026, 10:42 AM` from a display timestamp, with the day spelled out. */
export function formatStamp(value: string, reference: string = DEMO_TODAY): string {
  const clock = formatClock(value);
  return clock === value ? value : `${relativeDay(value, reference)}, ${clock}`;
}

/** Calendar date only, e.g. `18 Sep 2026`. */
export function formatDate(value: string): string {
  return value.split(",")[0] ?? value;
}

/** Whole days between two display timestamps, always non-negative. */
export function daysBetween(from: string, to: string): number {
  const start = parseStamp(from);
  const end = parseStamp(to);
  if (!start || !end) return 0;
  const days =
    (Date.UTC(end.year, end.month, end.day) -
      Date.UTC(start.year, start.month, start.day)) /
    86_400_000;
  return Math.max(0, Math.round(days));
}

/**
 * A display timestamp advanced by a whole number of minutes.
 *
 * The demo simulation uses this instead of the host clock, so a reviewer who
 * clicks the same controls twice in the same order sees exactly the same
 * timestamps. Carries across month, year and daylight boundaries by
 * normalising through UTC rather than the machine's local zone.
 */
export function addMinutes(value: string, minutes: number): string {
  const stamp = parseStamp(value);
  if (!stamp) return value;

  const shifted = new Date(
    Date.UTC(stamp.year, stamp.month, stamp.day, stamp.hours, stamp.minutes) +
      minutes * 60_000,
  );

  const day = String(shifted.getUTCDate()).padStart(2, "0");
  const month = MONTHS[shifted.getUTCMonth()] ?? "Jan";
  const hours = String(shifted.getUTCHours()).padStart(2, "0");
  const mins = String(shifted.getUTCMinutes()).padStart(2, "0");

  return `${day} ${month} ${shifted.getUTCFullYear()}, ${hours}:${mins}`;
}

/** The latest of a set of display timestamps. Empty input returns the demo day. */
export function latestStamp(values: readonly string[]): string {
  return values.reduce<string>(
    (latest, candidate) =>
      stampOrder(candidate) > stampOrder(latest) ? candidate : latest,
    DEMO_TODAY,
  );
}

/** Calendar date advanced by a whole number of days, e.g. `30 Sep 2026`. */
export function addCalendarDays(value: string, days: number): string {
  const stamp = parseStamp(value);
  if (!stamp) return value;

  const shifted = new Date(
    Date.UTC(stamp.year, stamp.month, stamp.day + days),
  );

  const day = String(shifted.getUTCDate()).padStart(2, "0");
  const month = MONTHS[shifted.getUTCMonth()] ?? "Jan";

  return `${day} ${month} ${shifted.getUTCFullYear()}`;
}
