import { View } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { captureRef, releaseCapture } from "react-native-view-shot";
import { LifeEvent } from "../domain/types";

async function requireSharing() {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("当前设备无法打开分享面板。");
}
export async function exportNews(event: LifeEvent, view?: View | null) {
  if (!view) throw new Error("新闻卡正在准备，请稍后重试。");
  await requireSharing();
  const uri = await captureRef(view, { format: "png", result: "tmpfile" });
  try {
    await Sharing.shareAsync(uri, {
      mimeType: "image/png", UTI: "public.png", dialogTitle: `${event.petSnapshot.name}的今日喵闻`,
    });
  } finally {
    releaseCapture(uri);
  }
}
export async function exportBackup(content: string) {
  await requireSharing();
  const file = new File(Paths.cache, `paw-life-backup-${Date.now()}.json`);
  try {
    file.create({ overwrite: true });
    file.write(content);
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json", UTI: "public.json", dialogTitle: "保存毛孩数据备份",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
