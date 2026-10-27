import test from "node:test";
import assert from "node:assert/strict";
import { demoState } from "../src/data/demo";
import { applyLang } from "../src/i18n/core";
import { generateStories, selfName, toPetVoice } from "../src/domain/story-engine";
import { flavorsOf, reaction, temperOf } from "../src/domain/temper";
import { en, zh } from "../src/domain/voice-bank";
import { greeting } from "../src/domain/greetings";
import { CATEGORIES, Pet } from "../src/domain/types";

const base = (): Pet => ({ ...demoState().pet!, ownerTitle: "妈妈" });

test("宠物自称：猫叫咪，狗叫汪，其他宠物用名字，英文用 I（docs/13 v3 §3）", () => {
  applyLang("zh");
  const cat = { ...base(), species: "cat" as const }, dog = { ...base(), species: "dog" as const, name: "旺财" };
  const bun = { ...base(), species: "rabbit" as const, name: "团子" };
  assert.equal(selfName(cat), "咪");
  assert.equal(selfName(dog), "汪");
  assert.equal(selfName(bun), "团子");
  assert.equal(toPetVoice(bun, "今天给它洗澡了").text, "今天妈妈给团子洗澡了。");
  const stories = generateStories(cat, "它睡了一下午。", "sleep");
  assert.doesNotMatch(Object.values(stories).map((s) => s.text).join(), /本喵|本汪|\{self\}|\{owner\}/);
  assert.match(greeting({ ...cat, personality: "傲娇" }, 20, "zh"), /咪可没有在等你/);
  applyLang("en");
  try {
    assert.equal(selfName(dog), "I");
  } finally {
    applyLang("zh");
  }
});

test("多选性格：第一个定主脾气，其余做副色，副色带出一处沙雕点（docs/13 v3 §2）", () => {
  const pet = { ...base(), personality: "傲娇 · 黏人 · 好奇 · 傲娇" };
  assert.equal(temperOf(pet), "cool");
  assert.deepEqual(flavorsOf(pet), ["clingy", "curious"]);
  assert.deepEqual(flavorsOf({ ...pet, personality: "傲娇" }), []);
  assert.deepEqual(flavorsOf({ ...pet, personality: "戏精 · 话痨" }), [], "同一种脾气不算副色");
  for (const variant of [0, 1, 2, 3]) {
    const r = reaction(pet, "bath", "妈妈", "zh", variant);
    assert.ok(r.flavored);
    const lender = variant % 2 === 0 ? zh.clingy : zh.curious;
    assert.ok(lender.silly.some((s) => r.closer === s.split("{self}").join("咪").split("{owner}").join("妈妈")), r.closer);
  }
  // The diary always carries the flavour's beat after the main line.
  const diary = generateStories(pet, "今天给它洗了澡。", "bath", 0).diary.text;
  assert.equal(diary.split("\n").length, 4);
});

test("句库：愿望句每句最多一个，没有占位符漏填，敏感时不开玩笑", () => {
  // "想" as in thinking (想了很久, 想法) is not a wish.
  for (const [bank, wish] of [[zh, /希望|下次|想(?:要|让|和|跟|被|吃|看|去|玩|黏|你)/g], [en, /I'd like|i'd like|I hope|next time/g]] as const)
    for (const [temper, set] of Object.entries(bank)) {
      const all = [...CATEGORIES.flatMap((c) => [...set.line[c], ...set.social[c]]), ...set.closers, ...set.silly];
      for (const line of all) assert.ok((line.match(wish) ?? []).length <= 1, `${temper}: ${line}`);
      assert.equal(set.closers.length, 3);
      assert.equal(set.silly.length, 3);
    }
  const sick = generateStories({ ...base(), personality: "戏精" }, "它生病住院了。", "other");
  assert.doesNotMatch(Object.values(sick).map((s) => s.text).join(), /浩劫|遗书|本大王|（/);
});

test("AI 网关：副色最多两个且必须是已知脾气，自称最长 20 字", async () => {
  const { createGateway } = await import("../server/core.mjs");
  const store = { get: async () => 0, add: async () => {}, ipGet: async () => 0, ipAdd: async () => {} };
  const gateway = createGateway({ AI_MOCK: "1", FREE_AI_PER_WEEK: "100" }, store);
  const ask = (extra: object, self = "咪") => gateway.handle("POST", new URL("http://x/v1/pet-voice"), async () => JSON.stringify({
    deviceId: "d", region: "cn", lang: "zh", temper: "cool", description: "今天睡了一下午。",
    pet: { name: "橘总", species: "cat", personality: "傲娇 · 黏人", route: "work", role: "巡逻保安", owner: "妈妈", self }, ...extra,
  }), { ip: "1.1.1.1" });
  assert.equal((await ask({ flavors: ["clingy"] })).status, 200);
  assert.equal((await ask({})).status, 200);
  assert.equal((await ask({ flavors: ["clingy", "shy", "calm"] })).status, 400);
  assert.equal((await ask({ flavors: ["sleepy"] })).status, 400);
  assert.equal((await ask({}, "团子团子团子团子团子团子")).status, 200);
});
