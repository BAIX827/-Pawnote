import { addDays, dayKey, eventDate, eventDay, newestEvents } from "./dates";
import { Lang, getLang } from "../i18n/core";
import { PlannedReminder, plannedReminders, remindersPaused } from "./paw-dates";
import { ownerName } from "./story-engine";
import { Temper, isSensitive, temperOf } from "./temper";
import { AppState, CATEGORIES, Category, LifeEvent } from "./types";

// 爪信 / Paw Mail (docs/01 8.18): a letter from the pet about a stretch of time, made only from
// saved entries. A recap (counts, favourite thing, a highlight), up to two complaints about
// things that happened, one piece of praise and a sign-off. Copy follows docs/13 §12.
type Text = Record<Lang, string>;
export const MAIL_KINDS = ["week", "month", "year"] as const;
export type MailKind = (typeof MAIL_KINDS)[number];
/** A year letter opens once the year has this many entries. */
export const MIN_YEAR_ENTRIES = 5;

/** Midnight on the Monday of the week containing `now`, local time. */
const mondayOf = (now: Date) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));

/** The stretch a letter covers: last Monday–Sunday, last month, or this year so far. End is exclusive. */
export function mailPeriod(kind: MailKind, now = new Date()): { start: Date; end: Date } {
  if (kind === "week") {
    const end = mondayOf(now);
    return { start: addDays(end, -7), end };
  }
  if (kind === "month")
    return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1) };
  return { start: new Date(now.getFullYear(), 0, 1), end: now };
}
/** Identifies this week's letter (the Monday it covers, YYYY-MM-DD), for the read marker. */
export const weekMailKey = (now = new Date()) => dayKey(mailPeriod("week", now).start);

