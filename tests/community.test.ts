import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { communitySchema, handleCommunity } from "../server/community.mjs";
import { newDraft } from "../src/domain/types";
import type {
  World,
  Moment,
  MomentDetailData,
  Conversation,
} from "../src/platform/community";

function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  for (const sql of communitySchema) db.exec(sql);
  const call = (
    token: string,
    action: string,
    body?: Record<string, unknown>,
    query: Record<string, string> = {},
  ) =>
    handleCommunity(
      body ? "POST" : "GET",
      new URL(
        "http://localhost/v1/community/" +
          action +
          "?" +
          new URLSearchParams(query),
      ),
      "Bearer " + token,
      undefined,
      {},
      async () => JSON.stringify(body),
      (
        fn: (
          sql: (query: string, ...args: SQLInputValue[]) => unknown[],
        ) => unknown,
      ) => {
        db.exec("BEGIN");
        try {
          const result = fn((query, ...args) => db.prepare(query).all(...args));
          db.exec("COMMIT");
          return result;
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      },
    );
  async function ok<T>(
    token: string,
    action: string,
    body?: Record<string, unknown>,
    q?: Record<string, string>,
  ) {
    const result = await call(token, action, body, q);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    return result.body as T;
  }
  return { db, call, ok };
}
const a = "A".repeat(20),
  b = "B".repeat(20),
  c = "C".repeat(20);
const pet = (local: string, name: string, species: string) => ({
  local,
  name,
  species,
  temper: "curious",
});
const post = (
  entry: string,
  caption: string,
  extra: Record<string, unknown> = {},
) => ({
  local: "one",
  entry,
  caption,
  category: "snack",
  enable: true,
  ...extra,
});
test("public moments meet across real households; private journal data, identities and consent stay independent", async () => {
  const { call, ok, db } = fixture();
  try {
    assert.equal(newDraft().published, false);
    assert.equal((await call("xx", "world")).status, 401);
    const fig = await ok<{ id: string }>(
      b,
      "enrol",
      pet("one", "Fig", "Rabbit"),
    );
    const bean = await ok<{ id: string }>(
      a,
      "enrol",
      pet("one", "Bean", "Dog"),
    );
    await ok(a, "enrol", pet("two", "Pip", "Bird"));
    const f = await ok<{ id: number }>(
      b,
      "publish",
      post("n", "The fridge opened. A sandwich! Back to my rug."),
    );
    const payload = post("n", "I did my good sit. Twice.", {
      description: "undisclosed private diary text",
    });
    const [p, again] = await Promise.all([
      ok<{ id: number }>(a, "publish", payload),
      ok<{ id: number }>(a, "publish", payload),
    ]);
    assert.equal(again.id, p.id);
    const figPost = await ok<Moment>(b, "post", undefined, {
      id: String(f.id),
    });
    assert.deepEqual(
      figPost.activity.map((v) => [v.actor, v.source]),
      [[bean.id, p.id]],
    );
    assert.ok(figPost.activity[0].answer);
    const fromBean = await ok<MomentDetailData>(a, "post", undefined, {
      id: String(p.id),
    });
    assert.equal(fromBean.met?.id, f.id);
    assert.match(figPost.activity[0].answer!, /rug/);
    const world = await ok<World>(b, "world", undefined, { local: "one" });
    assert.ok(!JSON.stringify(world).includes("undisclosed"));
    assert.equal(world.relations.length, 1);
    assert.equal(
      (await ok<World>(a, "world", undefined, { local: "two" })).relations
        .length,
      0,
    );
    assert.equal(
      (await call(a, "publish", post("tag", "Hi", { mention: fig.id }))).status,
      403,
    );
    await ok(a, "friend", { code: world.code });
    await ok(a, "publish", post("tag", "Fig was there.", { mention: fig.id }));
    assert.equal(
      (await ok<World>(b, "world", undefined, { local: "one" })).mentions
        .length,
      1,
    );
    await ok(a, "settings", { local: "one", active: false, mix: "variety" });
    const paused = await ok<{ id: number }>(
      a,
      "publish",
      post("paused", "A quiet day.", { enable: false }),
    );
    assert.ok(
      !(
        await ok<World>(a, "world", undefined, { local: "one" })
      ).relations.some((r) => r.source === paused.id),
    );
    assert.equal((await call(b, "withdraw", { id: p.id })).status, 403);
    await ok(a, "withdraw", { id: p.id });
    assert.ok(
      !(
        await ok<Moment>(b, "post", undefined, { id: String(f.id) })
      ).activity.some((r) => r.source === p.id),
    );
    await ok(a, "consent", { pet: fig.id, open: true });
    assert.equal(
      (await ok<Conversation>(b, "chat", undefined, { pet: bean.id })).open,
      false,
    );
    assert.equal(
      (await call(a, "message", { pet: fig.id, text: "Hi", nonce: "1" }))
        .status,
      403,
    );
    await ok(b, "consent", { pet: bean.id, open: true });
    for (let i = 0; i < 2; i++)
      await ok(a, "message", { pet: fig.id, text: "Hello!", nonce: "1" });
    assert.equal(
      (await ok<Conversation>(b, "chat", undefined, { pet: bean.id })).messages
        .length,
      1,
    );
    await ok(b, "consent", { pet: bean.id, open: false });
    assert.deepEqual(
      (await ok<Conversation>(a, "chat", undefined, { pet: fig.id })).messages,
      [],
    );
    await ok(c, "enrol", pet("one", "Dot", "Fish"));
    await ok(c, "report", { id: f.id, reason: "Check this post" });
    assert.equal(
      (await call(c, "post", undefined, { id: String(f.id) })).status,
      404,
    );
    await ok(b, "block", { pet: bean.id });
    assert.equal(
      (await call(a, "post", undefined, { id: String(f.id) })).status,
      404,
    );
    assert.ok(
      !(await ok<World>(a, "world")).friends.some((p) => p.id === fig.id),
    );
    await ok(b, "delete-account", {});
    assert.equal((await ok<World>(b, "world")).code, null);
  } finally {
    db.close();
  }
});

