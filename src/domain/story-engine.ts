import { Category, Draft, LifeEvent, Pet, Stories, Story, StoryStyle, STYLES } from "./types";
import { getLang, t } from "../i18n/core";
import { isLoss, isSensitive, reaction, selfOf, socialLine } from "./temper";
const incidents: Record<
  Category,
  {
    work: string;
    campus: string;
    title: string;
  }
> = {
  sleep: {
    work: "今日工作内容：睡觉。这是今天最重要的项目。",
    campus: "今天的课：睡觉。出勤率百分之百。",
    title: "今天忙着睡觉",
  },
  snack: {
    work: "试吃岗今日准时到岗。工作很辛苦，份量还可以再加。",
    campus: "吃饭课今天满分。老师是碗。",
    title: "开饭时间到",
  },
  bath: {
    work: "今天被安排了清洁团建，全程没有发言。",
    campus: "今天上了一节洗澡课。下次申请请假。",
    title: "洗澡这件小事",
  },
  chaos: {
    work: "今天的项目出了点状况。复盘会就不参加了。",
    campus: "今天这道题的解法比较特别，老师可能不认。",
    title: "今天有点小状况",
  },
  walk: {
    work: "外勤完成。外面的情况已摸清，报销另说。",
    campus: "户外课结束。学到了很多，具体是什么，忘了。",
    title: "出门啦",
  },
  other: {
    work: "这件事记进工作日志了。没人要求，自己记的。",
    campus: "这件事记进课堂笔记了。老师没布置，自己加的。",
    title: "今天的小事",
  },
};
const ALIASES: Partial<Record<Pet["species"], string[]>> = {
  cat: ["猫主子", "猫咪", "猫猫", "小猫", "主子"],
  dog: ["狗狗", "狗子", "小狗"],
  rabbit: ["小兔子", "兔兔", "兔子"],
};
const COMMON_ALIASES = ["小家伙", "小东西", "小祖宗", "小动物", "崽崽"];
// Words an owner uses about the pet, and how the pet would rather put it.
const SPINS: [string, string][] = [
  ["偷吃", "悄悄品鉴"],
  ["拆家", "改造家居"],
  ["捣乱", "热心帮忙"],
  ["闯祸", "搞创作"],
  ["不听话", "坚持己见"],
  ["乱叫", "发表演讲"],
  ["挑食", "严选食材"],
  ["发呆", "思考宇宙"],
  ["赖床", "延长睡眠研究"],
  ["胖了", "蓬松了"],
];
const KEEP = ["其他", "其它", "他们", "她们", "它们", "他人"];
const TIME =
  /^(今天早上|今天中午|今天下午|今天晚上|今天|今早|今晚|昨天|昨晚|刚才|刚刚|早上|中午|下午|晚上|半夜|凌晨)/;
const P = "\u0001",
  O = "\u0002",
  W = "\u0003",
  K = "\u0004";

// What the pet calls itself: 咪 / 汪 / its own name in Chinese, "I" in English (docs/13 v3 §3).
export const selfName = (pet: Pet) => selfOf(pet, getLang() === "en" ? "en" : "zh");
// English cats used to say "the staff", which read as a workplace; every pet says "my human" (docs/01 8.24).
export const defaultOwnerName = (species: Pet["species"]) =>
  getLang() === "en"
    ? "my human"
    : species === "cat" ? "铲屎官" : "我的人";
export const ownerName = (pet: Pet) =>
  pet.ownerTitle?.trim() || defaultOwnerName(pet.species);

