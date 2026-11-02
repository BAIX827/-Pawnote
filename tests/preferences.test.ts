import test from "node:test";
import assert from "node:assert/strict";
import { demoState } from "../src/data/demo";
import { parseBackup } from "../src/domain/backup";
import { isAppState } from "../src/data/validation";
import { ageFromBirthday } from "../src/domain/pet-profile";
import { birthdayDate, nextOccasions, occasionForYear, occasionLetter, occasionSVG } from "../src/domain/occasions";
import { generateStories, generationSignature, retellDraft } from "../src/domain/story-engine";
import { newDraft, STYLES } from "../src/domain/types";
import { applyLang } from "../src/i18n/core";
import { onlyDiary, titleFor } from "../src/domain/life";

applyLang("zh");

test("未知生日采用到家日庆生，祝福与导出卡不把到家年数当成年龄", () => {
  const state = demoState();
  state.pet = { ...state.pet!, species: "dog", birthDate: undefined, homeDate: "2022-02-28", ageMonths: undefined };
  state.preferences = { homeAsBirthday: true };
  const birthday = occasionForYear(state.pet, "birthday", 2026, state.preferences)!;
  assert.equal(birthday.day, "2026-02-28");
  assert.equal(birthday.birthdaySource, "home");
  const letter = occasionLetter(state, birthday, "zh", new Date(2026, 1, 28));
  assert.match(letter.subtitle, /用到家日庆生.*相伴 4 年/);
  assert.doesNotMatch(letter.subtitle, /4 岁/);
  assert.match(occasionSVG(letter), /用到家日庆生/);
  assert.match(occasionLetter(state, birthday, "en").subtitle, /4 years together/);
  assert.equal(state.pet.birthDate, undefined);
  assert.equal(state.pet.ageMonths, undefined);
});

test("生日优先于到家日；偏好关闭后保留到家纪念，两个日期均空仍可备份", () => {
  const pet = { ...demoState().pet!, birthDate: "2020-03-01", homeDate: "2022-02-28" };
  assert.equal(birthdayDate(pet, { homeAsBirthday: false }), "2020-03-01");
  assert.equal(occasionForYear(pet, "birthday", 2026)?.birthdaySource, "birth");
  const adopted = { ...pet, birthDate: undefined };
  assert.equal(birthdayDate(adopted, { homeAsBirthday: false }), undefined);
  assert.deepEqual(nextOccasions(adopted, new Date(2026, 1, 28), { homeAsBirthday: false }).map((o) => o.kind), ["home"]);
  const state = demoState();
  state.pet = { ...adopted, homeDate: undefined, ageMonths: undefined, route: "work", routeSource: "age" };
  assert.deepEqual(nextOccasions(state.pet), []);
  const restored = parseBackup(JSON.stringify(state));
  assert.equal(restored.pet?.routeSource, "age");
  assert.equal(restored.pet?.ageMonths, undefined);
  assert.equal(restored.pet?.birthDate, undefined);
  assert.equal(restored.pet?.homeDate, undefined);
  state.pet.route = "campus";
  state.pet.routeSource = "manual";
  assert.equal(isAppState(state), true);
});

test("到家庆生日遵循闰年规则；填写真实生日后立即换用生日", () => {
  const pet = { ...demoState().pet!, birthDate: undefined, homeDate: "2024-02-29" };
  const on = { homeAsBirthday: true };
  assert.equal(occasionForYear(pet, "birthday", 2025, on)?.day, "2025-02-28");
  assert.equal(occasionForYear(pet, "birthday", 2028, on)?.day, "2028-02-29");
  assert.equal(occasionForYear({ ...pet, birthDate: "2021-06-15" }, "birthday", 2025)?.day, "2025-06-15");
});

test("真实生日可计算月龄，未知日期保留未知，月末与12个月边界准确", () => {
  assert.equal(ageFromBirthday(undefined), undefined);
  assert.equal(ageFromBirthday("2025-02-30"), undefined);
  assert.equal(ageFromBirthday("2027-01-01", new Date(2026, 9, 13)), undefined);
  assert.equal(ageFromBirthday("2025-10-14", new Date(2026, 9, 13)), 11);
  assert.equal(ageFromBirthday("2025-10-13", new Date(2026, 9, 13)), 12);
  assert.equal(ageFromBirthday("2024-02-29", new Date(2025, 1, 28)), 12);
  assert.equal(ageFromBirthday("2025-01-31", new Date(2025, 1, 28)), 1);
});

test("记录只出一段：新草稿和旧日记都用内心独白，旧数据照常读取（docs/01 8.42）", () => {
  const pet = demoState().pet!;
  assert.equal(newDraft().selectedStyle, "diary");
  const draft = retellDraft(pet, newDraft(), "今天去散步", "walk");
  assert.equal(draft.selectedStyle, "diary");
  const old = demoState();
  const picked = { ...old, events: old.events.map((e, i) => ({ ...e, selectedStyle: STYLES[i % STYLES.length] })), draft: { ...draft, selectedStyle: "news" as const } };
  const restored = onlyDiary(parseBackup(JSON.stringify(picked)));
  assert.ok(restored.events.every((e) => e.selectedStyle === "diary"));
  assert.equal(restored.draft?.selectedStyle, "diary");
  assert.equal(restored.events.length, old.events.length);
});

test("生日未知时默认不用到家日庆生，打开偏好后才用", () => {
  const pet = { ...demoState().pet!, birthDate: undefined, homeDate: "2026-03-01" };
  assert.equal(birthdayDate(pet), undefined);
  assert.equal(birthdayDate(pet, { homeAsBirthday: true }), "2026-03-01");
});

test("修改原话或分类保留主人润色并要求确认，普通表达按新事实更新", () => {
  const pet = demoState().pet!;
  const draft = { ...newDraft(), description: "今天睡觉", category: "sleep" as const,
    stories: generateStories(pet, "今天睡觉", "sleep") };
  draft.stories.diary = { ...draft.stories.diary, text: "主人手动写的表达", edited: true };
  const changed = retellDraft(pet, draft, "今天去海边", "walk");
  assert.equal(changed.stories?.diary.text, "主人手动写的表达");
  assert.equal(changed.expressionNeedsReview, true);
  assert.equal(changed.signature, generationSignature(pet, "今天去海边", "walk"));
  assert.notEqual(changed.stories?.news.text, draft.stories.news.text);
  assert.equal(retellDraft(pet, draft, draft.description, "other").expressionNeedsReview, true);
  assert.equal(retellDraft(pet, draft, draft.description, draft.category), draft);
  assert.equal(parseBackup(JSON.stringify({ ...demoState(), draft: changed })).draft?.expressionNeedsReview, true);
});

test("偏好随备份恢复，旧备份兼容，异常偏好被拒绝", () => {
  const state = { ...demoState(), preferences: { homeAsBirthday: false, randomStyle: false, homeExtras: true } };
  assert.deepEqual(parseBackup(JSON.stringify(state)).preferences, state.preferences);
  assert.equal(isAppState(demoState()), true);
  for (const key of ["homeAsBirthday", "randomStyle", "homeExtras"]) {
    assert.equal(isAppState({ ...state, preferences: { [key]: "false" } }), false);
  }
});

test("校园 / 职场下线：等级称号不分路线（docs/01 8.42）", () => {
  applyLang("zh");
  assert.deepEqual([1, 2, 3, 4, 5, 9].map((n) => titleFor(n)), ["爪爪镇新居民", "记录小能手", "日常观察员", "资深居民", "爪爪镇传说", "爪爪镇传说"]);
});
