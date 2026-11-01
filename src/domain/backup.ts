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

// Cloud backup (docs/01 8.38): the recovery code is the account. 20 characters from 32 letters and digits
// without 0/O/1/I, shown as five groups of four. Same alphabet as server/core.mjs.
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function codeFromBytes(bytes: Uint8Array): string {
  if (bytes.length < 20) throw new Error("need 20 random bytes");
  // 256 is a multiple of 32, so taking each byte modulo 32 keeps every letter equally likely.
  const raw = Array.from(bytes.slice(0, 20), (b) => CODE_ALPHABET[b % 32]).join("");
  return formatCode(raw);
}
/** Accepts what a person types (any case, spaces or dashes) and returns the code in groups, or null. */
export function normalizeCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[\s-]/g, "");
  if (raw.length !== 20 || [...raw].some((c) => !CODE_ALPHABET.includes(c))) return null;
  return formatCode(raw);
}
const formatCode = (raw: string) => raw.match(/.{4}/g)!.join("-");

/** Upload automatically once a day at most, only when something changed, and never example or empty data. */
export function cloudDue(state: AppState, lastAt: string | undefined, now = new Date()): boolean {
  if (!state.pet || state.demo) return false;
  if (!lastAt) return true;
  const last = Date.parse(lastAt);
  return now.getTime() - last > DAY &&
    allEvents(state).some((e) => Date.parse(e.savedAt ?? e.createdAt) > last);
}