/** Turns what the owner wrote about the pet into the pet's own first-person account. */
export function toPetVoice(
  pet: Pet,
  description: string,
  plain = false,
): { text: string; spin?: string } {
  let s = description.trim().replace(/[\u0001-\u0004]/g, "");
  KEEP.forEach((word, i) => {
    s = s.split(word).join(K + String.fromCharCode(97 + i));
  });
  const names = [
    pet.name.trim(),
    ...(pet.species === "other" && pet.speciesName ? [pet.speciesName] : []),
    ...COMMON_ALIASES,
  ].filter((n) => n && !/^[我你他她它]+$/.test(n));
  for (const name of names) s = s.split(name).join(P);
  // A bare "小猫" may be someone else's pet; only take it as this one where the sentence points home.
  const generic = (ALIASES[pet.species] ?? []).join("|");
  if (generic)
    s = s
      .replace(new RegExp(`(我们家的?|我家的?|咱家的?)(?:${generic})`, "g"), P)
      .replace(new RegExp(`(^|[，。！？,.!?；;\\n])(?:${generic})`, "g"), `$1${P}`);
  s = s
    .replace(/[它牠他她]/g, P)
    .replace(new RegExp(`(?:我们家的?|我家的?|咱家的?|这只|这个|那只)${P}`, "g"), P)
    .replace(/我们|咱们/g, W)
    .replace(/我/g, O);
  const time = TIME.exec(s)?.[0] ?? "";
  // "今天带她出去玩" has an omitted owner subject; keep who did what intact.
  if (new RegExp(`^(?:带着?|给|帮|替|为)${P}`).test(s.slice(time.length)))
    s = time + O + s.slice(time.length);
  const first = s.split(/[，。！？,.!?；;\n]/)[0];
  if (!s.includes(P) && !first.startsWith(O) && !first.startsWith(W)) {
    const time = TIME.exec(s)?.[0] ?? "";
    s = time + P + s.slice(time.length);
  }
  let spin: string | undefined;
  // On a hard day the owner's words are kept straight, with no playful rewording.
  for (const [from, to] of plain ? [] : SPINS)
    if (s.includes(from)) {
      s = s.split(from).join(to);
      spin ??= from;
    }
  const owner = ownerName(pet);
  const self = selfName(pet);
  s = s
    .split(P).join(self)
    .split(O).join(owner)
    .split(W).join(`${self}和${owner}`);
  KEEP.forEach((word, i) => {
    s = s.split(K + String.fromCharCode(97 + i)).join(word);
  });
  if (!/[。！？!?~…”）)]$/.test(s)) s += "。";
  return { text: s, spin };
}

// English words sit beside the Chinese ones so English entries are sorted too (docs/01 8.25).
const HINTS: [Category, RegExp][] = [
  ["chaos", /拆|叼走|叼到|藏起来|偷拿|偷走|推下|推倒|打翻|打碎|咬坏|抓坏|撕|弄乱|捣乱|闯祸|摔|\b(knock(ed|s|ing)?|push(ed|es|ing)? .*\boff|tipp?(ed|ing)? over|broke|broken|smash(ed)?|shredd?(ed|ing)?|tore|torn|chew(ed|ing)? (up|through)|scratch(ed|ing)? (the )?(sofa|couch|door)|destroy(ed)?|wreck(ed)?|mess(ed)? up|spill(ed)?|ran off with|hid (?:my|the|his|her|a))\b/i],
  ["bath", /洗澡|洗了|泡泡|吹风|吹毛|美容|剪指甲|梳毛|\b(bath|bathed|shower(ed)?|groom(ed|ing)?|brush(ed|ing)?|nail trim|trimmed)\b/i],
  ["walk", /散步|遛|出门|出去|外出|公园|楼下|外面|巡逻|草地|晒太阳|\b(walk(ed|s|ing)?|park|outside|outdoors|hike|hiked|stroll)\b/i],
  ["sleep", /睡|困|打盹|午觉|做梦|呼噜|赖床|哈欠|\b(sleep(ing|s)?|slept|nap(ped|ping|s)?|snooz(e|ed|ing)|doz(e|ed|ing)|asleep|yawn(ed)?)\b/i],
  ["snack", /吃|零食|罐头|小鱼干|冻干|喝|饭|粮|肉|啃|\b(ate|eat(s|ing)?|snack(s|ed)?|treat(s)?|food|dinner|breakfast|lunch|kibble|chicken|tuna|stole (a|the|some))\b/i],
];
/** Guesses the tag from what the owner wrote, so they do not have to pick one. */
export const detectCategory = (description: string): Category =>
  HINTS.find(([, pattern]) => pattern.test(description))?.[0] ?? "other";

