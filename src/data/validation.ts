import { AppState, CATEGORIES, SPECIES, STYLES } from "../domain/types";
import { isHomeDate } from "../domain/timeline";
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
const optionalInt = (v: unknown, max: number) => v === undefined || (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max);
const questionnaire = (v: unknown) => v === undefined || (obj(v) && v.version === 1 && Array.isArray(v.answers) &&
  v.answers.length === 5 && v.answers.every(a => Number.isInteger(a) && a >= 0 && a <= 3) && v.answers.filter(a => a < 3).length >= 3);
const pet = (v: unknown) =>
  obj(v) &&
  str(v.id, 100) &&
  str(v.name, 20) &&
  (v.name as string).trim().length > 0 &&
  one(v.species, SPECIES) &&
  (v.speciesName === undefined || str(v.speciesName, 20)) &&
  (v.species !== "other" || (str(v.speciesName, 20) && (v.speciesName as string).trim().length > 0)) &&
  str(v.personality, 60) && (v.personality as string).trim().length > 0 &&
  (v.personalitySource === undefined || one(v.personalitySource, ["tag", "custom", "questionnaire"])) &&
  questionnaire(v.questionnaire) &&
  (v.personalitySource !== "questionnaire" || v.questionnaire !== undefined) &&
  optionalInt(v.ageMonths, 1200) &&
  (v.ageRecordedAt === undefined || (str(v.ageRecordedAt, 40) && Number.isFinite(Date.parse(v.ageRecordedAt as string)))) &&
  (v.routeSource === undefined || one(v.routeSource, ["age", "manual"])) &&
  (v.routeSource !== "age" || ((v.species === "cat" || v.species === "dog") && v.ageMonths !== undefined &&
    v.route === ((v.ageMonths as number) < 12 ? "campus" : "work"))) &&
  one(v.route, ["work", "campus"]) &&
  str(v.role, 30) &&
  (v.homeDate === undefined || isHomeDate(v.homeDate)) &&
  (v.ownerTitle === undefined || (str(v.ownerTitle, 10) && (v.ownerTitle as string).trim().length > 0)) &&
  photo(v.avatar);
const stories = (v: unknown) =>
  obj(v) &&
  STYLES.every(
    (k) =>
      obj(v[k]) &&
      str(v[k].text, 2000) &&
      str(v[k].title, 160) &&
      (v[k].generator === "template" || v[k].generator === "ai") &&
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
