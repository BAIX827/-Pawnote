import { AppState, BOND_LEVELS, CATEGORIES, SPECIES, STYLES, SOUND_STAGES } from "../domain/types";
import { MAX_PETS } from "../domain/household";
import { MAX_BONDS } from "../domain/bonds";
import { isSoundDay, validSoundAudio, MAX_SOUNDS, MAX_SOUND_TOTAL, MAX_SOUND_SECONDS } from "../domain/sounds";
import { isPastDay } from "../domain/dates";
import { isHomeDate } from "../domain/timeline";
import { MAX_LABEL, MAX_ROUTINES, isActivity, isTime } from "../domain/paw-dates";
import { PAWSONA_QUESTIONS, TEMPERS } from "../domain/pawsona";
import { QUESTIONS } from "../domain/pet-profile";
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.length <= max;
const timestamp = (v: unknown) => str(v, 40) && Number.isFinite(Date.parse(v));
const optionalDate = (v: unknown) => v === undefined || timestamp(v);
const one = (v: unknown, list: readonly string[]) =>
  typeof v === "string" && list.includes(v);
const photo = (v: unknown) =>
  v === undefined ||
  (str(v, 1000000) &&
    /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v));
const boundedInt = (v: unknown, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;
const optionalInt = (v: unknown, max: number) => v === undefined || boundedInt(v, max);
const questionnaire = (v: unknown) =>
  v === undefined ||
  (obj(v) && v.version === 1 && Array.isArray(v.answers) &&
    v.answers.length === QUESTIONS.length &&
    v.answers.every((a) => boundedInt(a, 3)) &&
    v.answers.filter((a) => a < 3).length >= 3);
const pet = (v: unknown) =>
  obj(v) &&
  str(v.id, 100) &&
  str(v.name, 20) &&
  v.name.trim().length > 0 &&
  one(v.species, SPECIES) &&
  (v.speciesName === undefined || str(v.speciesName, 20)) &&
  (v.species !== "other" || (str(v.speciesName, 20) && v.speciesName.trim().length > 0)) &&
  str(v.personality, 60) && v.personality.trim().length > 0 &&
  (v.personalitySource === undefined || one(v.personalitySource, ["tag", "custom", "questionnaire"])) &&
  questionnaire(v.questionnaire) &&
  (v.personalitySource !== "questionnaire" || v.questionnaire !== undefined) &&
  optionalInt(v.ageMonths, 1200) &&
  optionalDate(v.ageRecordedAt) &&
  optionalDate(v.joinedAt) &&
  (v.routeSource === undefined || one(v.routeSource, ["age", "manual"])) &&
  (v.routeSource !== "age" || ((v.species === "cat" || v.species === "dog") &&
    v.route === (v.ageMonths !== undefined && (v.ageMonths as number) < 12 ? "campus" : "work"))) &&
  one(v.route, ["work", "campus"]) &&
  str(v.role, 30) &&
  (v.homeDate === undefined || isHomeDate(v.homeDate)) &&
  (v.birthDate === undefined || isPastDay(v.birthDate)) &&
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
const routine = (v: unknown) =>
  obj(v) &&
  str(v.id, 100) &&
  typeof v.activity === "string" &&
  (v.activity === "custom"
    ? str(v.label, MAX_LABEL) && v.label.trim().length > 0
    : isActivity(v.activity) && v.label === undefined) &&
  isTime(v.time) &&
  Array.isArray(v.days) &&
  v.days.length > 0 &&
  v.days.length <= 7 &&
  new Set(v.days).size === v.days.length &&
  v.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
  typeof v.enabled === "boolean" &&
  timestamp(v.createdAt) &&
  optionalDate(v.lastDone) &&
  optionalDate(v.snoozedUntil);
function pawsona(v: unknown) {
  if (v === undefined) return true;
  if (!obj(v) || v.version !== 1 || !one(v.temper, TEMPERS) || !obj(v.scores)) return false;
  const scores = v.scores;
  return Object.keys(scores).every((key) => one(key, TEMPERS)) &&
    TEMPERS.every((key) => boundedInt(scores[key], PAWSONA_QUESTIONS.length)) &&
    TEMPERS.reduce((sum, key) => sum + (scores[key] as number), 0) === PAWSONA_QUESTIONS.length &&
    timestamp(v.takenAt);
}
const ids = (v: unknown, max: number) =>
  v === undefined || (Array.isArray(v) && v.length <= max && v.every((x) => str(x, 200)));
const circle = (v: unknown) => obj(v) && ids(v.hiddenNpcs, 7) && ids(v.removed, 500);
const preferences = (v: unknown) => v === undefined || (obj(v) &&
  ["homeAsBirthday", "randomStyle", "homeExtras", "bondsHomeOnly"].every((key) => v[key] === undefined || typeof v[key] === "boolean"));
const TONE_LIST = ["good", "neutral", "bad"];
const together = (v: unknown, self: unknown) => v === undefined || (obj(v) && one(v.tone, TONE_LIST) &&
  Array.isArray(v.pets) && v.pets.length > 0 && v.pets.length < MAX_PETS && new Set(v.pets).size === v.pets.length &&
  v.pets.every((p) => str(p, 100) && p !== self));
/** One pet and everything that belongs to it: the current pet's fields, or an entry in household. */
function bundle(v: Record<string, unknown>): boolean {
  if (!pet(v.pet) || !Array.isArray(v.events) || v.events.length > 1000) return false;
  const owner = (v.pet as { id: string }).id;
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
        (e.occurredOn === undefined || isPastDay(e.occurredOn)) &&
        optionalDate(e.savedAt) && optionalDate(e.editedAt) &&
        obj(e.petSnapshot) &&
        pet(e.petSnapshot) &&
        stories(e.stories) &&
        one(e.selectedStyle, STYLES) &&
        typeof e.published === "boolean" &&
        e.petSnapshot.id === owner &&
        together(e.together, owner),
    )
  )
    return false;
  if (new Set(v.events.map((e) => e.id)).size !== v.events.length) return false;
  if (
    v.routines !== undefined &&
    !(Array.isArray(v.routines) && v.routines.length <= MAX_ROUTINES && v.routines.every(routine) &&
      new Set(v.routines.map((r) => (r as { id: string }).id)).size === v.routines.length)
  )
    return false;
  if (!pawsona(v.pawsona)) return false;
  if (v.mailRead !== undefined && !(typeof v.mailRead === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.mailRead))) return false;
  if (v.mailReadMonth !== undefined && !(typeof v.mailReadMonth === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.mailReadMonth))) return false;
  if (v.circle !== undefined && !circle(v.circle)) return false;
  if (v.sounds !== undefined) {
    if (!Array.isArray(v.sounds) || v.sounds.length > MAX_SOUNDS || !v.sounds.every((s) =>
      obj(s) && str(s.id, 100) && (s.id as string).length > 0 && s.petId === owner &&
      str(s.title, 40) && (s.title as string).trim().length > 0 && str(s.note, 300) &&
      isSoundDay(s.recordedOn) && str(s.createdAt, 40) && Number.isFinite(Date.parse(s.createdAt as string)) &&
      optionalInt(s.ageMonths, 1200) && one(s.stage, SOUND_STAGES) && one(s.source, ["recording", "video"]) &&
      typeof s.duration === "number" && Number.isFinite(s.duration) && s.duration >= 0.1 && s.duration <= MAX_SOUND_SECONDS + 0.5 &&
      validSoundAudio(s.audio))) return false;
    if (new Set(v.sounds.map((s) => s.id)).size !== v.sounds.length) return false;
  }
  return true;
}
const soundBytes = (v: Record<string, unknown>) =>
  Array.isArray(v.sounds) ? v.sounds.reduce((n: number, s: { audio: string }) => n + s.audio.length, 0) : 0;