export const generationSignature = (
  pet: Pet,
  description: string,
  category: Category,
) =>
  JSON.stringify([
    pet.id,
    pet.name,
    pet.species,
    pet.speciesName,
    pet.ageMonths,
    pet.personality,
    pet.route,
    pet.role,
    pet.ownerTitle,
    description.trim(),
    category,
  ]);
export function generateStory(
  pet: Pet,
  description: string,
  category: Category,
  style: StoryStyle,
  variant = 0,
): Story {
  const fact = description.trim();
  if (!fact || fact.length > 500)
    throw new Error(t("请填写 1–500 字的真实日常。"));
  const done = (title: string, text: string): Story =>
    ({ title, text: text.slice(0, 2000), generator: "template", edited: false });
  // A pet that has died is not given a voice: the owner's words stand as written.
  if (isLoss(fact)) return done(t("{name}的一天", { name: pet.name }), fact);
  if (getLang() === "en") return englishStory(pet, fact, category, style, variant);
  const v = incidents[category];
  const grave = isSensitive(fact);
  const owner = ownerName(pet),
    said = toPetVoice(pet, fact, grave);
  const mine = reaction(pet, category, owner, "zh", variant, fact);
  if (grave && style === "news") return done(`${pet.name}的今日记录`, `${owner}写下：“${fact}”\n\n${mine.line}`);
  if (grave && style !== "diary")
    return done(`${pet.name}的今日记录`, `${said.text}\n\n${style === "social" ? mine.closer : mine.line}`);
  // The work / school diary keeps the pet's reply to this event and adds its job's take, so it
  // never reads the same as the inner voice (docs/01 8.25).
  const job = pet.route === "work" ? v.work : v.campus;
  const life = mine.contextual ? `${mine.line}${job ? `\n${job}` : ""}` : job;
  const text =
    style === "news"
      ? `${owner}说：“${fact}”\n\n${pet.name}：“${mine.line}”`
      : style === "life"
        ? `【${pet.route === "work" ? "今日工作日记" : "今日校园日记"}】\n${said.text}\n\n${life || mine.line}`
        : style === "social"
          ? `${said.text}\n${socialLine(pet, category, owner, "zh", fact, variant)}`
          : `${said.text}\n\n${mine.line}${(variant % 2 === 1 || mine.flavored) && !mine.line.endsWith(mine.closer) ? `\n${mine.closer}` : ""}`;
  const title =
    style === "news"
      ? `${pet.name}：${v.title}`
      : style === "life"
        ? `${pet.name}的${pet.route === "work" ? "工作日记" : "校园笔记"}`
        : style === "social"
          ? `${pet.name}的今日动态`
          : `${pet.name}的小心思`;
  return done(title, text);
}
// English has no safe rule for swapping grammatical person, so the offline version doesn't retell:
// the inner voice and diary give only the pet's side (the owner's note sits right above them), and
// the post and the news quote the owner for context. The AI gateway provides a true retelling.
const asides: Record<Category, { work: string; campus: string; title: string }> = {
  sleep: {
    work: "Today's task: sleep. Top priority project.",
    campus: "Today's class: sleep. Perfect attendance.",
    title: "Busy Sleeping",
  },
  snack: {
    work: "Tasting shift complete. Hard work. Portions could be bigger.",
    campus: "Lunch class: full marks. The teacher was the bowl.",
    title: "Snack Time",
  },
  bath: {
    work: "Mandatory water-based team building today. Did not contribute.",
    campus: "Had bath class today. Requesting a sick note next time.",
    title: "Bath Day",
  },
  chaos: {
    work: "A small incident on today's project. Skipping the retro.",
    campus: "My answer to today's question was creative. The teacher may not accept it.",
    title: "A Little Chaos Today",
  },
  walk: {
    work: "Field work done. Expenses to follow.",
    campus: "Outdoor class over. Learned a lot. Can't remember what.",
    title: "Out and About",
  },
  other: {
    work: "Logged in today's work notes. Nobody asked; I wanted it on record.",
    campus: "Added to today's class notes. Not assigned. My own idea.",
    title: "A Little Moment Today",
  },
};
function englishStory(pet: Pet, fact: string, category: Category, style: StoryStyle, variant: number): Story {
  const v = asides[category], owner = ownerName(pet), work = pet.route === "work";
  const Owner = owner.charAt(0).toUpperCase() + owner.slice(1);
  const mine = reaction(pet, category, owner, "en", variant, fact);
  const job = work ? v.work : v.campus;
  const life = mine.contextual ? `${mine.line}${job ? `\n${job}` : ""}` : job;
  if (isSensitive(fact))
    return {
      title: `${pet.name}'s day`,
      text: `${Owner} wrote: "${fact}"\n\n${style === "social" ? mine.closer : mine.line}`.slice(0, 2000),
      generator: "template",
      edited: false,
    };
  const text =
    style === "news"
      ? `${Owner} said: "${fact}"\n\n${pet.name}: "${mine.line}"`
      : style === "life"
        ? `${work ? "Work diary" : "School diary"}\n${life || mine.line}`
        : style === "social"
          ? `${Owner} says: "${fact}"\n${socialLine(pet, category, owner, "en", fact, variant)}`
          : `${mine.line}${(variant % 2 === 1 || mine.flavored) && !mine.line.endsWith(mine.closer) ? `\n${mine.closer}` : ""}`;
  const title =
    style === "news"
      ? `${pet.name}: ${v.title}`
      : style === "life"
        ? `${pet.name}'s ${work ? "work report" : "campus notes"}`
        : style === "social"
          ? `${pet.name}'s Little Update`
          : `${pet.name}'s Little Thoughts`;
  return { title, text: text.slice(0, 2000), generator: "template", edited: false };
}
export function generateStories(
  pet: Pet,
  description: string,
  category: Category,
  variant = 0,
): Stories {
  return {
    diary: generateStory(pet, description, category, "diary", variant),
    life: generateStory(pet, description, category, "life", variant),
    social: generateStory(pet, description, category, "social", variant),
    news: generateStory(pet, description, category, "news", variant),
  };
}

