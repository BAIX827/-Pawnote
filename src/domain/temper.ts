import { Category, Pet } from "./types";

// Five tempers, each with its own way of reacting to the same event. See docs/13 for the brief:
// personality leads the voice, feelings show in small details, and endings do not moralise.
export type Temper = "cool" | "warm" | "hyper" | "calm" | "shy";
type Lines = Record<Temper, Record<Category, string> & { closers: string[] }>;

const TAGS: [Temper, string[]][] = [
  ["cool", ["傲娇", "独立", "有主见", "高冷", "酷", "sassy", "independent", "strong-willed", "aloof", "cool"]],
  ["warm", ["亲人", "温柔", "憨厚", "黏人", "粘人", "cuddly", "gentle", "goofy", "affectionate", "sweet", "clingy"]],
  ["hyper", ["活泼", "戏精", "好奇", "调皮", "lively", "dramatic", "curious", "playful", "energetic"]],
  ["calm", ["稳重", "随和", "佛系", "steady", "easygoing", "calm", "chill"]],
  ["shy", ["慢热", "敏感", "胆小", "害羞", "slow to warm", "sensitive", "shy", "timid"]],
];
/** The temper named first in the personality wins; with none, the species sets the default. */
export function temperOf(pet: Pet): Temper {
  const text = pet.personality.toLowerCase();
  let best: { temper: Temper; at: number } | undefined;
  for (const [temper, words] of TAGS)
    for (const word of words) {
      const at = text.indexOf(word);
      if (at >= 0 && (!best || at < best.at)) best = { temper, at };
    }
  return best?.temper ?? (pet.species === "cat" ? "cool" : pet.species === "dog" ? "warm" : "calm");
}

