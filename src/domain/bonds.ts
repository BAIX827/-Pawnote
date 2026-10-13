import { AFFINITY, RESIDENTS, Resident, buildCircle } from "./paw-circle";
import { allEvents, homePets, switchPet } from "./household";
import { temperOf } from "./temper";
import { AppState, BOND_LEVELS, Bond, BondLevel, LifeEvent, Pet, Tone } from "./types";

// 关系网 (docs/01 8.23). Nothing here is stored but the starting levels the owner picked: every score is
// worked out from that start, the records where pets did something together, and what the 爪友圈 did.
export const BOND_LABELS: Record<BondLevel, string> = {
  foe: "敌对",
  stranger: "不熟",
  normal: "普通",
  friend: "朋友",
  bestie: "死党",
};
/** Where a pair starts when its level is set. */
export const ANCHOR: Record<BondLevel, number> = { foe: -60, stranger: -15, normal: 10, friend: 50, bestie: 85 };
export const TONE_DELTA: Record<Tone, number> = { good: 10, neutral: 3, bad: -12 };
export const TONE_LABELS: Record<Tone, string> = { good: "开心", neutral: "平常", bad: "闹矛盾" };
/** The most the 爪友圈 alone can add to a pet and a resident. */
export const CIRCLE_CAP = 30;
export const MAX_BONDS = 200;

export function levelOf(score: number): BondLevel {
  if (score <= -41) return "foe";
  if (score < 0) return "stranger";
  if (score < 30) return "normal";
  if (score < 70) return "friend";
  return "bestie";
}
const clamp = (n: number) => Math.max(-100, Math.min(100, n));

export const npcId = (r: Resident) => `npc:${r.id}`;
const residentOf = (id: string) => (id.startsWith("npc:") ? RESIDENTS.find((r) => `npc:${r.id}` === id) : undefined);
/** Pairs are stored and compared with the smaller id first. */
export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Residents who already know each other in 爪爪镇. Pairs not listed aren't drawn. */
const TOWN: [string, string, BondLevel][] = [
  ["coal", "bao", "friend"],
  ["coal", "biscuit", "normal"],
  ["bao", "duchess", "friend"],
  ["biscuit", "mochi", "bestie"],
  ["pip", "basil", "friend"],
  ["duchess", "coal", "normal"],
  ["mochi", "pip", "normal"],
];

const GOOD = /一起玩|玩了|玩耍|贴贴|蹭|舔毛|互相舔|抱在一起|挤在|靠在一起|一起睡|都睡着|一起趴|一起晒|依偎|分享|让给|陪|追着玩|和好|play|cuddl|snuggl|groom|nap(ped)? together|shared|made up/i;
const BAD = /打架|打起来|打了一架|咬了|咬它|咬他|互咬|抢|吵架|哈气|凶|揍|欺负|挠了|追着打|生气|不理|fight|fought|bit each other|bitten|hiss|growl|stole|swatted/i;
const MADE_UP = /和好|握手言和|made up|make up/i;

/** Where the last match of `pattern` starts in `text`, or -1. */
function lastAt(text: string, pattern: RegExp): number {
  let at = -1;
  for (const m of text.matchAll(new RegExp(pattern.source, "gi"))) at = m.index;
  return at;
}
/**
 * A first guess at how a shared moment went, from the owner's words; the owner can change it.
 * When good and bad words both appear, the one nearer the end is how it turned out (docs/01 8.25).
 */
export function guessTone(description: string): Tone {
  if (MADE_UP.test(description)) return "good";
  const bad = lastAt(description, BAD), good = lastAt(description, GOOD);
  if (bad < 0 && good < 0) return "neutral";
  return good > bad ? "good" : "bad";
}

/** Who took part in a record: the pet who recorded it and the pets it was with. */
export const participants = (e: LifeEvent) => [e.petSnapshot.id, ...(e.together?.pets ?? [])];

export interface BondNode {
  id: string;
  kind: "pet" | "resident";
  pet?: Pet;
  resident?: Resident;
}
export interface BondLink {
  a: string;
  b: string;
  score: number;
  level: BondLevel;
  /** The starting level: the owner's choice, or the default. */
  start: BondLevel;
  /** True when the owner picked the starting level. */
  chosen: boolean;
  /** The owner can set the start of a pair of their own pets (docs/01 8.24). */
  editable: boolean;
  /** Records that moved this pair, newest first. */
  history: { event: LifeEvent; delta: number }[];
  /** What the 爪友圈 added, capped. */
  circle: number;
}
export interface BondNetwork {
  nodes: BondNode[];
  links: BondLink[];
}