const bond = (v: unknown) => obj(v) && str(v.a, 100) && str(v.b, 100) && (v.a as string) < (v.b as string) &&
  one(v.level, BOND_LEVELS) && !((v.a as string).startsWith("npc:") && (v.b as string).startsWith("npc:"));
export function isAppState(v: unknown): v is AppState {
  if (!obj(v) || v.schemaVersion !== 1 || typeof v.demo !== "boolean") return false;
  if (v.pet === null) {
    if (!Array.isArray(v.events) || v.events.length > 0) return false;
    if (v.sounds !== undefined && !(Array.isArray(v.sounds) && v.sounds.length === 0)) return false;
  } else if (!bundle(v)) return false;
  if (!preferences(v.preferences)) return false;
  if (v.mailReminder !== undefined && typeof v.mailReminder !== "boolean") return false;
  if (v.backup !== undefined && !(obj(v.backup) && optionalDate(v.backup.lastAt) && optionalDate(v.backup.snoozedUntil))) return false;
  if (v.household !== undefined) {
    if (!Array.isArray(v.household) || v.household.length >= MAX_PETS || v.pet === null ||
        !v.household.every((b) => obj(b) && bundle(b))) return false;
    const ids = [(v.pet as { id: string }).id, ...v.household.map((b) => (b.pet as { id: string }).id)];
    if (new Set(ids).size !== ids.length) return false;
  }
  const bundles = [v, ...((v.household as Record<string, unknown>[] | undefined) ?? [])];
  if (bundles.some((b) => soundBytes(b) > MAX_SOUND_TOTAL)) return false;
  if (v.bonds !== undefined && !(Array.isArray(v.bonds) && v.bonds.length <= MAX_BONDS && v.bonds.every(bond) &&
      new Set(v.bonds.map((b) => `${b.a}|${b.b}`)).size === v.bonds.length)) return false;
  return (
    v.draft === null ||
    (obj(v.draft) &&
      str(v.draft.id, 100) &&
      (v.draft.occurredOn === undefined || str(v.draft.occurredOn, 10)) &&
      str(v.draft.description, 500) &&
      one(v.draft.category, CATEGORIES) &&
      one(v.draft.selectedStyle, STYLES) &&
      photo(v.draft.photo) &&
      typeof v.draft.published === "boolean" &&
      (v.draft.expressionNeedsReview === undefined || typeof v.draft.expressionNeedsReview === "boolean") &&
      (v.draft.stories === undefined || stories(v.draft.stories)) &&
      (v.draft.signature === undefined || str(v.draft.signature, 1500)) &&
      together(v.draft.together, (v.pet as { id: string } | null)?.id))
  );
}
