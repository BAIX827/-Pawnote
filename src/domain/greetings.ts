import type { Lang } from "../i18n/core";
import { Pet } from "./types";
import { Temper, temperOf, withSelf } from "./temper";

// 爪窝's opening line before there is an entry to quote: one per part of the day, in the pet's own
// temper (docs/01 8.25), so a lively dog never greets you like an aloof cat.
export type DaySlot = "night" | "morning" | "noon" | "afternoon" | "evening";

export const slotOf = (hour: number): DaySlot =>
  hour < 6 ? "night" : hour < 11 ? "morning" : hour < 14 ? "noon" : hour < 18 ? "afternoon" : "evening";

type Text = { zh: string; en: string };
const GREETINGS: Record<Temper, Record<DaySlot, Text>> = {
  cool: {
    night: { zh: "嘘，夜间巡逻中。", en: "Shh. Night patrol in progress." },
    morning: { zh: "早，今天的早饭呢？", en: "Morning. Where is breakfast?" },
    noon: { zh: "中午了，适合找块太阳躺下。", en: "Noon already. Time to find a patch of sun." },
    afternoon: { zh: "下午的风不错，我批准了。", en: "Nice breeze this afternoon. Approved." },
    evening: { zh: "你回来啦？我可没有在等你。", en: "Oh, you're back? I wasn't waiting or anything." },
  },
  clingy: {
    night: { zh: "你还没睡吗？那我也陪着。", en: "you're still up? then i'll stay up too." },
    morning: { zh: "早安！今天也要一直在一起。", en: "good morning! let's stay together all day." },
    noon: { zh: "中午了，可以抱一下再吃饭吗？", en: "it's noon. one cuddle before lunch?" },
    afternoon: { zh: "下午好长，你什么时候回来呀？", en: "the afternoon is so long. when are you back?" },
    evening: { zh: "你回来了！我在门口等了好久。", en: "you're home! i waited by the door for ages." },
  },
  goofy: {
    night: { zh: "半夜了！但我还能再玩一会儿！", en: "It's the middle of the night! I can still play a bit!" },
    morning: { zh: "早上好！出门吗？出门吗！", en: "Good morning! Going out? Going out!" },
    noon: { zh: "开饭了吗？我听见碗响了！", en: "Is it lunch? I heard a bowl!" },
    afternoon: { zh: "下午了，球呢？我把球弄丢了。", en: "Afternoon! Where's the ball? I lost the ball." },
    evening: { zh: "你回来啦！！我转了三圈欢迎你！", en: "You're HOME!! I did three spins for you!" },
  },
  drama: {
    night: { zh: "夜深了，正适合我的独白。", en: "Late night. The perfect hour for my monologue." },
    morning: { zh: "早上了，我的观众呢？", en: "Morning. Where is my audience?" },
    noon: { zh: "午饭还没上，这一幕太漫长了。", en: "Lunch hasn't arrived. This act drags on." },
    afternoon: { zh: "下午我排练了一下叹气，你听。", en: "I rehearsed a sigh this afternoon. Listen." },
    evening: { zh: "你终于回来了，我差点就要谢幕了。", en: "You're finally back. I nearly took my final bow." },
  },
  curious: {
    night: { zh: "夜里的声音比白天多，我在记录。", en: "Night has more sounds than day. Taking notes." },
    morning: { zh: "早，窗外有只鸟，我看了它很久。", en: "Morning. There's a bird outside. I've been watching." },
    noon: { zh: "中午了，你今天吃什么？我想闻一下。", en: "Noon. What are you eating? I'd like a sniff." },
    afternoon: { zh: "下午发现了一个新角落，晚点带你看。", en: "Found a new corner this afternoon. I'll show you later." },
    evening: { zh: "你回来了，包里有什么新东西？", en: "You're back. Anything new in the bag?" },
  },
  calm: {
    night: { zh: "夜里很安静，我在慢慢睡。", en: "Quiet night. I'm sleeping slowly." },
    morning: { zh: "早。不急，慢慢来。", en: "Morning. No rush." },
    noon: { zh: "中午了，晒一会儿太阳就好。", en: "Noon. A bit of sun will do." },
    afternoon: { zh: "下午挺好的，没什么事。", en: "Nice afternoon. Nothing to report." },
    evening: { zh: "回来了啊。今天也辛苦了。", en: "You're back. Long day, huh." },
  },
  shy: {
    night: { zh: "好黑……你在就好。", en: "it's dark... i'm glad you're here." },
    morning: { zh: "早、早上好……", en: "g-good morning..." },
    noon: { zh: "中午了……我在老地方。", en: "it's noon... i'm in my usual spot." },
    afternoon: { zh: "下午有点吵，我躲了一会儿。", en: "it was noisy this afternoon. i hid for a bit." },
    evening: { zh: "你回来了……我出来一下下。", en: "you're back... i'll come out for a little bit." },
  },
};

// In Chinese the pet says 咪 / 汪 / its name instead of 我 (docs/13 v3 §3).
export const greeting = (pet: Pet, hour: number, lang: Lang): string => {
  const line = GREETINGS[temperOf(pet)][slotOf(hour)][lang];
  return lang === "zh" ? withSelf(line, pet) : line;
};
