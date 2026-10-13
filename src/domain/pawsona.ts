import { Lang, getLang } from "../i18n/core";
import { ownerName } from "./story-engine";
import { Temper } from "./temper";
import { Pet } from "./types";

// 爪格 / Pawsona (docs/01 8.17): a playful eight-question test that lands on one of the seven
// tempers, with a shareable result card. Copy is written separately in Chinese and English
// (docs/13 §11); nothing here is a behaviour assessment.
type Text = Record<Lang, string>;

export const TEMPERS: Temper[] = ["cool", "clingy", "goofy", "drama", "curious", "calm", "shy"];

export interface PawsonaResult {
  version: 1;
  temper: Temper;
  scores: Record<Temper, number>;
  takenAt: string;
}

/** Eight everyday scenes; each choice gives one point to one temper. Every temper appears 4–5 times. */
export const PAWSONA_QUESTIONS: { title: Text; choices: { label: Text; temper: Temper }[] }[] = [
  {
    title: { zh: "你到家开门的那一刻，它……", en: "The moment you get home and open the door, it…" },
    choices: [
      { label: { zh: "已经在门口等着，贴上来", en: "is already at the door, pressing against you" }, temper: "clingy" },
      { label: { zh: "冲过来转圈，顺便撞翻点东西", en: "charges over in circles, knocking something over" }, temper: "goofy" },
      { label: { zh: "看你一眼，继续睡", en: "glances at you and goes back to sleep" }, temper: "cool" },
      { label: { zh: "在远处看着，过一会儿才出来", en: "watches from far away and comes out later" }, temper: "shy" },
    ],
  },
  {
    title: { zh: "到了洗澡或清洁的时间，它……", en: "When it's bath or grooming time, it…" },
    choices: [
      { label: { zh: "叫得像出了什么大事", en: "carries on like it's the end of the world" }, temper: "drama" },
      { label: { zh: "一动不动，等这件事结束", en: "goes still and waits for it to be over" }, temper: "calm" },
      { label: { zh: "研究水、梳子或者你的手", en: "investigates the water, the brush or your hands" }, temper: "curious" },
      { label: { zh: "往你怀里钻", en: "burrows into your arms" }, temper: "clingy" },
    ],
  },
  {
    title: { zh: "家里来了一个新纸箱或新东西，它……", en: "A new box or object turns up at home. It…" },
    choices: [
      { label: { zh: "第一时间凑上去闻、钻进去", en: "is on it straight away, sniffing or climbing in" }, temper: "curious" },
      { label: { zh: "绕开走，远远看着", en: "walks the long way round and watches" }, temper: "shy" },
      { label: { zh: "先不理，等没人时才去看", en: "ignores it until nobody is looking" }, temper: "cool" },
      { label: { zh: "当成新玩具扑上去", en: "pounces on it like a new toy" }, temper: "goofy" },
    ],
  },
  {
    title: { zh: "你在忙着看手机或电脑时，它……", en: "While you're busy on your phone or laptop, it…" },
    choices: [
      { label: { zh: "坐到你手边或键盘上", en: "sits right by your hands, or on the keyboard" }, temper: "clingy" },
      { label: { zh: "在旁边发出声音，叹气给你听", en: "makes noises nearby, sighing for an audience" }, temper: "drama" },
      { label: { zh: "自己找个地方睡觉", en: "finds a spot and naps" }, temper: "calm" },
      { label: { zh: "去翻你不让碰的东西", en: "goes through the things it's not meant to touch" }, temper: "curious" },
    ],
  },
  {
    title: { zh: "零食袋一响，它……", en: "The treat bag rustles. It…" },
    choices: [
      { label: { zh: "瞬间出现，眼睛发亮", en: "appears instantly, eyes shining" }, temper: "goofy" },
      { label: { zh: "摆出一副饿了三天的样子", en: "acts like it hasn't eaten in three days" }, temper: "drama" },
      { label: { zh: "慢悠悠过来，不急", en: "strolls over, no rush" }, temper: "calm" },
      { label: { zh: "远远看着，等你递过去", en: "watches from a distance and waits for you to bring it" }, temper: "shy" },
    ],
  },
  {
    title: { zh: "你叫它的名字，它……", en: "You call its name. It…" },
    choices: [
      { label: { zh: "看心情，有时应有时不应", en: "answers if it feels like it" }, temper: "cool" },
      { label: { zh: "马上跑过来", en: "comes running right away" }, temper: "clingy" },
      { label: { zh: "歪头看你，像在分析", en: "tilts its head, as if analysing you" }, temper: "curious" },
      { label: { zh: "抬一下眼皮", en: "lifts one eyelid" }, temper: "calm" },
    ],
  },
  {
    title: { zh: "家里来了客人，它……", en: "Guests come over. It…" },
    choices: [
      { label: { zh: "躲起来，客人走了才出来", en: "hides until they leave" }, temper: "shy" },
      { label: { zh: "主动上去打招呼", en: "goes straight over to say hello" }, temper: "goofy" },
      { label: { zh: "在客人面前表演", en: "puts on a show for them" }, temper: "drama" },
      { label: { zh: "待在高处观察，保持距离", en: "watches from somewhere high, keeping its distance" }, temper: "cool" },
    ],
  },
  {
    title: { zh: "到了晚上，它……", en: "At night, it…" },
    choices: [
      { label: { zh: "占着床上最好的位置", en: "takes the best spot on the bed" }, temper: "cool" },
      { label: { zh: "突然开始跑来跑去", en: "suddenly starts racing around" }, temper: "goofy" },
      { label: { zh: "一觉睡到天亮", en: "sleeps straight through till morning" }, temper: "calm" },
      { label: { zh: "缩在自己的窝里，有点动静就醒", en: "curls up in its own den and wakes at any sound" }, temper: "shy" },
    ],
  },
];

