import test from "node:test";
import assert from "node:assert/strict";
import { demoState } from "../src/data/demo";
import { isAppState } from "../src/data/validation";
import {
  ACTIVITIES,
  PRESETS,
  addRoutine,
  diaryEntry,
  dueRoutines,
  markDone,
  nextRoutine,
  normalizeTime,
  plannedReminders,
  reminderLine,
  remindersPaused,
  removeRoutine,
  snooze,
  updateRoutine,
} from "../src/domain/paw-dates";
import { SPECIES, type AppState, type LifeEvent, type Pet } from "../src/domain/types";
import { generateStories } from "../src/domain/story-engine";
import { applyLang } from "../src/i18n/core";

applyLang("zh");
// A Wednesday, 18:10 local time.
const at = (h: number, m = 0, day = 14) => new Date(2026, 9, day, h, m);
const base = (): AppState => ({ ...demoState(), routines: [] });
const entry = (pet: Pet, description: string, createdAt: Date): LifeEvent => ({
  id: `e-${description}`, description, category: "other", createdAt: createdAt.toISOString(), petSnapshot: pet,
  stories: generateStories(pet, description, "other"), selectedStyle: "diary", published: false,
});

test("每个物种都有预设，每个预设中英文各有说法，旧备份和示例都能读", () => {
  for (const s of SPECIES) assert.ok(PRESETS[s].length >= 2, s);
  for (const a of Object.values(ACTIVITIES)) {
    assert.ok(a.lines.zh.length && a.lines.en.length);
    assert.ok(!a.lines.en.some((l) => l.includes("—")), "no em dash in English");
  }
  const old = demoState();
  delete old.routines;
  assert.equal(isAppState(old), true);
  assert.equal(isAppState(demoState()), true);
  assert.equal(isAppState({ ...demoState(), routines: [{ id: "x", activity: "walk", time: "25:00", days: [1], enabled: true, createdAt: new Date().toISOString() }] }), false);
  assert.equal(isAppState({ ...demoState(), routines: [{ id: "x", activity: "custom", label: "", time: "08:00", days: [1], enabled: true, createdAt: new Date().toISOString() }] }), false);
});

