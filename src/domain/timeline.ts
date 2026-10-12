import { dayDistance, eventDay, isPastDay, localDay, newestEvents } from "./dates";
import { CATEGORIES, Category, LifeEvent, Pet } from "./types";

// The time machine: growth photos by month, "first time" moments and anniversaries.
// Everything is derived from saved entries and the pet profile.
const oldestFirst = (events: LifeEvent[]) => newestEvents(events).reverse();
export const isHomeDate = isPastDay;

/** The first entry with a photo in each month, oldest month first. */
export function monthlyPhotos(events: LifeEvent[]): { month: string; event: LifeEvent }[] {
  const seen = new Map<string, LifeEvent>();
  for (const e of oldestFirst(events)) {
    const month = eventDay(e).slice(0, 7);
    if (e.photo && !seen.has(month)) seen.set(month, e);
  }
  return [...seen].map(([month, event]) => ({ month, event }));
}

/** The earliest entry of each kind, plus the very first entry and the first photo. */
export function firsts(events: LifeEvent[]): { kind: Category | "entry" | "photo"; event: LifeEvent }[] {
  const sorted = oldestFirst(events);
  const out: { kind: Category | "entry" | "photo"; event: LifeEvent }[] = [];
  if (sorted[0]) out.push({ kind: "entry", event: sorted[0] });
  const photo = sorted.find((e) => e.photo);
  if (photo) out.push({ kind: "photo", event: photo });
  for (const c of CATEGORIES) {
    if (c === "other") continue;
    const first = sorted.find((e) => e.category === c);
    if (first) out.push({ kind: c, event: first });
  }
  return out;
}

export interface Milestones {
  /** Day count since the first entry, counting that day as day 1. */
  recordingDay?: number;
  /** Day count since the pet came home, counting that day as day 1. */
  homeDay?: number;
  /** Whole years at home when today is the anniversary. */
  anniversaryToday?: number;
  nextAnniversary?: { years: number; inDays: number };
}
export function milestones(pet: Pet, events: LifeEvent[], now = new Date()): Milestones {
  const today = localDay(now);
  const out: Milestones = {};
  const first = oldestFirst(events)[0];
  if (first) out.recordingDay = Math.max(1, dayDistance(eventDay(first), today) + 1);
  if (isHomeDate(pet.homeDate, now)) {
    const [y, m, d] = pet.homeDate.split("-").map(Number);
    out.homeDay = dayDistance(pet.homeDate, today) + 1;
    const occurrence = (year: number) => localDay(new Date(year, m - 1, Math.min(d, new Date(year, m, 0).getDate())));
    let years = now.getFullYear() - y;
    let next = occurrence(y + years);
    if (next === today && years > 0) out.anniversaryToday = years;
    if (next <= today) next = occurrence(y + ++years);
    out.nextAnniversary = { years, inDays: dayDistance(today, next) };
  }
  return out;
}
