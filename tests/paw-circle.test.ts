import test from "node:test";
import assert from "node:assert/strict";
import { demoState } from "../src/data/demo";
import { isAppState } from "../src/data/validation";
import {
  MAX_COMMENTS_PER_DAY,
  MAX_LIKES_PER_DAY,
  RESIDENTS,
  buildCircle,
  postBlock,
  residentPostsOn,
} from "../src/domain/paw-circle";
import { temperOf } from "../src/domain/temper";
import { CATEGORIES, type AppState, type Category, type LifeEvent, type Pet } from "../src/domain/types";
import { generateStories } from "../src/domain/story-engine";
import { applyLang } from "../src/i18n/core";

applyLang("zh");
const at = (h: number, m = 0, day = 14) => new Date(2026, 9, day, h, m);
const pet: Pet = { id: "p1", name: "糯米", species: "dog", personality: "憨厚", route: "work", role: "零食鉴定员" };
const entry = (description: string, category: Category, createdAt: Date, published = true): LifeEvent => ({
  id: `e-${description}`, description, category, createdAt: createdAt.toISOString(), petSnapshot: pet,
  stories: generateStories(pet, description, category), selectedStyle: "diary", published,
});
const base = (events: LifeEvent[] = []): AppState => ({ schemaVersion: 1, pet, events, draft: null, demo: false });

test("七位居民各占一种脾气，中英文案齐全，每类事件都有评论", () => {
  assert.equal(RESIDENTS.length, 7);
  assert.equal(new Set(RESIDENTS.map((r) => r.temper)).size, 7);
  for (const r of RESIDENTS) {
    assert.equal(r.temper, temperOf({ ...pet, species: r.species, personality: { cool: "傲娇", clingy: "黏人", goofy: "憨厚", drama: "戏精", curious: "好奇", calm: "淡定", shy: "害羞" }[r.temper] }));
    assert.ok(r.posts.length >= 8, r.id);
    for (const p of r.posts) assert.ok(p.text.zh && p.text.en && !/爪爪镇/.test(p.text.en), r.id);
    for (const c of CATEGORIES) assert.ok(r.comments[c].zh && r.comments[c].en, `${r.id} ${c}`);
    assert.ok(!/—/.test(JSON.stringify(r.name) + r.bio.en), "no em dash");
  }
});

test("居民每周发 3–5 条，同一天结果固定", () => {
  for (const r of RESIDENTS) {
    let n = 0;
    for (let d = 0; d < 28; d++) n += residentPostsOn(new Date(2026, 9, 1 + d), "zh").filter((p) => p.author.id === r.id).length;
    assert.ok(n >= 8 && n <= 24, `${r.id}: ${n} in four weeks`);
  }
  assert.deepEqual(residentPostsOn(at(0), "zh").map((p) => p.id), residentPostsOn(at(0), "zh").map((p) => p.id));
  assert.equal(residentPostsOn(at(0), "zh", RESIDENTS.map((r) => r.id)).length, 0);
});

test("宠物动态留在窝里，居民陆续来点爪评论，宠物回一句", () => {
  const e = entry("今天带它出门散步，在草地上跑了很久。", "walk", at(9));
  const early = buildCircle(base([e]), at(9, 1), "zh").posts.find((p) => p.kind === "pet")!;
  assert.equal(early.likes.length + early.comments.length, 0);
  const later = buildCircle(base([e]), at(12), "zh").posts.find((p) => p.kind === "pet")!;
  assert.ok(later.likes.length >= 1 && later.likes.length <= 4);
  assert.ok(later.comments.some((c) => c.author.kind === "resident"));
  assert.ok(later.comments.some((c) => c.author.kind === "pet" && c.replyTo));
  assert.equal(later.text, e.stories.social.text);
  // 豆包 cares about walks and is a dog, so he always comes by.
  assert.ok(later.likes.some((l) => l.who.id === "bao"));
  assert.equal(buildCircle(base([{ ...e, published: false }]), at(12), "zh").posts.filter((p) => p.kind === "pet").length, 0);
});

