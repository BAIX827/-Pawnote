import { Category, Pet } from "./types";

// The on-device voice bank. See docs/13 (宠物语气指南 v2) for the brief.
// Seven tempers: goofy is split out of warm, drama and curious out of hyper,
// because research shows each reads differently on the same event. "Weird" is not a temper but
// a dial: an owner who types 抽象/发疯/unhinged gets one absurd beat in every entry.
export type Temper = "cool" | "clingy" | "goofy" | "drama" | "curious" | "calm" | "shy";
type Bank = Record<Temper, Record<Category, [string, string]> & { closers: string[]; social: Record<Category, string> }>;

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

const zh: Bank = {
  cool: {
    sleep: ["不是困，是闭目养神。叫我我听见了，只是不想理。", "{owner}说我睡了一下午。我没睡，我在想事情。想完了。"],
    snack: ["没有偷。它放在那，我路过，仅此而已。", "一般。下次还吃。"],
    bath: ["洗就洗了，别指望我道谢。毛干之前不许看我。", "现在香香的。这笔账我记着。"],
    chaos: ["是它自己掉下去的。我碰巧在场，碰巧伸了爪子。", "桌上东西太多了，我帮忙精简了一下。不用谢。"],
    walk: ["出门是给{owner}面子。走在前面的一直是我。", "楼下有个家伙冲我叫。我看了它一眼，它就不叫了。"],
    other: ["这点小事也要记？……行，把我写帅一点。", "{owner}蹲下来叫我，我看了一眼，走了。给{owner}留点面子。"],
    closers: ["哼。", "不是在等{owner}，是门口凉快。", "今天就到这，别吵我。"],
    social: { sleep: "睡了。别问。", snack: "一般。还要。", bath: "不想说话。", chaos: "不是我。也可能是我。", walk: "巡视完毕。", other: "摸可以，三下。" },
  },
  clingy: {
    sleep: ["在{owner}腿上睡的。{owner}腿麻了，我没动，也不打算动。", "梦里闻到{owner}的味道，所以睡得特别久。"],
    snack: ["好吃。吃的时候一直看着{owner}，怕{owner}走开。", "想分{owner}一口的，想着想着就吃完了。"],
    bath: ["水有点可怕。但{owner}的手一直在，那就算了。", "吹风机好吵。我把头埋在{owner}怀里，等它吵完。"],
    chaos: ["我不是故意的。{owner}叹气的时候，我比那个东西还难受。", "{owner}出去太久了，我就去{owner}枕头上待了一会儿。待得有点乱。"],
    walk: ["外面很大。我走几步就回头看，{owner}都在。", "{owner}一说出门，我就在门口了。去哪都行，一起就行。"],
    other: ["{owner}去厕所，我也去。{owner}洗澡，我在门口等。", "门一关上，我就开始等{owner}回来了。"],
    closers: ["明天也要这样。", "最喜欢{owner}。这句可以不写。", "{owner}早点回来。"],
    social: { sleep: "今天的枕头是{owner}。", snack: "吃完了，去找{owner}。", bath: "洗完了，要抱。", chaos: "对不起。还要摸摸。", walk: "一起出门了。", other: "{owner}在家，就是好日子。" },
  },
  goofy: {
    sleep: ["睡醒发现自己在沙发底下。怎么进去的不知道，怎么出来也不知道。", "打呼噜把自己吵醒了。看了一圈，没人，接着睡。"],
    snack: ["掉地上的就是给我的。这是规矩，我刚定的。", "吃太快了，没尝出味道。再来一个就知道了。"],
    bath: ["水！到处都是水！我甩了三圈，现在{owner}也洗过了。", "洗完跑了十圈庆祝。庆祝什么不知道，反正很开心。"],
    chaos: ["球滚到柜子底下，我想把它救出来。柜子不太同意。", "撞了一下桌子，东西掉了。没事，桌子挺好的，我也挺好的。"],
    walk: ["{owner}说“出门”，我疯了。{owner}说“出门扔垃圾”，我还是疯了。", "风里有十七种味道，我一个一个打了招呼。"],
    other: ["今天！发生了！一件事！详情见上！", "不知道发生了啥，但我很开心。尾巴比我先知道的。"],
    closers: ["明天还玩这个！", "下一个节目是什么！", "好耶。"],
    social: { sleep: "睡醒了！又是新的一天！（下午四点）", snack: "吃了！还有吗！", bath: "香香的我，又湿又快乐。", chaos: "出了点小状况，问题不大。", walk: "出门了！！！", other: "今天也很好！" },
  },
  drama: {
    sleep: ["睡觉被叫醒了。我决定躺在原地不动，让大家看看我受了多大委屈。", "午觉只睡了三个小时。三个小时！谁懂。"],
    snack: ["饭晚了五分钟。我已经在门口倒下了，{owner}居然先去洗手。", "只给了一根。我看着{owner}，眼神里有一整部电视剧。"],
    bath: ["碰到水那一下，我叫出了这辈子最惨的一声。其实不冷，但戏要演完。", "洗完我缩在角落发抖。{owner}一走开，我就不抖了。"],
    chaos: ["是我推的。推的时候全家都看着我，这就是我要的。", "{owner}问是谁干的。我转过身，把背影留给了{owner}。"],
    walk: ["才出去二十分钟。我坐在路边不走了，让路人评评理。", "路过的小孩说我好看。我停下来，让他多看了一会儿。"],
    other: ["{owner}出门才五分钟，我已经把这辈子都想完了。", "今天的事我会记很久。具体是什么事，看我心情。"],
    closers: ["散会。", "下集更精彩。", "掌声可以响起来了。"],
    social: { sleep: "被吵醒了。今天谁都别跟我说话。", snack: "饿了五分钟，差点没挺过来。", bath: "今天经历了一场浩劫。", chaos: "现场是我布置的，欢迎参观。", walk: "今日出街，回头率很高。", other: "今天的我，有点东西。" },
  },
  curious: {
    sleep: ["睡前查了一遍：衣柜、纸箱、{owner}的包。都正常，才睡的。", "{owner}睡觉为什么要盖那块布？我钻进去研究了一下。暖和。还在研究。"],
    snack: ["袋子一响我就到了。里面是什么不重要，得先闻一下。", "{owner}碗里的味道不一样。我没吃，只是确认一下。"],
    bath: ["水是从墙上那个东西里出来的。我盯了它很久，它没再动。", "泡泡会破。我试了十几次，每次都破。"],
    chaos: ["杯子放在桌边，就是让我推的吧。推了，果然会掉。明天再验证一次。", "原来抽屉里面是这样的。现在大家都知道了。"],
    walk: ["楼下多了一个箱子。我绕着它走了三圈，回家路上还在想。", "草地上有个洞，里面什么也没有。我还想再看一次。"],
    other: ["今天弄明白了一件事。还有一百件没弄明白。", "{owner}拿回来一个新东西。我看了，闻了，碰了一下。可以留下。"],
    closers: ["明天继续调查。", "还有一个问题没想通。", "先记下来。"],
    social: { sleep: "睡前巡查完毕，一切正常。", snack: "新味道，已记录。", bath: "泡泡会破。已确认。", chaos: "实验成功：它会掉。", walk: "楼下多了个箱子。在意。", other: "今日新发现一项。" },
  },
  calm: {
    sleep: ["睡了。醒了。中间的事不清楚，应该挺顺利。", "太阳挪了，我也挪了。今天就干了这个。"],
    snack: ["吃了。味道可以。没别的要补充。", "别人都着急，我不急。碗又不会跑。"],
    bath: ["洗完了。我接受了这个结果。", "水温还行，时间偏长。"],
    chaos: ["东西掉了。这是地心引力的问题，我已经向它提了意见。", "地上多了点东西。会有人收拾的，不是我。"],
    walk: ["走了一圈。树还在，风还在。挺好。", "有个家伙冲我叫。我闻了闻地，走了。"],
    other: ["今天有这么一件事。记一下。", "吃了，睡了，晒了。也就这样。"],
    closers: ["就这样。", "明天大概也差不多。", "没意见。"],
    social: { sleep: "睡了一天。", snack: "吃了。", bath: "洗了。", chaos: "掉了。", walk: "走了一圈。", other: "今天也就这样。" },
  },
  shy: {
    sleep: ["躲在那里睡的。那个角落不会有人突然伸手。", "在{owner}的衣服堆里睡着了。里面很安全，别告诉别人。"],
    snack: ["等{owner}走开了才吃的。不是偷，是不想被看着。", "新零食闻了很久。第二口的时候，才敢说好吃。"],
    bath: ["有点怕。后来裹在毛巾里，就没那么怕了。", "吹风机一出来，我已经在柜子顶上了。"],
    chaos: ["被声音吓到才碰到的。我自己也吓了一跳。", "摔碎的声音太大了，我在床底下待到了晚上。"],
    walk: ["外面声音很多。我贴着{owner}的脚走，就还好。", "今天走到了楼下第二棵树。比昨天远一棵。"],
    other: ["家里来了个人，坐在我的位置上。我没出声，就看着。", "今天有一点点不一样。我还在想这件事。"],
    closers: ["让我自己待一会儿。", "明天可能会好一点。", "我在这儿，别找我。"],
    social: { sleep: "找到一个没人知道的地方。", snack: "偷偷吃完了。", bath: "洗完了，在躲。", chaos: "不是故意的……", walk: "今天走远了一点点。", other: "今天还好。" },
  },
};

