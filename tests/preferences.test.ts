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

applyLang("zh");

test("未知生日采用到家日庆生，祝福与导出卡不把到家年数当成年龄", () => {
  const state = demoState();
  state.pet = { ...state.pet!, species: "dog", birthDate: undefined, homeDate: "2022-02-28", ageMonths: undefined };
  const birthday = occasionForYear(state.pet, "birthday", 2026)!;
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
  assert.equal(occasionForYear(pet, "birthday", 2025)?.day, "2025-02-28");
  assert.equal(occasionForYear(pet, "birthday", 2028)?.day, "2028-02-29");
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

test("随机口吻覆盖四种，编辑和恢复草稿保留口吻，关闭随机用内心独白", (t) => {
  const random = t.mock.method(Math, "random");
  const pet = demoState().pet!;
  STYLES.forEach((style, i) => {
    random.mock.mockImplementation(() => (i + 0.1) / STYLES.length);
    const draft = retellDraft(pet, newDraft(), "今天去散步", "walk");
    assert.equal(draft.selectedStyle, style);
    assert.equal(retellDraft(pet, draft, "今天去海边散步", "walk").selectedStyle, style);
    const restored = parseBackup(JSON.stringify({ ...demoState(), draft }));
    assert.equal(restored.draft?.selectedStyle, style);
  });
  assert.equal(newDraft({ randomStyle: false }).selectedStyle, "diary");
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