test("敏感记录只有阿福和年糕安静地说一句", () => {
  const e = entry("它今天生病了，去医院打了针。", "other", at(9));
  const post = buildCircle(base([e]), at(15), "zh").posts.find((p) => p.kind === "pet")!;
  assert.equal(post.likes.length, 0);
  assert.deepEqual(post.comments.map((c) => c.author.id).sort(), ["biscuit", "mochi"]);
  assert.equal(postBlock(base(), "它今天生病了"), "sensitive");
});

test("一天最多发两条动态", () => {
  const two = base([entry("睡觉", "sleep", at(8)), entry("吃饭", "snack", at(9))]);
  assert.equal(postBlock(two, "出门玩了", at(10)), "limit");
  assert.equal(postBlock(two, "出门玩了", at(10, 0, 15)), null);
  assert.equal(postBlock(base([entry("睡觉", "sleep", at(8), false)]), "出门玩了", at(10)), null);
});

test("宠物自己逛：每天最多点 10 个爪、评论 3 条，10 点前不出门", () => {
  const state = base([entry("今天出门散步了。", "walk", at(8))]);
  const before = buildCircle(state, at(9, 30), "zh");
  assert.equal(before.today.liked.length, 0);
  const night = buildCircle(state, at(23), "zh");
  const mine = (p: { comments: { author: { kind: string }; replyTo?: string }[] }) =>
    p.comments.filter((c) => c.author.kind === "pet" && !c.replyTo).length;
  const today = night.posts.filter((p) => p.kind === "resident" && p.at.getDate() >= 13);
  assert.ok(night.today.liked.length >= 1 && night.today.liked.length <= MAX_LIKES_PER_DAY);
  assert.ok(night.today.commented.length <= MAX_COMMENTS_PER_DAY);
  assert.ok(today.reduce((n, p) => n + mine(p), 0) <= MAX_COMMENTS_PER_DAY * 2);
  // A resident answers the pet's comment.
  const answered = today.find((p) => mine(p) > 0);
  if (answered) assert.ok(answered.comments.some((c) => c.author.kind === "resident" && c.replyTo));
});

test("删掉的评论和送回小镇的居民不再出现；宠物离开后不再出门", () => {
  const state = base([entry("今天出门散步了。", "walk", at(8))]);
  const full = buildCircle(state, at(23), "zh");
  const comment = full.posts.flatMap((p) => p.comments).find((c) => c.removable)!;
  assert.ok(comment);
  const hidden: AppState = { ...state, circle: { removed: [comment.id], hiddenNpcs: ["bao"] } };
  const after = buildCircle(hidden, at(23), "zh");
  assert.ok(!after.posts.flatMap((p) => p.comments).some((c) => c.id === comment.id));
  assert.ok(!after.posts.some((p) => p.author.id === "bao"));
  assert.ok(!after.posts.flatMap((p) => p.likes).some((l) => l.who.id === "bao"));
  assert.ok(isAppState(hidden));
  assert.ok(!isAppState({ ...state, circle: { removed: "x" } }));
  const gone = base([entry("它今天去了彩虹桥。", "other", at(8))]);
  assert.equal(buildCircle(gone, at(23), "zh").today.liked.length, 0);
});

test("英文版整套用英文，示例数据照常读取", () => {
  const e = entry("今天出门散步了。", "walk", at(8));
  const circle = buildCircle(base([e]), at(23), "en");
  for (const p of circle.posts.filter((p) => p.kind === "resident"))
    assert.doesNotMatch((p.text + p.comments.map((c) => c.text).join("")).split(pet.name).join(""),/[一-鿿]/);
  assert.ok(isAppState(demoState()));
  assert.ok(buildCircle(demoState(), new Date(), "zh").posts.length > 0);
});

test("同一条居民动态，宠物只点一次爪", () => {
  const circle = buildCircle(base([entry("今天出门散步了。", "walk", at(8))]), at(23), "zh");
  for (const p of circle.posts) assert.equal(new Set(p.likes.map((l) => l.who.id)).size, p.likes.length, p.id);
});