// English is written in its own registers (deadpan cat, lowercase earnest dog, caps-burst goofball),
// not translated from the Chinese. {owner} at the start of a line is capitalised when filled.
const en: Bank = {
  cool: {
    sleep: ["I was not asleep. I was ignoring everyone with my eyes closed.", "Apparently I slept all afternoon. I was thinking. I am done thinking now."],
    snack: ["I did not steal it. It was left unattended, which is a form of consent.", "It was fine. I will be having more."],
    bath: ["I have been washed against my will. Nobody looks at me until I am dry.", "I smell like flowers now. I will remember this."],
    chaos: ["It fell. I was merely present, and my paw was merely nearby.", "There were too many things on the table. I fixed that."],
    walk: ["I allowed the walk. For the record, I was leading.", "Something barked at me. I looked at it once. It stopped."],
    other: ["You are writing this down? Fine. Make me look good.", "I allowed one (1) pat today. Do not make it weird."],
    closers: ["Whatever.", "I was by the door for unrelated reasons.", "That will be all."],
    social: { sleep: "Busy. Eyes closed. Still busy.", snack: "Mediocre. Again, please.", bath: "No comment.", chaos: "Not me. Possibly me.", walk: "Patrol complete. You're welcome.", other: "One pat. That's the limit." },
  },
  clingy: {
    sleep: ["i fell asleep on {owner}'s legs. the legs went numb. i did not move. i am not planning to.", "i slept where it smells like {owner}. that is why it took so long."],
    snack: ["it was very good. i thought about sharing the whole time i was eating it.", "i ate it while watching {owner}. in case {owner} left."],
    bath: ["the water was scary. but {owner}'s hands were there the whole time. so it was okay.", "the dryer was loud so i put my face in {owner}'s shirt until it stopped."],
    chaos: ["i did not mean to. when {owner} sighed it hurt more than the thing breaking.", "{owner} was gone too long so i sat on the pillow for a bit. it got a bit messy."],
    walk: ["outside is very big. i kept looking back. {owner} was there every time.", "{owner} said walk. i was at the door before the k."],
    other: ["{owner} went to the bathroom. i went too. that's just how it is.", "the door closed and i started waiting. i'm still a bit waiting."],
    closers: ["same again tomorrow please.", "i love {owner}. you don't have to write that part.", "come home soon."],
    social: { sleep: "today's pillow: {owner}.", snack: "ate it. going to find {owner} now.", bath: "clean. need a hug.", chaos: "sorry. pats please.", walk: "went out together.", other: "{owner} is home. good day." },
  },
  goofy: {
    sleep: ["woke up under the sofa. no idea how i got in. no idea how to get out.", "snored so loud i woke myself up. looked around. nobody. back to sleep."],
    snack: ["if it hits the floor it's mine. that's the rule. i made it just now.", "ate it too fast to taste it. need a second one for science."],
    bath: ["WATER. everywhere. i did three big shakes and now {owner} has had a bath too.", "bath done. did ten laps to celebrate. not sure what we're celebrating."],
    chaos: ["the ball went under the cabinet. i tried to rescue it. the cabinet said no.", "bumped the table. stuff fell. the table is fine. i am fine."],
    walk: ["{owner} said walk. i lost my mind. {owner} said 'just taking the bin out'. lost it again.", "there were seventeen smells and i said hello to every single one."],
    other: ["TODAY. A THING. HAPPENED. see above.", "not sure what happened but my tail found out first and it's thrilled."],
    closers: ["again tomorrow!!", "what's next.", "best day. (it's always the best day)"],
    social: { sleep: "woke up! new day! (it is 4pm)", snack: "ate it! is there more!", bath: "wet and thrilled about it.", chaos: "small situation. it's fine.", walk: "OUTSIDE!!!", other: "today was good! they're all good!" },
  },
  drama: {
    sleep: ["Someone woke me up. I have chosen to lie exactly where I was so everyone can see what I've been through.", "I got three hours of nap. Three."],
    snack: ["Dinner was five minutes late. I collapsed by the door. {owner} washed their hands first. Unbelievable.", "I was given one treat. I looked at {owner} with an entire season of television in my eyes."],
    bath: ["The moment I touched the water I made the worst sound of my life. It wasn't even cold. But you commit.", "Afterwards I shivered in the corner. The moment {owner} left, I stopped."],
    chaos: ["Yes, I pushed it. Everyone was watching. That was the point.", "{owner} asked who did this. I turned around and gave {owner} my back."],
    walk: ["Twenty minutes outside. Twenty. I sat down on the pavement and let the public decide.", "A child said I was beautiful. I stood very still so they could look longer."],
    other: ["{owner} has been gone five minutes. I have already lived an entire life.", "I'll be talking about today for a long time. What happened depends on my mood."],
    closers: ["Scene.", "To be continued.", "You may applaud now."],
    social: { sleep: "Woken up. Nobody speak to me today.", snack: "Went five minutes without food. Barely made it.", bath: "Today I survived a disaster.", chaos: "I designed this scene. Tours available.", walk: "Out in public. Heads were turned.", other: "Today I was a lot. As intended." },
  },
  curious: {
    sleep: ["Before bed I checked the wardrobe, the box and {owner}'s bag. All fine. Then I slept.", "Why does {owner} sleep under a cloth? I went in to investigate. It's warm. Investigation ongoing."],
    snack: ["The bag crinkled and I was there. What was inside didn't matter. I had to smell it first.", "{owner}'s bowl smelled different. I didn't eat it. I just had to confirm."],
    bath: ["The water comes out of the wall thing. I watched it for a long time. It did not do it again.", "Bubbles pop. I tested this about fifteen times. Every time."],
    chaos: ["The cup was at the edge, so I assumed it was for pushing. It falls. Will check again tomorrow.", "So that's what's inside the drawer. Now everyone knows."],
    walk: ["There's a new box downstairs. I walked around it three times and I'm still thinking about it.", "Found a hole in the grass. Nothing in it. Need to look again."],
    other: ["Figured out one thing today. About a hundred to go.", "{owner} brought home a new thing. I looked, sniffed, touched it once. It may stay."],
    closers: ["Investigation continues.", "One question remains.", "Noted."],
    social: { sleep: "Bedtime inspection complete. All clear.", snack: "New flavour. Logged.", bath: "Bubbles pop. Confirmed.", chaos: "Experiment result: it falls.", walk: "New box downstairs. Suspicious.", other: "One new discovery today." },
  },
  calm: {
    sleep: ["Slept. Woke. Unclear what happened in between, but I assume it went well.", "The sun moved. I moved. That was the day."],
    snack: ["Ate it. It was fine. Nothing further to add.", "Everyone else was in a hurry. Not me. The bowl isn't going anywhere."],
    bath: ["Bath complete. I have accepted the outcome.", "Water temperature acceptable. Duration on the long side."],
    chaos: ["An object fell. This is a gravity issue and I have filed a complaint.", "There are things on the floor now. Someone will deal with it. Not me."],
    walk: ["Went around once. Trees still there. Wind still there. Good.", "Something barked at me. I sniffed the ground and moved on."],
    other: ["This happened today. Writing it down.", "Ate. Slept. Sunbeam. That's the report."],
    closers: ["That is all.", "Tomorrow will be similar. No objections.", "Fine."],
    social: { sleep: "Slept. Recommend it.", snack: "Ate.", bath: "Washed.", chaos: "Fell.", walk: "Went around once.", other: "Same as usual. Good." },
  },
  shy: {
    sleep: ["I slept in the corner. Nobody reaches in suddenly there. I like that.", "I fell asleep in the pile of {owner}'s clothes. It's safe in there. Don't tell anyone."],
    snack: ["I waited until {owner} left the room. Not stealing. I just don't like being watched.", "I sniffed the new treat for a long time. By the second bite I was brave enough to like it."],
    bath: ["I was scared. Then there was a towel, and it was less scary.", "The dryer came out. I was already on top of the wardrobe."],
    chaos: ["A noise startled me and I bumped it. I startled myself too.", "The crash was so loud I stayed under the bed until dinner."],
    walk: ["Outside is loud. I stayed next to {owner}'s feet. That helped.", "Today I made it to the second tree. One more than yesterday."],
    other: ["A stranger sat in my spot. I didn't say anything. I just watched.", "Today was a little different. I'm still thinking about it."],
    closers: ["I need a minute alone now.", "Tomorrow might be easier.", "I'm here. Don't look for me."],
    social: { sleep: "Found a spot nobody knows about.", snack: "Ate it when nobody was looking.", bath: "Clean. Hiding.", chaos: "didn't mean to…", walk: "Went a little further today.", other: "Today was okay." },
  },
};

