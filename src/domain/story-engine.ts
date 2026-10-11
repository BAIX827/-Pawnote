import { Category, Pet, Stories, Story, StoryStyle } from "./types";
import { getLang, t } from "../i18n/core";
import { isLoss, isSensitive, reaction, socialLine, temperOf } from "./temper";
const incidents: Record<
  Category,
  {
    work: string;
    campus: string;
    title: string;
  }
> = {
  sleep: {
    work: "午觉想排进今天的日程。上班的事，等我睡够了再商量。",
    campus: "这门休息课，我想按自己的进度学。醒来再聊下一节。",
    title: "今天忙着睡觉",
  },
  snack: {
    work: "关于吃的，我愿意多花点心思。下一份试吃机会，希望还考虑我。",
    campus: "要是开一门吃饭课，我应该很愿意认真听。课后也想继续研究。",
    title: "开饭时间到",
  },
  bath: {
    work: "今天的清洁流程到这里。我想申请一点自由时间，慢慢恢复自己的节奏。",
    campus: "洗澡这门课先上到这里。下一节想选自己喜欢的，最好由我决定。",
    title: "洗澡这件小事",
  },
  chaos: {
    work: "这件事要是开会讨论，也请给我留个发言位置。我的想法还没讲完。",
    campus: "这道题我有自己的解法。结果可以聊，思路也想让大家听听。",
    title: "今天有点小状况",
  },
  walk: {
    work: "今天的外出算我喜欢的安排。下次想把时间留宽一点，按自己的节奏来。",
    campus: "户外这门课，下次还想选。好奇心想多留一点时间。",
    title: "出门啦",
  },
  other: {
    work: "",
    campus: "",
    title: "今天的小事",
  },
};
const SELF: Partial<Record<Pet["species"], string>> = {
  cat: "本喵",
  dog: "本汪",
  rabbit: "本兔",
  lizard: "本蜥",
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
  ["一脸无辜", "问心无愧"],
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

// "本喵 / 本汪" reads as a pose, so only the cool and the dramatic use it; everyone else says "我".
export const selfName = (pet: Pet) => {
  if (getLang() === "en") return "I";
  const temper = temperOf(pet);
  return temper === "cool" || temper === "drama" ? (SELF[pet.species] ?? "我") : "我";
};
export const defaultOwnerName = (species: Pet["species"]) =>
  getLang() === "en"
    ? species === "cat" ? "the staff" : "my human"
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
  s = s
    .split(P).join("我")
    .split(O).join(owner)
    .split(W).join(`我和${owner}`);
  KEEP.forEach((word, i) => {
    s = s.split(K + String.fromCharCode(97 + i)).join(word);
  });
  if (!/[。！？!?~…”）)]$/.test(s)) s += "。";
  return { text: s, spin };
}

const HINTS: [Category, RegExp][] = [
  ["chaos", /拆|推下|推倒|打翻|打碎|咬坏|抓坏|撕|弄乱|捣乱|闯祸|摔/],
  ["bath", /洗澡|洗了|泡泡|吹风|吹毛|美容|剪指甲|梳毛/],
  ["walk", /散步|遛|出门|出去|外出|公园|楼下|外面|巡逻|草地|晒太阳/],
  ["sleep", /睡|困|打盹|午觉|做梦|呼噜|赖床|哈欠/],
  ["snack", /吃|零食|罐头|小鱼干|冻干|喝|饭|粮|肉|啃/],
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
  const life = pet.route === "work" ? v.work : v.campus;
  const text =
    style === "news"
      ? `${pet.ownerTitle?.trim() || "主人"}说：“${fact}”\n\n${pet.name}：“${mine.line}”`
      : style === "life"
        ? `【${pet.route === "work" ? "今日工作日记" : "今日校园日记"}】\n${said.text}\n\n${life || mine.line}`
        : style === "social"
          ? `${said.text}\n${socialLine(pet, category, owner, "zh", fact, variant)}`
          : `${said.text}\n\n${mine.line}${variant ? `\n${mine.closer}` : ""}`;
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
// English has no safe rule for swapping grammatical person, so the offline version quotes
// the owner and lets the pet comment; the AI gateway provides a true first-person retelling.
const asides: Record<Category, { work: string; campus: string; title: string }> = {
  sleep: {
    work: "I'd like a nap on today's schedule. Work can be discussed when I've rested.",
    campus: "I'd like to study rest at my own pace. The next class can wait until I wake up.",
    title: "Busy Sleeping",
  },
  snack: {
    work: "Happy to give food some serious thought. Please consider me for the next tasting slot.",
    campus: "A class about food sounds interesting. I'd happily keep thinking about it afterwards.",
    title: "Snack Time",
  },
  bath: {
    work: "Cleaning routine complete. I'd like some free time to settle back into my own pace.",
    campus: "That's enough bath class for now. I'd like a say in the next elective.",
    title: "Bath Day",
  },
  chaos: {
    work: "If there's a meeting about this, save me a speaking slot. I have thoughts too.",
    campus: "I have my own approach to this question. I'd like my reasoning heard alongside the result.",
    title: "A Little Chaos Today",
  },
  walk: {
    work: "An outing belongs on my preferred schedule. I'd like more time and my own pace next time.",
    campus: "I'd choose outdoor class again. My curiosity could use a little more time.",
    title: "Out and About",
  },
  other: {
    work: "",
    campus: "",
    title: "A Little Moment Today",
  },
};
function englishStory(pet: Pet, fact: string, category: Category, style: StoryStyle, variant: number): Story {
  const v = asides[category], owner = ownerName(pet), work = pet.route === "work";
  const Owner = owner.charAt(0).toUpperCase() + owner.slice(1);
  const life = work ? v.work : v.campus;
  const mine = reaction(pet, category, owner, "en", variant, fact);
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
        ? `${work ? "Work diary" : "School diary"}\n${Owner} wrote: "${fact}"\n\n${life || mine.line}`
        : style === "social"
          ? `${Owner} says: "${fact}"\n${socialLine(pet, category, owner, "en", fact, variant)}`
          : `${Owner} wrote: "${fact}"\n\n${mine.line}${variant ? `\n${mine.closer}` : ""}`;
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
): Stories {
  return {
    diary: generateStory(pet, description, category, "diary"),
    life: generateStory(pet, description, category, "life"),
    social: generateStory(pet, description, category, "social"),
    news: generateStory(pet, description, category, "news"),
  };
}
