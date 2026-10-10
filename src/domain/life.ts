import { AppState, LifeEvent } from "./types";
export function progress(events: LifeEvent[]) {
  const xp = new Set(events.map((e) => e.id)).size * 20;
  return {
    xp,
    level: Math.floor(xp / 100) + 1,
    current: xp % 100,
    toNext: 100 - (xp % 100),
  };
}
export function saveEvent(state: AppState, event: LifeEvent): AppState {
  if (!state.pet || event.petSnapshot.id !== state.pet.id)
    throw new Error("请先创建宠物。");
  if (!event.description.trim() || event.description.length > 500)
    throw new Error("请填写 1–500 字的真实日常。");
  if (
    Object.values(event.stories).some(
      (s) => !s.text.trim() || s.text.length > 2000,
    )
  )
    throw new Error("故事需要 1–2000 字。");
  const previous = state.events.find((e) => e.id === event.id);
  return {
    ...state,
    draft: null,
    events: [
      { ...event, createdAt: previous?.createdAt ?? event.createdAt },
      ...state.events.filter((e) => e.id !== event.id),
    ],
  };
}
export const deleteEvent = (state: AppState, eventId: string): AppState => ({
  ...state,
  events: state.events.filter((e) => e.id !== eventId),
});
export const titleFor = (level: number, route: "campus" | "work") =>
  route === "work"
    ? level >= 5
      ? "资深摸鱼专家"
      : level >= 3
        ? "正式营业员"
        : "职场萌新"
    : level >= 5
      ? "校园传说"
      : level >= 3
        ? "校园活跃分子"
        : "校园新生";