// One absurd beat, used in place of the closer. Never for shy or clingy unless the owner asked for weird.
const weird = {
  zh: ["我对着空气哈了一口。空气知道它做了什么。", "凌晨三点在走廊跑了七个来回，原因不明，下次还跑。", "我盯着墙看了很久。墙先眨的眼。", "我也不知道我刚才为什么那样。", "地心引力今天又上班了。"],
  en: ["I hissed at the air. The air knows what it did.", "Ran the hallway seven times at 3am. Reason unknown. Will do it again.", "I stared at the wall for a long time. The wall blinked first.", "I don't know why I did that either.", "I have decided the vacuum is my father."],
};

// Species that do not fit cat/dog lines get their own flavour. Fish, snakes and turtles replace
// the event line entirely; the others add one line in place of the closer.
const speciesLines: Partial<Record<Pet["species"], { replace: boolean; zh: string[]; en: string[] }>> = {
  rabbit: { replace: false, zh: ["我跺了三下脚，你自己体会。", "背对着{owner}坐了一下午。这是态度。"], en: ["I thumped three times. Think about it.", "Sat with my back to {owner} all afternoon. That's a statement."] },
  hamster: { replace: false, zh: ["腮里还剩六粒。明天的事明天说。", "轮子跑到半夜，哪也没去，很充实。"], en: ["Six seeds still in my cheeks. Tomorrow's problem.", "Ran the wheel till midnight. Went nowhere. Very fulfilling."] },
  guineaPig: { replace: false, zh: ["冰箱门一响我就叫，叫到生菜出现为止。", "我和别的豚鼠交流了一下今天的事。结论是：要生菜。"], en: ["The fridge door opened. I screamed until lettuce happened.", "Discussed today with the others. Conclusion: lettuce."] },
  bird: { replace: false, zh: ["我学会了{owner}的手机提示音。{owner}今天找了三次手机。", "我在{owner}肩膀上监督了全过程。"], en: ["I learned {owner}'s phone notification. {owner} checked the phone three times today.", "I supervised the whole thing from {owner}'s shoulder."] },
  lizard: { replace: false, zh: ["灯下的那块石头二十八度。可以。", "今天没怎么动。动多了浪费热量。"], en: ["The rock under the lamp is at 28 degrees. Acceptable.", "Did not move much today. Moving wastes heat."] },
  snake: { replace: true, zh: ["蜕了一层皮。新的我，旧的态度。", "今天盘着。明天大概也盘着。", "{owner}在玻璃外面看我。我也在看{owner}。我赢了。"], en: ["Shed my skin. New me. Same attitude.", "Coiled today. Probably coiled tomorrow.", "{owner} watched me through the glass. I watched back. I won."] },
  turtle: { replace: true, zh: ["这事不急。我活得长。", "晒了一下午背。没什么好说的，很好。", "{owner}很着急。我不急，我有的是时间。"], en: ["No rush. I have time. A lot of it.", "Warmed my shell all afternoon. Nothing to report. Excellent.", "{owner} was in a hurry. I was not. I have decades."] },
  fish: { replace: true, zh: ["这是哪？哦，是我家。这是哪？", "天上掉了吃的。今天是好日子。", "{owner}趴在玻璃上看我。我游过去，又忘了要干嘛。"], en: ["New castle just dropped. (It's the same castle.)", "Food fell from the sky today. Good day.", "{owner} pressed a face to the glass. I swam over and forgot why."] },
};

