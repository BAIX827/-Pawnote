import { Category, Pet } from "./types";
import { en, zh } from "./voice-bank";

// The on-device voice bank. See docs/13 (宠物语气指南 v2) for the brief.
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

/** The temper named first in the personality wins; with none, the species sets the default. */
export function temperOf(pet: Pet): Temper {
  const text = pet.personality.toLowerCase();
  let best: { temper: Temper; at: number } | undefined;
  for (const [temper, words] of TAGS)
    for (const word of words) {
      const at = text.indexOf(word);
      if (at >= 0 && (!best || at < best.at)) best = { temper, at };
    }
  return best?.temper ?? (pet.species === "cat" ? "cool" : pet.species === "dog" ? "goofy" : "calm");
}
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

// One absurd beat, used in place of the closer. Never for shy or clingy unless the owner asked for weird.
const weird = {
  zh: ["这件事要是开会，我希望空气也来听。", "想给今天颁个奖。奖品最好归我。", "我的想法有点绕，想借个纸箱装一下。", "心里的小剧场，想给自己留个前排。", "希望今天的规矩明天能听我一次。"],
  en: ["If this needs a meeting, I'd like the air to attend.", "I'd like to give today a prize. Ideally, I get to keep it.", "My thoughts could use a cardboard box to sit in.", "I'd like a front-row seat in my own little theatre.", "Tomorrow's rules should hear my proposal."],
};

// Species colour stays a wish or an opinion; it never replaces the recorded event.
const speciesLines: Partial<Record<Pet["species"], { zh: string[]; en: string[] }>> = {
  cat: { zh: ["我想自己决定靠近的距离。", "要是有合心意的纸箱，想把自己的时间放进去。"], en: ["I'd like to choose how close I get.", "A good cardboard box could hold some time of my own."] },
  dog: { zh: ["想认识新的气味，也想让{owner}等我慢慢闻。", "要是能约着一起玩，我想早一点收到消息。"], en: ["I'd like time for new smells, with {owner} waiting patiently.", "If there's a plan to play together, I'd like an early invitation."] },
  rabbit: { zh: ["我的意见也想被认真听见。", "想给自己的安静角落留点时间。"], en: ["I'd like my opinion heard properly too.", "I'd like time for my own quiet corner."] },
  hamster: { zh: ["想把喜欢的小事一点点存起来。", "大家的时间表，可以跟我的稍微错开。"], en: ["I'd like to save the little things I like.", "Everyone's timetable can leave some room for mine."] },
  guineaPig: { zh: ["要是能用喜欢的味道聊聊，我会更愿意参与。", "我的小声意见，也想让{owner}听见。"], en: ["A favourite flavour could help this conversation.", "I'd like {owner} to hear my little opinion too."] },
  bird: { zh: ["想把自己的声音也放进这段聊天。", "{owner}要是愿意听，我也有很多想说的。"], en: ["I'd like my own voice in this conversation.", "I have plenty to say if {owner} wants to listen."] },
  lizard: { zh: ["想把舒服的温度留给自己。", "我的节奏可以安静一点。"], en: ["I'd like a comfortable temperature to myself.", "My pace can be a quiet one."] },
  snake: { zh: ["我的安静也有自己的意思。", "想给自己的空间留点余地。"], en: ["My quiet has its own meaning.", "I'd like some room in my own space."] },
  turtle: { zh: ["这事不急，我想按自己的速度来。", "希望大家也能听听慢一点的那一版。"], en: ["No rush. I'd like my own pace.", "I'd like everyone to hear the slower version too."] },
  fish: { zh: ["我想让水里的那一版也被听见。", "我的小天地，也有值得聊的事。"], en: ["I'd like the underwater version heard too.", "My little world has things worth talking about."] },
};

const QUIET = {
  zh: { line: "今天心里有些沉。想慢慢休息，也想离{owner}近一点。", closer: "想让{owner}陪一会儿。" },
  en: { line: "Today feels heavy. I'd like quiet rest and some time close to {owner}.", closer: "I'd like {owner} to stay a while." },
};

const fillWith = (owner: string, lang: "zh" | "en") => (s: string) => {
  const out = s.split("{owner}").join(owner);
  return lang === "en" && s.startsWith("{owner}") ? out.charAt(0).toUpperCase() + out.slice(1) : out;
};

/** The pet's own reaction to an event and a sign-off, in its temper and the given language. */
export function reaction(
  pet: Pet,
  category: Category,
  owner: string,
  lang: "zh" | "en",
  variant = 0,
  description = "",
): { line: string; closer: string } {
  const fill = fillWith(owner, lang);
  if (isSensitive(description)) return { line: fill(QUIET[lang].line), closer: fill(QUIET[lang].closer) };
  const temper = temperOf(pet);
  const set = (lang === "en" ? en : zh)[temper];
  const special = speciesLines[pet.species];
  const line = set[category][variant % 2];
  let closer = set.closers[variant % set.closers.length];
  if (special && variant % 2 === 1) closer = special[lang][variant % special[lang].length];
  // Every third version gets an absurd beat; owners who asked for weird get one every time.
  const weirdOk = isWeird(pet) || (temper !== "shy" && temper !== "clingy");
  if (weirdOk && (isWeird(pet) || variant % 3 === 2)) closer = weird[lang][(variant + Object.keys(set).indexOf(category)) % weird[lang].length];
  return { line: fill(line), closer: fill(closer) };
}

/** A brief post addressed to friends, with a second version for "say it another way". */
export function socialLine(pet: Pet, category: Category, owner: string, lang: "zh" | "en", description = "", variant = 0): string {
  const fill = fillWith(owner, lang);
  if (isSensitive(description)) return fill(QUIET[lang].closer);
  const base = fill((lang === "en" ? en : zh)[temperOf(pet)].social[category][variant % 2]);
  // Use a recorded detail to anchor the thought, rather than adding a stock scene.
  if ((pet.species === "cat" || pet.species === "dog") && /闻|嗅|sniff|smell/i.test(description))
    return base + (lang === "zh" ? "你们看照片，我想把气味里的消息读完。" : "You have the photos. I'd like time to read the scent news.");
  if (/窗边|窗台|window/i.test(description))
    return base + (lang === "zh" ? "窗边那个位置，想留给自己慢慢待着。" : "I'd like some unhurried time in that window spot.");
  return base;
}
