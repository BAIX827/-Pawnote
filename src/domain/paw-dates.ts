import { dayKey } from "./dates";
import { Lang, getLang, t } from "../i18n/core";
import { detectCategory, ownerName } from "./story-engine";
import { Temper, isLoss, isSensitive, temperOf } from "./temper";
import { AppState, Category, LifeEvent, Pet, Routine, Species, id } from "./types";

// 爪约 (docs/01 8.16): the pet calls its owner over for something they do together.
// Every line is a local template, written separately in Chinese and English (docs/13 §10).
interface Activity {
  /** Chinese label; doubles as the i18n key. */
  label: string;
  category: Category;
  time: string;
  lines: Record<Lang, string[]>;
  /** What the owner would write in 爪语 afterwards. */
  diary: Record<Lang, string>;
}

export const ACTIVITIES = {
  walk: {
    label: "出门遛弯", category: "walk", time: "07:30",
    lines: {
      zh: ["{owner}，出门！出门！牵引绳在门口。", "外面的味道在等我，{owner}穿鞋吧。"],
      en: ["{owner}. Walk. Walk? WALK.", "The outside has new smells. Shoes on, {owner}."],
    },
    diary: { zh: "今天带{name}出门遛弯了。", en: "Took {name} out for a walk today." },
  },
  fetch: {
    label: "扔球", category: "other", time: "17:30",
    lines: {
      zh: ["球在我嘴里，{owner}的手空着。正好。", "扔一次就好。好吧，十次。"],
      en: ["The ball is in my mouth and your hands are empty. Perfect timing.", "Throw it once. Okay, ten times."],
    },
    diary: { zh: "今天陪{name}玩了扔球。", en: "Played fetch with {name} today." },
  },
  snack: {
    label: "小零食", category: "snack", time: "15:00",
    lines: {
      zh: ["{owner}，零食柜那边好像有动静。", "我今天挺乖的。乖的有零食吧。"],
      en: ["{owner}, I heard the treat cupboard. It said my name.", "I was good today. Good gets a snack, right?"],
    },
    diary: { zh: "今天给{name}吃了小零食。", en: "Gave {name} a little snack today." },
  },
  brush: {
    label: "梳毛", category: "other", time: "21:00",
    lines: {
      zh: ["毛有点乱了。梳子在抽屉第二层。", "背上那块我够不着，交给你了。"],
      en: ["My fur needs a manager. The brush is in the second drawer.", "There's a spot on my back I can't reach. That's your job."],
    },
    diary: { zh: "今天给{name}梳了毛。", en: "Brushed {name} today." },
  },
  wand: {
    label: "逗猫棒", category: "other", time: "20:30",
    lines: {
      zh: ["逗猫棒在柜子上，我盯它很久了。", "{owner}，羽毛那根。你来晃，我来抓。"],
      en: ["The wand toy is on the shelf. I've been watching it.", "{owner}. The feather one. You wave, I hunt."],
    },
    diary: { zh: "今天陪{name}玩了逗猫棒。", en: "Played with the wand toy with {name} today." },
  },
  sunbath: {
    label: "陪我晒太阳", category: "sleep", time: "13:00",
    lines: {
      zh: ["阳台那块太阳到了，旁边给你留了位置。", "太阳正好。你坐着，我躺你腿上。"],
      en: ["The sun spot has arrived. I saved you the edge.", "Good sun right now. You sit, I'll take your lap."],
    },
    diary: { zh: "今天陪{name}晒了会儿太阳。", en: "Sat in the sun with {name} today." },
  },
  roam: {
    label: "出笼放风", category: "walk", time: "19:00",
    lines: {
      zh: ["笼门那边，我想出去巡视一下领地。", "地板我还没跑完，开门吧。"],
      en: ["Gate, please. I need to inspect my territory.", "I haven't finished running the floor. Open up."],
    },
    diary: { zh: "今天让{name}出笼放风了。", en: "Let {name} out to roam today." },
  },
  hay: {
    label: "新鲜牧草", category: "snack", time: "08:00",
    lines: {
      zh: ["草盆见底了，我已经跺了两次脚。", "新的牧草，要香的那种。"],
      en: ["The hay rack is empty. I've thumped twice already.", "Fresh hay, please. The good-smelling kind."],
    },
    diary: { zh: "今天给{name}换了新鲜牧草。", en: "Gave {name} fresh hay today." },
  },
  pat: {
    label: "摸摸头", category: "other", time: "21:00",
    lines: {
      zh: ["我把头低下来了。你懂的。", "额头这里，摸两下就好。"],
      en: ["I've lowered my head. You know what this means.", "Right here on the forehead. Two pats will do."],
    },
    diary: { zh: "今天摸了摸{name}的头。", en: "Gave {name} head pats today." },
  },
  nightRun: {
    label: "夜间放风", category: "walk", time: "22:00",
    lines: {
      zh: ["天黑了，我的班开始了。放我出来巡逻。", "轮子跑腻了，今晚想去外面那个大世界。"],
      en: ["It's dark. My shift has started. Let me out to patrol.", "The wheel is fine, but I'd like the big world tonight."],
    },
    diary: { zh: "今天晚上让{name}出来放风了。", en: "Let {name} out for a night run." },
  },
  seeds: {
    label: "加点瓜子", category: "snack", time: "20:00",
    lines: {
      zh: ["仓库清点完了，缺货。", "颊囊还有空位，可以再装一点。"],
      en: ["Inventory check complete. We're low.", "My cheeks have room for a few more."],
    },
    diary: { zh: "今天给{name}加了瓜子。", en: "Topped up {name}'s seeds today." },
  },
  lettuce: {
    label: "生菜时间", category: "snack", time: "18:00",
    lines: {
      zh: ["冰箱门响了吗？我听见了。我先叫为敬。", "生菜。生菜。生菜。"],
      en: ["Was that the fridge? I heard the fridge.", "Lettuce. Lettuce. Lettuce."],
    },
    diary: { zh: "今天给{name}吃了生菜。", en: "Gave {name} lettuce today." },
  },
  fly: {
    label: "出笼飞一会", category: "walk", time: "10:00",
    lines: {
      zh: ["翅膀想伸一伸，开门吧。", "让我飞一圈，最后落在你肩膀上。"],
      en: ["My wings want a stretch. Door, please.", "One lap of the room, then I land on your shoulder."],
    },
    diary: { zh: "今天让{name}出笼飞了一会儿。", en: "Let {name} out for some flying today." },
  },
  chat: {
    label: "陪我说话", category: "other", time: "19:30",
    lines: {
      zh: ["我学会了一个新声音，想放给你听。", "你说一句，我学一句。"],
      en: ["I learned a new sound. I'd like to perform it.", "You say a thing, I say it back."],
    },
    diary: { zh: "今天陪{name}说了会儿话。", en: "Chatted with {name} today." },
  },
  lamp: {
    label: "晒灯检查", category: "sleep", time: "09:00",
    lines: {
      zh: ["我的太阳该开了。", "温度再高一点，我就能动了。"],
      en: ["My sun should be on by now.", "A few degrees warmer and I'll be able to move."],
    },
    diary: { zh: "今天给{name}检查了晒灯。", en: "Checked {name}'s heat lamp today." },
  },
  feed: {
    label: "喂食", category: "snack", time: "18:00",
    lines: {
      zh: ["我在角落看了你很久。是饭点的意思。", "开饭时间。我准备好了。"],
      en: ["I've been watching you from the corner. That means dinner.", "Feeding time. I'm ready."],
    },
    diary: { zh: "今天给{name}喂了食。", en: "Fed {name} today." },
  },
  soak: {
    label: "泡澡", category: "bath", time: "16:00",
    lines: {
      zh: ["想泡一会儿温水，不急。", "水温合适的话，我会慢慢伸出头。"],
      en: ["A warm soak would be nice. No rush.", "If the water's right, I'll slowly put my head out."],
    },
    diary: { zh: "今天给{name}泡了个澡。", en: "Gave {name} a soak today." },
  },
  swim: {
    label: "看我游一圈", category: "other", time: "20:00",
    lines: {
      zh: ["我游到前面来了，你看到了吗？", "新的一圈，和上一圈不一样。真的。"],
      en: ["I swam to the front glass. Did you see?", "New lap. Totally different from the last one."],
    },
    diary: { zh: "今天在缸边看{name}游了会儿。", en: "Watched {name} swim for a while today." },
  },
  play: {
    label: "陪我玩", category: "other", time: "19:00",
    lines: {
      zh: ["我有点闲。你也闲吗？", "{owner}，陪我玩一会儿。"],
      en: ["I'm a little bored. Are you?", "{owner}, play with me for a bit."],
    },
    diary: { zh: "今天陪{name}玩了一会儿。", en: "Played with {name} today." },
  },
} satisfies Record<string, Activity>;
export type ActivityKey = keyof typeof ACTIVITIES;
export const isActivity = (key: string): key is ActivityKey => Object.hasOwn(ACTIVITIES, key);

