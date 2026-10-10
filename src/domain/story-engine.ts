import { Category, Pet, Stories, Story, StoryStyle } from "./types";
import { speciesLabel } from "./pet-profile";
import { getLang, t } from "../i18n/core";
import { isLoss, isSensitive, reaction, socialLine, temperOf } from "./temper";
const incidents: Record<
  Category,
  {
    work: string;
    campus: string;
    title: string;
    topic: string;
  }
> = {
  sleep: {
    work: "沉浸式带薪休息研究已完成。工作可以等，午觉的黄金窗口只有一次。",
    campus: "睡眠研究课已完成实地实践。闭眼认真听讲，也是我的学习方式。",
    title: "睡眠研究员今日再次延长实验时间",
    topic: "睡觉这件事",
  },
  snack: {
    work: "作为零食鉴定员，我对产品进行了深入抽样。建议补货，继续研究。",
    campus: "食堂风味调研已完成，样本数量仍有提升空间。申请下一轮实践经费。",
    title: "零食抽样研究取得阶段性进展",
    topic: "吃这件事",
  },
  bath: {
    work: "清洁主题团建已参加，并当场提出用零食补偿的建议。",
    campus: "卫生实践课顺利结束，建议下次改为阳光浴选修课。",
    title: "泡泡主题活动引发当事宠物热议",
    topic: "洗澡这件事",
  },
  chaos: {
    work: "环境结构压力测试已完成。项目经验增加，预算请另行讨论。",
    campus: "空间改造实践作业已提交，期待老师给出有创意的评语。",
    title: "毛孩创意改造项目引发家庭关注",
    topic: "今天的现场",
  },
  walk: {
    work: "外勤巡逻结束，沿途气味信息已收集。申请零食作为差旅补助。",
    campus: "户外观察课已完成，气味地图又增加了一页。",
    title: "街区巡逻员完成新一轮外勤任务",
    topic: "出门这件事",
  },
  other: {
    work: "已将这段日常归档为今日工作纪要。",
    campus: "已将这段日常收录为校园生活笔记。",
    title: "毛孩生活档案新增一段独家记录",
    topic: "今天这件事",
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
const COMMON_ALIASES = ["小家伙", "小东西", "小祖宗", "毛孩子", "崽崽"];
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
  ["walk", /散步|遛|出门|公园|楼下|外面|巡逻|草地|晒太阳/],
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
  const self = selfName(pet),
    owner = ownerName(pet),
    said = toPetVoice(pet, fact, grave);
  const mine = reaction(pet, category, owner, "zh", variant, fact);
  if (grave && style === "news") return done(`${pet.name}的今日记录`, `${owner}写下：“${fact}”\n\n${mine.line}`);
  if (grave && style !== "diary")
    return done(`${pet.name}的今日记录`, `${said.text}\n\n${style === "social" ? mine.closer : mine.line}`);
  const note = said.spin
    ? `\n（注：${owner}管这叫“${said.spin}”，${self}保留意见。）`
    : "";
  const life = pet.route === "work" ? v.work : v.campus;
  const text =
    style === "news"
      ? `本报讯｜据${owner}向本报爆料：“${fact}”\n\n当事${speciesLabel(pet)} ${pet.name} 随后回应：“${said.text}”\n\n在毛孩世界里，这被写进了${pet.route === "work" ? "营业" : "校园"}档案。${life}\n\n${variant % 2 ? "这件小事，已收录进爪报特刊。" : "以上为基于主人记录的虚构娱乐报道。"}`
      : style === "life"
        ? `【${pet.route === "work" ? "今日工作纪要" : "今日课堂笔记"}】\n1. ${said.text}\n2. ${life}\n备注：${mine.closer}${note}`
        : style === "social"
          ? `${said.text}${socialLine(pet, category, owner, "zh", fact)}`
          : `${said.text}\n\n${mine.line}\n${mine.closer}${note}`;
  const title =
    style === "news"
      ? `${pet.name}：${v.title}`
      : style === "life"
        ? `${pet.name}的${pet.route === "work" ? "营业报告" : "校园笔记"}`
        : style === "social"
          ? `${pet.name}正在营业`
          : `关于${v.topic}，${self}有话说`;
  return done(title, text);
}
// English has no safe rule for swapping grammatical person, so the offline version quotes
// the owner and lets the pet comment; the AI gateway provides a true first-person retelling.
const asides: Record<Category, { work: string; campus: string; title: string }> = {
  sleep: {
    work: "Paid rest research completed. Work can wait; the afternoon nap window cannot.",
    campus: "Sleep studies: field practice complete. Listening with my eyes closed still counts.",
    title: "Sleep researcher extends experiment yet again",
  },
  snack: {
    work: "As snack inspector, I sampled the product thoroughly. Recommend restocking for further study.",
    campus: "Cafeteria flavour survey done. Sample size still too small; requesting more funding.",
    title: "Snack sampling study reports early progress",
  },
  bath: {
    work: "Attended the cleaning-themed team event and proposed compensation in treats.",
    campus: "Hygiene practical complete. Suggest replacing it with a sunbathing elective.",
    title: "Bubble event sparks debate from the party involved",
  },
  chaos: {
    work: "Structural stress test of the environment complete. Budget to be discussed separately.",
    campus: "Space redesign assignment submitted. Looking forward to creative feedback.",
    title: "Creative renovation project draws household attention",
  },
  walk: {
    work: "Field patrol finished, scent data collected. Requesting treats as travel allowance.",
    campus: "Outdoor observation class complete. One more page in the scent map.",
    title: "Neighbourhood patroller completes another field mission",
  },
  other: {
    work: "Filed under today's work notes.",
    campus: "Added to my campus notebook.",
    title: "Life archive gains an exclusive new entry",
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
      ? `PAW DISPATCH | ${Owner} told this paper: "${fact}"\n\n${pet.name} was reached for comment: "${mine.line}"${pet.species === "dog" ? " Our rating: 13/10." : ""}\n\nIn the pet world this now sits in the ${work ? "work" : "campus"} file. ${life}\n\n${variant % 2 ? "This small story has been added to the special edition." : "This is fictional entertainment based on the owner's note."}`
      : style === "life"
        ? `${work ? "Work log" : "Class notes"}\n1. ${Owner} reports: "${fact}"\n2. ${life}\nNote: ${mine.closer}`
        : style === "social"
          ? `${Owner} says: "${fact}" ${socialLine(pet, category, owner, "en", fact)}`
          : `${Owner} wrote: "${fact}"\n\n${mine.line}\n${mine.closer}`;
  const title =
    style === "news"
      ? `${pet.name}: ${v.title}`
      : style === "life"
        ? `${pet.name}'s ${work ? "work report" : "campus notes"}`
        : style === "social"
          ? `${pet.name} is open for business`
          : `${pet.name} has something to say`;
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
