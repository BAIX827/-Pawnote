import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { MAX_BACKUP_BYTES, parseBackup } from "../domain/backup";

export async function chooseBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"], copyToCacheDirectory: true, multiple: false,
  });
  if (result.canceled) return;
  const file = new File(result.assets[0].uri);
  try {
    if (file.size > MAX_BACKUP_BYTES)
      throw new Error("备份过大，请选择 20 MB 以内的文件。");
    return parseBackup(await file.text());
  } finally {
    if (file.exists) file.delete();
  }
}
