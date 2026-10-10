import { AppState, CATEGORIES, STYLES } from "../domain/types";
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max: number) =>
  typeof v === "string" && v.length <= max;
const one = (v: unknown, list: readonly string[]) =>
  typeof v === "string" && list.includes(v);
const photo = (v: unknown) =>
  v === undefined ||
  (str(v, 1000000) &&
    /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v as string));
const pet = (v: unknown) =>
  obj(v) &&
  str(v.id, 100) &&
  str(v.name, 20) &&
  (v.name as string).trim().length > 0 &&
  one(v.species, ["cat", "dog"]) &&
  one(v.personality, ["傲娇", "憨厚", "戏精"]) &&
  one(v.route, ["work", "campus"]) &&
  str(v.role, 30) &&
  photo(v.avatar);
const stories = (v: unknown) =>
  obj(v) &&
  STYLES.every(
    (k) =>
      obj(v[k]) &&
      str(v[k].text, 2000) &&
      str(v[k].title, 160) &&
      v[k].generator === "template" &&
      typeof v[k].edited === "boolean",
  );
export function isAppState(v: unknown): v is AppState {
  if (
    !obj(v) ||
    v.schemaVersion !== 1 ||
    typeof v.demo !== "boolean" ||
    (v.pet !== null && !pet(v.pet)) ||
    !Array.isArray(v.events) ||
    v.events.length > 1000
  )
    return false;
  if (
    !v.events.every(
      (e) =>
        obj(e) &&
        str(e.id, 100) &&
        str(e.description, 500) &&
        one(e.category, CATEGORIES) &&
        photo(e.photo) &&
        str(e.createdAt, 40) &&
        Number.isFinite(Date.parse(e.createdAt as string)) &&
        obj(e.petSnapshot) &&
        pet(e.petSnapshot) &&
        stories(e.stories) &&
        one(e.selectedStyle, STYLES) &&
        typeof e.published === "boolean" &&
        obj(v.pet) &&
        e.petSnapshot.id === v.pet.id,
    )
  )
    return false;
  if (new Set(v.events.map((e) => e.id)).size !== v.events.length) return false;
  return (
    v.draft === null ||
    (obj(v.draft) &&
      str(v.draft.id, 100) &&
      str(v.draft.description, 500) &&
      one(v.draft.category, CATEGORIES) &&
      one(v.draft.selectedStyle, STYLES) &&
      photo(v.draft.photo) &&
      typeof v.draft.published === "boolean" &&
      (v.draft.stories === undefined || stories(v.draft.stories)) &&
      (v.draft.signature === undefined || str(v.draft.signature, 1500)))
  );
}
