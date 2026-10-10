import { AppState } from "./types";
import { isAppState } from "../data/validation";

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

export function parseBackup(content: string): AppState {
  if (content.length > MAX_BACKUP_BYTES)
    throw new Error("备份过大，请选择 20 MB 以内的文件。");
  let value: unknown;
  try {
    value = JSON.parse(content.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("文件读取失败，请选择毛孩营业中导出的 JSON 备份。");
  }
  if (!isAppState(value))
    throw new Error("备份内容或版本无法读取，请检查文件是否完整。");
  return value;
}
