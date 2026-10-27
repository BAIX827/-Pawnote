import { t, locale } from "../i18n/core";
import { AppState, LifeEvent, Pet, SoundMemory } from "./types";
import { dayDate, eventDay, newestEvents } from "./dates";
import { escapeXML } from "./news-card";
import { soundTime, SOUND_STAGE_LABELS, validSoundAudio } from "./sounds";

export interface Keepsake { title: string; pet: Pet; events: LifeEvent[]; sounds: SoundMemory[]; years: string; days: number }
export const keepsakeYears = (state: AppState) => [...new Set([
  ...state.events.map((e) => eventDay(e).slice(0, 4)), ...(state.sounds ?? []).map((s) => s.recordedOn.slice(0, 4)),
])].sort().reverse();
export function makeKeepsake(state: AppState, options: { title: string; year?: string; events: string[]; sounds: string[] }): Keepsake {
  if (!state.pet) throw new Error(t("请先创建宠物档案。"));
  const title = options.title.trim();
  if (!title || title.length > 60) throw new Error(t("纪念册标题请填写 1–60 个字。"));
  const eventIds = new Set(options.events), soundIds = new Set(options.sounds);
  const within = (day: string) => !options.year || day.slice(0, 4) === options.year;
  const events = newestEvents(state.events).reverse().filter((e) => eventIds.has(e.id) && within(eventDay(e)));
  const sounds = (state.sounds ?? []).filter((s) => soundIds.has(s.id) && within(s.recordedOn)).sort((a, b) => a.recordedOn.localeCompare(b.recordedOn));
  if (!events.length && !sounds.length) throw new Error(t("选至少一篇日记或一段声音，再制作纪念册。"));
  const days = [...events.map(eventDay), ...sounds.map((s) => s.recordedOn)].sort();
  return { title, pet: state.pet, events, sounds, days: new Set(days).size, years: `${days[0]} – ${days[days.length - 1]}` };
}
const safePhoto = (photo?: string) => photo && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo) ? photo : undefined;
/** A self-contained offline album. User content stays in text nodes; only validated data media is embedded. */
export function keepsakeHTML(book: Keepsake): string {
  const esc = escapeXML, image = (uri?: string) => safePhoto(uri) ? `<img src="${uri}" alt="${esc(book.pet.name)}" loading="lazy">` : "";
  const items = [
    ...book.events.map((event) => ({ day: eventDay(event), html: `<article class="page"><span class="tag">${esc(eventDay(event))} · ${esc(t("日记"))}</span>
${image(event.photo)}<h2>${esc(event.stories[event.selectedStyle].title)}</h2><p class="story">${esc(event.stories[event.selectedStyle].text)}</p>
<footer>${esc(event.petSnapshot.name)} · ${esc(t(event.petSnapshot.role))}</footer></article>` })),
    ...book.sounds.map((sound) => ({ day: sound.recordedOn, html: `<article class="page sound"><span class="tag">${esc(sound.recordedOn)} · ${esc(t("声音相册"))}</span>
<h2>${esc(sound.title)}</h2><p>${esc(t(SOUND_STAGE_LABELS[sound.stage]))}${sound.ageMonths === undefined ? "" : ` · ${esc(t("当时 {n} 个月", { n: sound.ageMonths }))}`} · ${soundTime(sound.duration)}</p>
${validSoundAudio(sound.audio) ? `<audio controls preload="none" src="${sound.audio}">${esc(t("请用浏览器打开纪念册，播放声音。"))}</audio>` : `<p>${esc(t("声音读取失败，请重试。"))}</p>`}
<p>${esc(sound.note)}</p><p class="print-note">${esc(t("这一声保存在电子纪念册中，打开原文件可以回听。"))}</p></article>` })),
  ].sort((a, b) => a.day.localeCompare(b.day));
  let month = "";
  const body = items.map((item) => {
    const current = item.day.slice(0, 7);
    const heading = current === month ? "" : `<h2 class="month">${esc(dayDate(`${current}-01`).toLocaleDateString(locale(), { year: "numeric", month: "long" }))}</h2>`;
    month = current;
    return heading + item.html;
  }).join("\n");
  return `<!doctype html><html lang="${locale()}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; media-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>${esc(book.title)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#FFF3DF;color:#263830;font:16px/1.8 -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC',sans-serif}main{max-width:780px;margin:0 auto;padding:24px 18px 60px}h1,h2,p{overflow-wrap:anywhere}h1{font-size:clamp(32px,6vw,56px);line-height:1.25}h2{font-size:26px;line-height:1.4}.cover,.page{border:3px solid #263830;border-radius:16px;padding:26px;margin:22px 0;box-shadow:5px 5px 0 #263830;background:#fffdf7}.cover{background:#FF914D}.cover img{max-height:360px;object-fit:cover}.tag{display:inline-block;background:#C4F06B;border-radius:24px;padding:4px 12px;font-size:13px;font-weight:700}img{display:block;width:100%;max-height:500px;object-fit:contain;background:#FFF3DF;border:2px solid #263830;border-radius:8px;margin:20px 0}p{white-space:pre-wrap}.story{font-size:18px}details{padding:12px 18px;background:#FFF3DF;border-radius:12px}summary{font-weight:700;cursor:pointer}footer{font-size:13px;margin-top:22px}.sound{background:#E3DAFF}audio{width:100%;margin:14px 0}.month{padding-top:20px;border-bottom:3px solid #263830}.tools{position:sticky;top:0;background:#FFF3DF;padding:12px;z-index:1;text-align:center}.tools button{font:inherit;font-weight:700;background:#C4F06B;border:2px solid #263830;border-radius:30px;padding:8px 20px;cursor:pointer}.print-note{display:none}.closing{text-align:center;margin-top:40px}
@media print{@page{size:A4;margin:16mm}body{background:white;font-size:12pt}main{max-width:none;padding:0}.tools{display:none}.cover{break-after:page;box-shadow:none;min-height:200mm;display:flex;flex-direction:column;justify-content:center}.page{box-shadow:none;break-inside:avoid;margin:12mm 0;padding:8mm}img{max-height:100mm}audio{display:none}.print-note{display:block}.month{break-after:avoid}details{display:block}h1{font-size:36pt}h2{font-size:20pt}p{orphans:3;widows:3}}
</style></head><body><div class="tools"><button onclick="window.print()">${esc(t("打印 / 保存为 PDF"))}</button></div><main>
<header class="cover"><span class="tag">PAWNOTE · ${esc(t("年度纪念册"))}</span><h1>${esc(book.title)}</h1>${image(book.pet.avatar)}<p>${esc(book.pet.name)}<br>${esc(book.years)}</p>
<p>${esc(t("{e} 篇日记 · {s} 段声音 · {d} 个日子", { e: book.events.length, s: book.sounds.length, d: book.days }))}</p></header>
${body}<div class="closing"><h2>${esc(t("这些小日子，都留下来了。"))}</h2><p>爪记 · Pawnote</p><p>${esc(t("电子版保留完整声音；打印版保留声音的日期、标题和备注。"))}</p></div></main></body></html>`;
}
