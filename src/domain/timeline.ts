import { dayNumber, monthKey, startOfDay } from "./dates";
import { newestFirst } from "./life";
import { CATEGORIES, Category, LifeEvent, Pet } from "./types";

// The time machine: growth photos by month, "first time" moments and anniversaries.
// Everything is derived from saved entries and the pet profile.
const oldestFirst = (events: LifeEvent[]) => newestFirst(events).reverse();

/** A YYYY-MM-DD date that exists and is not in the future. */
export function isHomeDate(value: unknown, now = new Date()): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d &&
    y >= 1970 && date.getTime() <= startOfDay(now).getTime()
  );
}

/** The first entry with a photo in each month, oldest month first. */
export function monthlyPhotos(events: LifeEvent[]): { month: string; event: LifeEvent }[] {
  const seen = new Map<string, LifeEvent>();
  for (const e of oldestFirst(events)) {
    const month = monthKey(e.createdAt);
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
  const today = dayNumber(now);
  const out: Milestones = {};
  const first = oldestFirst(events)[0];
  if (first) out.recordingDay = Math.max(1, today - dayNumber(new Date(first.createdAt)) + 1);
  if (isHomeDate(pet.homeDate, now)) {
    const [y, m, d] = pet.homeDate.split("-").map(Number);
    out.homeDay = today - dayNumber(new Date(y, m - 1, d)) + 1;
    let years = now.getFullYear() - y;
    let next = dayNumber(new Date(y + years, m - 1, d));
    if (next === today && years > 0) out.anniversaryToday = years;
    if (next <= today) next = dayNumber(new Date(y + ++years, m - 1, d));
    out.nextAnniversary = { years, inDays: next - today };
  }
  return out;
}