/**
 * Which of the temper's lines a new entry gets: how many entries of the same kind this pet already
 * has before it, so writing about sleep every day walks through the lines in turn (docs/01 8.27).
 */
export function voiceVariant(events: LifeEvent[], category: Category, entry?: Pick<LifeEvent, "id" | "createdAt">): number {
  const before = entry ? Date.parse(entry.createdAt) : Infinity;
  return events.filter((e) => e.category === category && e.id !== entry?.id && Date.parse(e.createdAt) < before).length;
}

/** Keep owner-edited voices until the owner explicitly chooses how to update them. */
export function retellDraft(pet: Pet, draft: Draft, description: string, category: Category, variant = 0): Draft {
  if (description === draft.description && category === draft.category) return draft;
  const edited = STYLES.filter((s) => draft.stories?.[s].edited);
  const stories = description.trim() || edited.length ? generateStories(pet, description, category, variant) : undefined;
  if (stories) for (const style of edited) stories[style] = draft.stories![style];
  return { ...draft, description, category, stories,
    signature: stories ? generationSignature(pet, description, category) : undefined,
    expressionNeedsReview: edited.length > 0 };
}

const HEADINGS = /^(【.*】|Work diary|School diary)$/;
// The job's take the work / school diary adds after the pet's reply; the bubble wants the reply itself.
const JOB_LINES = new Set(
  [...Object.values(incidents), ...Object.values(asides)].flatMap((v) => [v.work, v.campus]).filter(Boolean),
);
/**
 * What the pet itself said in a saved entry, for the 爪窝 speech bubble: its closing reaction, never the
 * owner's quoted words or a section heading, with a news-style "Name: “…”" unwrapped (docs/01 8.24).
 */
export function petLine(e: LifeEvent): string | undefined {
  const text = e.stories[e.selectedStyle]?.text ?? "";
  const fact = e.description.trim();
  const name = e.petSnapshot.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const own = lines.filter((l) => !HEADINGS.test(l) && !JOB_LINES.has(l) && !(fact && l.includes(fact)));
  // The pet's own reaction comes last in every voice; the retelling, if any, comes before it.
  const line = own[own.length - 1] ?? lines.find((l) => !HEADINGS.test(l));
  return line?.replace(new RegExp(`^${name}[：:]\\s*[“"]`), "").replace(/[”"]$/, "");
}
