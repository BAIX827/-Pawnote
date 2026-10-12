import type { LifeEvent } from "./types";

export const localDay = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const dayDate = (day: string) => {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date, 12);
};
export function isDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = dayDate(value);
  return date.getFullYear() >= 1970 && localDay(date) === value;
}
export const isPastDay = (value: unknown, now = new Date()): value is string =>
  isDay(value) && value <= localDay(now);
/** Explicit calendar dates remain stable when a backup moves between time zones. */
export const eventDay = (event: LifeEvent) => event.occurredOn ?? localDay(new Date(event.createdAt));
export const eventDate = (event: LifeEvent) => {
  const date = new Date(event.createdAt);
  return !event.occurredOn || localDay(date) === event.occurredOn ? date : dayDate(event.occurredOn);
};
export const newestEvents = (events: LifeEvent[]) => [...events].sort((a, b) =>
  eventDay(b).localeCompare(eventDay(a)) || b.createdAt.localeCompare(a.createdAt));
/** Calendar arithmetic uses UTC ordinals to avoid daylight-saving hour offsets. */
export const dayDistance = (from: string, to: string) => {
  const ordinal = (day: string) => { const [y, m, d] = day.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((ordinal(to) - ordinal(from)) / 86400000);
};
export function eventTimestamp(day: string, previous?: LifeEvent, now = new Date()) {
  if (!isPastDay(day, now)) throw new Error("记录日期请填写真实日期，且不晚于今天。");
  if (previous && eventDay(previous) === day) return previous.createdAt;
  return day === localDay(now) ? now.toISOString() : dayDate(day).toISOString();
}
