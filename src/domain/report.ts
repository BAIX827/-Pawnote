import { eventDay, newestEvents } from "./dates";
import { t } from "../i18n/core";
import { isSensitive, temperOf, Temper } from "./temper";
import { CATEGORIES, Category, LifeEvent, Pet } from "./types";

// The monthly review: a payslip (work route) or report card (campus route), a grade and a
// short appraisal. Everything is derived from saved entries; nothing here is stored.
export type Grade = "S" | "A" | "B" | "C" | null;
export interface MonthReport {
  month: string;
  entries: number;
  days: number;
  counts: Record<Category, number>;
  top?: Category;
  highlight?: LifeEvent;
  grade: Grade;
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
    grade: n >= 20 ? "S" : n >= 10 ? "A" : n >= 4 ? "B" : n >= 1 ? "C" : null,
  };
}

const RATES: Record<Category, { label: string; each: number }> = {
  sleep: { label: "带薪午休补贴", each: 3 },
  snack: { label: "餐补（自取）", each: 2 },
  bath: { label: "洗澡受惊补偿", each: 5 },
  walk: { label: "外勤补贴", each: 4 },
  other: { label: "杂项", each: 1 },
  chaos: { label: "物品损耗扣款", each: -3 },
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
/** Report-card rows for the campus route; a subject with no entries is marked absent. */
export function reportCard(report: MonthReport): { rows: { subject: string; count: number; score?: number }[]; credits: number } {
  return {
    rows: CATEGORIES.map((c) => ({
      subject: t(SUBJECTS[c]),
      count: report.counts[c],
      score: report.counts[c] ? Math.min(100, 60 + report.counts[c] * 8) : undefined,
    })),
    credits: report.entries * 2,
  };
}

const MANAGER: Record<"S" | "A" | "B" | "C" | "none", string> = {
  S: "全勤级表现，建议立刻发放零食。",
  A: "表现稳定，继续保持。",
  B: "有记录，有进步空间。",
  C: "本月露面不多，下月多写几笔。",
  none: "本月还没有记录。",
};
const SELF: Record<Temper, string> = {
  cool: "我的表现不需要评价。",
  clingy: "只要{owner}在，我每天都满分。",
  goofy: "不知道考核是什么，但我很开心！",
  drama: "本月我付出了太多，建议加薪并公开表扬。",
  curious: "已完成多项实验，结论待复现。",
  calm: "正常上班，正常下班，没有意见。",
  shy: "我有在努力，只是比较小声。",
};
/** The owner's verdict by grade and the pet's self-review in its own temper. */
export function appraisal(pet: Pet, report: MonthReport, owner: string) {
  return {
    manager: t(MANAGER[report.grade ?? "none"]),
    self: t(SELF[temperOf(pet)], { owner }),
  };
}
