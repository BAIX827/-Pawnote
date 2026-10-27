import { Category, Pet } from "./types";
import { en, zh } from "./voice-bank";
import { actionLine, eventContext } from "./event-context";

// The on-device voice bank. See docs/13 (宠物语气指南 v3) for the brief.
// Seven tempers: goofy is split out of warm, drama and curious out of hyper,
// because research shows each reads differently on the same event. "Weird" is not a temper but
// a dial: an owner who types 抽象/发疯/unhinged gets one absurd beat in every entry.
export type Temper = "cool" | "clingy" | "goofy" | "drama" | "curious" | "calm" | "shy";

const TAGS: [Temper, string[]][] = [
  ["cool", ["傲娇", "独立", "有主见", "高冷", "酷", "拽", "冷淡", "sassy", "independent", "strong-willed", "aloof", "cool", "deadpan"]],
  ["clingy", ["亲人", "温柔", "黏人", "粘人", "撒娇", "乖", "cuddly", "gentle", "affectionate", "sweet", "clingy", "velcro"]],
  ["goofy", ["憨厚", "憨", "傻", "活泼", "调皮", "闹腾", "goofy", "lively", "playful", "energetic", "derpy", "himbo"]],
  ["drama", ["戏精", "爱演", "话痨", "作", "dramatic", "diva", "drama", "vocal"]],
  ["curious", ["好奇", "机灵", "聪明", "curious", "nosy", "clever", "smart"]],
  ["calm", ["稳重", "随和", "佛系", "淡定", "懒", "steady", "easygoing", "calm", "chill", "lazy", "zen"]],
  ["shy", ["慢热", "敏感", "胆小", "害羞", "内向", "怂", "slow to warm", "sensitive", "shy", "timid", "anxious", "nervous"]],
];
const WEIRD = ["抽象", "发疯", "沙雕", "神经", "癫", "古怪", "weird", "unhinged", "chaotic", "gremlin", "feral", "chaos"];

function firstTemper(text: string): Temper | undefined {
  let best: { temper: Temper; at: number } | undefined;
  for (const [temper, words] of TAGS)
    for (const word of words) {
      const at = text.indexOf(word);
      if (at >= 0 && (!best || at < best.at)) best = { temper, at };
    }
  return best?.temper;
}
/** The temper named first in the personality wins; with none, the species sets the default. */
export function temperOf(pet: Pet): Temper {
  return firstTemper(pet.personality.toLowerCase()) ?? (pet.species === "cat" ? "cool" : pet.species === "dog" ? "goofy" : "calm");
}
/**
 * The other tempers a multi-pick personality ("傲娇 · 黏人 · 好奇") names after the first: up to two
 * "flavours" that colour one beat of each entry without changing the main voice (docs/13 v3 §2).
 */
export function flavorsOf(pet: Pet): Temper[] {
  const main = temperOf(pet), out: Temper[] = [];
  for (const part of pet.personality.toLowerCase().split(/\s*[·、,，/]\s*/)) {
    const temper = firstTemper(part);
    if (temper && temper !== main && !out.includes(temper)) out.push(temper);
  }
  return out.slice(0, 2);
}
/** What the pet calls itself: 咪 for cats, 汪 for dogs, its own name otherwise; "I" in English. */
export const selfOf = (pet: Pet, lang: "zh" | "en") =>
  lang === "en" ? "I" : pet.species === "cat" ? "咪" : pet.species === "dog" ? "汪" : pet.name.trim() || "我";
/** True when the owner described the pet as absurd or unhinged. */
export const isWeird = (pet: Pet) => WEIRD.some((w) => pet.personality.toLowerCase().includes(w));

// Illness, injury, loss or death: no jokes, no spin, no news parody. Vaccinations and nail trims
// are routine and stay playful, so they are deliberately not on this list. Everyday phrases
// such as 走了一圈 or 把球丢了 must not trip it, so only explicit wording is listed.
const SENSITIVE = /生病|病了|住院|手术|抢救|骨折|抽搐|吐血|便血|去世|离世|不在了|安乐|彩虹桥|走丢|跑丢|走失|失踪|离开我们|\b(sick|ill|hospital|surgery|emergency|passed away|put to sleep|put down|put (?:him|her|them) down|rainbow bridge|went missing|is missing|lost (him|her|them)|died|cancer|tumou?r)\b/i;
export const isSensitive = (description: string) => SENSITIVE.test(description);
// A pet that has died should not be given a voice at all; the story engine keeps the owner's words.
const LOSS = /去世|离世|不在了|安乐|彩虹桥|离开我们|\b(passed away|put to sleep|put down|put (?:him|her|them) down|rainbow bridge|died)\b/i;
export const isLoss = (description: string) => LOSS.test(description);

