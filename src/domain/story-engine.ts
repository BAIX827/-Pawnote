import { Category, Pet, Stories, Story, StoryStyle } from "./types";
import { speciesLabel } from "./pet-profile";
const incidents: Record<
  Category,
  {
    diary: string[];
    work: string;
    campus: string;
    social: string;
    title: string;
    topic: string;
  }
> = {
  sleep: {
    diary: [
      "梦里已经把生活安排得明明白白，醒来只需要伸个懒腰。",
      "睡觉这件事，我是认真的。姿势换了三个，都很成功。",
    ],
    work: "沉浸式带薪休息研究已完成。工作可以等，午觉的黄金窗口只有一次。",
    campus: "睡眠研究课已完成实地实践。闭眼认真听讲，也是我的学习方式。",
    social: "忙了一下午，忙着把梦做完。",
    title: "睡眠研究员今日再次延长实验时间",
    topic: "睡觉这件事",
  },
  snack: {
    diary: [
      "食物路过我的嘴，这是一场命中注定的相遇。",
      "味道不错，建议常备。下次请直接放在我够得到的地方。",
    ],
    work: "作为零食鉴定员，我对产品进行了深入抽样。建议补货，继续研究。",
    campus: "食堂风味调研已完成，样本数量仍有提升空间。申请下一轮实践经费。",
    social: "尝一口是礼貌，多尝几口是对食物的尊重。",
    title: "零食抽样研究取得阶段性进展",
    topic: "吃这件事",
  },
  bath: {
    diary: [
      "身上的香味，我暂时保留意见。",
      "水是湿的，这一点事先没有人通知我。",
    ],
    work: "清洁主题团建已参加，并当场提出用零食补偿的建议。",
    campus: "卫生实践课顺利结束，建议下次改为阳光浴选修课。",
    social: "今日新造型：香香的，有点委屈的。",
    title: "泡泡主题活动引发当事宠物热议",
    topic: "洗澡这件事",
  },
  chaos: {
    diary: [
      "艺术创作，总需要一点动静。",
      "我只是想看看它掉下去是什么样子。现在知道了。",
    ],
    work: "环境结构压力测试已完成。项目经验增加，预算请另行讨论。",
    campus: "空间改造实践作业已提交，期待老师给出有创意的评语。",
    social: "关于今天的现场，我选择把它称为创作过程。",
    title: "毛孩创意改造项目引发家庭关注",
    topic: "今天的现场",
  },
  walk: {
    diary: [
      "外面的每一阵风都带着新消息，我都收到了。",
      "这一带归我巡视，今天一切正常。",
    ],
    work: "外勤巡逻结束，沿途气味信息已收集。申请零食作为差旅补助。",
    campus: "户外观察课已完成，气味地图又增加了一页。",
    social: "出门巡逻，顺便让人类运动一下。",
    title: "街区巡逻员完成新一轮外勤任务",
    topic: "出门这件事",
  },
  other: {
    diary: [
      "这件小事，也值得放进我的人生档案。",
      "日子就是这样一件一件小事攒起来的。",
    ],
    work: "已将这段日常归档为今日工作纪要。",
    campus: "已将这段日常收录为校园生活笔记。",
    social: "我的生活，又添了一条值得记住的动态。",
    title: "毛孩生活档案新增一段独家记录",
    topic: "今天这件事",
  },
};
const voices: Record<string, string> = {
  傲娇: "本喵自有安排。",
  憨厚: "能和你一起过这一天，我很开心。",
  戏精: "请把聚光灯给我，今日主角已就位！",
  亲人: "这一页，要和你一起收藏。",
  独立: "我的生活节奏，由我安排。",
  活泼: "今天的生活，继续元气营业！",
  慢热: "慢慢熟悉，慢慢把故事写好。",
  好奇: "小小的世界，还有好多值得观察。",
  稳重: "稳稳当当地，把这一天记下来。",
  敏感: "给我一点空间，按自己的节奏就好。",
  随和: "按平常的节奏，过好今天。",
  有主见: "关于我的故事，我有自己的想法。",
  温柔: "轻轻收藏，今天的小日子。",
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

export const selfName = (pet: Pet) => SELF[pet.species] ?? "我";
export const defaultOwnerName = (species: Pet["species"]) =>
  species === "cat" ? "铲屎官" : species === "dog" ? "主人" : "我的人类";
export const ownerName = (pet: Pet) =>
  pet.ownerTitle?.trim() || defaultOwnerName(pet.species);

/** Turns what the owner wrote about the pet into the pet's own first-person account. */
export function toPetVoice(
  pet: Pet,
  description: string,
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
  for (const [from, to] of SPINS)
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
    throw new Error("请填写 1–500 字的真实日常。");
  const v = incidents[category];
  const self = selfName(pet),
    owner = ownerName(pet),
    said = toPetVoice(pet, fact);
  const voice = (Object.hasOwn(voices, pet.personality) ? voices[pet.personality]
    : `我的性格小档案：${pet.personality}。这一页，按自己的节奏写。`).replace("本喵", self);
  const closer = variant % 2 ? "好了，今天的营业到这里。" : voice;
  const note = said.spin
    ? `\n（注：${owner}管这叫“${said.spin}”，${self}保留意见。）`
    : "";
  const life = pet.route === "work" ? v.work : v.campus;
  const text =
    style === "news"
      ? `本报讯｜据${owner}向本报爆料：“${fact}”\n\n当事${speciesLabel(pet)} ${pet.name} 随后回应：“${said.text}”\n\n在毛孩世界里，这被写进了${pet.route === "work" ? "营业" : "校园"}档案。${life}\n\n${variant % 2 ? "这件小事，已收录进毛孩人生特刊。" : "以上为基于主人记录的虚构娱乐报道。"}`
      : style === "life"
        ? `【${pet.route === "work" ? "今日工作纪要" : "今日课堂笔记"}】\n${said.text}\n\n${life}${note}`
        : style === "social"
          ? `${said.text}${v.social}`
          : `${said.text}\n\n${v.diary[variant % v.diary.length]}${closer}${note}`;
  const title =
    style === "news"
      ? `${pet.name}：${v.title}`
      : style === "life"
        ? `${pet.name}的${pet.route === "work" ? "营业报告" : "校园笔记"}`
        : style === "social"
          ? `${pet.name}正在营业`
          : `关于${v.topic}，${self}有话说`;
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
