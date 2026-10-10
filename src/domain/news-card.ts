import { LifeEvent, formatDate } from "./types";
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
export const wrap = (s: string, width: number): string[] =>
  s.split("\n").flatMap((line) => {
    const chars = Array.from(line);
    return chars.length
      ? Array.from({ length: Math.ceil(chars.length / width) }, (_, i) =>
          chars.slice(i * width, (i + 1) * width).join(""),
        )
      : [""];
  });
export function newsSVG(event: LifeEvent): string {
  const title = wrap(event.stories.news.title, 19);
  const lines = wrap(event.stories.news.text, 29);
  const picture =
    event.photo && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(event.photo)
      ? `<image href="${event.photo}" x="40" y="${190 + title.length * 45}" width="640" height="320" preserveAspectRatio="xMidYMid slice"/>`
      : "";
  const start = 220 + title.length * 45 + (picture ? 340 : 0);
  const height = start + lines.length * 32 + 120;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height}" viewBox="0 0 720 ${height}"><rect width="720" height="${height}" fill="#fff9ef"/><g font-family="Arial, sans-serif" fill="#263830"><text x="40" y="65" font-size="42" font-weight="bold">今日喵闻</text><text x="40" y="103" font-size="17">${escapeXML(formatDate(event.createdAt))} · ${escapeXML(event.petSnapshot.name)} 的生活特刊</text><path d="M40 125H680" stroke="#263830" stroke-width="3"/>${title.map((t, i) => `<text x="40" y="${180 + i * 45}" font-size="31" font-weight="bold">${escapeXML(t)}</text>`).join("")}${picture}${lines.map((t, i) => `<text x="40" y="${start + i * 32}" font-size="21">${escapeXML(t)}</text>`).join("")}<path d="M40 ${height - 75}H680" stroke="#263830"/><text x="40" y="${height - 40}" font-size="16">爪记 Pawnote · ${event.stories.news.generator === "ai" ? "AI 生成" : "模板生成"} · 虚构娱乐报道</text></g></svg>`;
}
