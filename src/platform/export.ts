import { Platform, Share } from "react-native";
import { LifeEvent } from "../domain/types";
import { newsSVG } from "../domain/news-card";
function download(content: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export async function exportNews(event: LifeEvent) {
  if (Platform.OS === "web")
    download(
      newsSVG(event),
      `今日喵闻-${event.id}.svg`,
      "image/svg+xml;charset=utf-8",
    );
  else
    await Share.share({
      title: "今日喵闻",
      message: `${event.stories.news.title}\n\n${event.stories.news.text}\n毛孩营业中 · 模板生成 · 虚构娱乐报道`,
    });
}
export async function exportBackup(content: string) {
  if (Platform.OS === "web")
    download(content, `paw-life-backup-${Date.now()}.json`, "application/json");
  else await Share.share({ title: "毛孩营业中 · 数据备份", message: content });
}