// One absurd beat for owners who asked for weird; it takes the closer's place.
const weird = {
  zh: ["这件事要是开会，{self}希望空气也来听。", "{self}对着空气哈了一口。空气知道它做了什么。", "{self}的想法有点绕，想借个纸箱装一下。", "{self}决定给今天颁个奖。奖品归{self}。", "宇宙很大，{self}的碗很小。这不公平。"],
  en: ["If this needs a meeting, I'd like the air to attend.", "I hissed at the air. The air knows what it did.", "My thoughts need a cardboard box to sit in.", "I'm giving today an award. I'm keeping the award.", "The universe is huge. My bowl is small. Unfair."],
};

// Species colour stays an opinion; it never replaces the recorded event.
const speciesLines: Partial<Record<Pet["species"], { zh: string[]; en: string[] }>> = {
  cat: { zh: ["这个家，名义上是{owner}的。", "纸箱是{self}的，{owner}只是暂时保管。"], en: ["This house is in {owner}'s name. On paper.", "The box is mine. {owner} is just looking after it."] },
  dog: { zh: ["外面每个气味都是一条新消息，{self}还没读完。", "尾巴自己决定要不要摇，{self}管不了。"], en: ["Every smell is a new message. I'm behind on my inbox.", "My tail makes its own decisions. I'm not in charge."] },
  rabbit: { zh: ["{self}有意见的时候会跺脚。今天跺没跺，保密。", "{self}背对着{owner}，不是生气，是在思考。"], en: ["I thump when I have opinions. Whether I thumped today is classified.", "I'm facing away from {owner}. Not upset. Thinking."] },
  hamster: { zh: ["好东西先存进腮帮子，再慢慢想。", "{self}的夜班还没开始，现在只是热身。"], en: ["Good things go in the cheeks first. Thinking comes later.", "My night shift hasn't started. This is a warm-up."] },
  guineaPig: { zh: ["冰箱门一响，{self}的心就跟着响。", "生菜就是一切。别的事排在生菜后面。"], en: ["When the fridge door opens, so does my heart.", "Lettuce is everything. Everything else comes after lettuce."] },
  bird: { zh: ["这件事{self}已经学会了，下次学给{owner}听。", "{self}在高处监督，一切尽在掌握。"], en: ["I've learned this one. I'll perform it for {owner} later.", "Supervising from above. All under control."] },
  lizard: { zh: ["这件事的温度刚刚好，{self}批准。", "{self}没有情绪，{self}只有温度。"], en: ["The temperature of this was correct. Approved.", "I don't have feelings. I have temperatures."] },
  snake: { zh: ["{self}盘着想了一下，又盘紧了一点。", "隔着玻璃，{self}看懂了{owner}。{owner}没看懂{self}。"], en: ["I coiled, considered, and coiled a little tighter.", "Through the glass I understood {owner}. {owner} did not understand me."] },
  turtle: { zh: ["不急。{self}活得长，可以慢慢想。", "这件事{self}会记一百年。"], en: ["No rush. I'll be around a long time.", "I'll remember this for a hundred years."] },
  fish: { zh: ["水里的版本是这样的：咕噜。", "{self}在水里绕了一圈，觉得这件事可以。"], en: ["The underwater version is: blub.", "I swam a lap and decided this is fine."] },
};

const QUIET = {
  zh: { line: "今天心里有些沉。想慢慢休息，也想离{owner}近一点。", closer: "想让{owner}陪一会儿。" },
  en: { line: "Today feels heavy. I'd like quiet rest and some time close to {owner}.", closer: "I'd like {owner} to stay a while." },
};