export function defaultLevel(a: BondNode, b: BondNode): BondLevel {
  if (a.kind === "pet" && b.kind === "pet") return "normal";
  const pet = (a.pet ?? b.pet)!, r = (a.resident ?? b.resident)!;
  if (!pet) return "normal";
  return pet.species === r.species || AFFINITY[temperOf(pet)].includes(r.temper) ? "normal" : "stranger";
}

/** How much each pet's 爪友圈 brought it closer to each resident: likes +1, comments +2, both ways. */
export function circleWarmth(state: AppState, now: Date): Map<string, number> {
  const warmth = new Map<string, number>();
  const add = (pet: string, resident: string, n: number) => {
    const key = pairKey(pet, `npc:${resident}`);
    warmth.set(key, (warmth.get(key) ?? 0) + n);
  };
  for (const pet of homePets(state)) {
    const { posts } = buildCircle(switchPet(state, pet.id), now, "zh");
    for (const p of posts) {
      const from = p.kind === "pet" ? undefined : p.resident?.id;
      for (const l of p.likes) {
        if (p.kind === "pet" && l.who.kind === "resident") add(pet.id, l.who.id, 1);
        if (from && l.who.kind === "pet") add(pet.id, from, 1);
      }
      for (const c of p.comments) {
        if (p.kind === "pet" && c.author.kind === "resident") add(pet.id, c.author.id, 2);
        if (from && c.author.kind === "pet") add(pet.id, from, 2);
      }
    }
  }
  return warmth;
}

/** The whole network as it stands at `now`. With `homeOnly`, just the household's own pets. */
export function bondNetwork(state: AppState, now: Date, homeOnly = false): BondNetwork {
  const pets = homePets(state);
  const hidden = state.circle?.hiddenNpcs ?? [];
  const nodes: BondNode[] = [
    ...pets.map((pet) => ({ id: pet.id, kind: "pet" as const, pet })),
    ...(homeOnly ? [] : RESIDENTS.filter((r) => !hidden.includes(r.id)).map((r) => ({ id: npcId(r), kind: "resident" as const, resident: r }))),
  ];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const chosen = new Map((state.bonds ?? []).map((b) => [pairKey(b.a, b.b), b.level]));
  const history = new Map<string, { event: LifeEvent; delta: number }[]>();
  for (const e of allEvents(state)) {
    if (!e.together) continue;
    const who = [...new Set(participants(e))].filter((id) => byId.has(id));
    for (let i = 0; i < who.length; i++)
      for (let j = i + 1; j < who.length; j++) {
        const key = pairKey(who[i], who[j]);
        history.set(key, [...(history.get(key) ?? []), { event: e, delta: TONE_DELTA[e.together.tone] }]);
      }
  }
  const warmth = homeOnly ? new Map<string, number>() : circleWarmth(state, now);
  const links: BondLink[] = [];
  const link = (a: BondNode, b: BondNode, fallback: BondLevel) => {
    const key = pairKey(a.id, b.id);
    const start = chosen.get(key) ?? fallback;
    const moved = (history.get(key) ?? []).sort((x, y) => y.event.createdAt.localeCompare(x.event.createdAt));
    const circle = Math.min(CIRCLE_CAP, warmth.get(key) ?? 0);
    const score = clamp(ANCHOR[start] + moved.reduce((n, m) => n + m.delta, 0) + circle);
    const [x, y] = a.id < b.id ? [a.id, b.id] : [b.id, a.id];
    links.push({ a: x, b: y, score, level: levelOf(score), start, chosen: chosen.has(key),
      editable: a.kind === "pet" && b.kind === "pet", history: moved, circle });
  };
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      if (a.kind === "resident" && b.kind === "resident") continue;
      link(a, b, defaultLevel(a, b));
    }
  if (!homeOnly)
    for (const [x, y, level] of TOWN) {
      const a = byId.get(`npc:${x}`), b = byId.get(`npc:${y}`);
      if (a && b) link(a, b, level);
    }
  return { nodes, links };
}

/** Sets (or, with null, forgets) the starting level the owner picked for a pair. */
export function setBond(state: AppState, a: string, b: string, level: BondLevel | null): AppState {
  if (a === b || (residentOf(a) && residentOf(b))) return state;
  const key = pairKey(a, b);
  const rest = (state.bonds ?? []).filter((x) => pairKey(x.a, x.b) !== key);
  if (!level) return { ...state, bonds: rest };
  if (!BOND_LEVELS.includes(level) || rest.length >= MAX_BONDS) return state;
  const [x, y] = a < b ? [a, b] : [b, a];
  const bond: Bond = { a: x, b: y, level };
  return { ...state, bonds: [...rest, bond] };
}
