import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRandomBytes } from "expo-crypto";
import { AppState } from "../domain/types";
import { MAX_BACKUP_BYTES, codeFromBytes, parseBackup } from "../domain/backup";
import { allEvents } from "../domain/household";
import { t } from "../i18n/core";

// Cloud backup lives on the same gateway as AI (docs/03 ADR-007); without an address it is hidden.
const API = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
const KEY = "pawnote.cloud";
export const cloudAvailable = !!API;

/** This device's link to its cloud copy. Kept apart from the diary so a JSON backup never carries the code. */
export interface CloudAccount { code: string; lastAt?: string; events?: number; bytes?: number }
export interface CloudMeta { savedAt: string; pet: string; events: number; bytes: number }

export async function loadAccount(): Promise<CloudAccount | null> {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    const value: unknown = saved ? JSON.parse(saved) : null;
    return value && typeof (value as CloudAccount).code === "string" ? (value as CloudAccount) : null;
  } catch {
    return null;
  }
}
// Settings and the background upload both read the account; each change tells the other.
const listeners = new Set<(account: CloudAccount | null) => void>();
export function onAccountChange(listener: (account: CloudAccount | null) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export async function saveAccount(account: CloudAccount) {
  await AsyncStorage.setItem(KEY, JSON.stringify(account));
  listeners.forEach((l) => l(account));
}
export async function forgetAccount() {
  await AsyncStorage.removeItem(KEY);
  listeners.forEach((l) => l(null));
}
export const newCode = () => codeFromBytes(getRandomBytes(20));

const auth = (code: string) => ({ authorization: `Bearer ${code}` });
async function call(path: string, init: RequestInit): Promise<Response> {
  if (!API) throw new Error(t("云端备份还没有接通。"));
  try {
    return await fetch(`${API}${path}`, init);
  } catch {
    throw new Error(t("连不上云端，请检查网络后重试。"));
  }
}
function failure(response: Response): Error {
  if (response.status === 401) return new Error(t("恢复码不对，请检查后重试。"));
  if (response.status === 404) return new Error(t("这个恢复码下面还没有云端备份。"));
  if (response.status === 413) return new Error(t("数据超过 20 MB，暂时没法传到云端，请导出 JSON 备份。"));
  if (response.status === 429) return new Error(t("今天云端操作太多了，明天再试。"));
  return new Error(t("云端暂时出错了，请稍后再试。"));
}

/** Uploads everything on this device, replacing the cloud copy, and remembers when. */
export async function uploadBackup(state: AppState, code: string): Promise<CloudMeta> {
  const body = JSON.stringify(state);
  const bytes = new TextEncoder().encode(body).length;
  if (bytes > MAX_BACKUP_BYTES) throw new Error(t("数据超过 20 MB，暂时没法传到云端，请导出 JSON 备份。"));
  const events = allEvents(state).length;
  const response = await call("/v1/backup", {
    method: "PUT",
    headers: {
      ...auth(code),
      "content-type": "application/json",
      "x-backup-pet": encodeURIComponent(state.pet?.name ?? ""),
      "x-backup-events": String(events),
    },
    body,
  });
  if (!response.ok) throw failure(response);
  const { backup } = (await response.json()) as { backup: CloudMeta };
  await saveAccount({ code, lastAt: backup.savedAt, events, bytes });
  return backup;
}
export async function downloadBackup(code: string): Promise<AppState> {
  const response = await call("/v1/backup", { headers: auth(code) });
  if (!response.ok) throw failure(response);
  return parseBackup(await response.text());
}
export async function cloudMeta(code: string): Promise<CloudMeta | null> {
  const response = await call("/v1/backup/meta", { headers: auth(code) });
  if (response.status === 404) return null;
  if (!response.ok) throw failure(response);
  return ((await response.json()) as { backup: CloudMeta }).backup;
}
export async function deleteCloud(code: string): Promise<void> {
  const response = await call("/v1/backup", { method: "DELETE", headers: auth(code) });
  if (!response.ok) throw failure(response);
  await forgetAccount();
}
