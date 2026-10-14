import test from "node:test";
import assert from "node:assert/strict";
import { RESIDENTS, buildCircle } from "../src/domain/paw-circle";
import { detectCategory, generateStories } from "../src/domain/story-engine";
import { guessTone, bondNetwork } from "../src/domain/bonds";
import { othersCalling, addRoutine } from "../src/domain/paw-dates";
import { addPet } from "../src/domain/household";
import { CATEGORY_LABELS, type AppState, type Category, type LifeEvent, type Pet } from "../src/domain/types";
import { applyLang } from "../src/i18n/core";

// docs/01 8.26: fixes from the third trial run.
applyLang("zh");
const dog: Pet = { id: "p1", name: "可乐", species: "dog", personality: "活泼", route: "campus", role: "睡眠研究班", ownerTitle: "哥哥" };
const rabbit: Pet = { id: "p2", name: "团子", species: "rabbit", personality: "慢热", route: "work", role: "草料品控员", ownerTitle: "哥哥" };
const entry = (pet: Pet, description: string, category: Category, at: Date): LifeEvent => ({
  id: `e-${description}`, description, category, createdAt: at.toISOString(), petSnapshot: pet,
  stories: generateStories(pet, description, category), selectedStyle: "social", published: true,
});
const home = (pet: Pet, events: LifeEvent[] = []): AppState => ({ schemaVersion: 1, pet, events, draft: null, demo: false });
const FILLER = /好多想法|好多话|分几次说|多讲两句|多说两句|容我多说|more than one message|more to say/;

test("“日常”类不再凑字数：接住之后只跟一句短收尾，打工 / 校园日记和内心独白不一样", () => {
  for (const personality of ["傲娇", "亲人", "活泼", "戏精", "好奇", "随和", "慢热"]) {
    const pet = { ...dog, personality };
    for (const fact of ["今天在家待了一天。", "可乐今天把我的拖鞋叼到阳台藏起来了。"]) {
      const s = generateStories(pet, fact, "other");
      for (const style of ["diary", "life", "social", "news"] as const)
        assert.doesNotMatch(s[style].text, FILLER, `${personality} ${style}: ${s[style].text}`);
      assert.notEqual(s.life.text.replace(/^【.*】\n/, ""), s.diary.text, personality);
    }
  }
  applyLang("en");
  const en = generateStories({ ...dog, personality: "Lively" }, "Coco sat by the door all day.", "other");
  for (const style of ["diary", "life", "social", "news"] as const) assert.doesNotMatch(en[style].text, FILLER);
  applyLang("zh");
});

test("叼走、藏起来算拆家；分类“其他”改叫“日常”", () => {
  assert.equal(detectCategory("可乐今天把我的拖鞋叼到阳台藏起来了"), "chaos");
  assert.equal(detectCategory("She ran off with my sock"), "chaos");
  assert.equal(CATEGORY_LABELS.other, "日常");
});

test("趴在一起、互相闻算开心", () => {
  assert.equal(guessTone("可乐一直追着团子跑，团子吓得躲进纸箱，后来互相闻了闻，最后趴在一起了。"), "good");
});

test("另一只宠物到点的爪约能被看到", () => {
  const morning = new Date(2026, 9, 15, 8, 10);
  let s = addRoutine(home(dog), { activity: "walk", time: "07:30" }, new Date(2026, 9, 14, 9));
  s = addPet(s, rabbit);
  assert.deepEqual(othersCalling(s, morning).map((c) => [c.pet.name, c.routine.time]), [["可乐", "07:30"]]);
  assert.deepEqual(othersCalling(s, new Date(2026, 9, 15, 7, 0)), []);
});

test("新搬来的宠物不给搬来之前的居民动态点爪；第一位评论的居民会提到原话里的物件", () => {
  const joined = new Date(2026, 9, 14, 19, 30);
  const pet = { ...dog, joinedAt: joined.toISOString() };
  const post = entry(pet, "可乐今天把我的拖鞋叼到阳台藏起来了。", "chaos", new Date(2026, 9, 14, 19, 38));
  const circle = buildCircle(home(pet, [post]), new Date(2026, 9, 15, 22), "zh");
  const liked = circle.posts.filter((p) => p.kind === "resident" && p.likes.some((l) => l.who.kind === "pet"));
  assert.ok(liked.length > 0);
  assert.ok(liked.every((p) => p.at >= new Date(2026, 9, 14)), "nothing from before the day it moved in");
  const own = circle.posts.find((p) => p.kind === "pet")!;
  assert.match(own.comments.find((c) => c.author.kind === "resident")!.text, /拖鞋/);
  // Pets set up before 8.26 have no move-in time and keep their full rounds.
  const old = buildCircle(home(dog, [post]), new Date(2026, 9, 15, 22), "zh");
  assert.ok(old.posts.filter((p) => p.kind === "resident" && p.likes.some((l) => l.who.kind === "pet")).length >= liked.length);
});

test("和居民在爪友圈有来往就不算不熟", () => {
  const post = entry(dog, "今天在家待了一天。", "other", new Date(2026, 9, 14, 19, 38));
  const net = bondNetwork(home(dog, [post]), new Date(2026, 9, 14, 23));
  for (const link of net.links.filter((l) => l.circle > 0 && !l.chosen && RESIDENTS.some((r) => `npc:${r.id}` === l.a || `npc:${r.id}` === l.b)))
    assert.notEqual(link.start, "stranger");
});