const zh: Lines = {
  cool: {
    sleep: "不是困，是闭目养神。叫我也没用，我听见了，只是不想理。",
    snack: "我没有偷。它放在那里，我路过，仅此而已。",
    bath: "洗就洗了，别以为我会道谢。毛干之前不许看我。",
    chaos: "是它自己掉下去的。我只是碰巧在场，碰巧伸了爪子。",
    walk: "出门是给{owner}面子。走在前面的那个，一直是我。",
    other: "这点小事也要记下来？……行吧，记得把我写帅一点。",
    closers: ["哼。", "才不是因为在意{owner}。", "今天就到这，别吵我。"],
  },
  warm: {
    sleep: "睡着的时候好像闻到{owner}的味道了，所以睡得特别久。",
    snack: "好吃。吃的时候想到{owner}，想了一下，还是自己吃完了。",
    bath: "水有点可怕。但是{owner}的手一直在，那就算了。",
    chaos: "我不是故意的。{owner}叹气的时候，我比那个东西还难受。",
    walk: "外面很大。我走几步就回头看一眼，{owner}都在。",
    other: "没什么大事。只是今天也和{owner}在一起，我想记一下。",
    closers: ["明天也要这样。", "最喜欢{owner}了。这句不写进去也行。"],
  },
  hyper: {
    sleep: "我只是眨了一下眼！怎么天就黑了！谁把下午偷走了！",
    snack: "事情发生得太快，我的嘴比我的脑子先到。",
    bath: "水！到处都是水！我甩了三圈，现在{owner}也洗过了。",
    chaos: "是它先动的手。好吧它没有手。但是它看我的眼神不对。",
    walk: "风里有十七种味道，我一个一个打了招呼。来不及了来不及了。",
    other: "今天！发生了！一件事！详情见上！",
    closers: ["下一个节目是什么！", "我还没玩够。"],
  },
  calm: {
    sleep: "睡了。醒了。中间的事不清楚，应该挺顺利的。",
    snack: "吃了。味道可以。没有别的要补充。",
    bath: "洗完了。我接受了这个结果。",
    chaos: "东西掉了。这是地心引力的问题，我已经向它提出了意见。",
    walk: "走了一圈。树还在，风还在。挺好。",
    other: "今天有这么一件事。记下来，这一天就不算白过。",
    closers: ["就这样。", "明天大概也差不多，我没意见。"],
  },
  shy: {
    sleep: "躲在那里睡的。那个角落不会有人突然伸手，我喜欢。",
    snack: "等{owner}走开了才吃的。不是偷，是不想被看着。",
    bath: "有点怕。后来裹在毛巾里，就不那么怕了。",
    chaos: "被声音吓到了才碰到的。我自己也吓了一跳。",
    walk: "外面声音很多。我贴着{owner}的脚走，这样就还好。",
    other: "今天有一点点不一样。我还在想这件事。",
    closers: ["让我自己待一会儿。", "慢慢来，我在学。"],
  },
};
// English is written fresh in its own registers (deadpan cat, earnest lowercase dog), not translated.
const en: Lines = {
  cool: {
    sleep: "I was not asleep. I was ignoring everyone with my eyes closed.",
    snack: "I did not steal it. It was left unattended, which is a form of consent.",
    bath: "I have been washed against my will. Nobody looks at me until I am dry.",
    chaos: "It fell. I was merely present, and my paw was merely nearby.",
    walk: "I allowed the walk. For the record, I was the one leading.",
    other: "You are writing this down? Fine. Make me look good.",
    closers: ["Whatever.", "This changes nothing between me and {owner}.", "That will be all. Do not disturb."],
  },
  warm: {
    sleep: "i fell asleep where it smells like {owner}. that is why it took so long.",
    snack: "it was very good. i thought about sharing. i thought about it the whole time i was eating.",
    bath: "the water was scary. but {owner}'s hands were there the whole time. so it was okay.",
    chaos: "i did not mean to. when {owner} sighed it hurt more than the thing breaking.",
    walk: "outside is very big. i kept looking back. {owner} was there every time.",
    other: "nothing big happened. i just wanted it written down that we were together today.",
    closers: ["same again tomorrow please.", "i love {owner}. you do not have to write that part."],
  },
  hyper: {
    sleep: "I BLINKED. ONCE. and the whole afternoon was gone. who took it.",
    snack: "it happened so fast. my mouth got there before my brain did.",
    bath: "WATER. everywhere. i did three big shakes and now {owner} has had a bath too.",
    chaos: "it started it. okay it has no hands. but it was looking at me funny.",
    walk: "there were seventeen smells and i said hello to every single one. no time. no time.",
    other: "TODAY. A THING. HAPPENED. see above for details.",
    closers: ["what is next.", "i am not done yet."],
  },
  calm: {
    sleep: "Slept. Woke. Unclear what happened in between, but I assume it went well.",
    snack: "Ate it. It was fine. Nothing further to add.",
    bath: "Bath complete. I have accepted the outcome.",
    chaos: "An object fell. This is a gravity issue and I have filed a complaint.",
    walk: "Went around once. Trees still there. Wind still there. Good.",
    other: "This happened today. It is written down now, so the day counts.",
    closers: ["That is all.", "Tomorrow will be similar. No objections."],
  },
  shy: {
    sleep: "I slept in the corner. Nobody reaches in suddenly there. I like that.",
    snack: "I waited until {owner} left the room. Not stealing. I just do not like being watched.",
    bath: "I was scared. Then there was a towel, and it was less scary.",
    chaos: "A noise startled me and I bumped it. I startled myself too.",
    walk: "Outside is loud. I stayed next to {owner}'s feet. That helped.",
    other: "Today was a little different. I am still thinking about it.",
    closers: ["I need a minute alone now.", "Slowly. I am learning."],
  },
};

/** The pet's own reaction to an event and a sign-off, in its temper and the given language. */
export function reaction(
  pet: Pet,
  category: Category,
  owner: string,
  lang: "zh" | "en",
  variant = 0,
): { line: string; closer: string } {
  const set = (lang === "en" ? en : zh)[temperOf(pet)];
  const fill = (s: string) => s.split("{owner}").join(owner);
  return { line: fill(set[category]), closer: fill(set.closers[variant % set.closers.length]) };
}
