import { View } from "react-native";
import { LifeEvent } from "../domain/types";
import { NewsTemplate, newsSVG } from "../domain/news-card";
function download(content: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export async function exportNews(event: LifeEvent, _view?: View | null, template?: NewsTemplate) {
  download(newsSVG(event, template), `爪报-${event.id}.svg`, "image/svg+xml;charset=utf-8");
}
/** A share card (爪格, 爪信): the web saves the SVG; the app shares a PNG of the view instead. */
export async function exportCard(svg: string, filename: string, _view?: View | null, _title?: string) {
  download(svg, `${filename}.svg`, "image/svg+xml;charset=utf-8");
}
export async function exportBackup(content: string) {
  download(content, `pawnote-backup-${Date.now()}.json`, "application/json");
}