test("添加、修改、删除约定，并校验输入", () => {
  let s = addRoutine(base(), { activity: "wand", time: "20:30" });
  s = addRoutine(s, { activity: "custom", label: " 被摸肚子 ", time: "08:00", days: [1, 3, 1] });
  assert.equal(isAppState(s), true);
  assert.deepEqual(s.routines![0].days, [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(s.routines![1].label, "被摸肚子");
  assert.deepEqual(s.routines![1].days, [1, 3]);
  assert.throws(() => addRoutine(s, { activity: "custom", label: "  ", time: "08:00" }));
  assert.throws(() => addRoutine(s, { activity: "custom", label: "这件事写得实在是太太太太太太太太太太太长了啊", time: "08:00" }));
  assert.throws(() => addRoutine(s, { activity: "jump", time: "08:00" }));
  assert.throws(() => addRoutine(s, { activity: "walk", time: "8:00" }));
  assert.throws(() => addRoutine(s, { activity: "walk", time: "08:00", days: [] }));
  assert.throws(() => updateRoutine(s, s.routines![0].id, { days: [] }));
  s = updateRoutine(s, s.routines![0].id, { time: "21:15", enabled: false });
  assert.equal(s.routines![0].time, "21:15");
  assert.equal(s.routines![0].enabled, false);
  s = removeRoutine(s, s.routines![0].id);
  assert.equal(s.routines!.length, 1);
  let full = base();
  for (let i = 0; i < 12; i++) full = addRoutine(full, { activity: "snack", time: "10:00" });
  assert.throws(() => addRoutine(full, { activity: "snack", time: "10:00" }));
  assert.equal(normalizeTime("8:30"), "08:30");
  assert.equal(normalizeTime("0830"), "08:30");
  assert.equal(normalizeTime("08：30"), "08:30");
  assert.equal(normalizeTime("24:00"), undefined);
});

test("到点、陪了、晚点和下一个", () => {
  let s = addRoutine(base(), { activity: "walk", time: "07:30" });
  s = addRoutine(s, { activity: "snack", time: "18:00" });
  s = addRoutine(s, { activity: "wand", time: "20:30", days: [3] });
  const [walk, snack] = s.routines!;
  assert.deepEqual(dueRoutines(s.routines, at(7, 0)).map((r) => r.id), []);
  assert.deepEqual(dueRoutines(s.routines, at(18, 10)).map((r) => r.id), [walk.id, snack.id]);
  s = markDone(s, walk.id, at(18, 10));
  s = snooze(s, snack.id, at(18, 10));
  assert.deepEqual(dueRoutines(s.routines, at(18, 30)), []);
  assert.deepEqual(dueRoutines(s.routines, at(18, 41)).map((r) => r.id), [snack.id]);
  // Done yesterday means due again today.
  assert.deepEqual(dueRoutines(s.routines, at(8, 0, 15)).map((r) => r.id), [walk.id]);
  // The wand toy is Wednesdays only: 14 Oct 2026 is a Wednesday.
  assert.equal(at(0, 0).getDay(), 3);
  assert.equal(nextRoutine(s.routines, at(18, 10))!.routine.activity, "wand");
  const next = nextRoutine(s.routines, at(21, 0))!;
  assert.equal(next.routine.activity, "walk");
  assert.equal(next.at.getDate(), 15);
  s = updateRoutine(s, walk.id, { enabled: false });
  assert.ok(!dueRoutines(s.routines, at(8, 0, 15)).some((r) => r.id === walk.id));
});

test("建档当天，早于创建时刻的那次不喊", () => {
  const s = addRoutine(base(), { activity: "snack", time: "15:00" }, at(20, 45));
  assert.deepEqual(dueRoutines(s.routines, at(21, 0)), []);
  assert.equal(dueRoutines(s.routines, at(15, 5, 15)).length, 1);
  const later = addRoutine(base(), { activity: "wand", time: "20:30" }, at(9, 0));
  assert.equal(dueRoutines(later.routines, at(20, 45)).length, 1);
});

test("提醒是宠物口吻，按脾气和语言变化，难过时不开玩笑，去世后暂停", () => {
  const pet: Pet = { ...demoState().pet!, personality: "傲娇", ownerTitle: "妈妈" };
  const walk = { activity: "walk" };
  const cool = reminderLine(pet, walk, 0, { lang: "zh" });
  assert.ok(cool.includes("妈妈"));
  assert.ok(cool.endsWith("我只是顺便提一下。"));
  assert.ok(reminderLine({ ...pet, personality: "胆小" }, walk, 0, { lang: "zh" }).endsWith("……你有空的话。"));
  const clingyEn = reminderLine({ ...pet, personality: "clingy" }, { activity: "wand" }, 0, { lang: "en" });
  assert.equal(clingyEn, clingyEn.toLowerCase());
  assert.ok(reminderLine(pet, { activity: "custom", label: "被摸肚子" }, 0, { lang: "zh" }).includes("被摸肚子"));
  const now = at(12);
  const sick = reminderLine(pet, walk, 0, { lang: "zh", events: [entry(pet, "它生病了，去了医院", at(9))], now });
  assert.ok(sick.includes("歇着") && !sick.includes("顺便"));
  // A sad entry from long ago no longer quiets the reminders.
  assert.ok(reminderLine(pet, walk, 0, { lang: "zh", events: [entry(pet, "它生病了", at(9, 0, 1))], now }).endsWith("我只是顺便提一下。"));
  const s = { ...addRoutine(base(), { activity: "walk", time: "07:30" }), pet };
  assert.equal(remindersPaused(s.events), false);
  const gone = { ...s, events: [entry(pet, "它今天去了彩虹桥", at(9)), ...s.events] };
  assert.equal(remindersPaused(gone.events), true);
  assert.deepEqual(plannedReminders(gone, "zh"), []);
});

test("系统通知计划：每天一条，或按选中的星期各一条", () => {
  let s = addRoutine(base(), { activity: "walk", time: "07:30" });
  s = addRoutine(s, { activity: "snack", time: "18:05", days: [0, 6] });
  s = addRoutine(s, { activity: "wand", time: "20:30" });
  s = updateRoutine(s, s.routines![2].id, { enabled: false });
  const plan = plannedReminders(s, "zh");
  assert.equal(plan.length, 3);
  assert.deepEqual(plan.map((p) => p.weekday), [undefined, 1, 7]);
  assert.deepEqual([plan[1].hour, plan[1].minute], [18, 5]);
  assert.ok(plan.every((p) => p.title === s.pet!.name && p.body.length > 0));
  assert.equal(new Set(plan.map((p) => p.key)).size, plan.length);
  assert.deepEqual(plannedReminders({ ...s, pet: null }, "zh"), []);
});

test("陪完记进爪语：主人视角的一句和事件标签", () => {
  const pet = demoState().pet!;
  assert.deepEqual(diaryEntry(pet, { activity: "walk" }, "zh"), { description: "今天带橘总出门遛弯了。", category: "walk" });
  assert.equal(diaryEntry(pet, { activity: "wand" }, "en").description, "Played with the wand toy with 橘总 today.");
  assert.equal(diaryEntry(pet, { activity: "custom", label: "被摸肚子" }, "zh").description, "今天和橘总一起：被摸肚子。");
});
