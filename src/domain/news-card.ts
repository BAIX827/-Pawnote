import { eventDate } from "./dates";
import { LifeEvent, formatDate } from "./types";
import { t } from "../i18n/core";
import { currency } from "./report";
import { isSensitive } from "./temper";

export const NEWS_TEMPLATES = ["daily", "extra", "wanted", "cover"] as const;
export type NewsTemplate = (typeof NEWS_TEMPLATES)[number];
/** The layout 爪报编辑部 opens on: a wanted poster for mischief, the extra edition otherwise (docs/01 8.24). */
export const defaultNewsTemplate = (event?: Pick<LifeEvent, "category">): NewsTemplate =>
  event?.category === "chaos" ? "wanted" : "extra";
/** A hard day gets a plain record card instead of a parody layout. */
export const isPlainNews = (event: LifeEvent) => isSensitive(event.description);
/** The mock bounty on a wanted poster: a steady number per entry, in the pet's own currency. */
export const bounty = (event: LifeEvent) =>
  `${((event.description.length % 9) + 1) * 10} ${currency(event.petSnapshot)}`;
/** The first sentence of the news text, used as a pull line on compact layouts. */
export const lead = (event: LifeEvent) =>
  (event.stories.news.text.split("\n").find((l) => l.trim()) ?? "").slice(0, 80);
export const escapeXML = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
/** Keep Latin words whole, with room sized for CJK glyphs; long single words still wrap. */
export const wrap = (s: string, width: number): string[] =>
  s.split("\n").flatMap((paragraph) => {
    const lines: string[] = [];
    let line = "", used = 0;
    const weight = (char: string) => /[^\x00-\xff]|[WMwm]/.test(char) ? 1 : /\s/.test(char) ? 0.35 : 0.65;
    for (const token of paragraph.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*|[^A-Za-z0-9]/gu) ?? []) {
      const size = Array.from(token).reduce((sum, char) => sum + weight(char), 0);
      if (line && used + size > width) { lines.push(line); line = ""; used = 0; }
      for (const char of token) {
        if (line && used + weight(char) > width) { lines.push(line); line = ""; used = 0; }
        line += char; used += weight(char);
      }
    }
    return [...lines, line];
  });
const INK = "#263830";
const safePhoto = (event: LifeEvent) =>
  event.photo && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(event.photo) ? event.photo : undefined;
const footer = (event: LifeEvent, plain = false) =>
  `${t("爪记 Pawnote")} · ${t(event.stories.news.generator === "ai" ? "AI 生成" : "模板生成")}${plain ? "" : ` · ${t("虚构娱乐报道")}`}`;