/** The tally and winning temper. Ties go to the temper that scored first in the answers. */
export function scorePawsona(answers: number[]): { temper: Temper; scores: Record<Temper, number> } {
  if (answers.length !== PAWSONA_QUESTIONS.length || answers.some((a) => !Number.isInteger(a) || a < 0 || a > 3))
    throw new Error("incomplete");
  const scores = Object.fromEntries(TEMPERS.map((t) => [t, 0])) as Record<Temper, number>;
  const firstAt = new Map<Temper, number>();
  answers.forEach((a, i) => {
    const temper = PAWSONA_QUESTIONS[i].choices[a].temper;
    scores[temper]++;
    if (!firstAt.has(temper)) firstAt.set(temper, i);
  });
  const temper = [...firstAt.keys()].sort((a, b) => scores[b] - scores[a] || firstAt.get(a)! - firstAt.get(b)!)[0];
  return { temper, scores };
}
export function takePawsona(answers: number[], now = new Date()): PawsonaResult {
  return { version: 1, ...scorePawsona(answers), takenAt: now.toISOString() };
}
/**
 * The top three tempers for the bars on the card, as strength relative to the strongest (which fills
 * its bar). Shares of eight answers looked weak, so no percentage is shown (docs/01 8.24).
 */
export const topTempers = (scores: Record<Temper, number>) => {
  const top = Math.max(1, ...TEMPERS.map((t) => scores[t]));
  return TEMPERS.filter((t) => scores[t] > 0)
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, 3)
    .map((t) => ({ temper: t, percent: Math.round((scores[t] / top) * 100) }));
};

