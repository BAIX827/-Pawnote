import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { IMAGE_PREFIX, hasImages, imageName, imageRefs, mapImages } from "../src/domain/media";
import { backupDue, markBackedUp, snoozeBackup } from "../src/domain/backup";
import { deleteEvent, restoreEvent } from "../src/domain/life";
import { generateStories, voiceVariant } from "../src/domain/story-engine";
import { en as voiceEn, zh as voiceZh } from "../src/domain/voice-bank";
import { CATEGORIES, type AppState, type Category, type LifeEvent, type Pet } from "../src/domain/types";
import { applyLang } from "../src/i18n/core";
import { createGateway, headers, originAllowed } from "../server/core.mjs";

// docs/01 8.27: photos stored outside, backup reminder, undo delete, more voice lines, gateway limits, font.
applyLang("zh");
const jpeg = (n: number) => `data:image/jpeg;base64,${"A".repeat(40)}${n}`;
const pet: Pet = { id: "p1", name: "可乐", species: "dog", personality: "活泼", route: "work", role: "巡逻保安", avatar: jpeg(0) };
const entry = (description: string, category: Category, day: number, photo?: string): LifeEvent => ({
  id: `e-${day}`, description, category, photo, createdAt: new Date(2026, 9, day, 12).toISOString(), petSnapshot: pet,
  stories: generateStories(pet, description, category), selectedStyle: "diary", published: false,
});
const home = (events: LifeEvent[] = []): AppState => ({ schemaVersion: 1, pet, events, draft: null, demo: false });

test("照片：头像、记录照片、快照头像、草稿和其他宠物的都能找到，同一张图只存一份", () => {
  const other: Pet = { ...pet, id: "p2", name: "团子", avatar: jpeg(2) };
  const state: AppState = {
    ...home([entry("今天睡了一下午", "sleep", 1, jpeg(1))]),
    draft: { id: "d", description: "", category: "other", selectedStyle: "diary", published: false, photo: jpeg(3) },
    household: [{ pet: other, events: [{ ...entry("吃了草", "snack", 2), petSnapshot: other }] }],
  };
  const stored = mapImages(state, (uri) => `${IMAGE_PREFIX}${imageName(uri)}`);
  assert.equal(JSON.stringify(stored).includes("data:image"), false);
  // pet avatar + its snapshot are the same picture, as are the other pet's avatar and snapshot
  assert.equal(imageRefs(stored).length, 4);
  assert.equal(imageName(jpeg(1)), imageName(jpeg(1)));
  assert.notEqual(imageName(jpeg(1)), imageName(jpeg(2)));
  assert.ok(hasImages(state) && !hasImages(home().pet ? { ...home(), pet: { ...pet, avatar: undefined } } : home()));
  // Reading back: one picture missing costs only that picture.
  const lost = imageName(jpeg(1));
  const back = mapImages(stored, (uri) => {
    const name = uri.slice(IMAGE_PREFIX.length);
    return name === lost ? undefined : [jpeg(0), jpeg(2), jpeg(3)].find((d) => imageName(d) === name);
  });
  assert.equal(back.events[0].photo, undefined);
  assert.equal(back.events[0].petSnapshot.avatar, jpeg(0));
  assert.equal(back.pet?.avatar, jpeg(0));
  assert.equal(back.draft?.photo, jpeg(3));
  assert.equal(back.household?.[0].pet.avatar, jpeg(2));
});

test("备份提醒：记满 10 条没备份过才提醒；备份 30 天后有新记录再提醒；以后再说歇两周；示例不提醒", () => {
  const now = new Date(2026, 9, 20, 12);
  const nine = Array.from({ length: 9 }, (_, i) => entry(`第${i}件事`, "other", i + 1));
  assert.equal(backupDue(home(nine), now), false);
  const ten = [...nine, entry("第十件事", "other", 10)];
  assert.equal(backupDue(home(ten), now), true);
  assert.equal(backupDue({ ...home(ten), demo: true }, now), false);
  const snoozed = snoozeBackup(home(ten), now);
  assert.equal(backupDue(snoozed, new Date(2026, 9, 30)), false);
  assert.equal(backupDue(snoozed, new Date(2026, 10, 5)), true);
  const saved = markBackedUp(home(ten), now);
  assert.equal(backupDue(saved, new Date(2026, 10, 30)), false, "no new entries since");
  const later = { ...saved, events: [{ ...entry("新的一件", "other", 25), createdAt: new Date(2026, 9, 25).toISOString() }, ...saved.events] };
  assert.equal(backupDue(later, new Date(2026, 10, 10)), false, "within 30 days");
  assert.equal(backupDue(later, new Date(2026, 10, 25)), true);
});

test("删除日记可以撤销，换了宠物或已经恢复过就不重复放回", () => {
  const e = entry("把拖鞋叼走了", "chaos", 3);
  const s = home([entry("睡觉", "sleep", 1), e]);
  const removed = deleteEvent(s, e.id);
  assert.equal(removed.events.length, 1);
  const back = restoreEvent(removed, e);
  assert.deepEqual(back.events.map((x) => x.id), [e.id, "e-1"]);
  assert.equal(restoreEvent(back, e), back);
  assert.equal(restoreEvent({ ...removed, pet: { ...pet, id: "p2" } }, e).events.length, 1);
});