const QUIET = {
  zh: { line: "今天不是轻松的一天。{owner}一直在旁边。", closer: "我知道{owner}在。" },
  en: { line: "Today was not an easy one. {owner} stayed close the whole time.", closer: "I know {owner} is here." },
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
  let line = set[category][variant % 2];
  let closer = set.closers[variant % set.closers.length];
  if (special?.replace) line = special[lang][variant % special[lang].length];
  else if (special && variant % 2 === 1) closer = special[lang][variant % special[lang].length];
  // Every third version gets an absurd beat; owners who asked for weird get one every time.
  const weirdOk = isWeird(pet) || (temper !== "shy" && temper !== "clingy");
  if (weirdOk && (isWeird(pet) || variant % 3 === 2)) closer = weird[lang][(variant + Object.keys(set).indexOf(category)) % weird[lang].length];
  return { line: fill(line), closer: fill(closer) };
}

/** A one-line feed post in the pet's temper; the social voice is short and ends on the reaction. */
export function socialLine(pet: Pet, category: Category, owner: string, lang: "zh" | "en", description = ""): string {
  const fill = fillWith(owner, lang);
  if (isSensitive(description)) return fill(QUIET[lang].closer);
  return fill((lang === "en" ? en : zh)[temperOf(pet)].social[category]);
}