/** What each species tends to ask for, in the order the 爪约 page offers them. */
export const PRESETS: Record<Species, ActivityKey[]> = {
  dog: ["walk", "fetch", "snack", "brush"],
  cat: ["wand", "snack", "brush", "sunbath"],
  rabbit: ["roam", "hay", "pat", "snack"],
  hamster: ["nightRun", "seeds"],
  guineaPig: ["lettuce", "roam"],
  bird: ["fly", "chat", "snack"],
  lizard: ["lamp", "feed", "soak"],
  snake: ["lamp", "feed"],
  turtle: ["lamp", "feed", "soak"],
  fish: ["feed", "swim"],
  other: ["play", "snack"],
};

const CUSTOM: Record<Lang, string[]> = {
  zh: ["{owner}，{thing}的时间到了。", "约好的{thing}，我记着呢。"],
  en: ["{owner}, it's {thing} time.", "We said {thing}. I remember."],
};
// One sign-off per temper, so the same ask sounds like this particular pet (docs/13 §10).
const TAILS: Record<Temper, Record<Lang, string[]>> = {
  cool: { zh: ["我只是顺便提一下。", "不来也行。我就在这儿。"], en: ["Not that I care.", "No pressure. I'll just be here."] },
  clingy: { zh: ["我在门口等你。", "想和你一起。"], en: ["i'll be by the door.", "i'd like it to be you."] },
  goofy: { zh: ["现在吗？现在吗！", "我已经准备好了！"], en: ["NOW? NOW.", "I'm ready! I've been ready!"] },
  drama: { zh: ["再不来我就要枯萎了。", "这可能是我这辈子最重要的请求。"], en: ["I've waited my whole life (ten minutes).", "This may be the most important request of my career."] },
  curious: { zh: ["实验对象已就位。", "我想再验证一次。"], en: ["Test subject ready.", "I'd like to run this experiment again."] },
  calm: { zh: ["以上。", "特此提醒。"], en: ["Nothing further.", "That is all."] },
  shy: { zh: ["……你有空的话。", "我小声说一下。"], en: ["...only if you have time.", "just saying it quietly."] },
};
// After an entry about illness, injury or going missing: no jokes and no temper flourish.
const QUIET: Record<Lang, string> = {
  zh: "{owner}，我们约好的事到点了。我要是不舒服，就先陪我歇着。",
  en: "{owner}, it's the time we agreed on. If I'm not feeling well, just sit with me instead.",
};

