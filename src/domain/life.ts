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
// One title per level, the same names the 爪迹 route uses (docs/01 8.25).
const TITLES = {
  work: ["职场萌新", "转正新人", "正式营业员", "金牌员工", "资深摸鱼专家"],
  campus: ["校园新生", "小测达人", "校园活跃分子", "课代表", "校园传说"],
} as const;
export const titleFor = (level: number, route: "campus" | "work") =>
  t(TITLES[route][Math.min(Math.max(level, 1), 5) - 1]);
