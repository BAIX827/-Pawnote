import test from "node:test";
import assert from "node:assert/strict";
import { demoState } from "../src/data/demo";
import { isAppState } from "../src/data/validation";
import { ANCHOR, bondNetwork, guessTone, levelOf, pairKey, setBond } from "../src/domain/bonds";
import { addPet, homePets, mapSounds, removePet, soundLists, switchPet } from "../src/domain/household";
import { deleteEvent } from "../src/domain/life";
import { generateStories } from "../src/domain/story-engine";
import type { AppState, LifeEvent, Pet, Tone } from "../src/domain/types";
import { applyLang } from "../src/i18n/core";

applyLang("zh");
const cat: Pet = { id: "cat", name: "咪咪", species: "cat", personality: "傲娇", route: "work", role: "零食鉴定员" };
const dog: Pet = { id: "dog", name: "旺财", species: "dog", personality: "憨厚", route: "work", role: "零食鉴定员" };
const now = new Date(2026, 9, 13, 12);
const entry = (pet: Pet, id: string, description: string, tone?: Tone, withPets = [dog.id]): LifeEvent => ({
  id, description, category: "other", createdAt: new Date(2026, 9, 10, 9, Number(id.slice(-1)) || 0).toISOString(),
  petSnapshot: pet, stories: generateStories(pet, description, "other"), selectedStyle: "diary", published: false,
  ...(tone ? { together: { pets: withPets, tone } } : {}),
});
const home = (events: LifeEvent[] = []): AppState =>
  ({ schemaVersion: 1, pet: cat, events, draft: null, demo: false, household: [{ pet: dog, events: [] }] });
const catDog = (s: AppState) => bondNetwork(s, now, true).links.find((l) => pairKey(l.a, l.b) === pairKey("cat", "dog"))!;

test("关系值按五档落位", () => {
  assert.equal(levelOf(-60), "foe");
  assert.equal(levelOf(-41), "foe");
  assert.equal(levelOf(-40), "stranger");
  assert.equal(levelOf(0), "normal");
  assert.equal(levelOf(30), "friend");
  assert.equal(levelOf(70), "bestie");
  for (const [level, score] of Object.entries(ANCHOR)) assert.equal(levelOf(score), level);
});

test("按原话猜相处的好坏，和好算开心", () => {
  assert.equal(guessTone("它俩今天一起玩逗猫棒"), "good");
  assert.equal(guessTone("猫狗又打架了"), "bad");
  assert.equal(guessTone("打了一架之后又和好了"), "good");
  assert.equal(guessTone("一起在客厅待着"), "neutral");
  assert.equal(guessTone("They played tag in the garden"), "good");
  assert.equal(guessTone("The cat hissed at the dog"), "bad");
  assert.equal(guessTone("I gave her a bit of chicken"), "neutral");
});

test("猫狗初始敌对，一起玩一次会缓和，三次变不熟；删掉记录就变回去", () => {
  let s = setBond(home(), "dog", "cat", "foe");
  assert.deepEqual(s.bonds, [{ a: "cat", b: "dog", level: "foe" }]);
  assert.equal(catDog(s).score, -60);
  s = { ...s, events: [entry(cat, "e1", "一起玩", "good")] };
  assert.equal(catDog(s).score, -50);
  assert.equal(catDog(s).level, "foe");
  assert.equal(catDog(s).history.length, 1);
  s = { ...s, events: [...s.events, entry(cat, "e2", "一起玩", "good"), entry(cat, "e3", "一起玩", "good")] };
  assert.equal(catDog(s).score, -30);
  assert.equal(catDog(s).level, "stranger");
  assert.equal(catDog(deleteEvent(s, "e3")).score, -40);
  // The dog's own records count just the same, and a squabble pulls them apart.
  s = { ...s, household: [{ pet: dog, events: [entry(dog, "d1", "抢饭", "bad", [cat.id])] }] };
  assert.equal(catDog(s).score, -42);
  assert.equal(catDog(setBond(s, "cat", "dog", null)).score, ANCHOR.normal + 30 - 12);
});

test("关系值封顶在 −100 到 100", () => {
  const many = Array.from({ length: 20 }, (_, i) => entry(cat, `e${i}`, "打架", "bad"));
  assert.equal(catDog({ ...home(many) }).score, -100);
});

