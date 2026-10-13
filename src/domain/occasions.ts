import { getLang, Lang, t } from "../i18n/core";
import { AppState, Pet, Preferences } from "./types";
import { dayDistance, eventDay, isPastDay, localDay, newestEvents } from "./dates";
import { escapeXML, wrap } from "./news-card";
import { ownerName } from "./story-engine";
import { isSensitive, temperOf } from "./temper";
import { remindersPaused } from "./paw-dates";

export type OccasionKind = "birthday" | "home";
export interface Occasion { kind: OccasionKind; day: string; years: number; inDays: number; birthdaySource?: "birth" | "home" }
export function birthdayDate(pet: Pet, preferences?: Preferences) {
  return pet.birthDate ?? (preferences?.homeAsBirthday === false ? undefined : pet.homeDate);
}
export function occasionForYear(pet: Pet, kind: OccasionKind, year: number, preferences?: Preferences): Occasion | undefined {
  const origin = kind === "birthday" ? birthdayDate(pet, preferences) : pet.homeDate;
  if (!isPastDay(origin) || !Number.isInteger(year) || year < Number(origin.slice(0, 4)) || year > 9999) return undefined;
  const [y, m, d] = origin.split("-").map(Number);
  // February 29 is observed on February 28 in non-leap years.
  const day = localDay(new Date(year, m - 1, Math.min(d, new Date(year, m, 0).getDate())));
  return { kind, day, years: year - y, inDays: dayDistance(localDay(), day),
    ...(kind === "birthday" ? { birthdaySource: pet.birthDate ? "birth" as const : "home" as const } : {}) };
}
export function nextOccasions(pet: Pet, now = new Date(), preferences?: Preferences) {
  return (["birthday", "home"] as const).flatMap((kind) => {
    let occasion = occasionForYear(pet, kind, now.getFullYear(), preferences);
    if (occasion && occasion.day < localDay(now)) occasion = occasionForYear(pet, kind, now.getFullYear() + 1, preferences);
    return occasion ? [{ ...occasion, inDays: dayDistance(localDay(now), occasion.day) }] : [];
  }).sort((a, b) => a.day.localeCompare(b.day));
}
export interface OccasionLetter {
  title: string; subtitle: string; greeting: string; paragraphs: string[]; closing: string;
  photo?: string; quiet: boolean; memorial: boolean;
}
export function occasionLetter(state: AppState, occasion: Occasion, lang: Lang = getLang(), now = new Date()): OccasionLetter {
  const pet = state.pet!;
  const entries = newestEvents(state.events).filter((e) => eventDay(e) <= occasion.day && eventDay(e) <= localDay(now));
  const anniversaryYear = Number(occasion.day.slice(0, 4));
  const from = occasionForYear(pet, occasion.kind, anniversaryYear - 1, state.preferences)?.day;
  const recent = entries.filter((e) => !from || eventDay(e) >= from);
  const memory = recent.find((e) => !isSensitive(e.description));
  const memorial = remindersPaused(state.events), quiet = memorial || recent.some((e) => isSensitive(e.description));
  const zh = lang === "zh", owner = ownerName(pet);
  const title = zh ? occasion.kind === "birthday" ? `${pet.name}的生日` : `${pet.name}的到家纪念日`
    : occasion.kind === "birthday" ? `${pet.name}'s birthday` : `${pet.name}'s home anniversary`;
  const celebration = occasion.kind === "birthday" && occasion.birthdaySource === "home";
  const subtitle = celebration
    ? zh ? `${occasion.day} · 用到家日庆生 · 相伴 ${occasion.years} 年`
      : `${occasion.day} · Celebrating on home day · ${occasion.years} years together`
    : zh ? `${occasion.day} · ${occasion.kind === "birthday" ? `${occasion.years} 岁` : `到家 ${occasion.years} 年`}`
      : `${occasion.day} · ${occasion.years} ${occasion.kind === "birthday" ? 'years old' : 'years at home'}`;
  const opening = zh ? occasion.kind === "birthday" ? `又翻到我的生日这一页了。${owner}，这一天留给我们。`
    : `到家${occasion.years}年了。这一页，想和${owner}一起翻。`
    : occasion.kind === "birthday" ? `We've reached my birthday page. ${owner}, let's keep this day for us.`
    : `It's been ${occasion.years} years since I came home. I'd like to turn this page with you.`;
  const ending = {
    cool: ["愿望先留一个：下次也陪我。", "One wish: stay with me next time too."],
    clingy: ["我的愿望很简单：多一点和你在一起的时间。", "my wish is simple: more time with you."],
    goofy: ["我的愿望清单：一起玩！再一起玩！", "My wish list: play together! Then play again!"],
    drama: ["这一天请给我主角待遇，我先预约了。", "I'd like the starring role for this day. Consider it booked."],
    curious: ["下一年的新发现，想和你一起找。", "Next year's discoveries: I'd like to find them with you."],
    calm: ["下一个这样的日子，也一起过。", "Let's spend the next one together too."],
    shy: ["……明年这一天，你也陪我好吗？", "...will you spend this day with me next year too?"],
  }[temperOf(pet)][zh ? 0 : 1];
  const paragraphs = memorial
    ? [zh ? `把${pet.name}的这一天留在册子里。` : `A page to keep ${pet.name}'s special day.`,
        zh ? `留下了${entries.length}条日常记录。可以慢慢翻，也可以听听保存下来的声音。` : `${entries.length} daily entries are preserved. Turn the pages at your own pace, or listen to a saved sound.`]
    : [opening,
        zh ? `这段时间，你为我留下了${recent.length}条日常。` : `You saved ${recent.length} everyday entries from this chapter of my life.`,
        ...(memory ? [zh ? `翻到一条原话：“${memory.description}”` : `Here's one of your entries: “${memory.description}”`] : []),
        quiet ? (zh ? "这一天，愿我们安安静静地相伴。" : "For this day, I wish for quiet time together.") : ending];
  return { title, subtitle, greeting: memorial ? (zh ? "留给你的纪念页" : "A page for you") : zh ? `致${owner}：` : `To ${owner},`,
    paragraphs, closing: memorial ? pet.name : zh ? `写信的：${pet.name}` : `From ${pet.name}`,
    photo: entries.find((e) => e.photo)?.photo ?? pet.avatar, quiet, memorial };
}
export function occasionSVG(letter: OccasionLetter, lang: Lang = getLang()) {
  const lines = [letter.greeting, "", ...letter.paragraphs.flatMap((p) => [...wrap(p, lang === "zh" ? 26 : 48), ""]), letter.closing];
  const photo = letter.photo && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(letter.photo) ? letter.photo : undefined;
  const start = photo ? 450 : 180, height = start + lines.length * 30 + 70;
  const titleLines = wrap(letter.title, lang === "zh" ? 18 : 30);
  const titleHeight = titleLines.length * 44;
  const extra = Math.max(0, titleHeight - 44);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height + extra}" viewBox="0 0 720 ${height + extra}">
<rect width="720" height="${height + extra}" fill="#FFF3DF"/><rect x="24" y="24" width="672" height="${height + extra - 48}" rx="18" fill="#fffdf7" stroke="#263830" stroke-width="3"/>
<g fill="#263830" font-family="sans-serif">${titleLines.map((line, i) => `<text x="48" y="${82 + i * 44}" font-size="36" font-weight="bold">${escapeXML(line)}</text>`).join("")}
<text x="48" y="${126 + extra}" font-size="20">${escapeXML(letter.subtitle)}</text>
${photo ? `<image x="48" y="${150 + extra}" width="624" height="260" href="${photo}" preserveAspectRatio="xMidYMid slice"/>` : ""}
${lines.map((line, i) => `<text x="48" y="${start + extra + i * 30}" font-size="22">${escapeXML(line)}</text>`).join("")}
<text x="48" y="${height + extra - 38}" font-size="16">${escapeXML(t("爪记 Pawnote · 按已保存的记录写成"))}</text></g></svg>`;
}
