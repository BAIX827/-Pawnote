import { eventDay, newestEvents } from "./dates";
import { getLang, t } from "../i18n/core";
import { isSensitive, temperOf, Temper } from "./temper";
import { CATEGORIES, Category, LifeEvent, Pet } from "./types";

// A monthly keepsake of saved moments. Frequency is never a performance rating.
export interface MonthReport {
  month: string;
  entries: number;
  days: number;
  counts: Record<Category, number>;
  top?: Category;
  highlight?: LifeEvent;
}

const pad = (n: number) => String(n).padStart(2, "0");
/** The owner's local calendar month of a timestamp, as YYYY-MM. */
export const monthKey = (date: string | Date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
/** Months that have entries, newest first; the current month is always offered. */
export function reportMonths(events: LifeEvent[], now = new Date()): string[] {
  return [...new Set([monthKey(now), ...events.map((e) => eventDay(e).slice(0, 7))])].sort().reverse();
}

export function monthReport(events: LifeEvent[], month: string): MonthReport {
  const mine = newestEvents(events).filter((e) => eventDay(e).slice(0, 7) === month);
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  // A hard day still counts as showing up, but never as a "chaos deduction" or a joke line.
  for (const e of mine) if (!isSensitive(e.description)) counts[e.category]++;
  const top = CATEGORIES.filter((c) => counts[c] > 0).sort((a, b) => counts[b] - counts[a])[0];
  const n = mine.length;
  return {
    month,
    entries: n,
    days: new Set(mine.map((e) => eventDay(e))).size,
    counts,
    top,
    highlight: mine[0],
  };
}

const RATES: Record<Category, { label: string; each: number }> = {
  sleep: { label: "带薪午休补贴", each: 3 },
  snack: { label: "餐补（自取）", each: 2 },
  bath: { label: "洗澡受惊补偿", each: 5 },
  walk: { label: "外勤补贴", each: 4 },
  other: { label: "杂项", each: 1 },
  chaos: { label: "创意补贴", each: 3 },
};
export const currency = (pet: Pet) =>
  t(pet.species === "cat" ? "小鱼干" : pet.species === "dog" ? "肉干" : "零食");
/** Payslip lines for the work route. The total never goes below zero. */
export function payslip(report: MonthReport): { lines: { label: string; count?: number; amount: number }[]; total: number } {
  const lines = [{ label: t("底薪"), count: report.entries, amount: report.entries * 10 }];
  for (const c of CATEGORIES)
    if (report.counts[c]) lines.push({ label: t(RATES[c].label), count: report.counts[c], amount: report.counts[c] * RATES[c].each });
  if (report.days >= 20) lines.push({ label: t("全勤奖"), count: report.days, amount: 30 });
  return { lines, total: Math.max(0, lines.reduce((sum, l) => sum + l.amount, 0)) };
}

const SUBJECTS: Record<Category, string> = {
  sleep: "睡眠研究",
  snack: "食堂调研",
  bath: "卫生实践",
  chaos: "手工课",
  walk: "户外观察",
  other: "生活笔记",
};
/** Category counts for the campus route; an unrecorded subject stays empty. */
export function reportCard(report: MonthReport): { rows: { subject: string; count: number }[]; credits: number } {
  return {
    rows: CATEGORIES.map((c) => ({
      subject: t(SUBJECTS[c]),
      count: report.counts[c],
    })),
    credits: report.entries * 2,
  };
}

const SELF: Record<Temper, string> = {
  cool: "这些日常，我想按自己的节奏慢慢回看。",
  clingy: "和{owner}一起的日子，想一段一段记住。",
  goofy: "和{owner}一起，想把这些小事再看一遍！",
  drama: "本月的小剧场，想请{owner}一起回看。",
  curious: "还有些小问题，想和{owner}接着聊。",
  calm: "正常上班，正常下班，没有意见。",
  shy: "我有在努力，只是比较小声。",
};
/** A count-based memory note and the pet's reflection in its own temper. */
export function appraisal(pet: Pet, report: MonthReport, owner: string) {
  return {
    manager: report.entries
      ? getLang() === "en"
        ? `${report.entries} ${report.entries === 1 ? "moment" : "moments"} kept across ${report.days} ${report.days === 1 ? "day" : "days"}. Add another whenever you feel like it.`
        : t("这 {days} 天，留下了 {n} 段生活。想记的时候，就添一笔。", { days: report.days, n: report.entries })
      : t("这一页还空着，想记的时候再写。"),
    self: t(SELF[temperOf(pet)], { owner }),
  };
}
