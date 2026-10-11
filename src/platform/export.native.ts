import { t } from "../i18n/core";
import { View } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { captureRef, releaseCapture } from "react-native-view-shot";
import { LifeEvent } from "../domain/types";
import type { NewsTemplate } from "../domain/news-card";

async function requireSharing() {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error(t("当前设备无法打开分享面板。"));
}
export async function exportNews(event: LifeEvent, view?: View | null, _template?: NewsTemplate) {
  if (!view) throw new Error(t("新闻卡正在准备，请稍后重试。"));
  await requireSharing();
  const uri = await captureRef(view, { format: "png", result: "tmpfile" });
  try {
    await Sharing.shareAsync(uri, {
      mimeType: "image/png", UTI: "public.png", dialogTitle: `${event.petSnapshot.name}的爪报`,
    });
  } finally {
    releaseCapture(uri);
  }
}
/** A share card (爪格, 爪信) as a PNG of the on-screen view; the SVG is for the web build. */
export async function exportCard(_svg: string, _filename: string, view?: View | null, title?: string) {
  if (!view) throw new Error(t("卡片正在准备，请稍后重试。"));
  await requireSharing();
  const uri = await captureRef(view, { format: "png", result: "tmpfile" });
  try {
    await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: title });
  } finally {
    releaseCapture(uri);
  }
}
export async function exportBackup(content: string) {
  await requireSharing();
  const file = new File(Paths.cache, `pawnote-backup-${Date.now()}.json`);
  try {
    file.create({ overwrite: true });
    file.write(content);
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json", UTI: "public.json", dialogTitle: "保存小动物数据备份",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