// The three extra layouts share one vertical flow: a header block, optional photo, then text.
function altSVG(event: LifeEvent, template: Exclude<NewsTemplate, "daily"> | "plain"): string {
  const photo = safePhoto(event), name = escapeXML(event.petSnapshot.name), date = escapeXML(formatDate(eventDate(event).toISOString()));
  const title = wrap(template === "plain" ? t("{name}的今日记录", { name: event.petSnapshot.name }) : event.stories.news.title, 16);
  const body = wrap(template === "cover" ? lead(event) : event.stories.news.text, 29);
  const bg = template === "wanted" ? "#F6E7C8" : template === "plain" ? "#FFFDF9" : "#FFF9EF";
  const parts: string[] = [];
  let y = 0;
  const text = (content: string, size: number, opts = "") =>
    parts.push(`<text x="${opts.includes("middle") ? 360 : 40}" y="${y}" font-size="${size}" ${opts}>${content}</text>`);
  if (template === "extra") {
    parts.push(`<rect width="720" height="120" fill="#E0483A"/><text x="40" y="82" font-size="60" font-weight="bold" fill="#FFFFFF">${escapeXML(t("号外"))} · ${escapeXML(t("爪报"))}</text>`);
    y = 165;
    text(`${date} · ${name}`, 18);
    y += 20;
  } else if (template === "wanted") {
    y = 130;
    text(escapeXML(t("通缉")), 110, 'font-weight="bold" text-anchor="middle"');
    y += 45;
    text(`WANTED · ${date}`, 20, 'text-anchor="middle" letter-spacing="4"');
    y += 25;
  } else if (template === "cover") {
    parts.push(photo
      ? `<image href="${photo}" x="0" y="0" width="720" height="620" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect width="720" height="620" fill="#FBE6A6"/>`);
    parts.push(`<text x="40" y="130" font-size="120" font-weight="bold" fill="#FFFFFF" stroke="${INK}" stroke-width="3">${escapeXML(t("爪报"))}</text><text x="44" y="170" font-size="20" fill="#FFFFFF" stroke="${INK}" stroke-width="0.6" letter-spacing="4">${name} · ${date}</text>`);
    y = 640;
  } else {
    y = 70;
    text(`${date}`, 18);
    y += 10;
  }
  if (photo && template === "wanted") {
    parts.push(`<rect x="150" y="${y}" width="420" height="420" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/><image href="${photo}" x="160" y="${y + 10}" width="400" height="400" preserveAspectRatio="xMidYMid slice"/>`);
    y += 440;
  }
  if (template === "wanted") {
    y += 40;
    text(`${escapeXML(t("事由"))}`, 18, 'letter-spacing="4"');
  }
  for (const line of title) {
    y += template === "extra" ? 56 : 48;
    text(escapeXML(line), template === "extra" ? 42 : 34, 'font-weight="bold"');
  }
  if (template === "wanted") {
    y += 50;
    text(`${escapeXML(t("悬赏"))}：${escapeXML(bounty(event))}`, 26, 'font-weight="bold"');
  }
  if (photo && (template === "extra" || template === "plain")) {
    y += 30;
    parts.push(`<image href="${photo}" x="40" y="${y}" width="640" height="320" preserveAspectRatio="xMidYMid slice"/>`);
    y += 320;
  }
  y += 24;
  for (const line of body) {
    y += 32;
    text(escapeXML(line), 21);
  }
  y += 50;
  parts.push(`<path d="M40 ${y}H680" stroke="${INK}"/>`);
  y += 34;
  text(escapeXML(footer(event, template === "plain")), 16);
  const height = y + 40;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height}" viewBox="0 0 720 ${height}"><rect width="720" height="${height}" fill="${bg}"/><g font-family="Arial, sans-serif" fill="${INK}">${parts.join("")}</g></svg>`;
}
export function newsSVG(event: LifeEvent, template: NewsTemplate = "daily"): string {
  if (isPlainNews(event)) return altSVG(event, "plain");
  if (template !== "daily") return altSVG(event, template);
  const title = wrap(event.stories.news.title, 19);
  const lines = wrap(event.stories.news.text, 29);
  const picture =
    event.photo && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(event.photo)
      ? `<image href="${event.photo}" x="40" y="${190 + title.length * 45}" width="640" height="320" preserveAspectRatio="xMidYMid slice"/>`
      : "";
  const start = 220 + title.length * 45 + (picture ? 340 : 0);
  const height = start + lines.length * 32 + 120;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height}" viewBox="0 0 720 ${height}"><rect width="720" height="${height}" fill="#fff9ef"/><g font-family="Arial, sans-serif" fill="#263830"><text x="40" y="65" font-size="42" font-weight="bold">${escapeXML(t("爪报"))}</text><text x="40" y="103" font-size="17">${escapeXML(formatDate(eventDate(event).toISOString()))} · ${escapeXML(t("来源：{name}的本人日常记录", { name: event.petSnapshot.name }))}</text><path d="M40 125H680" stroke="#263830" stroke-width="3"/>${title.map((t, i) => `<text x="40" y="${180 + i * 45}" font-size="31" font-weight="bold">${escapeXML(t)}</text>`).join("")}${picture}${lines.map((t, i) => `<text x="40" y="${start + i * 32}" font-size="21">${escapeXML(t)}</text>`).join("")}<path d="M40 ${height - 75}H680" stroke="#263830"/><text x="40" y="${height - 40}" font-size="16">${escapeXML(footer(event))}</text></g></svg>`;
}