const BANNED_ZH = /仿佛|宛如|岁月静好|治愈|小确幸|满满的|暖暖的|不仅.{1,15}更是|好多话|好多想法|分几次说/;
const BANNED_EN = /—|heartwarming|furry friend|pawsome|more to say/i;
test("本机文案：每种脾气每类事内心独白 5 句、爪友圈 4 句，同类事连着记不重复", () => {
  for (const [bank, banned] of [[voiceZh, BANNED_ZH], [voiceEn, BANNED_EN]] as const)
    for (const [temper, set] of Object.entries(bank))
      for (const c of CATEGORIES) {
        assert.equal(set.line[c].length, 5, `${temper} ${c}`);
        assert.equal(set.social[c].length, 4, `${temper} ${c}`);
        for (const line of [...set.line[c], ...set.social[c]]) assert.doesNotMatch(line, banned, line);
      }
  for (const lang of ["zh", "en"] as const) {
    applyLang(lang);
    for (const personality of ["傲娇", "亲人", "活泼", "戏精", "好奇", "随和", "慢热"]) {
      const p = { ...pet, personality };
      const said = (variant: number) => generateStories(p, lang === "zh" ? "今天睡了一下午。" : "Slept all afternoon.", "sleep", variant).diary.text.split("\n\n").pop()!.split("\n")[0];
      const lines = [0, 1, 2, 3, 4].map(said);
      for (let i = 1; i < lines.length; i++) assert.notEqual(lines[i], lines[i - 1], `${lang} ${personality} ${i}`);
      assert.equal(new Set(lines).size, 5, `${lang} ${personality}`);
    }
  }
  applyLang("zh");
  // The variant counts this pet's earlier entries of the same kind.
  const events = [entry("睡觉", "sleep", 1), entry("又睡觉", "sleep", 2), entry("吃饭", "snack", 3)];
  assert.equal(voiceVariant(events, "sleep"), 2);
  assert.equal(voiceVariant(events, "snack"), 1);
  assert.equal(voiceVariant(events, "sleep", events[1]), 1, "editing keeps its place");
});

test("AI 网关：只放行自家网页和 Mac 版来源，手机不带来源照常；每个地址每天限次", async () => {
  assert.equal(originAllowed({}, undefined), true);
  assert.equal(originAllowed({}, "https://baix827.github.io"), true);
  assert.equal(originAllowed({}, "http://127.0.0.1:61234"), true);
  assert.equal(originAllowed({}, "https://example.com"), false);
  assert.equal(originAllowed({}, "https://baix827.github.io.example.com"), false);
  assert.equal(headers({}, "https://example.com")["access-control-allow-origin"], "null");
  assert.equal(headers({ ALLOW_ORIGIN: "*" }, "https://example.com")["access-control-allow-origin"], "*");

  const usage = new Map<string, number>();
  const store = {
    get: async () => 0, add: async () => {},
    ipGet: async (day: string, ip: string) => usage.get(`${day}:${ip}`) ?? 0,
    ipAdd: async (day: string, ip: string) => { usage.set(`${day}:${ip}`, (usage.get(`${day}:${ip}`) ?? 0) + 1); },
  };
  const gateway = createGateway({ AI_MOCK: "1", IP_DAILY_LIMIT: "2", FREE_AI_PER_WEEK: "100" }, store);
  const body = (deviceId: string) => JSON.stringify({
    deviceId, region: "cn", lang: "zh", temper: "goofy", description: "今天睡了一下午。",
    pet: { name: "可乐", species: "dog", personality: "活泼", route: "work", role: "巡逻保安", owner: "哥哥", self: "我" },
  });
  const ask = (deviceId: string, meta: object) =>
    gateway.handle("POST", new URL("http://x/v1/pet-voice"), async () => body(deviceId), meta);
  assert.equal((await ask("a", { origin: "https://example.com" })).status, 403);
  assert.equal((await ask("a", { ip: "1.2.3.4" })).status, 200);
  assert.equal((await ask("b", { ip: "1.2.3.4" })).status, 200);
  const third = await ask("c", { ip: "1.2.3.4" });
  assert.equal(third.status, 429);
  assert.equal(third.body.error, "ip_limited");
  assert.equal((await ask("c", { ip: "5.6.7.8" })).status, 200);
});

// A minimal cmap reader (formats 4 and 12), enough to know which characters the font has.
function fontChars(path: string): Set<number> {
  const b = readFileSync(path);
  const tables = b.readUInt16BE(4);
  let cmap = 0;
  for (let i = 0; i < tables; i++) if (b.toString("latin1", 12 + i * 16, 16 + i * 16) === "cmap") cmap = b.readUInt32BE(20 + i * 16);
  const chars = new Set<number>();
  const count = b.readUInt16BE(cmap + 2);
  for (let i = 0; i < count; i++) {
    const at = cmap + b.readUInt32BE(cmap + 8 + i * 8);
    const format = b.readUInt16BE(at);
    if (format === 12) {
      const groups = b.readUInt32BE(at + 12);
      for (let g = 0; g < groups; g++) {
        const start = b.readUInt32BE(at + 16 + g * 12), end = b.readUInt32BE(at + 20 + g * 12);
        for (let c = start; c <= end; c++) chars.add(c);
      }
    } else if (format === 4) {
      const segs = b.readUInt16BE(at + 6) / 2;
      for (let s = 0; s < segs; s++) {
        const end = b.readUInt16BE(at + 14 + s * 2), start = b.readUInt16BE(at + 16 + segs * 2 + s * 2);
        for (let c = start; c <= end && c !== 0xffff; c++) chars.add(c);
      }
    }
  }
  return chars;
}
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
});
test("标题字体包含界面里出现的每个汉字（缺字时重跑 scripts/subset-font.py）", () => {
  const font = fontChars(join(__dirname, "../assets/fonts/ZCOOLQingKeHuangYou-Subset.ttf"));
  const missing = new Set<string>();
  for (const f of files(join(__dirname, "../src")))
    for (const ch of readFileSync(f, "utf8").match(/[一-鿿]/g) ?? [])
      if (!font.has(ch.codePointAt(0)!)) missing.add(ch);
  assert.deepEqual([...missing], []);
});
