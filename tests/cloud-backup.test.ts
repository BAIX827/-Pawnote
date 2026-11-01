import test from "node:test";
import assert from "node:assert/strict";
import { CODE_ALPHABET, cloudDue, codeFromBytes, normalizeCode } from "../src/domain/backup";
import { generateStories } from "../src/domain/story-engine";
import type { AppState, Category, LifeEvent, Pet } from "../src/domain/types";
import { applyLang } from "../src/i18n/core";
import { CODE_ALPHABET as SERVER_ALPHABET, accountId, createGateway } from "../server/core.mjs";

// docs/01 8.38 and docs/03 ADR-007: recovery-code account and cloud backup.
applyLang("zh");
const pet: Pet = { id: "p1", name: "可乐", species: "dog", personality: "活泼", route: "work", role: "巡逻保安" };
const entry = (day: number): LifeEvent => ({
  id: `e-${day}`, description: "睡觉", category: "sleep" as Category, createdAt: new Date(2026, 10, day, 12).toISOString(),
  petSnapshot: pet, stories: generateStories(pet, "睡觉", "sleep"), selectedStyle: "diary", published: false,
});
const home = (events: LifeEvent[]): AppState => ({ schemaVersion: 1, pet, events, draft: null, demo: false });

test("恢复码：20 位分 5 组，大小写、空格和横线都能认，字母表和网关一致", () => {
  const code = codeFromBytes(Uint8Array.from({ length: 20 }, (_, i) => i * 13));
  assert.match(code, /^[A-Z2-9]{4}(-[A-Z2-9]{4}){4}$/);
  assert.equal(normalizeCode(code.toLowerCase().replace(/-/g, " ")), code);
  assert.equal(normalizeCode("ABCD-EFGH"), null);
  assert.equal(normalizeCode("ABCD-EFGH-JKLM-NPQR-ST0U"), null, "0 is not in the alphabet");
  assert.equal(CODE_ALPHABET, SERVER_ALPHABET);
});

test("自动云备份：没传过就传；一天内不重复；之后有新记录才传；示例和空档案不传", () => {
  const now = new Date(2026, 10, 10, 12);
  const s = home([entry(1)]);
  assert.equal(cloudDue(s, undefined, now), true);
  assert.equal(cloudDue({ ...s, demo: true }, undefined, now), false);
  assert.equal(cloudDue({ ...s, pet: null }, undefined, now), false);
  const last = new Date(2026, 10, 5).toISOString();
  assert.equal(cloudDue(s, last, now), false, "nothing new");
  const later = home([entry(8), entry(1)]);
  assert.equal(cloudDue(later, last, now), true);
  assert.equal(cloudDue(later, new Date(2026, 10, 10, 6).toISOString(), now), false, "within a day");
});

test("网关云备份：存、查、取、删按恢复码隔开，码不对 401，超大 413，按地址限次", async () => {
  const kv = new Map<string, unknown>(), ips = new Map<string, number>();
  const store = {
    get: async () => 0, add: async () => {},
    ipGet: async (day: string, k: string) => ips.get(`${day}:${k}`) ?? 0,
    ipAdd: async (day: string, k: string) => { ips.set(`${day}:${k}`, (ips.get(`${day}:${k}`) ?? 0) + 1); },
    backupPut: async (a: string, body: string, info: object) => { kv.set(a, body); kv.set(`m:${a}`, info); },
    backupGet: async (a: string) => kv.get(a) ?? null,
    backupMeta: async (a: string) => kv.get(`m:${a}`) ?? null,
    backupDelete: async (a: string) => { kv.delete(a); kv.delete(`m:${a}`); },
  };
  const gw = createGateway({ BACKUP_IP_DAILY: "2" }, store);
  const A = "Bearer ABCD-EFGH-JKLM-NPQR-STUV", B = "Bearer 2345-6789-ABCD-EFGH-JKLM";
  type Result = { status: number; raw?: unknown; body: { backup?: object } };
  const call = async (method: string, path: string, meta: object) =>
    (await gw.handle(method, new URL(`http://x${path}`), async () => "", meta)) as Result;
  const body = '{"schemaVersion":1}';
  assert.equal((await call("GET", "/v1/backup/meta", { authorization: "Bearer nope" })).status, 401);
  assert.equal((await call("GET", "/v1/backup/meta", { authorization: A })).status, 404);
  const put = await call("PUT", "/v1/backup", {
    authorization: A, ip: "1.1.1.1", contentLength: String(body.length), backupPet: encodeURIComponent("可乐"),
    backupEvents: "3", readBody: async () => body,
  });
  assert.equal(put.status, 200);
  assert.deepEqual({ ...put.body.backup, savedAt: "" }, { savedAt: "", pet: "可乐", events: 3, bytes: body.length });
  assert.equal((await call("GET", "/v1/backup", { authorization: A.toLowerCase().replace("bearer", "Bearer") })).raw, body);
  assert.equal((await call("GET", "/v1/backup", { authorization: B })).status, 404, "another code sees nothing");
  assert.equal((await call("PUT", "/v1/backup", { authorization: A, contentLength: String(21 * 1024 * 1024), readBody: async () => "" })).status, 413);
  await call("PUT", "/v1/backup", { authorization: A, ip: "1.1.1.1", contentLength: "2", readBody: async () => "{}" });
  assert.equal((await call("PUT", "/v1/backup", { authorization: A, ip: "1.1.1.1", contentLength: "2", readBody: async () => "{}" })).status, 429);
  assert.equal((await call("DELETE", "/v1/backup", { authorization: A })).status, 200);
  assert.equal((await call("GET", "/v1/backup/meta", { authorization: A })).status, 404);
  assert.notEqual(await accountId(A), await accountId(B));
  assert.equal(await accountId(A), await accountId("Bearer abcdefghjklmnpqrstuv"));
});