export const MAX_ROUTINES = 12;
export const MAX_LABEL = 20;
export const SNOOZE_MINUTES = 30;
const QUIET_DAYS = 3;
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const isTime = (v: unknown): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
/** Accepts 8:30, 0830 or 08：30 and returns HH:MM, or undefined. */
export function normalizeTime(input: string): string | undefined {
  const m = input.trim().replace("：", ":").match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) return undefined;
  const out = `${m[1].padStart(2, "0")}:${m[2]}`;
  return isTime(out) ? out : undefined;
}
const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const doneOn = (r: Routine, now: Date) => !!r.lastDone && dayKey(new Date(r.lastDone)) === dayKey(now);

/** The routine's name as shown: a built-in activity in the interface language, or the owner's words as written. */
export const activityLabel = (r: Pick<Routine, "activity" | "label">) =>
  isActivity(r.activity) ? t(ACTIVITIES[r.activity].label) : (r.label ?? "");

/** The latest entry says the pet died: 爪约 stops speaking for it. */
export const remindersPaused = (events: LifeEvent[]) => {
  let latest: LifeEvent | undefined;
  for (const event of events)
    if (!latest || Date.parse(event.createdAt) > Date.parse(latest.createdAt)) latest = event;
  return !!latest && isLoss(latest.description);
};
const quiet = (events: LifeEvent[], now: Date) =>
  events.some((e) => now.getTime() - Date.parse(e.createdAt) < QUIET_DAYS * 86400000 && isSensitive(e.description));

