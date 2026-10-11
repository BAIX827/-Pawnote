import { getLang, t } from "../i18n/core";
import { escapeXML, wrap as wrapChars } from "./news-card";
import type { Mail } from "./paw-mail";
import { pawsonaCard, type PawsonaResult } from "./pawsona";
import { CATEGORY_LABELS, Pet } from "./types";

// Web export for the 爪格 and 爪信 cards, drawn in the orange-pop style (docs/12): cream page,
// one colour block with a thick ink outline and a hard offset shadow.
const INK = "#111111";
const W = 720;
const safeAvatar = (pet: Pet) =>
  pet.avatar && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(pet.avatar) ? pet.avatar : undefined;
// English lines are roughly twice as many characters per width as Chinese ones.
const width = (zh: number) => (getLang() === "en" ? Math.round(zh * 1.9) : zh);
/** Chinese breaks anywhere; English breaks between words. */
function wrap(s: string, max: number): string[] {
  if (getLang() !== "en") return wrapChars(s, max);
  const out: string[] = [];
  let line = "";
  for (const word of s.split(/\s+/)) {
    if (line && line.length + 1 + word.length > max) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  return [...out, line];
}
const kicker = (zh: string, latin: string) => (getLang() === "zh" ? `${zh} · ${latin}` : t(zh));
const block = (x: number, y: number, w: number, h: number, fill: string) =>
  `<rect x="${x + 8}" y="${y + 8}" width="${w}" height="${h}" rx="18" fill="${INK}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill}" stroke="${INK}" stroke-width="4"/>`;
const svg = (height: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}"><rect width="${W}" height="${height}" fill="#FFF3DF"/><g font-family="Arial, sans-serif" fill="${INK}">${body}</g></svg>`;

export function pawsonaSVG(pet: Pet, result: Pick<PawsonaResult, "temper" | "scores">): string {
  const card = pawsonaCard(pet, result);
  const intro = wrap(card.intro, width(24));
  const parts: string[] = [];
  const avatar = safeAvatar(pet);
  parts.push(`<text x="40" y="70" font-size="20" letter-spacing="4">${escapeXML(kicker("爪格测试", "PAWSONA"))}</text>`);
  const top = 100, headH = 230;
  parts.push(block(40, top, W - 88, headH, card.color));
  if (avatar)
    parts.push(`<clipPath id="a"><circle cx="560" cy="${top + 115}" r="80"/></clipPath><image href="${avatar}" x="480" y="${top + 35}" width="160" height="160" clip-path="url(#a)" preserveAspectRatio="xMidYMid slice"/><circle cx="560" cy="${top + 115}" r="80" fill="none" stroke="${INK}" stroke-width="4"/>`);
  parts.push(`<text x="70" y="${top + 70}" font-size="22" letter-spacing="6">${escapeXML(card.code)}</text>`);
  parts.push(`<text x="70" y="${top + 140}" font-size="${getLang() === "en" ? 46 : 58}" font-weight="bold">${escapeXML(card.name)}</text>`);
  parts.push(`<text x="70" y="${top + 190}" font-size="24">${escapeXML(pet.name)}</text>`);
  let y = top + headH + 70;
  for (const line of intro) {
    parts.push(`<text x="40" y="${y}" font-size="24">${escapeXML(line)}</text>`);
    y += 36;
  }
  y += 20;
  for (const bar of card.bars) {
    parts.push(`<text x="40" y="${y}" font-size="20" font-weight="bold">${escapeXML(bar.label)}</text><text x="680" y="${y}" font-size="20" text-anchor="end">${bar.percent}%</text>`);
    parts.push(`<rect x="40" y="${y + 12}" width="640" height="22" rx="11" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/><rect x="40" y="${y + 12}" width="${Math.max(22, 6.4 * bar.percent)}" height="22" rx="11" fill="${card.color}" stroke="${INK}" stroke-width="3"/>`);
    y += 66;
  }
  y += 10;
  for (const [label, text] of [[t("使用说明"), card.manual], [t("最佳拍档"), card.match]] as const) {
    parts.push(`<text x="40" y="${y}" font-size="18" letter-spacing="3">${escapeXML(label)}</text>`);
    for (const line of wrap(text, width(26))) {
      y += 34;
      parts.push(`<text x="40" y="${y}" font-size="22" font-weight="bold">${escapeXML(line)}</text>`);
    }
    y += 50;
  }
  parts.push(`<path d="M40 ${y}H680" stroke="${INK}" stroke-width="2"/>`);
  y += 34;
  parts.push(`<text x="40" y="${y}" font-size="16">${escapeXML(t("爪记 Pawnote · 娱乐测试，不是行为评估"))}</text>`);
  return svg(y + 40, parts.join(""));
}

export function mailSVG(pet: Pet, mail: Mail): string {
  const parts: string[] = [];
  parts.push(`<text x="40" y="70" font-size="20" letter-spacing="4">${escapeXML(kicker("爪信", "PAW MAIL"))}</text>`);
  parts.push(`<text x="40" y="130" font-size="${getLang() === "en" ? 40 : 52}" font-weight="bold">${escapeXML(mail.title)}</text>`);
  parts.push(`<text x="40" y="172" font-size="20">${escapeXML(periodLabel(mail))}</text>`);
  let y = 210;
  if (!mail.empty) {
    const stats = [
      { n: String(mail.entries), label: t("条记录") },
      { n: String(mail.days), label: t("天有记录") },
      { n: String(mail.photos), label: t("张照片") },
    ];
    stats.forEach((s, i) => {
      const x = 40 + i * 216;
      parts.push(block(x, y, 196, 130, ["#FF7A1A", "#C6F432", "#B9A6FF"][i]));
      parts.push(`<text x="${x + 20}" y="${y + 72}" font-size="52" font-weight="bold">${s.n}</text><text x="${x + 20}" y="${y + 108}" font-size="18">${escapeXML(s.label)}</text>`);
    });
    y += 180;
  }
  const lines: [string, string][] = [];
  lines.push(["", mail.greeting]);
  if (mail.top && mail.topLine) lines.push([t("最常做的事：{what}", { what: t(CATEGORY_LABELS[mail.top]) }), mail.topLine]);
  if (mail.quietLine) lines.push(["", mail.quietLine]);
  if (mail.complaints[0]) lines.push([t("告状"), mail.complaints[0]]);
  if (mail.praise) lines.push([t("表扬"), mail.praise]);
  lines.push(["", mail.closing]);
  for (const [label, text] of lines) {
    if (label) {
      y += 10;
      parts.push(`<text x="40" y="${y}" font-size="18" letter-spacing="3">${escapeXML(label)}</text>`);
    }
    for (const line of wrap(text, width(26))) {
      y += 36;
      parts.push(`<text x="40" y="${y}" font-size="24">${escapeXML(line)}</text>`);
    }
    y += 24;
  }
  if (mail.stars) {
    y += 20;
    parts.push(`<text x="40" y="${y}" font-size="18" letter-spacing="3">${escapeXML(t("给{owner}打分", { owner: mail.owner }))}</text>`);
    y += 50;
    parts.push(`<text x="40" y="${y}" font-size="44" fill="#FF7A1A" stroke="${INK}" stroke-width="2">${"★".repeat(mail.stars)}${"☆".repeat(5 - mail.stars)}</text>`);
    y += 20;
  }
  y += 30;
  parts.push(`<text x="680" y="${y}" font-size="24" font-weight="bold" text-anchor="end">— ${escapeXML(pet.name)} 🐾</text>`);
  y += 40;
  parts.push(`<path d="M40 ${y}H680" stroke="${INK}" stroke-width="2"/>`);
  y += 34;
  parts.push(`<text x="40" y="${y}" font-size="16">${escapeXML(t("爪记 Pawnote · 按已保存的记录写成"))}</text>`);
  return svg(y + 40, parts.join(""));
}

/** "Oct 5 – Oct 11" for the period a letter covers. */
export function periodLabel(mail: Pick<Mail, "start" | "end" | "kind">): string {
  const loc = getLang() === "zh" ? "zh-CN" : "en-US";
  const last = new Date(mail.end.getTime() - 1);
  const f = (d: Date) => d.toLocaleDateString(loc, { month: "short", day: "numeric" });
  return mail.kind === "year" ? `${mail.start.getFullYear()} · ${f(mail.start)} – ${f(last)}` : `${f(mail.start)} – ${f(last)}`;
}
