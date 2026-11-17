import assert from "node:assert/strict";
import { test } from "node:test";
import { isAppState } from "../src/data/validation";
import { savePet } from "../src/domain/life";
import { addRelayMoment, readRelay, relayFromEntry, relayFromLinkParam, relayLink, RELAY_LIMIT } from "../src/domain/moment-relay";
import { emptyState, type LifeEvent, type Pet } from "../src/domain/types";

const pet: Pet = { id: "family-account-id", name: "Bean", species: "other", speciesName: "Axolotl", personality: "Quiet", route: "work", role: "Reporter" };
const story = { title: "Dinner", text: "Dinner was 100% worth waiting for.", generator: "template", edited: false } as const;
const entry: LifeEvent = {
  id: "private-id",
  description: "Private original",
  category: "snack",
  photo: "private-photo",
  createdAt: "2026-11-01T00:00:00.000Z",
  petSnapshot: pet,
  stories: { diary: story, life: story, social: story, news: story },
  selectedStyle: "diary",
  published: false,
};
const first = relayFromEntry(entry, "I spent 100% of dinner under my leaf. %20 🫧");
const initial = addRelayMoment(null, "Dinner & comforts", first);
const next = { petName: "Dot", species: "hamster", category: "sleep", caption: "I snack in my nest.", bridge: "We both had dinner in our favorite hiding spot." } as const;

test("a relay link contains the approved lines and preserves its hosted path", () => {
  const marked = { ...initial, account: "private-account", moments: [{ ...first, photo: "private-photo" }] };
  const url = new URL(relayLink("https://example.test/-Pawnote/?tracking=x#previous", marked));
  assert.equal(url.pathname, "/-Pawnote/");
  assert.equal(url.hash, "");
  assert.equal(url.searchParams.has("tracking"), false);
  const payload = url.searchParams.get("relay")!;
  assert.equal(payload.includes("private"), false);
  assert.deepEqual(relayFromLinkParam(decodeURIComponent(payload)), initial);
  assert.equal(relayFromLinkParam(payload)?.moments[0].speciesName, "Axolotl");
});

test("different species can continue a relay without mutating the incoming snapshot", () => {
  const continued = addRelayMoment(initial, "Unused", next);
  assert.equal(continued.title, initial.title);
  assert.deepEqual(continued.moments, [first, next]);
  assert.deepEqual(initial.moments, [first]);
  assert.throws(() => addRelayMoment(initial, "", { ...first, bridge: "Same turn." }), /already in this relay/);
  assert.throws(() => addRelayMoment(initial, "", { ...next, bridge: " " }), /connection/);
  let full = initial;
  for (let turn = 1; turn < RELAY_LIMIT; turn++) {
    full = addRelayMoment(full, "", { ...next, petName: `Pet ${turn}` });
  }
  assert.throws(() => addRelayMoment(full, "", next), /complete/);
});

test("rejects malformed links and keeps a received relay through first-time onboarding", () => {
  assert.equal(relayFromLinkParam("{malformed"), null);
  assert.equal(readRelay({ ...initial, version: 2 }), null);
  assert.equal(readRelay({ ...initial, moments: [first, { ...next, caption: "x".repeat(151) }] }), null);
  assert.equal(readRelay({ ...initial, moments: [first, { ...next, species: "unknown" }] }), null);
  assert.equal(isAppState(emptyState()), true);
  assert.equal(isAppState({ ...emptyState(), relay: { ...initial, moments: [] } }), false);
  const saved = savePet({ ...emptyState(), relay: initial }, pet);
  assert.equal(isAppState(saved), true);
  assert.deepEqual(saved.relay, initial);
});
