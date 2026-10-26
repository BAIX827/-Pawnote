import test from "node:test";
import assert from "node:assert/strict";
import { RESIDENTS, buildCircle, residentName, residentPostsOn } from "../src/domain/paw-circle";
import { actionLine } from "../src/domain/event-context";
import { generateStories, petLine } from "../src/domain/story-engine";
import { mentionedPets } from "../src/domain/household";
import { withStarterRoutines } from "../src/domain/paw-dates";
import { topTempers } from "../src/domain/pawsona";
import { defaultNewsTemplate } from "../src/domain/news-card";
import { roleFor, type AppState, type Category, type LifeEvent, type Pet } from "../src/domain/types";
import { applyLang } from "../src/i18n/core";

// docs/01 8.24: fixes from the trial run.
applyLang("zh");
const cat: Pet = { id: "p1", name: "豆包", species: "cat", personality: "憨厚", route: "work", role: "零食鉴定员" };
const dog: Pet = { ...cat, id: "p2", name: "糯米", species: "dog" };
const entry = (pet: Pet, description: string, category: Category, style: LifeEvent["selectedStyle"] = "diary"): LifeEvent => ({
  id: `e-${description}`, description, category, createdAt: new Date(2026, 9, 13, 9).toISOString(), petSnapshot: pet,
  stories: generateStories(pet, description, category), selectedStyle: style, published: true,
});
const home = (events: LifeEvent[] = []): AppState => ({ schemaVersion: 1, pet: cat, events, draft: null, demo: false });

test("居民名字一律带职业，正文里提到它也一起改", () => {
  const bao = RESIDENTS.find((r) => r.id === "bao")!;
  assert.equal(residentName(bao, "zh"), "实习生豆包");
  assert.equal(residentName(bao, "en"), "Intern Bao");
  const circle = buildCircle(home(), new Date(2026, 9, 14, 22), "zh");
  const town = circle.posts.filter((p) => p.kind === "resident");
  assert.ok(town.every((p) => p.author.name !== "豆包"));
  assert.ok(!town.some((p) => p.author.id !== "bao" && /(^|[^生])豆包/.test(p.text)));
  // Each resident post shows once in the two-week feed.
  const keys = town.map((p) => `${p.author.id}:${p.text}`);
  assert.equal(new Set(keys).size, keys.length);
});

test("居民动态里的煤球店长统一为店长煤球，职业只出现一次", () => {
  const texts: string[] = [];
  for (let day = 1; day <= 90; day++) {
    for (const lang of ["zh", "en"] as const) {
      for (const post of residentPostsOn(new Date(2026, 9, day), lang)) {
        texts.push(post.text);
        for (const resident of RESIDENTS) {
          const name = residentName(resident, lang), title = resident.title[lang];
          const space = lang === "zh" ? "" : " ";
          assert.ok(!post.text.includes(`${name}${space}${title}`), post.text);
          assert.ok(!post.text.includes(`${title}${space}${name}`), post.text);
        }
      }
    }
  }
  assert.ok(texts.some((text) => text.startsWith("店长煤球说我数学不好。")));
});

test("常见动作有专门的接话，首页气泡只放宠物自己的话", () => {
  assert.match(actionLine("今天豆包把我的水杯推下去了", "zh")!, /重力/);
  assert.match(actionLine("She knocked my mug off the desk", "en")!, /gravity/);
  assert.match(actionLine("两只抢同一个纸箱", "zh")!, /纸箱/);
  assert.equal(actionLine("明天要是把杯子推下去", "zh"), undefined);
  const fact = "今天豆包把我的水杯推下去了，还一脸无辜地看着我。";
  for (const style of ["diary", "life", "social", "news"] as const) {
    const line = petLine(entry(cat, fact, "chaos", style))!;
    assert.ok(!line.includes(fact) && !line.startsWith("主人说") && !line.startsWith("【"), `${style}: ${line}`);
    assert.match(line, /重力/);
  }
});

test("原话里提到家里其他宠物就算一起；新宠物自带两条爪约；岗位按物种", () => {
  assert.deepEqual(mentionedPets("糯米和豆包抢纸箱", [dog]), ["p2"]);
  assert.deepEqual(mentionedPets("今天睡了一下午", [dog]), []);
  const s = withStarterRoutines({ ...home(), pet: dog });
  assert.deepEqual(s.routines!.map((r) => [r.activity, r.enabled]), [["walk", true], ["fetch", true]]);
  assert.equal(withStarterRoutines(s).routines!.length, 2);
  assert.equal(roleFor("work", "dog"), "巡逻保安");
  assert.equal(roleFor("work"), "零食鉴定员");
  assert.equal(roleFor("campus", "dog"), "睡眠研究班");
});

test("爪格占比按最强的一项满格；爪报默认版式按事件", () => {
  const bars = topTempers({ cool: 2, clingy: 1, goofy: 1, drama: 0, curious: 1, calm: 1, shy: 2 });
  assert.equal(bars[0].percent, 100);
  assert.equal(bars[2].percent, 50);
  assert.equal(defaultNewsTemplate({ category: "chaos" }), "wanted");
  assert.equal(defaultNewsTemplate({ category: "sleep" }), "extra");
});
