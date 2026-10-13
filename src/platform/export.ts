import { View } from "react-native";
import { LifeEvent } from "../domain/types";
import { NewsTemplate, newsSVG } from "../domain/news-card";
import { t } from "../i18n/core";
function download(content: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

let prepared: { svg: string; image: Promise<Blob> } | undefined;
/** Prepare before the click so Web Share keeps the browser's user activation. */
export function prepareNewsImage(event: LifeEvent, template?: NewsTemplate): Promise<Blob> {
  const svg = newsSVG(event, template);
  if (prepared?.svg === svg) return prepared.image;
  const image = new Promise<Blob>((resolve, reject) => {
    const picture = new Image();
    const timeout = setTimeout(() => reject(new Error(t("图片生成失败，请重试。"))), 20000);
    picture.onerror = () => { clearTimeout(timeout); reject(new Error(t("图片生成失败，请重试。"))); };
    picture.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(2, Math.sqrt(16000000 / (picture.naturalWidth * picture.naturalHeight)));
        canvas.width = Math.round(picture.naturalWidth * scale);
        canvas.height = Math.round(picture.naturalHeight * scale);
        const context = canvas.getContext("2d");
        if (!context) throw new Error(t("图片生成失败，请重试。"));
        context.drawImage(picture, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          clearTimeout(timeout);
          if (blob) resolve(blob);
          else reject(new Error(t("图片生成失败，请重试。")));
        }, "image/png");
      } catch (error) { clearTimeout(timeout); reject(error); }
    };
    picture.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  prepared = { svg, image };
  void image.catch(() => { if (prepared?.image === image) prepared = undefined; });
  return image;
}

type ImageShareBridge = { postMessage: (data: { png: string }) => Promise<unknown> };
const macImageShare = () => (window as Window & {
  webkit?: { messageHandlers?: { pawnoteImageShare?: ImageShareBridge } };
}).webkit?.messageHandlers?.pawnoteImageShare;

export function canShareNews(): boolean {
  return !!macImageShare() || !!(typeof navigator.share === "function" && navigator.canShare?.({
    files: [new File([new Uint8Array()], "pawnote.png", { type: "image/png" })],
  }));
}

export async function exportNews(event: LifeEvent, _view?: View | null, template?: NewsTemplate) {
  downloadBlob(await prepareNewsImage(event, template), `爪报-${event.id}.png`);
}

export async function shareNews(event: LifeEvent, _view?: View | null, template?: NewsTemplate) {
  const blob = await prepareNewsImage(event, template);
  const bridge = macImageShare();
  if (bridge) {
    const png = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(new Error(t("图片生成失败，请重试。")));
      reader.readAsDataURL(blob);
    });
    await bridge.postMessage({ png });
    return "opened";
  }
  const file = new File([blob], `爪报-${event.id}.png`, { type: "image/png" });
  if (typeof navigator.share !== "function" || !navigator.canShare?.({ files: [file] }))
    throw new Error(t("当前浏览器支持保存图片，请保存后分享。"));
  try { await navigator.share({ files: [file], title: event.stories.news.title }); }
  catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    throw error;
  }
}
/** A share card (爪格, 爪信): the web saves the SVG; the app shares a PNG of the view instead. */
export async function exportCard(svg: string, filename: string, _view?: View | null, _title?: string) {
  download(svg, `${filename}.svg`, "image/svg+xml;charset=utf-8");
}
export async function exportBackup(content: string) {
    download(content, `pawnote-backup-${Date.now()}.json`, "application/json");
}

/** Photos and audio travel inside the offline album. */
export async function exportKeepsake(content: string, filename: string) {
  download(content, `${filename}.html`, "text/html;charset=utf-8");
}