test("choosing a pet changes only this pet’s future preferences and respects both owners’ controls", async () => {
  const { ok, db } = fixture();
  try {
    await ok(a, "enrol", pet("one", "Bean", "Dog"));
    await ok(a, "enrol", pet("two", "Pip", "Bird"));
    const fig = await ok<{ id: string }>(
      b,
      "enrol",
      pet("one", "Fig", "Rabbit"),
    );
    const figPost = await ok<{ id: number }>(
      b,
      "publish",
      post("fig", "A cardboard box is all mine."),
    );
    await ok(a, "preference", { local: "one", pet: fig.id, prefer: true });
    const preferences = (local: string) =>
      ok<World>(a, "world", undefined, { local, profile: fig.id });
    assert.equal((await preferences("one")).profile?.preferred, 1);
    assert.equal((await preferences("two")).profile?.preferred, 0);
    assert.equal((await preferences("one")).pet?.active, false);
    assert.equal((await preferences("one")).relations.length, 0);
    await ok(b, "settings", { local: "one", active: false, mix: "variety" });
    const source = await ok<{ id: number }>(
      a,
      "publish",
      post("bean", "That box looks cosy."),
    );
    const readSource = () =>
      ok<MomentDetailData>(a, "post", undefined, { id: String(source.id) });
    assert.equal((await readSource()).met, null);
    await ok(b, "settings", { local: "one", active: true, mix: "variety" });
    assert.equal((await readSource()).activity[0].source, figPost.id);
    const readFig = () =>
      ok<MomentDetailData>(b, "post", undefined, { id: String(figPost.id) });
    assert.equal((await readFig()).met?.id, source.id);
    await ok(b, "report", { id: source.id, reason: "Hide this moment." });
    assert.equal((await readFig()).met, null);
    await ok(a, "preference", { local: "one", pet: fig.id, prefer: false });
    assert.equal((await preferences("one")).profile?.preferred, 0);
  } finally {
    db.close();
  }
});