const PREFIX: Record<Temper, { complaint: Text; praise: Text; closing: Text; teaser: Text }> = {
  cool: {
    complaint: { zh: "顺便一提：", en: "For the record:" },
    praise: { zh: "勉强表扬一下：", en: "Grudging praise:" },
    closing: { zh: "就这样。下次再说。", en: "That's all. Until next time." },
    teaser: { zh: "信放门口了。看不看随你。", en: "Letter's by the door. Read it or don't." },
  },
  clingy: {
    complaint: { zh: "有件事想跟你说，", en: "can i tell you something?" },
    praise: { zh: "还有，", en: "also," },
    closing: { zh: "想你。其实你就在旁边，也想你。", en: "miss you. even when you're right here." },
    teaser: { zh: "我给你写了一封信，快来看。", en: "i wrote you a letter. come read it." },
  },
  goofy: {
    complaint: { zh: "我要告状！但不是很生气！", en: "Complaint! (Not a big one!)" },
    praise: { zh: "还有好事！", en: "Also, GOOD NEWS:" },
    closing: { zh: "下次也要一起玩！", en: "Next time: more. Of everything." },
    teaser: { zh: "信！我写了一封信！", en: "LETTER! I wrote a letter!" },
  },
  drama: {
    complaint: { zh: "我要正式告状。", en: "I wish to file a formal complaint." },
    praise: { zh: "不过我也是讲道理的：", en: "But I am fair:" },
    closing: { zh: "写完了。我需要躺一下。", en: "That's the letter. I need to lie down now." },
    teaser: { zh: "我有好多话要说，都写在信里了。", en: "I have a lot to say. It's all in the letter." },
  },
  curious: {
    complaint: { zh: "观察记录：", en: "Observation:" },
    praise: { zh: "正面结果：", en: "Positive result:" },
    closing: { zh: "本期报告完毕，下期继续观察。", en: "End of report. Observation continues." },
    teaser: { zh: "观察报告出来了。", en: "The observation report is ready." },
  },
  calm: {
    complaint: { zh: "例行反馈：", en: "Routine feedback:" },
    praise: { zh: "另：", en: "Also:" },
    closing: { zh: "以上。", en: "Nothing further." },
    teaser: { zh: "周报已送达。", en: "Weekly report delivered." },
  },
  shy: {
    complaint: { zh: "小声说一句……", en: "um, small thing..." },
    praise: { zh: "还有……", en: "and..." },
    closing: { zh: "……谢谢你看完。", en: "...thanks for reading." },
    teaser: { zh: "我……写了一封信。", en: "i... wrote a letter." },
  },
};
// Complaints are about things that happened, never about the owner (docs/13 §12).
const COMPLAINT: Record<Category, Text> = {
  bath: { zh: "洗澡那件事，我还没原谅。毛湿了好久。", en: "About the bath. I haven't forgiven it. My fur stayed wet for ages." },
  sleep: { zh: "我睡觉的时候，好像总有人拿手机对着我。", en: "Every time I nap, someone points a phone at me." },
  snack: { zh: "零食的分量需要重新谈一谈。", en: "We need to renegotiate snack portions." },
  chaos: { zh: "被记成拆家的那次，是东西自己先掉下来的。", en: "The mess on record was the object's fault. It moved first." },
  walk: { zh: "出门的时间，再长一点就更好了。", en: "The outings could be a little longer. Just a thought." },
  other: { zh: "有些事你写下来了，我的版本还没人听。", en: "You wrote some things down. Nobody has heard my side yet." },
};
const PRAISE: Partial<Record<Category, Text>> = {
  walk: { zh: "你带我出门那次，我记着。", en: "That time you took me out. I remember." },
  snack: { zh: "零食那次，做得不错。", en: "The snack. Good work." },
  sleep: { zh: "你让我安安静静睡了一觉，这点很好。", en: "You let me nap in peace. Appreciated." },
  other: { zh: "你把我的日常都记下来了。", en: "You wrote my days down. I noticed." },
};
const TOP: Record<Category, Text> = {
  sleep: { zh: "睡觉。这件事我做得最认真。", en: "Sleeping. The thing I take most seriously." },
  snack: { zh: "吃。每一口都值得记下来。", en: "Eating. Every bite deserved a record." },
  bath: { zh: "洗澡。次数比我想要的多。", en: "Baths. More than I'd have chosen." },
  chaos: { zh: "拆家。我更愿意叫它重新布置。", en: "Chaos. I prefer \"redecorating\"." },
  walk: { zh: "出门。外面的消息我都读过了。", en: "Going out. I've read all the news out there." },
  other: { zh: "各种小事。都是我。", en: "All sorts of little things. All me." },
};
const EMPTY: Text = {
  zh: "这段时间的信很短：我很好，你有空再来写我。",
  en: "Short letter this time: I'm fine. Write about me when you have a minute.",
};
const QUIET: { line: Text; closing: Text; teaser: Text } = {
  line: { zh: "这段时间有几天不太舒服。谢谢你陪着我。", en: "Some of these days weren't easy. Thank you for staying close." },
  closing: { zh: "想让你陪一会儿。", en: "Stay a while." },
  teaser: { zh: "这周的信到了。", en: "This week's letter is here." },
};
const TITLE: Record<MailKind, Text> = {
  week: { zh: "{name}的周信", en: "{name}'s weekly letter" },
  month: { zh: "{name}的月信", en: "{name}'s monthly letter" },
  year: { zh: "{name}的年鉴", en: "{name}'s year so far" },
};
// "Dear the staff" reads oddly, so English opens with "To".
const GREETING: Text = { zh: "致{owner}：", en: "To {owner}," };

export interface Mail {
  kind: MailKind;
  start: Date;
  end: Date;
  title: string;
  /** What the pet calls its owner. */
  owner: string;
  greeting: string;
  entries: number;
  days: number;
  photos: number;
  xp: number;
  top?: Category;
  topLine?: string;
  /** The newest entry with a photo, else the newest entry. */
  highlight?: LifeEvent;
  /** Year letters only. */
  first?: LifeEvent;
  longest?: LifeEvent;
  complaints: string[];
  praise?: string;
  closing: string;
  /** 4 or 5; never lower. Absent for an empty or quiet letter. */
  stars?: 4 | 5;
  /** No entries in the period. */
  empty: boolean;
  /** The period that just ended had nothing, so this covers the current week or month so far. */
  inProgress: boolean;
  /** An entry about illness, injury or going missing: no complaints, jokes or stars. */
  quiet: boolean;
  quietLine?: string;
}

