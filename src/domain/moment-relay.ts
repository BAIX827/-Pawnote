import { CATEGORIES, SPECIES, type Category, type LifeEvent, type Species } from "./types";

export const RELAY_LIMIT = 6;
export const RELAY_TITLE_MAX = 48;
export const RELAY_CAPTION_MAX = 150;
export const RELAY_BRIDGE_MAX = 65;
const LINK_QUERY_MAX = 7500;

export interface RelayMoment {
  petName: string;
  species: Species;
  speciesName?: string;
  category: Category;
  caption: string;
  bridge?: string;
}

export interface MomentRelay {
  version: 1;
  title: string;
  moments: RelayMoment[];
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const line = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.length <= max && !!value.trim();
const listed = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);
const momentKey = (moment: RelayMoment) =>
  JSON.stringify([moment.petName, moment.species, moment.speciesName, moment.caption]).toLowerCase();

function readMoment(value: unknown, needsBridge: boolean): RelayMoment | null {
  if (!record(value) || !line(value.petName, 20) || !listed(SPECIES, value.species) ||
    !listed(CATEGORIES, value.category) || !line(value.caption, RELAY_CAPTION_MAX) ||
    (needsBridge ? !line(value.bridge, RELAY_BRIDGE_MAX) : value.bridge !== undefined) ||
    (value.speciesName !== undefined && (value.species !== "other" || !line(value.speciesName, 20)))) return null;
  return {
    petName: value.petName.trim(),
    species: value.species,
    ...(typeof value.speciesName === "string" && { speciesName: value.speciesName.trim() }),
    category: value.category,
    caption: value.caption.trim(),
    ...(typeof value.bridge === "string" && { bridge: value.bridge.trim() }),
  };
}

export function readRelay(value: unknown): MomentRelay | null {
  if (!record(value) || value.version !== 1 || !line(value.title, RELAY_TITLE_MAX) ||
    !Array.isArray(value.moments) || value.moments.length === 0 || value.moments.length > RELAY_LIMIT) return null;
  const moments: RelayMoment[] = [];
  const seen = new Set<string>();
  for (const item of value.moments) {
    const moment = readMoment(item, moments.length > 0);
    if (!moment || seen.has(momentKey(moment))) return null;
    moments.push(moment);
    seen.add(momentKey(moment));
  }
  return { version: 1, title: value.title.trim(), moments };
}

export function relayFromEntry(event: LifeEvent, caption: string, bridge?: string): RelayMoment {
  const { name, species, speciesName } = event.petSnapshot;
  return {
    petName: name,
    species,
    ...(species === "other" && speciesName && { speciesName }),
    category: event.category,
    caption: caption.trim(),
    ...(bridge !== undefined && { bridge: bridge.trim() }),
  };
}

export function addRelayMoment(relay: MomentRelay | null, title: string, moment: RelayMoment): MomentRelay {
  if (relay?.moments.length === RELAY_LIMIT) throw new Error("This relay is complete.");
  if (relay?.moments.some((previous) => momentKey(previous) === momentKey(moment))) {
    throw new Error("That moment is already in this relay. Pick another diary entry.");
  }
  const next = readRelay({ version: 1, title: relay?.title ?? title, moments: [...(relay?.moments ?? []), moment] });
  if (!next) throw new Error("Check the title, caption and connection before adding your moment.");
  if (makeQuery(next).length > LINK_QUERY_MAX) throw new Error("This link is too long. Shorten your caption or connection.");
  return next;
}

// Expo Router decodes parameters again after parsing the query. Keep literal percent signs inside JSON escapes.
const makeQuery = (relay: MomentRelay) =>
  new URLSearchParams({ relay: JSON.stringify(relay).replaceAll("%", "\\u0025") }).toString();

export function relayLink(base: string, relay: MomentRelay): string {
  const shareable = readRelay(relay);
  if (!shareable) throw new Error("This relay can't be shared.");
  const url = new URL(base.split(/[?#]/, 1)[0]);
  const query = makeQuery(shareable);
  if (query.length > LINK_QUERY_MAX) throw new Error("This link is too long to share.");
  return `${url.toString()}?${query}`;
}

export function relayFromLinkParam(param: string): MomentRelay | null {
  if (param.length > LINK_QUERY_MAX) return null;
  try {
    return readRelay(JSON.parse(param));
  } catch {
    return null;
  }
}