const fill = (s: string, owner: string, thing: string, lang: Lang) => {
  const out = s.split("{owner}").join(owner).split("{thing}").join(thing);
  return lang === "en" && s.startsWith("{owner}") ? out.charAt(0).toUpperCase() + out.slice(1) : out;
};
/** What the pet says when it is time, in its own temper and the given language. */
export function reminderLine(
  pet: Pet,
  routine: Pick<Routine, "activity" | "label">,
  variant = 0,
  options: { events?: LifeEvent[]; now?: Date; lang?: Lang } = {},
): string {
  const lang = options.lang ?? getLang(),
    owner = ownerName(pet),
    thing = routine.label?.trim() ?? "";
  if (quiet(options.events ?? [], options.now ?? new Date())) return fill(QUIET[lang], owner, thing, lang);
  const temper = temperOf(pet);
  const lines = isActivity(routine.activity) ? ACTIVITIES[routine.activity].lines[lang] : CUSTOM[lang];
  const tails = TAILS[temper][lang];
  const line = `${fill(lines[variant % lines.length], owner, thing, lang)}${lang === "en" ? " " : ""}${tails[Math.floor(variant / lines.length) % tails.length]}`;
  // Clingy pets write in lowercase in English (docs/13 §4).
  return lang === "en" && temper === "clingy" ? line.toLowerCase() : line;
}
/** A different line each day, steady within the day. */
export const dayVariant = (now: Date, salt = 0) =>
  Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000) + salt;

/** Routines whose time has come today and that the owner has not done or put off. */
export function dueRoutines(routines: Routine[] = [], now = new Date()): Routine[] {
  const minute = now.getHours() * 60 + now.getMinutes();
  return routines
    .filter((r) => r.enabled && r.days.includes(now.getDay()) && minutesOf(r.time) <= minute && !doneOn(r, now) &&
      !(r.snoozedUntil && Date.parse(r.snoozedUntil) > now.getTime()))
    .sort((a, b) => a.time.localeCompare(b.time));
}
/** The next time a routine comes round, within the coming week. */
export function nextRoutine(routines: Routine[] = [], now = new Date()): { routine: Routine; at: Date } | undefined {
  let best: { routine: Routine; at: Date } | undefined;
  for (const r of routines) {
    if (!r.enabled) continue;
    for (let offset = 0; offset <= 7; offset++) {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, Number(r.time.slice(0, 2)), Number(r.time.slice(3)));
      if (!r.days.includes(at.getDay()) || at.getTime() <= now.getTime()) continue;
      if (!best || at < best.at) best = { routine: r, at };
      break;
    }
  }
  return best;
}

