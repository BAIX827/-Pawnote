import { t } from "../i18n/core";
import { AppState } from "./types";
import { isAppState } from "../data/validation";
import { allEvents } from "./household";

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

export function parseBackup(content: string): AppState {
  if (content.length > MAX_BACKUP_BYTES)
    throw new Error(t("备份过大，请选择 20 MB 以内的文件。"));
  let value: unknown;
  try {
    value = JSON.parse(content.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error(t("文件读取失败，请选择爪记导出的 JSON 备份。"));
  }
  if (!isAppState(value))
    throw new Error(t("备份内容或版本无法读取，请检查文件是否完整。"));
  return value;
}

// The home reminder to keep a copy (docs/01 8.27): ten entries and never backed up, or a month since the
// last backup with new entries after it. "Later" rests it for two weeks. Example data never asks.
export const BACKUP_FIRST_AFTER = 10;
const DAY = 86400000;
export function backupDue(state: AppState, now = new Date()): boolean {
  if (!state.pet || state.demo) return false;
  const snoozed = state.backup?.snoozedUntil;
  if (snoozed && Date.parse(snoozed) > now.getTime()) return false;
  const events = allEvents(state);
  const last = state.backup?.lastAt;
  if (!last) return events.length >= BACKUP_FIRST_AFTER;
  const lastAt = Date.parse(last);
  return now.getTime() - lastAt > 30 * DAY &&
    events.some((e) => Date.parse(e.savedAt ?? e.createdAt) > lastAt);
}
export const markBackedUp = (state: AppState, now = new Date()): AppState =>
  ({ ...state, backup: { lastAt: now.toISOString() } });
export const snoozeBackup = (state: AppState, now = new Date()): AppState =>
  ({ ...state, backup: { ...state.backup, snoozedUntil: new Date(now.getTime() + 14 * DAY).toISOString() } });
