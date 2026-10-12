import { t } from "../i18n/core";
import { AppState, Pet, SoundMemory, SoundStage, SOUND_STAGES, id } from "./types";

export const MAX_SOUND_SECONDS = 60;
export const MAX_SOUND_BYTES = 2 * 1024 * 1024;
export const MAX_SOUND_TOTAL = 12 * 1024 * 1024; // Base64 characters, included in the 20 MB backup.
export const MAX_SOUNDS = 100;
export const SOUND_STAGE_LABELS: Record<SoundStage, string> = {
  baby: "幼年", young: "少年", adult: "成年", senior: "熟龄", unknown: "待标记",
};
export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function isSoundDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return Number.isFinite(d.getTime()) && localDay(d) === value;
}
/** Month resolution matches the pet profile. Historical dates preserve historical age. */
export function soundAge(pet: Pet, day: string): number | undefined {
  if (pet.ageMonths === undefined || !isSoundDay(day)) return undefined;
  if (!pet.ageRecordedAt) return day === localDay() ? pet.ageMonths : undefined;
  const anchor = new Date(pet.ageRecordedAt), target = new Date(`${day}T12:00:00`);
  let delta = (target.getFullYear() - anchor.getFullYear()) * 12 + target.getMonth() - anchor.getMonth();
  if (delta > 0 && target.getDate() < anchor.getDate()) delta--;
  if (delta < 0 && target.getDate() > anchor.getDate()) delta++;
  const age = pet.ageMonths + delta;
  return age < 0 ? undefined : Math.min(age, 1200);
}
// Album grouping defaults; owners can choose the stage themselves.
export const stageForAge = (months?: number): SoundStage => months === undefined ? "unknown"
  : months < 6 ? "baby" : months < 12 ? "young" : months < 84 ? "adult" : "senior";
export const soundTime = (seconds: number) => {
  const n = Math.max(0, Math.floor(seconds));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
};
export function validSoundAudio(value: unknown): value is string {
  return typeof value === "string" && value.length <= Math.ceil(MAX_SOUND_BYTES / 3) * 4 + 80 &&
    /^data:audio\/(mp4|m4a|wav|webm|ogg|mpeg)(;codecs=[\w.,-]+)?;base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}
export function soundRange(startText: string, lengthText: string, total: number) {
  const start = startText.trim() ? Number(startText) : 0;
  const duration = lengthText.trim() ? Number(lengthText) : NaN;
  if (!Number.isFinite(start) || start < 0 || !Number.isFinite(duration) || duration < 0.5 || duration > MAX_SOUND_SECONDS ||
      !Number.isFinite(total) || start >= total || start + duration > total + 0.1)
    throw new Error(t("请填写有效片段：开始秒数需在视频内，时长为 0.5–60 秒。"));
  return { start, duration: Math.min(duration, total - start) };
}
export function addSound(state: AppState, input: Omit<SoundMemory, "id" | "petId" | "createdAt">): AppState {
  if (!state.pet) throw new Error(t("请先创建宠物档案。"));
  if (!input.title.trim() || input.title.trim().length > 40 || input.note.length > 300 ||
      !isSoundDay(input.recordedOn) || input.recordedOn > localDay() || !SOUND_STAGES.includes(input.stage) ||
      (input.ageMonths !== undefined && (!Number.isInteger(input.ageMonths) || input.ageMonths < 0 || input.ageMonths > 1200)) ||
      !Number.isFinite(input.duration) || input.duration < 0.1 || input.duration > MAX_SOUND_SECONDS + 0.5 ||
      !["recording", "video"].includes(input.source) || !validSoundAudio(input.audio))
    throw new Error(t("请检查标题、日期、月龄和声音片段。"));
  const sounds = state.sounds ?? [];
  if (sounds.length >= MAX_SOUNDS || sounds.reduce((n, s) => n + s.audio.length, input.audio.length) > MAX_SOUND_TOTAL)
    throw new Error(t("声音相册空间已满，请先导出备份，再删除部分片段。"));
  const next = { ...state, sounds: [...sounds, { ...input, title: input.title.trim(), note: input.note.trim(), id: id(), petId: state.pet.id, createdAt: new Date().toISOString() }] };
  if (JSON.stringify(next).length > 20 * 1024 * 1024)
    throw new Error(t("本机记录已接近备份容量，请先导出备份并整理记录。"));
  return next;
}
