import { getLang, Lang, t } from "../i18n/core";
import { Category, LifeEvent, SoundMemory } from "./types";
import { dayDate, eventDay, localDay, newestEvents } from "./dates";
import { isSensitive } from "./temper";

export interface JournalFilter { query?: string; month?: string; day?: string; category?: Category; photosOnly?: boolean }
export function filterJournal(events: LifeEvent[], filter: JournalFilter = {}) {
  const words = (filter.query ?? "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return newestEvents(events).filter((event) => {
    const day = eventDay(event);
    if (filter.month && day.slice(0, 7) !== filter.month) return false;
    if (filter.day && day !== filter.day) return false;
    if (filter.category && event.category !== filter.category) return false;
    if (filter.photosOnly && !event.photo) return false;
    const text = [event.description, ...Object.values(event.stories).flatMap((s) => [s.title, s.text])].join("\n").toLocaleLowerCase();
    return words.every((word) => text.includes(word));
  });
}
/** Monday-first calendar, including padding cells, with counts from the current filters. */
export function calendarDays(month: string, events: LifeEvent[]) {
  const date = dayDate(`${month}-01`), offset = (date.getDay() + 6) % 7;
  const count = new Map<string, number>();
  for (const event of events) { const day = eventDay(event); count.set(day, (count.get(day) ?? 0) + 1); }
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => {
    const n = i - offset + 1;
    if (n < 1 || n > days) return undefined;
    const day = `${month}-${String(n).padStart(2, "0")}`;
    return { day, n, count: count.get(day) ?? 0 };
  });
}
export const shiftMonth = (month: string, delta: number) => {
  const date = dayDate(`${month}-01`);
  return localDay(new Date(date.getFullYear(), date.getMonth() + delta, 1)).slice(0, 7);
};
export type PastMemory = { kind: "event"; event: LifeEvent; years: number; day: string } |
  { kind: "sound"; sound: SoundMemory; years: number; day: string };
export function onThisDay(events: LifeEvent[], sounds: SoundMemory[] = [], now = new Date()): PastMemory[] {
  const today = localDay(now), thisYear = now.getFullYear();
  const matches = (day: string) => day.slice(5) === today.slice(5) && Number(day.slice(0, 4)) < thisYear;
  return [
    ...events.filter((e) => matches(eventDay(e))).map((event): PastMemory => ({ kind: "event", event, day: eventDay(event), years: thisYear - Number(eventDay(event).slice(0, 4)) })),
    ...sounds.filter((s) => matches(s.recordedOn)).map((sound): PastMemory => ({ kind: "sound", sound, day: sound.recordedOn, years: thisYear - Number(sound.recordedOn.slice(0, 4)) })),
  ].sort((a, b) => b.day.localeCompare(a.day) || a.kind.localeCompare(b.kind));
}
/** Only the saved entry supplies facts; the introduction adds no invented memories. */
export function memoryLine(memory: PastMemory, lang: Lang = getLang()) {
  if (memory.kind === "sound") return lang === "zh" ? "这一声也被留下来了。点开再听听。" : "This little sound was saved too. Listen again.";
  if (isSensitive(memory.event.description)) return lang === "zh" ? "这一天的记录，留在这里。" : "This day's record is here to revisit.";
  return lang === "zh" ? "翻到以前的我了。那天的事，你也写下来了。" : "You found an earlier me. You wrote that day down too.";
}
export const memoryYears = (years: number) => t("{n} 年前的今天", { n: years });