export interface RoutineInput {
  activity: string;
  label?: string;
  time: string;
  days?: number[];
}
/** Checks a new or edited routine and returns its clean form, or throws a message for the owner. */
export function cleanRoutine(input: RoutineInput): Pick<Routine, "activity" | "label" | "time" | "days"> {
  const custom = input.activity === "custom";
  if (!custom && !isActivity(input.activity)) throw new Error(t("没有这件事。"));
  const label = input.label?.trim();
  if (custom && (!label || label.length > MAX_LABEL)) throw new Error(t("写下它喜欢干的事，1–20 个字。"));
  if (!isTime(input.time)) throw new Error(t("时间请按 08:30 这样填写。"));
  const days = [...new Set(input.days ?? ALL_DAYS)].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();
  if (!days.length) throw new Error(t("至少选一天。"));
  return { activity: input.activity, ...(custom ? { label } : {}), time: input.time, days };
}
export function addRoutine(state: AppState, input: RoutineInput, now = new Date()): AppState {
  const routines = state.routines ?? [];
  if (routines.length >= MAX_ROUTINES) throw new Error(t("爪约最多 {n} 条，先删掉一条吧。", { n: MAX_ROUTINES }));
  const routine: Routine = { id: id(), ...cleanRoutine(input), enabled: true, createdAt: now.toISOString() };
  return { ...state, routines: [...routines, routine] };
}
export function updateRoutine(state: AppState, routineId: string, changes: Partial<Pick<Routine, "time" | "days" | "enabled">>): AppState {
  return {
    ...state,
    routines: (state.routines ?? []).map((r) => {
      if (r.id !== routineId) return r;
      const next = { ...r, ...changes };
      return { ...next, ...cleanRoutine(next) };
    }),
  };
}
export const removeRoutine = (state: AppState, routineId: string): AppState => ({
  ...state,
  routines: (state.routines ?? []).filter((r) => r.id !== routineId),
});
export const markDone = (state: AppState, routineId: string, now = new Date()): AppState => ({
  ...state,
  routines: (state.routines ?? []).map((r) =>
    r.id === routineId ? { ...r, lastDone: now.toISOString(), snoozedUntil: undefined } : r,
  ),
});
export const snooze = (state: AppState, routineId: string, now = new Date()): AppState => ({
  ...state,
  routines: (state.routines ?? []).map((r) =>
    r.id === routineId ? { ...r, snoozedUntil: new Date(now.getTime() + SNOOZE_MINUTES * 60000).toISOString() } : r,
  ),
});

/** The owner-perspective sentence 爪语 starts from after a routine is done. */
export function diaryEntry(pet: Pet, routine: Pick<Routine, "activity" | "label">, lang: Lang = getLang()): { description: string; category: Category } {
  if (isActivity(routine.activity)) {
    const a = ACTIVITIES[routine.activity];
    return { description: a.diary[lang].split("{name}").join(pet.name), category: a.category };
  }
  const label = routine.label?.trim() ?? "";
  const description = lang === "en" ? `Today with ${pet.name}: ${label}.` : `今天和${pet.name}一起：${label}。`;
  return { description, category: detectCategory(label) };
}

export interface PlannedReminder {
  /** Stable per routine and weekday, so a reschedule replaces rather than duplicates. */
  key: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  /** 1 = Sunday … 7 = Saturday; absent for a daily reminder. */
  weekday?: number;
  /** Where tapping the notification goes; 爪窝 when absent. */
  url?: string;
}
/** Every system notification the app should have scheduled for the current state. */
export function plannedReminders(state: AppState, lang: Lang = getLang(), now = new Date()): PlannedReminder[] {
  const pet = state.pet;
  if (!pet || remindersPaused(state.events)) return [];
  const out: PlannedReminder[] = [];
  (state.routines ?? []).forEach((r, i) => {
    if (!r.enabled) return;
    const hour = Number(r.time.slice(0, 2)), minute = Number(r.time.slice(3));
    // Rescheduled on every change and launch, so the quiet line lifts once the bad days pass.
    const say = (variant: number) => reminderLine(pet, r, variant, { lang, events: state.events, now });
    if (r.days.length === 7) out.push({ key: `${r.id}-daily`, title: pet.name, body: say(i), hour, minute });
    else
      for (const d of r.days)
        out.push({ key: `${r.id}-${d}`, title: pet.name, body: say(i + d), hour, minute, weekday: d + 1 });
  });
  return out;
}