test("全部展示含居民和居民之间的关系，只看自家宠物时只剩自家", () => {
  const all = bondNetwork(home(), now);
  assert.equal(all.nodes.length, 9);
  assert.ok(all.links.some((l) => l.a.startsWith("npc:") && l.b.startsWith("npc:") && !l.editable));
  assert.ok(all.links.filter((l) => l.a === "cat" || l.b === "cat").every((l) => l.editable));
  const mine = bondNetwork(home(), now, true);
  assert.deepEqual(mine.nodes.map((n) => n.id), ["cat", "dog"]);
  assert.equal(mine.links.length, 1);
  // Residents sent back to town leave the map too.
  const hidden = bondNetwork({ ...home(), circle: { hiddenNpcs: ["coal"] } }, now);
  assert.ok(!hidden.nodes.some((n) => n.id === "npc:coal"));
  // Residents can't be given a relationship with each other.
  assert.equal(setBond(home(), "npc:coal", "npc:bao", "foe").bonds, undefined);
});

test("爪友圈里的点爪和评论让宠物和居民更熟，最多 +30", () => {
  const posts = Array.from({ length: 6 }, (_, i) => ({ ...entry(cat, `p${i}`, "在窗边睡了一下午"), category: "sleep" as const, published: true,
    createdAt: new Date(2026, 9, 12 - i, 9).toISOString() }));
  const s = home(posts);
  const near = bondNetwork(s, now).links.filter((l) => (l.a === "cat" || l.b === "cat") && l.circle > 0);
  assert.ok(near.length > 0);
  assert.ok(near.every((l) => l.circle <= 30));
});

test("切换、添加、删除宠物时各自的记录跟着自己走", () => {
  const s = home([entry(cat, "e1", "一起玩", "good")]);
  const asDog = switchPet(s, "dog");
  assert.equal(asDog.pet!.id, "dog");
  assert.equal(asDog.events.length, 0);
  assert.equal(asDog.household![0].events[0].id, "e1");
  assert.deepEqual(switchPet(asDog, "cat").events, s.events);
  assert.equal(catDog(asDog).score, catDog(s).score);
  const rabbit: Pet = { ...dog, id: "rabbit", name: "团子", species: "rabbit" };
  const three = addPet(s, rabbit);
  assert.equal(three.pet!.id, "rabbit");
  assert.deepEqual(homePets(three).map((p) => p.id), ["rabbit", "dog", "cat"]);
  assert.ok(isAppState(three));
  const fewer = removePet(setBond(three, "cat", "dog", "foe"), "dog");
  assert.deepEqual(homePets(fewer).map((p) => p.id), ["rabbit", "cat"]);
  assert.deepEqual(fewer.bonds, []);
  assert.equal(removePet(three, "rabbit"), three, "the current pet isn't deleted");
});

test("备份校验：多宠物、关系和一起做的事都能读，坏数据拒绝", () => {
  const s = setBond(home([entry(cat, "e1", "一起玩", "good")]), "cat", "dog", "foe");
  assert.ok(isAppState(s));
  assert.ok(isAppState(JSON.parse(JSON.stringify(s))));
  assert.ok(!isAppState({ ...s, household: [{ pet: cat, events: [] }] }), "duplicate pet");
  assert.ok(!isAppState({ ...s, household: [{ pet: dog, events: [entry(cat, "x", "a")] }] }), "record of another pet");
  assert.ok(!isAppState({ ...s, bonds: [{ a: "dog", b: "cat", level: "foe" }] }), "pair out of order");
  assert.ok(!isAppState({ ...s, bonds: [{ a: "cat", b: "dog", level: "frenemy" }] }));
  assert.ok(!isAppState({ ...s, events: [entry(cat, "e1", "一起玩", "good", [cat.id])] }), "with itself");
  assert.ok(!isAppState({ ...s, events: [{ ...entry(cat, "e1", "x"), together: { pets: ["dog"], tone: "meh" } }] }));
  assert.ok(isAppState({ ...s, preferences: { bondsHomeOnly: true } }));
});

test("示例数据：橘总和旺财初始敌对，一起玩过一次正在缓和", () => {
  const demo = demoState();
  assert.ok(isAppState(demo));
  const link = bondNetwork(demo, new Date(), true).links[0];
  assert.equal(link.start, "foe");
  assert.equal(link.score, -50);
});

test("存储能找到每只宠物的声音", () => {
  const sound = { id: "s1", petId: "dog", title: "汪", note: "", recordedOn: "2026-10-01", createdAt: now.toISOString(),
    stage: "adult" as const, source: "recording" as const, duration: 1, audio: "a" };
  const s: AppState = { ...home(), sounds: [], household: [{ pet: dog, events: [], sounds: [sound] }] };
  assert.equal(soundLists(s).flat().length, 1);
  const mapped = mapSounds(s, (x) => ({ ...x, audio: "ref" }));
  assert.equal(mapped.household![0].sounds![0].audio, "ref");
});