interface Persona {
  name: Text;
  code: string;
  /** The personality tag "set as its personality" writes; temperOf maps it back to this temper. */
  tag: string;
  color: string;
  trait: Text;
  intro: Text;
  manual: Text;
  match: Text;
}
export const PERSONAS: Record<Temper, Persona> = {
  cool: {
    name: { zh: "嘴硬大佬", en: "The Boss" }, code: "BOSS", tag: "傲娇", color: "#FF7A1A",
    trait: { zh: "嘴硬", en: "Aloof" },
    intro: {
      zh: "我是{name}。这个家归我管，{owner}负责开门和开罐头。你回来我会看一眼，看一眼就够了。别误会，我没在等你。",
      en: "I'm {name}. I run this place. {owner} handles doors and snacks. I noticed you came home. Noticing is not the same as caring.",
    },
    manual: { zh: "摸头之前先问。我可能说不。", en: "Ask before the head pat. The answer may be no." },
    match: { zh: "给我空间、又准时开饭的人类。", en: "A human who gives me space and feeds me on time." },
  },
  clingy: {
    name: { zh: "黏黏小尾巴", en: "The Velcro" }, code: "VELCRO", tag: "亲人", color: "#FF9EC7",
    trait: { zh: "黏人", en: "Clingy" },
    intro: {
      zh: "我是{name}，{owner}去哪我去哪，厕所门口也算。一天里最开心的，是你开门回家那一下。",
      en: "i'm {name}. wherever {owner} goes, i go. bathroom included. best part of my day is when you come home.",
    },
    manual: { zh: "多叫我的名字，回家先抱我。", en: "say my name a lot. hug first, keys later." },
    match: { zh: "不介意身后多一条小尾巴的人类。", en: "a human who doesn't mind a shadow." },
  },
  goofy: {
    name: { zh: "快乐憨憨", en: "The Sunshine Goof" }, code: "GOOF", tag: "憨厚", color: "#C6F432",
    trait: { zh: "憨", en: "Goofy" },
    intro: {
      zh: "我是{name}！今天也很开心！不知道为什么开心，反正很开心！{owner}回来了！现在更开心了！",
      en: "I'm {name}! Today is GREAT. Not sure why. {owner} came home, so now it's even better!",
    },
    manual: { zh: "扔点什么给我，什么都行。", en: "Throw something. Anything. I'll bring it back (probably)." },
    match: { zh: "笑点很低、体力很好的人类。", en: "A human with lots of energy and a low bar for fun." },
  },
  drama: {
    name: { zh: "戏精本精", en: "The Diva" }, code: "DIVA", tag: "戏精", color: "#B9A6FF",
    trait: { zh: "戏多", en: "Dramatic" },
    intro: {
      zh: "我是{name}。我这一生经历了太多：洗澡、等饭、{owner}出门整整五分钟。都挺过来了。好吧，其实没那么惨。",
      en: "I'm {name}. I have survived so much. Baths. Waiting for dinner. {owner} leaving for five whole minutes. Okay, it was fine.",
    },
    manual: { zh: "我叫得很大声的时候，先看看我是不是只想要观众。", en: "When I yell, check whether I just want an audience. I usually do." },
    match: { zh: "会在对的时候给我鼓掌的人类。", en: "A human who claps at the right moments." },
  },
  curious: {
    name: { zh: "小小科学家", en: "The Lab Gremlin" }, code: "GREMLIN", tag: "好奇", color: "#FFD3E5",
    trait: { zh: "好奇", en: "Curious" },
    intro: {
      zh: "我是{name}，家里的首席研究员。纸箱、塑料袋、{owner}的水杯，都在研究范围内。结论：水杯推下去会响。明天再验证一次。",
      en: "I'm {name}, lead researcher of this house. Boxes, bags, {owner}'s mug. Findings: the mug makes a noise when it falls. Will retest tomorrow.",
    },
    manual: { zh: "新东西先给我检查，检查完才算你的。", en: "New things go through inspection first. Mine, then yours." },
    match: { zh: "不怕东西被翻一翻的人类。", en: "A human who doesn't mind a little chaos on the shelf." },
  },
  calm: {
    name: { zh: "佛系大师", en: "The Zen Master" }, code: "ZEN", tag: "随和", color: "#DDD2FF",
    trait: { zh: "淡定", en: "Calm" },
    intro: {
      zh: "我是{name}。作息规律，情绪稳定。{owner}出门，我睡觉；{owner}回来，我继续睡。以上。",
      en: "I'm {name}. Stable schedule, stable mood. {owner} leaves, I nap. {owner} returns, I continue napping. Nothing further.",
    },
    manual: { zh: "按时开饭，其他随意。", en: "Feed on schedule. Everything else is optional." },
    match: { zh: "不慌不忙的人类。", en: "A human who's in no particular hurry." },
  },
  shy: {
    name: { zh: "小声派", en: "The Quiet One" }, code: "QUIET", tag: "慢热", color: "#FFF3DF",
    trait: { zh: "慢热", en: "Shy" },
    intro: {
      zh: "我是{name}……我比较慢热。新东西要先看一会儿，新的人要先闻一会儿。不过{owner}的手，我已经认得了。",
      en: "I'm {name}... I take a while. New things need a long look first. New people too. But I know {owner}'s hands now.",
    },
    manual: { zh: "说话轻一点，等我自己过来。", en: "Speak softly and let me come to you." },
    match: { zh: "有耐心、愿意等我的人类。", en: "A patient human who's happy to wait." },
  },
};

const fill = (s: string, pet: Pet, lang: Lang) => {
  const owner = ownerName(pet);
  const out = s.split("{name}").join(pet.name).split("{owner}").join(owner);
  return lang === "en" && s.startsWith("{owner}") ? out.charAt(0).toUpperCase() + out.slice(1) : out;
};
/** Everything the result card shows, in the given language. */
export function pawsonaCard(pet: Pet, result: Pick<PawsonaResult, "temper" | "scores">, lang: Lang = getLang()) {
  const p = PERSONAS[result.temper];
  return {
    name: p.name[lang],
    code: p.code,
    color: p.color,
    intro: fill(p.intro[lang], pet, lang),
    manual: p.manual[lang],
    match: p.match[lang],
    bars: topTempers(result.scores).map((b) => ({ ...b, label: PERSONAS[b.temper].trait[lang] })),
  };
}
/** The pet with its personality set to the tag for this 爪格; only later stories change. */
export const adoptPawsona = (pet: Pet, temper: Temper): Pet => ({
  ...pet,
  personality: PERSONAS[temper].tag,
  personalitySource: "tag",
  questionnaire: undefined,
});
