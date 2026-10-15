import type { AppState } from "./types";

// Photos live outside the main store, like sounds (docs/01 8.27): the store keeps "pawnote-image:<name>"
// and the picture itself sits in IndexedDB or a file. Names come from the picture's content, so the same
// avatar repeated in every record's pet snapshot is kept once.
export const IMAGE_PREFIX = "pawnote-image:";
export const IMAGE_NAME = /^image-[a-z0-9]+-[a-z0-9]+$/;
export const isEmbeddedImage = (v: unknown): boolean =>
  typeof v === "string" && v.startsWith("data:image/");

const fnv = (text: string, seed: number) => {
  let h = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36);
};
/** A storage name for an embedded picture, the same for the same content. */
export const imageName = (data: string) =>
  `image-${fnv(data, 2166136261)}${fnv(data, 3735928559)}-${data.length.toString(36)}`;

type Loose = Record<string, unknown>;
type Fn = (uri: string) => string | undefined;
const isObj = (v: unknown): v is Loose => !!v && typeof v === "object" && !Array.isArray(v);
function field(o: Loose, key: string, fn: Fn): Loose {
  const v = o[key];
  if (typeof v !== "string") return o;
  const next = fn(v);
  if (next === v) return o;
  const copy = { ...o };
  if (next === undefined) delete copy[key];
  else copy[key] = next;
  return copy;
}
const pet = (p: unknown, fn: Fn) => (isObj(p) ? field(p, "avatar", fn) : p);
const event = (e: unknown, fn: Fn) => {
  if (!isObj(e)) return e;
  const withPhoto = field(e, "photo", fn);
  return isObj(withPhoto.petSnapshot) ? { ...withPhoto, petSnapshot: pet(withPhoto.petSnapshot, fn) } : withPhoto;
};
const events = (list: unknown, fn: Fn) => (Array.isArray(list) ? list.map((e) => event(e, fn)) : list);

/**
 * Applies `fn` to every picture the state carries: each pet's avatar, every record's photo and its pet
 * snapshot's avatar, and the draft's photo. Returning undefined drops that picture. Works on stored
 * data that hasn't been validated yet, so it never assumes a shape.
 */
export function mapImages(state: AppState, fn: Fn): AppState {
  const s = state as unknown as Loose;
  const out: Loose = { ...s, pet: pet(s.pet, fn), events: events(s.events, fn) };
  if (isObj(s.draft)) out.draft = field(s.draft, "photo", fn);
  if (Array.isArray(s.household))
    out.household = s.household.map((b) => (isObj(b) ? { ...b, pet: pet(b.pet, fn), events: events(b.events, fn) } : b));
  return out as unknown as AppState;
}

/** Every picture reference ("pawnote-image:…") in stored state. */
export function imageRefs(state: AppState): string[] {
  const refs = new Set<string>();
  mapImages(state, (uri) => {
    if (uri.startsWith(IMAGE_PREFIX)) refs.add(uri.slice(IMAGE_PREFIX.length));
    return uri;
  });
  return [...refs];
}

/** Whether the state carries any picture, embedded or already stored outside. */
export function hasImages(state: AppState): boolean {
  let found = false as boolean;
  mapImages(state, (uri) => {
    if (isEmbeddedImage(uri) || uri.startsWith(IMAGE_PREFIX)) found = true;
    return uri;
  });
  return found;
}
