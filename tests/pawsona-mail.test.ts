import test from "node:test";
import assert from "node:assert/strict";
import { demoState } from "../src/data/demo";
import { isAppState } from "../src/data/validation";
import { PAWSONA_QUESTIONS, PERSONAS, TEMPERS, adoptPawsona, pawsonaCard, scorePawsona, takePawsona } from "../src/domain/pawsona";
import { hasNewMail, mailDay, mailPeriod, monthMailKey, newMail, pastMail, plannedMail, weekMailKey, writeMail } from "../src/domain/paw-mail";
import { mailSVG, pawsonaSVG } from "../src/domain/share-cards";
import { temperOf } from "../src/domain/temper";
import { generateStories } from "../src/domain/story-engine";
import type { AppState, Category, LifeEvent, Pet } from "../src/domain/types";
import { en } from "../src/i18n/en";
import { applyLang } from "../src/i18n/core";

applyLang("zh");
const pet = (): Pet => ({ ...demoState().pet!, personality: "傲娇" });
const entry = (p: Pet, description: string, category: Category, at: Date, photo?: string): LifeEvent => ({
  id: `e-${description}-${at.getTime()}`, description, category, createdAt: at.toISOString(), petSnapshot: p, photo,
  stories: generateStories(p, description, category), selectedStyle: "diary", published: false,
});
const state = (events: LifeEvent[], p = pet()): AppState => ({ ...demoState(), pet: p, events: [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
// Wednesday 15 October 2026, so last week is Mon 5 – Sun 11 October.
const NOW = new Date(2026, 9, 14, 10, 0);

test("爪格：八道题、每种脾气至少出现 4 次，计分稳定，平分按先出现的", () => {
  assert.equal(PAWSONA_QUESTIONS.length, 8);
  for (const temper of TEMPERS) {
    const n = PAWSONA_QUESTIONS.flatMap((q) => q.choices).filter((c) => c.temper === temper).length;
    assert.ok(n >= 4, `${temper} appears ${n} times`);
  }
  for (const q of PAWSONA_QUESTIONS) {
    assert.equal(q.choices.length, 4);
    assert.ok(!q.title.en.includes("—") && !q.choices.some((c) => c.label.en.includes("—")));
  }
  assert.throws(() => scorePawsona([0, 0, 0]));
  assert.throws(() => scorePawsona([0, 0, 0, 0, 0, 0, 0, 4]));
  // Choice 0 everywhere: clingy, drama, curious, clingy, goofy, cool, shy, cool → clingy and cool tie at 2; clingy came first.
  const r = scorePawsona([0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(r.temper, "clingy");
  assert.equal(Object.values(r.scores).reduce((a, b) => a + b, 0), 8);
  assert.deepEqual(scorePawsona([0, 0, 0, 0, 0, 0, 0, 0]), r);
  // Every temper can win.
  const reach = new Set<string>();
  for (const temper of TEMPERS) {
    const answers = PAWSONA_QUESTIONS.map((q) => Math.max(0, q.choices.findIndex((c) => c.temper === temper)));
    reach.add(scorePawsona(answers).temper);
  }
  assert.equal(reach.size, 7);
});

test("爪格：结果卡中英文、设为性格映射回同一脾气、备份往返", () => {
  for (const temper of TEMPERS) {
    const adopted = adoptPawsona(pet(), temper);
    assert.equal(temperOf(adopted), temper, temper);
    assert.equal(adopted.personalitySource, "tag");
    for (const lang of ["zh", "en"] as const) {
      const card = pawsonaCard(pet(), { temper, scores: { ...Object.fromEntries(TEMPERS.map((t) => [t, 0])), [temper]: 8 } as never }, lang);
      assert.ok(card.intro.includes(pet().name) && !card.intro.includes("{"), `${temper} ${lang}`);
      assert.ok(!card.intro.includes("—"));
    }
    assert.ok(PERSONAS[temper].name.en);
  }
  const result = takePawsona([1, 1, 1, 1, 1, 1, 1, 1], NOW);
  const s = { ...state([]), pawsona: result };
  assert.equal(isAppState(s), true);
  assert.equal(isAppState(JSON.parse(JSON.stringify(s))), true);
  assert.equal(isAppState({ ...s, pawsona: { ...result, temper: "angry" } }), false);
  assert.equal(isAppState({ ...s, pawsona: { ...result, scores: { ...result.scores, cool: 9 } } }), false);
  const svg = pawsonaSVG(pet(), result);
  assert.ok(svg.startsWith("<svg") && svg.includes(PERSONAS[result.temper].name.zh));
});

test("爪信：时间段为上周一到周日、上个月、今年至今", () => {
  const week = mailPeriod("week", NOW);
  assert.deepEqual([week.start, week.end], [new Date(2026, 9, 5), new Date(2026, 9, 12)]);
  assert.equal(weekMailKey(NOW), "2026-10-05");
  // Sunday still belongs to the week that started on Monday.
  assert.equal(weekMailKey(new Date(2026, 9, 18, 23)), "2026-10-05");
  assert.equal(weekMailKey(new Date(2026, 9, 19, 0, 1)), "2026-10-12");
  const month = mailPeriod("month", NOW);
  assert.deepEqual([month.start, month.end], [new Date(2026, 8, 1), new Date(2026, 9, 1)]);
  const jan = mailPeriod("month", new Date(2027, 0, 3));
  assert.deepEqual(jan.start, new Date(2026, 11, 1));
  assert.deepEqual(mailPeriod("year", NOW).start, new Date(2026, 0, 1));
});

test("爪信：数字、最常做的事、代表作、告状只告事情、星级只有 4 或 5", () => {
  const p = pet();
  const events = [
    entry(p, "给它洗了澡", "bath", new Date(2026, 9, 6, 9)),
    entry(p, "又洗了一次澡", "bath", new Date(2026, 9, 7, 9), "data:image/jpeg;base64,AAAA"),
    entry(p, "睡了一下午", "sleep", new Date(2026, 9, 7, 15)),
    entry(p, "上周之外的事", "walk", new Date(2026, 9, 13, 9)),
  ];
  const mail = writeMail(state(events), "week", NOW, "zh")!;
  assert.equal(mail.entries, 3);
  assert.equal(mail.days, 2);
  assert.equal(mail.photos, 1);
  assert.equal(mail.xp, 60);
  assert.equal(mail.top, "bath");
  assert.equal(mail.highlight!.description, "又洗了一次澡");
  assert.equal(mail.complaints.length, 2);
  assert.ok(mail.complaints[0].startsWith("顺便一提："));
  assert.ok(!mail.complaints.some((c) => /不爱我|不陪我/.test(c)));
  assert.equal(mail.stars, 4);
  assert.ok(mail.greeting.includes(mail.owner));
  // A walk or a snack in the period lifts it to five; there is never a lower score.
  const fed = writeMail(state([...events, entry(p, "吃了零食", "snack", new Date(2026, 9, 8))]), "week", NOW, "zh")!;
  assert.equal(fed.stars, 5);
  const enMail = writeMail(state(events, { ...p, personality: "亲人" }), "week", NOW, "en")!;
  assert.equal(enMail.closing, enMail.closing.toLowerCase());
  assert.ok(!JSON.stringify(enMail).includes("—"));
  const year = writeMail(state(events), "year", NOW, "zh")!;
  assert.equal(year.entries, 4);
  assert.equal(year.first!.description, "给它洗了澡");
  assert.equal(year.longest!.description, "上周之外的事");
  assert.ok(mailSVG(p, mail).includes("<svg"));
});

test("爪信：没有记录写短信，生病不告状不打星，去世不写信也不通知", () => {
  const p = pet();
  const empty = writeMail(state([entry(p, "很久以前", "sleep", new Date(2026, 5, 1))]), "week", NOW, "zh")!;
  assert.equal(empty.empty, true);
  assert.equal(empty.stars, undefined);
  assert.equal(empty.complaints.length, 0);
  assert.ok(empty.quietLine && !/怪|为什么不/.test(empty.quietLine));
  const sick = writeMail(state([entry(p, "它生病了，去了医院", "other", new Date(2026, 9, 6)), entry(p, "洗澡", "bath", new Date(2026, 9, 7))]), "week", NOW, "zh")!;
  assert.equal(sick.quiet, true);
  assert.equal(sick.complaints.length, 0);
  assert.equal(sick.stars, undefined);
  assert.equal(sick.praise, undefined);
  const lost = state([entry(p, "它去世了", "other", new Date(2026, 9, 6))]);
  assert.equal(writeMail(lost, "week", NOW), undefined);
  assert.equal(plannedMail(lost, "zh", NOW), undefined);
  assert.equal(hasNewMail(lost, NOW), false);
});

test("爪信：新信卡读过就消失，周一 9 点提醒可关闭，旧备份照常读取", () => {
  const p = pet();
  const s = state([entry(p, "睡觉", "sleep", new Date(2026, 9, 6))]);
  assert.equal(hasNewMail(s, NOW), true);
  assert.equal(hasNewMail({ ...s, mailRead: weekMailKey(NOW) }, NOW), false);
  assert.equal(hasNewMail(state([]), NOW), false);
  const note = plannedMail(s, "en", NOW)!;
  assert.deepEqual([note.weekday, note.hour, note.minute, note.url], [2, 9, 0, "/mail"]);
  assert.ok(note.title.includes(p.name));
  assert.equal(plannedMail({ ...s, mailReminder: false }, "zh", NOW), undefined);
  assert.equal(isAppState({ ...s, mailRead: "2026-10-05", mailReminder: false }), true);
  assert.equal(isAppState({ ...s, mailRead: "last week" }), false);
  assert.equal(isAppState({ ...s, mailReminder: "yes" }), false);
});

test("爪格与爪信的界面文字都有英文", () => {
  for (const key of ["爪格测试", "爪信", "周信", "月信", "年鉴", "告状", "表扬", "使用说明", "最佳拍档", "给{owner}打分"])
    assert.ok(Object.hasOwn(en, key), key);
});

test("爪信：上周没有记录时显示本周进行中的信，爪窝不提示新信", () => {
  const p = pet();
  // Registered this week: one entry on Tuesday 13 October, nothing last week.
  const s = state([entry(p, "睡觉", "sleep", new Date(2026, 9, 13, 9))]);
  const week = writeMail(s, "week", NOW, "zh")!;
  assert.equal(week.inProgress, true);
  assert.equal(week.entries, 1);
  assert.equal(week.start.getDate(), 12);
  assert.equal(week.stars, undefined);
  assert.equal(writeMail(s, "month", NOW, "zh")!.inProgress, true);
  // The year waits for five entries, and starts from the first one (docs/01 8.25).
  const year = writeMail(s, "year", NOW, "zh")!;
  assert.equal(year.inProgress, true);
  assert.equal(year.start.getMonth(), 9);
  assert.equal(year.start.getDate(), 13);
  assert.equal(hasNewMail(s, NOW), false);
});

test("月信按到家日每月送达，月底没有这一天就在最后一天；新信月信先开，历史只列有记录的期", () => {
  assert.equal(mailDay({ homeDate: "2025-09-11" }), 11);
  assert.equal(mailDay({ joinedAt: new Date(2026, 2, 7, 12).toISOString() }), 7);
  assert.equal(mailDay({}), 1);
  const m = mailPeriod("month", NOW, 11);
  assert.deepEqual([m.start, m.end], [new Date(2026, 8, 11), new Date(2026, 9, 11)]);
  // The 10th still waits for the 11th.
  assert.deepEqual(mailPeriod("month", new Date(2026, 9, 10, 23), 11).end, new Date(2026, 8, 11));
  // Arrived on the 31st: February's letter comes on the 28th.
  assert.deepEqual(mailPeriod("month", new Date(2027, 1, 28, 9), 31), { start: new Date(2027, 0, 31), end: new Date(2027, 1, 28) });
  assert.equal(monthMailKey(NOW, 11), "2026-10-11");

  const p = { ...pet(), homeDate: "2025-09-11" };
  const s = state([
    entry(p, "睡了一下午", "sleep", new Date(2026, 8, 20)),
    entry(p, "洗澡", "bath", new Date(2026, 9, 6)),
    entry(p, "很早以前散步", "walk", new Date(2026, 6, 15)),
  ], p);
  assert.deepEqual(newMail(s, NOW), ["month", "week"]);
  assert.deepEqual(newMail({ ...s, mailReadMonth: "2026-10-11" }, NOW), ["week"]);
  assert.deepEqual(newMail({ ...s, demo: false, events: [] }, NOW), []);
  const months = pastMail(s, "month", NOW, "zh");
  // Sep 11–Oct 10 is the current letter; Jul 11–Aug 10 had the walk; Aug 11–Sep 10 had nothing.
  assert.deepEqual(months.map((x) => x.mail.start), [new Date(2026, 6, 11)]);
  assert.equal(writeMail(s, "month", months[0].at, "zh")!.entries, 1);
  assert.deepEqual(pastMail(s, "week", NOW, "zh").map((x) => x.mail.start), [new Date(2026, 8, 14), new Date(2026, 6, 13)]);
  assert.equal(isAppState({ ...s, mailReadMonth: "2026-10-11" }), true);
  assert.equal(isAppState({ ...s, mailReadMonth: "soon" }), false);
});
