import test from "node:test";
import assert from "node:assert/strict";
import { demoState } from "../src/data/demo";
import { isAppState } from "../src/data/validation";
import { MAX_ROUTINES, addRoutines } from "../src/domain/paw-dates";
import { personalityParts, togglePersonality } from "../src/domain/pet-profile";
import { temperOf } from "../src/domain/temper";
import { PERSONALITIES } from "../src/domain/types";

// docs/01 8.34
test("personality tags toggle in the order picked, keep the owner's words and stop at four", () => {
  let p = togglePersonality("傲娇", "戏精", PERSONALITIES)!;
  assert.equal(p, "傲娇 · 戏精");
  p = togglePersonality(p, "傲娇", PERSONALITIES)!;
  assert.equal(p, "戏精");
  assert.equal(togglePersonality("慢热但很亲人，喜欢观察", "好奇", PERSONALITIES), "慢热但很亲人，喜欢观察 · 好奇");
  const four = ["傲娇", "戏精", "好奇", "活泼"].join(" · ");
  assert.equal(togglePersonality(four, "温柔", PERSONALITIES), undefined);
  assert.equal(togglePersonality(four, "好奇", PERSONALITIES), "傲娇 · 戏精 · 活泼");
  assert.deepEqual(personalityParts("好奇 · 慢热"), ["好奇", "慢热"]);
});

test("the first tag of several still sets the voice", () => {
  const pet = demoState().pet!;
  assert.equal(temperOf({ ...pet, personality: "戏精 · 稳重" }), temperOf({ ...pet, personality: "戏精" }));
});

test("several times add one 爪约 each, all or none", () => {
  const s = { ...demoState(), routines: [] };
  const next = addRoutines(s, ["08:00", "21:00"].map((time) => ({ activity: "custom", label: "摸肚子", time, days: [1, 3] })));
  assert.equal(next.routines!.length, 2);
  assert.deepEqual(next.routines!.map((r) => r.time), ["08:00", "21:00"]);
  assert.ok(next.routines!.every((r) => r.label === "摸肚子" && r.days.join() === "1,3"));
  assert.ok(isAppState(next));
  const full = addRoutines(s, Array.from({ length: MAX_ROUTINES - 1 }, (_, i) => ({ activity: "custom", label: "x", time: `0${i % 10}:00` })));
  assert.throws(() => addRoutines(full, ["08:00", "09:00"].map((time) => ({ activity: "custom", label: "y", time }))));
  assert.throws(() => addRoutines(s, []));
  assert.throws(() => addRoutines(s, [{ activity: "custom", label: "", time: "08:00" }]));
});