const fillWith = (pet: Pet, owner: string, lang: "zh" | "en") => (s: string) => {
  const out = s.split("{owner}").join(owner).split("{self}").join(selfOf(pet, lang));
  return lang === "en" && s.startsWith("{owner}") ? out.charAt(0).toUpperCase() + out.slice(1) : out;
};

/**
 * The pet's own reaction to an event and a sign-off, in its temper and the given language. The line
 * carries the temper's own silly beat; a second personality, when there is one, lends the sign-off.
 */
export function reaction(
  pet: Pet,
  category: Category,
  owner: string,
  lang: "zh" | "en",
  variant = 0,
  description = "",
): { line: string; closer: string; contextual?: boolean; flavored?: boolean } {
  const fill = fillWith(pet, owner, lang);
  if (isSensitive(description)) return { line: fill(QUIET[lang].line), closer: fill(QUIET[lang].closer) };
  const bank = lang === "en" ? en : zh;
  const temper = temperOf(pet), set = bank[temper], flavors = flavorsOf(pet);
  const lines = set.line[category];
  const line = lines[variant % lines.length];
  const special = speciesLines[pet.species]?.[lang];
  let closer: string;
  if (flavors.length) {
    const lender = bank[flavors[variant % flavors.length]].silly;
    closer = lender[Math.floor(variant / flavors.length) % lender.length];
  } else if (isWeird(pet)) closer = weird[lang][variant % weird[lang].length];
  else if (special && variant % 4 === 3) closer = special[Math.floor(variant / 4) % special.length];
  else if (variant % 3 === 2) closer = set.silly[Math.floor(variant / 3) % set.silly.length];
  else closer = set.closers[variant % set.closers.length];
  const flavored = flavors.length > 0;
  const context = eventContext(description, owner, lang);
  const sep = lang === "zh" ? "" : " ";
  if (context) return { line: `${selfify(context, pet, owner, lang)}${sep}${fill(closer)}`, closer: fill(closer), contextual: true, flavored };
  const action = actionLine(description, lang);
  // An everyday moment the pet already answered ends on a short sign-off, not a stock line (docs/01 8.26).
  const after = category === "other" ? closer : line;
  return { line: action ? `${selfify(action, pet, owner, lang)}${sep}${fill(after)}` : fill(line), closer: fill(closer), contextual: !!action, flavored };
}
// The detail sentences in event-context.ts say 我; in Chinese the pet uses its own word for itself.
// The owner's title may itself contain 我 (我的人), so it is left alone.
const selfify = (s: string, pet: Pet, owner: string, lang: "zh" | "en") => (lang === "zh" ? withSelf(s, pet, owner) : s);
/** Chinese copy written with 我 in the pet's own word for itself (docs/13 v3 §3), leaving the owner's title alone. */
export const withSelf = (s: string, pet: Pet, owner = "") =>
  (owner ? s.split(owner) : [s]).map((part) => part.replace(/我(?!们|的人)/g, selfOf(pet, "zh"))).join(owner);

/** A brief post addressed to friends, with a second version for "say it another way". */
export function socialLine(pet: Pet, category: Category, owner: string, lang: "zh" | "en", description = "", variant = 0): string {
  const fill = fillWith(pet, owner, lang);
  if (isSensitive(description)) return fill(QUIET[lang].closer);
  const temper = temperOf(pet), set = (lang === "en" ? en : zh)[temper];
  const posts = set.social[category];
  const base = fill(posts[variant % posts.length]);
  const sep = lang === "zh" ? "" : " ";
  const context = eventContext(description, owner, lang) ?? actionLine(description, lang);
  // Same as reaction(): once the pet has answered an everyday moment, a short sign-off is enough (docs/01 8.26).
  if (context) return `${selfify(context, pet, owner, lang)}${sep}${category === "other" ? fill(set.closers[variant % set.closers.length]) : base}`;
  // Use a recorded detail to anchor the thought, rather than adding a stock scene.
  if ((pet.species === "cat" || pet.species === "dog") && /闻|嗅|sniff|smell/i.test(description))
    return base + sep + fill(lang === "zh" ? "你们看照片，{self}忙着读气味里的消息。" : "You have the photos. I'm busy reading the scent news.");
  if (/窗边|窗台|window/i.test(description))
    return base + sep + fill(lang === "zh" ? "窗边那个位置，现在归{self}了。" : "The window spot is mine now.");
  return base;
}
