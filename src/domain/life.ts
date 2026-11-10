import { t } from "../i18n/core";
import { isPastDay, newestEvents } from "./dates";
import { AppState, LifeEvent, Pet, emptyState } from "./types";
export function progress(events: LifeEvent[]) {
  const xp = new Set(events.map((e) => e.id)).size * 20;
  return {
    xp,
    level: Math.floor(xp / 100) + 1,
    current: xp % 100,
    toNext: 100 - (xp % 100),
  };
}
/** Compare actual timestamps so imported records also work with different UTC offsets. */
export const newestFirst = (events: LifeEvent[]) =>
  [...events].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

export function savePet(state: AppState, pet: Pet): AppState {
  return state.pet?.id === pet.id
    ? { ...state, pet, draft: null }
    : { ...emptyState(), ...(state.preferences && { preferences: state.preferences }), pet };
}
export function saveEvent(state: AppState, event: LifeEvent): AppState {
  if (!state.pet || event.petSnapshot.id !== state.pet.id)
    throw new Error(t("请先创建宠物。"));
  if (!event.description.trim() || event.description.length > 500)
    throw new Error(t("请填写 1–500 字的真实日常。"));
  if (
    Object.values(event.stories).some(
      (s) => !s.text.trim() || s.text.length > 2000,
    )
  )
    throw new Error(t("故事需要 1–2000 字。"));
  if (!Number.isFinite(Date.parse(event.createdAt)) ||
      (event.occurredOn !== undefined && !isPastDay(event.occurredOn)))
    throw new Error(t("记录日期请填写真实日期，且不晚于今天。"));
  const previous = state.events.find((e) => e.id === event.id);
  return {
    ...state,
    draft: previous ? state.draft : null,
    events: newestEvents([
      { ...event, petSnapshot: previous?.petSnapshot ?? event.petSnapshot,
        savedAt: previous?.savedAt ?? previous?.createdAt ?? event.savedAt ?? new Date().toISOString(),
        editedAt: previous ? new Date().toISOString() : undefined },
      ...state.events.filter((e) => e.id !== event.id),
    ]),
  };
}
export const deleteEvent = (state: AppState, eventId: string): AppState => ({
  ...state,
  events: state.events.filter((e) => e.id !== eventId),
});
/** Puts a just-deleted entry back, if its pet is still the current one (docs/01 8.27). */
export const restoreEvent = (state: AppState, event: LifeEvent): AppState =>
  state.pet?.id !== event.petSnapshot.id || state.events.some((e) => e.id === event.id)
    ? state
    : { ...state, events: newestEvents([event, ...state.events]) };
// One title per level, the same for every pet now that school and work are gone (docs/01 8.42).
const TITLES = ["爪爪镇新居民", "记录小能手", "日常观察员", "资深居民", "爪爪镇传说"] as const;
export const titleFor = (level: number) => t(TITLES[Math.min(Math.max(level, 1), 5) - 1]);

/** Every entry shows the pet's own voice; older entries that picked another voice switch over (docs/01 8.42). */
export function onlyDiary(state: AppState): AppState {
  const fix = (events: LifeEvent[]) =>
    events.some((e) => e.selectedStyle !== "diary") ? events.map((e) => ({ ...e, selectedStyle: "diary" as const })) : events;
  const events = fix(state.events);
  const household = state.household?.map((b) => ({ ...b, events: fix(b.events) }));
  const draft = state.draft && state.draft.selectedStyle !== "diary" ? { ...state.draft, selectedStyle: "diary" as const } : state.draft;
  return { ...state, events, draft, ...(household && { household }) };
}
