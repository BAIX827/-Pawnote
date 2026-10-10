import * as DocumentPicker from "expo-document-picker";
import { MAX_BACKUP_BYTES, parseBackup } from "../domain/backup";

export async function chooseBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"], base64: false, multiple: false,
  });
  if (result.canceled) return;
  const file = result.assets[0].file;
  if (!file) throw new Error("文件读取失败，请重新选择。");
  if (file.size > MAX_BACKUP_BYTES)
    throw new Error("备份过大，请选择 20 MB 以内的文件。");
  return parseBackup(await file.text());
}