/** The letter for a period, or undefined when the latest entry says the pet has died. */
export function writeMail(state: Pick<AppState, "pet" | "events">, kind: MailKind, now = new Date(), lang: Lang = getLang()): Mail | undefined {
  const pet = state.pet;
  if (!pet || remindersPaused(state.events)) return undefined;
  let { start, end } = mailPeriod(kind, now);
  const within = (from: Date, to: Date) =>
    newestEvents(state.events).filter((e) => {
      const at = eventDate(e).getTime();
      return at >= from.getTime() && at < to.getTime();
    });
  let mine = within(start, end);
  // The year starts from its first entry, not 1 January, and waits for a few entries before it opens (docs/01 8.25).
  if (kind === "year" && mine.length) start = new Date(Math.max(start.getTime(), new Date(eventDate(mine[mine.length - 1]).toDateString()).getTime()));
  // Nothing in the week or month that just ended (often because the pet wasn't here yet): rather than
  // an empty letter, show the one still being written for the current week or month (docs/01 8.24).
  const inProgress = kind === "year" ? mine.length < MIN_YEAR_ENTRIES : !mine.length;
  if (inProgress && kind !== "year") {
    start = end;
    end = new Date(now.getTime() + 1);
    mine = within(start, end);
  }
  const temper = temperOf(pet), owner = ownerName(pet);
  // Clingy pets write in lowercase in English (docs/13 §4).
  const voice = (s: string) => (lang === "en" && temper === "clingy" ? s.toLowerCase() : s);
  const fill = (s: string) => s.split("{name}").join(pet.name).split("{owner}").join(owner);
  const quiet = mine.some((e) => isSensitive(e.description));
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  for (const e of mine) if (!isSensitive(e.description)) counts[e.category]++;
  const present = CATEGORIES.filter((c) => counts[c] > 0).sort((a, b) => counts[b] - counts[a]);
  const top = present[0];
  const empty = mine.length === 0;
  const p = PREFIX[temper];
  const join = (a: string, b: string) => (lang === "en" ? `${a} ${b}` : `${a}${b}`);
  const praiseKey = (["walk", "snack", "sleep", "other"] as Category[]).find((c) => counts[c] > 0) ?? "other";
  return {
    kind,
    start,
    end,
    title: fill(TITLE[kind][lang]),
    owner,
    greeting: voice(fill(GREETING[lang])),
    entries: mine.length,
    days: new Set(mine.map((e) => eventDay(e))).size,
    photos: mine.filter((e) => e.photo).length,
    xp: mine.length * 20,
    top,
    topLine: top && !quiet ? voice(TOP[top][lang]) : undefined,
    highlight: mine.find((e) => e.photo) ?? mine[0],
    first: kind === "year" ? mine[mine.length - 1] : undefined,
    longest: kind === "year" && mine.length ? [...mine].sort((a, b) => b.description.length - a.description.length)[0] : undefined,
    // The temper's opener goes on the first complaint only, so two in a row don't repeat it.
    complaints: empty || quiet || inProgress ? [] : present.slice(0, 2).map((c, i) => voice(i ? COMPLAINT[c][lang] : join(p.complaint[lang], COMPLAINT[c][lang]))),
    praise: empty || quiet || inProgress ? undefined : voice(join(p.praise[lang], PRAISE[praiseKey]![lang])),
    closing: quiet ? QUIET.closing[lang] : voice(p.closing[lang]),
    stars: empty || quiet || inProgress ? undefined : counts.walk || counts.snack ? 5 : 4,
    empty,
    inProgress,
    quiet,
    quietLine: quiet ? QUIET.line[lang] : empty ? voice(EMPTY[lang]) : undefined,
  };
}

/** Shows the 爪窝 card: last week's letter is unread and last week had something to write about. */
export const hasNewMail = (state: AppState, now = new Date()) => {
  if (!state.pet || !state.events.length || remindersPaused(state.events) || state.mailRead === weekMailKey(now)) return false;
  const mail = writeMail(state, "week", now);
  return !!mail && !mail.inProgress;
};

const NOTE_TITLE: Text = { zh: "{name}给你写了一封信", en: "{name} sent you a letter" };
/** The Monday 09:00 notification, unless the owner turned it off or the pet has died. */
export function plannedMail(state: AppState, lang: Lang = getLang(), now = new Date()): PlannedReminder | undefined {
  const pet = state.pet;
  if (!pet || state.mailReminder === false || remindersPaused(state.events)) return undefined;
  const recent = state.events.some((e) => now.getTime() - eventDate(e).getTime() < 7 * 86400000 && isSensitive(e.description));
  const temper = temperOf(pet);
  return {
    key: "mail-weekly",
    title: NOTE_TITLE[lang].split("{name}").join(pet.name),
    body: recent ? QUIET.teaser[lang] : PREFIX[temper].teaser[lang],
    hour: 9,
    minute: 0,
    weekday: 2,
    url: "/mail",
  };
}
/** Every notification the app should have scheduled: 爪约 plus the weekly letter. */
export function allReminders(state: AppState, lang: Lang = getLang(), now = new Date()): PlannedReminder[] {
  const mail = plannedMail(state, lang, now);
  return [...plannedReminders(state, lang, now), ...(mail ? [mail] : [])];
}

