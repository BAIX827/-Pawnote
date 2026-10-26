import type { Lang } from "../i18n/core";
import { addDays, dayKey, dayNumber, eventDate, newestEvents, startOfDay } from "./dates";
import { Temper, isLoss, isSensitive, temperOf } from "./temper";
import { AppState, Category, LifeEvent, Pet, Species } from "./types";

// 爪友圈 2.0, local edition (docs/01 8.20). Only animals speak here: the owner's pet drafts its
// own posts from saved records, seven 爪爪镇 residents post their own lives, and everyone likes and
// comments in their own temper. Nothing below is stored: posts, likes, comments and the pet's
// browsing are worked out from the date and the saved records, so the same moment always shows
// the same circle. Chinese and English are written separately (docs/15), never translated.
type Text = Record<Lang, string>;

export interface Resident {
  id: string;
  name: Text;
  /** Its job, always put before its name (docs/01 8.28). */
  title: Text;
  species: Species;
  emoji: string;
  temper: Temper;
  /** Badge colour, from the orange-pop palette. */
  color: string;
  role: Text;
  bio: Text;
  /** Event categories this resident cares about; it comes by when a post is about one of them. */
  likes: Category[];
  posts: { category: Category; text: Text }[];
  /** What it says under the owner's pet's post, by category. {name} is the pet. */
  comments: Record<Category, Text>;
  /** What it says back when the owner's pet comments on its post. */
  replies: Text[];
}

const all: Category[] = ["sleep", "snack", "bath", "chaos", "walk", "other"];

export const RESIDENTS: Resident[] = [
  {
    id: "coal",
    title: { zh: "店长", en: "Manager" },
    name: { zh: "煤球", en: "Coal" },
    species: "cat",
    emoji: "🐈‍⬛",
    temper: "cool",
    color: "#B9A6FF",
    role: { zh: "便利店夜班店长", en: "Night manager, corner shop" },
    bio: {
      zh: "爪爪镇便利店的夜班店长。嘴硬，从不承认在等谁，但会顺手问别人吃了没。",
      en: "Runs the night shift at the Pawtown corner shop. Never admits to waiting for anyone. Always asks if you've eaten.",
    },
    likes: ["snack", "sleep", "other"],
    posts: [
      { category: "snack", text: { zh: "店里新到一箱小鱼干。我先替大家检查了一根，质量还行。只是检查。", en: "A new box of fish treats came in. I inspected one for quality. Just the one. For quality." } },
      { category: "sleep", text: { zh: "夜班结束，收银台上的暖灯归我了。谁也别叫我，除非有人来买东西。", en: "Night shift's over. The warm lamp on the counter is mine now. Wake me only if someone's buying." } },
      { category: "other", text: { zh: "今晚只来了三位客人。第二位没买东西，站着聊了很久。我没嫌烦。", en: "Three customers tonight. The second bought nothing and talked for ages. I didn't mind. Don't spread that around." } },
      { category: "walk", text: { zh: "关店后绕着货架走了一圈，确认每一包都在原位。这叫巡店，不叫散步。", en: "Walked the aisles after closing to check everything was in place. It's called a store check, not a stroll." } },
      { category: "bath", text: { zh: "下雨天门口全是湿脚印。我把自己舔干净了。别的脚印，归拖把管。", en: "Rainy night. Wet pawprints all over the entrance. I cleaned myself. The floor is the mop's problem." } },
      { category: "chaos", text: { zh: "有一排罐头倒了。监控里那只黑猫是谁，我不方便评论。", en: "A row of cans fell over. Who's the black cat on the camera? No comment." } },
      { category: "snack", text: { zh: "豆包来买肉干，又把钱数错了。差的那一块，我替他记账上了。别谢我。", en: "Bao came in for jerky and miscounted again. I put the difference on his tab. Don't thank me." } },
      { category: "other", text: { zh: "门口的风铃响了一晚上。我一直看着门。不是在等谁，是在看门。", en: "The door chime rang all night. I kept watching the door. Not waiting for anyone. Just watching the door." } },
    ],
    comments: {
      sleep: { zh: "睡得挺好。不是羡慕。", en: "Nice nap. Not jealous." },
      snack: { zh: "吃的什么，下次店里进点。只是进货参考。", en: "What was that? Asking for inventory purposes." },
      bath: { zh: "洗完了？那就别再提了。", en: "Bath's done. We don't need to talk about it." },
      chaos: { zh: "动静不小。我什么都没看见。", en: "Big noise. I saw nothing." },
      walk: { zh: "出门记得回来。店里的灯一直亮着。", en: "Go wherever. The shop light stays on." },
      other: { zh: "嗯。看到了。", en: "Hm. Saw it." },
    },
    replies: [
      { zh: "嗯。你也是。", en: "Hm. You too." },
      { zh: "下次来店里，给你打折。不是特别对你。", en: "Come by the shop. I'll give you a discount. Not because it's you." },
    ],
  },
  {
    id: "biscuit",
    title: { zh: "老师", en: "Teacher" },
    name: { zh: "阿福", en: "Biscuit" },
    species: "dog",
    emoji: "🦮",
    temper: "clingy",
    color: "#C6F432",
    role: { zh: "幼儿园陪读老师", en: "Reading buddy, kindergarten" },
    bio: {
      zh: "退休的导盲犬，老金毛。现在在幼儿园陪小朋友读书，什么都想和“我的人”一起做。",
      en: "A retired guide dog, old golden. Now listens to kindergarteners read. Wants to do everything with his person.",
    },
    likes: all,
    posts: [
      { category: "walk", text: { zh: "今天和我的人走了平时那条路。走得很慢，正好可以多闻一会儿，也多跟他待一会儿。", en: "walked the usual way with my person today. slow pace. more time to sniff. more time with him. good." } },
      { category: "other", text: { zh: "幼儿园的小朋友读书给我听，读错了好几个字。我觉得每个字都很好听。", en: "the kids at school read to me today. they got lots of words wrong. i liked every single one." } },
      { category: "sleep", text: { zh: "午睡的时候把头放在我的人脚上。他动一下，我就醒一下，然后再睡。", en: "napped with my head on my person's foot. every time he moved, i woke up a little. then slept again. worth it." } },
      { category: "snack", text: { zh: "我的人分了我一块红薯。他吃一口，我看一口，最后一口是我的。", en: "my person shared some sweet potato. he took a bite, i watched. the last bite was mine. we're a team." } },
      { category: "bath", text: { zh: "今天洗澡了。不太喜欢水，但我的人一直在旁边说话，就还好。", en: "bath today. not a fan of water. but my person kept talking to me the whole time, so it was okay." } },
      { category: "other", text: { zh: "以前上班要认真走路，现在可以随便停下来看蝴蝶。我还是习惯等我的人先走。", en: "i used to walk very seriously for work. now i can stop for butterflies. i still wait for my person to go first." } },
      { category: "walk", text: { zh: "下雨了，我们在屋檐下站了一会儿。他没说话，我也没说话。挺好的。", en: "it rained so we stood under the roof for a while. he didn't say anything. neither did i. it was nice." } },
      { category: "chaos", text: { zh: "把我的人的拖鞋叼到了床边。不是捣乱，是想让他一下床就想到我。", en: "brought my person's slipper to the bed. not being naughty. i just want him to think of me first thing." } },
    ],
    comments: {
      sleep: { zh: "{name}睡着的样子一定很好看。我也想挨着睡。", en: "bet {name} looks so peaceful asleep. i'd nap right next to you." },
      snack: { zh: "好吃的要和喜欢的人一起吃，你做到了。", en: "good food is best shared. you did it right." },
      bath: { zh: "洗澡好辛苦，抱抱{name}。", en: "baths are hard. hugs, {name}." },
      chaos: { zh: "我知道，你只是想让家里人多看看你。", en: "i get it. you just wanted them to look at you more." },
      walk: { zh: "一起出门最好了！下次叫上我好不好。", en: "going out together is the best. take me next time?" },
      other: { zh: "今天也很喜欢你。", en: "liked this. liked you too." },
    },
    replies: [
      { zh: "谢谢{name}！你说话让我很开心。", en: "thank you {name}! that made me really happy." },
      { zh: "我们是好朋狗了吧？", en: "we're friends now, right?" },
    ],
  },
  {
    id: "bao",
    title: { zh: "实习生", en: "Intern" },
    name: { zh: "豆包", en: "Bao" },
    species: "dog",
    emoji: "🐕",
    temper: "goofy",
    color: "#FF7A1A",
    role: { zh: "快递站跑腿实习生", en: "Courier intern" },
    bio: {
      zh: "柯基，快递站的跑腿实习生。送错件是常态，送错了也很开心。",
      en: "A corgi interning at the parcel depot. Often delivers to the wrong door. Is delighted every time.",
    },
    likes: ["walk", "snack", "chaos"],
    posts: [
      { category: "walk", text: { zh: "今天送了十二个快递！送对了九个！剩下三家也很开心，因为见到了我！！", en: "DELIVERED TWELVE PACKAGES today. nine to the right door!! the other three were also happy because they met me" } },
      { category: "snack", text: { zh: "快递站的阿姨给了我一根肉干，我开心到原地转了五圈，然后发现肉干掉了。", en: "the lady at the depot gave me jerky and I spun five times from joy. then I could not find the jerky." } },
      { category: "chaos", text: { zh: "把站里的泡泡纸全踩响了。领导说这是浪费，我觉得这是庆祝。", en: "popped ALL the bubble wrap at work. boss says that's waste. i say that's a party" } },
      { category: "sleep", text: { zh: "下午在纸箱里睡着了，差点被当成快递寄走。醒来发现自己还在，太好了！", en: "fell asleep in a box and almost got shipped. woke up still here. GREAT NEWS" } },
      { category: "bath", text: { zh: "今天洗澡了！湿了以后我好像小了一圈！吹干又变回来了！好神奇！", en: "BATH DAY. got wet and became a smaller dog?? then they dried me and i grew back. science!!" } },
      { category: "walk", text: { zh: "跟着送货车跑了一整条街。腿短，但是心很长。", en: "chased the delivery van down the whole street. short legs. big heart. zero regrets" } },
      { category: "other", text: { zh: "煤球店长说我数学不好。我数了一下，我有四条腿，全都很开心。", en: "Coal says I'm bad at math. I counted and I have four legs and all of them are happy" } },
      { category: "snack", text: { zh: "今天学会一个新词：“不行”。好像是零食的意思？明天再确认一下。", en: "learned a new word today: 'no.' pretty sure it means treat? will check again tomorrow" } },
    ],
    comments: {
      sleep: { zh: "哇！睡觉！我也会！我们是一样的！！", en: "WOW SLEEPING. i do that too!! we're the same!!" },
      snack: { zh: "好吃吗！！看起来就好吃！", en: "WAS IT GOOD. it looks SO good" },
      bath: { zh: "湿了以后是不是变小了！我也是！", en: "did you get smaller when wet?? me too!!" },
      chaos: { zh: "哈哈哈哈好厉害！下次教我！", en: "HAHA amazing. teach me" },
      walk: { zh: "出门！！我最喜欢出门了！你闻到什么好东西了吗！", en: "OUTSIDE!! best place!! smell anything good??" },
      other: { zh: "不知道发生了什么，但是我好开心！", en: "not sure what happened but i'm SO happy for you" },
    },
    replies: [
      { zh: "{name}！！你来啦！！", en: "{name}!! you're here!!" },
      { zh: "谢谢！！我要把这句话背下来！", en: "THANK YOU. memorizing this forever" },
    ],
  },
  {
    id: "duchess",
    title: { zh: "台柱", en: "Star" },
    name: { zh: "公主", en: "Duchess" },
    species: "cat",
    emoji: "🐈",
    temper: "drama",
    color: "#FF9EC7",
    role: { zh: "剧团台柱", en: "Lead actress, town theatre" },
    bio: {
      zh: "布偶猫，爪爪镇剧团的台柱。洗个澡能演成三幕悲剧，演完自己拆穿。",
      en: "A ragdoll and the star of the Pawtown theatre. Can turn a bath into a tragedy in three acts, then admit it was fine.",
    },
    likes: ["bath", "chaos", "other"],
    posts: [
      { category: "bath", text: { zh: "今天，我被洗了。水从天而降，我以为这是终幕。后来吹风机响了，原来还有返场。", en: "Today I was bathed. Water fell from the sky. I thought it was the final act. Then the hairdryer started. An encore. Tragic." } },
      { category: "other", text: { zh: "剧团排练《猫与窗帘》，我演窗帘后面的那只猫。台词零句，全场都在看我。", en: "Rehearsals for 'The Cat and the Curtain.' I play the cat behind the curtain. No lines. Everyone watched me anyway." } },
      { category: "chaos", text: { zh: "我只是轻轻碰了一下杯子。杯子自己决定要掉下去的。我尊重它的选择。", en: "I barely touched the cup. The cup chose to fall. I respect its decision." } },
      { category: "snack", text: { zh: "晚饭晚了五分钟。这五分钟，我经历了全部低谷。现在吃上了，我原谅世界。", en: "Dinner was five minutes late. I lived through my lowest point. I've eaten now. The world is forgiven." } },
      { category: "sleep", text: { zh: "在沙发正中间睡了一下午，像躺在舞台中央。没有观众也没关系，我自己鼓掌。", en: "Napped in the exact centre of the sofa all afternoon. Centre stage. No audience. I applauded myself." } },
      { category: "walk", text: { zh: "今天被抱到阳台“散步”。风吹乱了我的毛，我当场决定这是一场暴风雨戏。", en: "Was carried onto the balcony for a 'walk.' The wind ruined my fur. I turned it into a storm scene on the spot." } },
      { category: "other", text: { zh: "有人说我今天话太多。我只是把每一句都说成了独白。", en: "Someone said I talked too much today. I simply performed every sentence as a monologue." } },
      { category: "bath", text: { zh: "梳毛的时候掉了一团毛。我为它默哀了一秒，然后发现背上还有很多。", en: "Lost a whole tuft while being brushed. I held a moment of silence. Then noticed I have plenty left." } },
    ],
    comments: {
      sleep: { zh: "如此安详的睡姿，值得一场谢幕。", en: "Such a peaceful sleep. It deserves a curtain call." },
      snack: { zh: "这一口，是整部戏的高潮。", en: "That bite was the climax of the whole show." },
      bath: { zh: "我懂。水从天而降的那一刻，整个世界都背叛了我们。", en: "I understand. When the water falls, the whole world betrays us." },
      chaos: { zh: "掉下去的东西，都是自己想掉的。我支持你。", en: "Things that fall wanted to fall. I stand with you." },
      walk: { zh: "外面的风，有没有也给你安排一场暴风雨戏？", en: "Did the wind give you a storm scene too?" },
      other: { zh: "这条动态，我要读三遍，每遍语气都不同。", en: "I'll read this three times, in three different voices." },
    },
    replies: [
      { zh: "终于有懂我的观众了。", en: "At last, an audience that understands." },
      { zh: "{name}，你有演戏的天赋。", en: "{name}, you have a gift for theatre." },
    ],
  },
  {
    id: "pip",
    title: { zh: "研究员", en: "Researcher" },
    name: { zh: "啾啾", en: "Pip" },
    species: "bird",
    emoji: "🦜",
    temper: "curious",
    color: "#DDD2FF",
    role: { zh: "气象站小研究员", en: "Junior researcher, weather station" },
    bio: {
      zh: "玄凤鹦鹉，气象站的小研究员。把一切当实验，结论永远是“明天再验证”。",
      en: "A cockatiel at the weather station. Treats everything as an experiment. Every conclusion ends with 'will verify tomorrow.'",
    },
    likes: ["chaos", "other", "walk"],
    posts: [
      { category: "other", text: { zh: "今日观测：窗外云朵 7 朵，其中 2 朵像小米。结论：明天可能下小米。待验证。", en: "Today's readings: 7 clouds, 2 shaped like millet. Conclusion: possible millet tomorrow. Will verify." } },
      { category: "chaos", text: { zh: "实验：把纸巾撕成 15 条，看哪一条最先被发现。结果：全被发现了。明天换个藏法。", en: "Experiment: shredded a tissue into 15 strips to see which gets found first. Result: all found. Will retest with better hiding." } },
      { category: "snack", text: { zh: "测试了三种瓜子。第一种好吃，第二种好吃，第三种也好吃。样本不够，申请继续测试。", en: "Tested three seeds. First: good. Second: good. Third: also good. Sample too small. Requesting more seeds." } },
      { category: "bath", text: { zh: "喷水洗澡时，我张开翅膀数水滴。数到 40 就忘了。明天从 41 开始。", en: "During my spray bath I opened my wings to count droplets. Lost count at 40. Starting at 41 tomorrow." } },
      { category: "walk", text: { zh: "出笼飞了三圈。客厅的灯好像比上周高了一点点，也可能是我变小了。需要复测。", en: "Flew three laps of the living room. The lamp seems higher than last week. Or I've shrunk. Requires remeasurement." } },
      { category: "sleep", text: { zh: "今天研究了睡觉：单脚站着睡，比双脚站着睡更像在工作。数据已存档。", en: "Researched sleep: sleeping on one foot looks more professional than on two. Data archived." } },
      { category: "other", text: { zh: "学会了一个新口哨，是微波炉的声音。现在家里有两个微波炉了。", en: "Learned a new whistle: the microwave beep. The household now has two microwaves." } },
      { category: "walk", text: { zh: "测了气象站门口的风：从左边来的风比较香。原因不明，明天继续观察。", en: "Measured the wind at the station door: wind from the left smells better. Cause unknown. Observation continues." } },
    ],
    comments: {
      sleep: { zh: "记录：{name}今天睡眠质量良好。样本 +1。", en: "Logged: {name}, sleep quality good. Sample size +1." },
      snack: { zh: "请问是什么味道？我在做零食数据库。", en: "What flavour? I'm building a snack database." },
      bath: { zh: "洗完以后蓬松了多少？请提供数据。", en: "How much fluffier are you post-bath? Data requested." },
      chaos: { zh: "很有研究价值的现场。明天能再做一次吗？", en: "Fascinating site. Can you replicate it tomorrow?" },
      walk: { zh: "外面的风从哪边来？我需要第二个观测点。", en: "Which way was the wind blowing? I need a second observation point." },
      other: { zh: "已收录。结论待验证。", en: "Recorded. Conclusion pending." },
    },
    replies: [
      { zh: "好建议，已纳入实验。", en: "Good input. Added to the experiment." },
      { zh: "感谢{name}提供数据。", en: "Thanks for the data, {name}." },
    ],
  },
  {
    id: "basil",
    title: { zh: "管理员", en: "Archivist" },
    name: { zh: "老绿", en: "Basil" },
    species: "lizard",
    emoji: "🦎",
    temper: "calm",
    color: "#C6F432",
    role: { zh: "档案馆管理员", en: "Town archivist" },
    bio: {
      zh: "鬃狮蜥，爪爪镇档案馆管理员。每条动态都像值班报告，晒太阳也要写进报告。",
      en: "A bearded dragon who runs the Pawtown archive. Every post reads like a shift report, sunbathing included.",
    },
    likes: ["sleep", "other"],
    posts: [
      { category: "sleep", text: { zh: "值班报告：14:00 至 16:30 在晒灯下静坐。期间无事发生。本人状态良好。", en: "Shift report: 14:00 to 16:30, sat under the heat lamp. Nothing occurred. Condition: good." } },
      { category: "other", text: { zh: "档案馆今日收到旧报纸一捆。已归档。顺便在上面晒了一会儿。", en: "The archive received a bundle of old newspapers. Filed. Also sat on them for a while." } },
      { category: "snack", text: { zh: "今日伙食：蟋蟀若干，青菜若干。评价：符合预期。无补充。", en: "Today's meals: several crickets, some greens. Assessment: as expected. Nothing further." } },
      { category: "bath", text: { zh: "温水泡澡十分钟。水温适宜，表情不变。记录在案。", en: "Ten-minute warm soak. Temperature appropriate. Facial expression unchanged. Noted for the record." } },
      { category: "walk", text: { zh: "从晒台走到水盆，再走回晒台。全程四十厘米。本周运动指标已完成。", en: "Walked from basking spot to water dish and back. Forty centimetres. Weekly exercise target met." } },
      { category: "chaos", text: { zh: "今日异常：啾啾来借书，在三本书里留下了羽毛。已登记为附件。", en: "Incident: Pip borrowed books and left feathers in three of them. Logged as attachments." } },
      { category: "sleep", text: { zh: "傍晚换了一块更暖的石头。这是本月第二件大事。第一件是上一块石头。", en: "Switched to a warmer rock this evening. Second major event this month. The first was the previous rock." } },
      { category: "other", text: { zh: "今天有人对我说早上好。我点了一下头。双方均表示满意。", en: "Someone said good morning to me. I nodded once. Both parties satisfied." } },
    ],
    comments: {
      sleep: { zh: "已阅。睡眠充足，状态良好。", en: "Read. Rest adequate. Condition good." },
      snack: { zh: "伙食已登记。", en: "Meal logged." },
      bath: { zh: "清洁完成。无需补充。", en: "Cleaning complete. Nothing further." },
      chaos: { zh: "现场情况已记录。建议明天休息。", en: "Incident noted. Recommend rest tomorrow." },
      walk: { zh: "外勤一次，已归档。", en: "One field trip. Filed." },
      other: { zh: "收到。", en: "Received." },
    },
    replies: [
      { zh: "已阅，谢谢。", en: "Read. Thank you." },
      { zh: "回复已归档。", en: "Reply filed." },
    ],
  },
  {
    id: "mochi",
    title: { zh: "借阅员", en: "Librarian" },
    name: { zh: "年糕", en: "Mochi" },
    species: "rabbit",
    emoji: "🐇",
    temper: "shy",
    color: "#FFD3E5",
    role: { zh: "图书馆借阅员", en: "Library assistant" },
    bio: {
      zh: "垂耳兔，图书馆最角落的借阅员。慢热，每条动态都是一点点小勇敢。",
      en: "A lop rabbit who works the quietest corner of the library. Slow to warm up. Every post is a small brave step.",
    },
    likes: ["bath", "sleep", "walk"],
    posts: [
      { category: "other", text: { zh: "今天有小朋友来借书，我没有躲到书架后面。只躲了一半。进步了。", en: "a kid came to borrow a book and i didn't hide behind the shelf. only half hid. progress." } },
      { category: "bath", text: { zh: "今天被梳毛了。一开始有点害怕，后来发现梳子是温的。就……还可以。", en: "got brushed today. scared at first. then the brush was warm. so... it was okay." } },
      { category: "snack", text: { zh: "新的牧草很香。我吃得很小声，怕吵到看书的人。", en: "the new hay smells really good. i ate very quietly so i wouldn't bother anyone reading." } },
      { category: "walk", text: { zh: "出笼以后，在地板上跑了一小圈。跑完赶紧回来，但心里很开心。", en: "ran one small loop on the floor after getting out. went right back after. but my heart was happy." } },
      { category: "sleep", text: { zh: "在书架最下面那层睡了午觉。那里很暗，很安全，有纸的味道。", en: "napped on the lowest shelf. it's dark and safe there and smells like paper." } },
      { category: "chaos", text: { zh: "不小心把一本书的角啃了一点点。我把它推到最里面了。对不起。", en: "accidentally nibbled the corner of a book. pushed it to the very back. i'm sorry." } },
      { category: "other", text: { zh: "今天跟豆包说了一句话。他说了二十句。我觉得我们是朋友了。", en: "said one sentence to Bao today. he said twenty. i think we're friends now." } },
      { category: "walk", text: { zh: "外面下过雨，草地的味道变了。我闻了很久，没敢踩进去。下次也许可以。", en: "it rained, and the grass smells different. i sniffed for a long time but didn't step in. maybe next time." } },
    ],
    comments: {
      sleep: { zh: "睡得好香……我也想找个暗暗的地方睡一下。", en: "that looks so cozy... i want to find a dark little corner too." },
      snack: { zh: "看起来好好吃……（小声）", en: "that looks really good... (quietly)" },
      bath: { zh: "洗澡的时候我也会害怕。你很勇敢。", en: "baths scare me too. you were really brave." },
      chaos: { zh: "我、我不会告诉别人的。", en: "i-i won't tell anyone." },
      walk: { zh: "你出门了呀，好厉害。外面是什么味道？", en: "you went outside... so brave. what did it smell like?" },
      other: { zh: "我看到了……想给你点一个爪。", en: "i saw this... i wanted to leave you a paw." },
    },
    replies: [
      { zh: "谢、谢谢你……", en: "th-thank you..." },
      { zh: "被{name}看到了，有点开心。", en: "{name} saw it... that makes me a little happy." },
    ],
  },
];

/** Under a sensitive record, only these two speak, quietly; nobody likes it or jokes. */
const QUIET: Record<string, Text> = {
  biscuit: { zh: "我在这里陪着你。慢慢来。", en: "i'm right here with you. take your time." },
  mochi: { zh: "我会安静地陪着。", en: "i'll stay here quietly with you." },
};

/** What the owner's pet says under a resident's post, by its temper. {friend} is the resident. */
const PET_COMMENTS: Record<Temper, Record<Category, Text>> = {
  cool: {
    sleep: { zh: "这个位置看着还行。下次借我。", en: "That spot looks acceptable. I'll borrow it sometime." },
    snack: { zh: "分我一点，我就不说什么。", en: "Share some and I won't say anything." },
    bath: { zh: "洗完就好。别再提了。", en: "It's over. We move on." },
    chaos: { zh: "干得不错。我什么都没看到。", en: "Nice work. I saw nothing." },
    walk: { zh: "外面有什么好的，回来告诉我。我不一定去。", en: "Tell me if there's anything good out there. I might not go." },
    other: { zh: "行，记住了。", en: "Fine. Noted." },
  },
  clingy: {
    sleep: { zh: "{friend}睡得好香，想挨着你一起睡。", en: "you look so cozy, {friend}. i'd nap right next to you." },
    snack: { zh: "好吃的要分给喜欢的人哦。", en: "good snacks are for sharing with people you love." },
    bath: { zh: "洗澡辛苦啦，抱抱{friend}。", en: "baths are hard. hugs, {friend}." },
    chaos: { zh: "没关系，我还是很喜欢你。", en: "it's okay. i still like you a lot." },
    walk: { zh: "下次出门可以叫上我吗？", en: "can i come next time you go out?" },
    other: { zh: "看到你的动态好开心。", en: "seeing your post made me happy." },
  },
  goofy: {
    sleep: { zh: "睡觉！！我也爱睡觉！！", en: "SLEEPING!! i love sleeping!!" },
    snack: { zh: "好吃吗！！看起来超好吃！", en: "WAS IT GOOD. it looks SO good" },
    bath: { zh: "洗完是不是香香的！", en: "do you smell nice now?? i bet you do!!" },
    chaos: { zh: "哈哈哈太厉害了！下次叫我一起！", en: "HAHA amazing. invite me next time!!" },
    walk: { zh: "出门！我也想去！等等我！", en: "OUTSIDE! wait for me!!" },
    other: { zh: "不知道为什么，但是好开心！", en: "not sure why but i'm SO happy" },
  },
  drama: {
    sleep: { zh: "这一觉，睡出了大结局的气势。", en: "A nap with the energy of a grand finale." },
    snack: { zh: "这一口，我在屏幕这边都感动了。", en: "That bite moved me to tears from here." },
    bath: { zh: "我懂。那是一场无声的悲剧。", en: "I understand. A silent tragedy." },
    chaos: { zh: "掉下去的东西，都是命运的安排。", en: "What falls was always destined to fall." },
    walk: { zh: "你出门的那一刻，整条街都成了舞台。", en: "The moment you stepped out, the street became a stage." },
    other: { zh: "这条我要读三遍。", en: "I'm reading this three times. Dramatically." },
  },
  curious: {
    sleep: { zh: "睡了多久？我在做睡眠统计。", en: "How long did you sleep? I'm collecting sleep data." },
    snack: { zh: "什么味道？请详细描述。", en: "What flavour? Please describe in detail." },
    bath: { zh: "洗完以后蓬松了多少？想要数据。", en: "How much fluffier afterwards? I'd like numbers." },
    chaos: { zh: "这个现场很有研究价值。能再做一次吗？", en: "This site is worth studying. Can you do it again?" },
    walk: { zh: "外面今天什么味道？我想对比一下。", en: "What did outside smell like today? I'd like to compare." },
    other: { zh: "有意思。明天继续观察。", en: "Interesting. Will keep observing tomorrow." },
  },
  calm: {
    sleep: { zh: "已阅。休息很重要。", en: "Read. Rest matters." },
    snack: { zh: "伙食不错。", en: "Decent meal." },
    bath: { zh: "清洁完成，辛苦。", en: "Cleaning complete. Well done." },
    chaos: { zh: "情况已了解。", en: "Situation noted." },
    walk: { zh: "外勤辛苦。", en: "Good field trip." },
    other: { zh: "收到。", en: "Received." },
  },
  shy: {
    sleep: { zh: "看起来好舒服……（小声）", en: "that looks so comfy... (quietly)" },
    snack: { zh: "好像很好吃……我也想尝一点点。", en: "that looks so good... i'd like a tiny taste." },
    bath: { zh: "我也怕洗澡……你很勇敢。", en: "baths scare me too... you were brave." },
    chaos: { zh: "我、我不会说出去的。", en: "i-i won't tell." },
    walk: { zh: "你去外面了呀，好厉害。", en: "you went outside... that's so brave." },
    other: { zh: "想给你点一个爪……", en: "i wanted to leave you a paw..." },
  },
};

// Things owners often mention; the first resident to comment says a word about it, so the comment
// touches what happened (docs/01 8.26).
const THINGS: [RegExp, { zh: string; en: string }][] = [
  [/拖鞋|slipper/i, { zh: "拖鞋这种东西，确实很难不叼。", en: "Slippers are hard to resist." }],
  [/纸箱|箱子|\bbox(es)?\b/i, { zh: "纸箱！我也想要一个。", en: "A box! I want one too." }],
  [/杯|\b(cup|mug|glass)\b/i, { zh: "杯子放在桌边，本来就很危险。", en: "A cup near the edge was always in danger." }],
  [/沙发|\b(sofa|couch)\b/i, { zh: "沙发是大家的，也是你的。", en: "The sofa belongs to everyone, including you." }],
  [/袜子|\bsocks?\b/i, { zh: "袜子是很好的收藏品。", en: "Socks make a fine collection." }],
  [/球|\bball\b/i, { zh: "球！下次也扔给我。", en: "A ball! Throw one my way next time." }],
  [/窗|\bwindow\b/i, { zh: "窗边那个位置，我懂。", en: "I know that window spot." }],
  [/被子|被窝|毯子|\bblanket\b/i, { zh: "被窝真的很难离开。", en: "Blankets are very hard to leave." }],
  [/遥控器|\bremote\b/i, { zh: "遥控器总是藏在最奇怪的地方。", en: "Remotes always end up somewhere strange." }],
  [/充电线|耳机线|数据线|\b(cable|cord|charger)\b/i, { zh: "线这种东西，看起来就很好咬。", en: "Cables do look very chewable." }],
];
const thingLine = (description: string, lang: Lang) => THINGS.find(([pattern]) => pattern.test(description))?.[1][lang] ?? "";

/** The owner's pet answering the first comment under its own post. {friend} is the resident. */
const PET_REPLIES: Record<Temper, Text[]> = {
  cool: [{ zh: "嗯。知道了。", en: "Hm. Noted." }, { zh: "你还挺会说话。", en: "Not bad, {friend}." }],
  clingy: [{ zh: "谢谢{friend}！好喜欢你。", en: "thank you {friend}! i like you so much." }, { zh: "被你看到了，好开心。", en: "you saw it! that makes me happy." }],
  goofy: [{ zh: "{friend}！！谢谢！！", en: "{friend}!! THANK YOU!!" }, { zh: "哈哈哈你也来啦！", en: "HAHA you're here too!!" }],
  drama: [{ zh: "终于有人懂我了。", en: "At last. Someone understands." }, { zh: "{friend}，你这句我要裱起来。", en: "{friend}, I'm framing this comment." }],
  curious: [{ zh: "好问题，明天告诉你结果。", en: "Good question. Results tomorrow." }, { zh: "你的观察已收录。", en: "Your observation is noted, {friend}." }],
  calm: [{ zh: "收到，谢谢。", en: "Received. Thanks." }, { zh: "已阅。", en: "Read." }],
  shy: [{ zh: "谢、谢谢……", en: "th-thanks..." }, { zh: "被你看到了，有点开心。", en: "you saw it... that makes me a little happy." }],
};

/** Tempers each temper enjoys visiting: goofy pets cheer on the drama queen, shy ones stay near the gentle. */
export const AFFINITY: Record<Temper, Temper[]> = {
  cool: ["clingy", "calm"],
  clingy: ["shy", "clingy", "goofy"],
  goofy: ["drama", "goofy", "curious"],
  drama: ["goofy", "drama", "cool"],
  curious: ["curious", "calm", "drama"],
  calm: ["calm", "cool"],
  shy: ["shy", "clingy"],
};

export const MAX_POSTS_PER_DAY = 2;
export const MAX_LIKES_PER_DAY = 10;
export const MAX_COMMENTS_PER_DAY = 3;
/** The pet heads out to browse at these local hours. */
export const BROWSE_HOURS = [10, 19];
/** Residents' posts older than this drop out of the circle. */
export const FEED_DAYS = 14;
const MINUTE = 60_000;

/** FNV-1a: a small stable hash so every choice below is the same each time it's worked out. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (whole, k: string) => vars[k] ?? whole);

export interface Actor {
  kind: "pet" | "resident";
  id: string;
  name: string;
}
export interface CircleComment {
  id: string;
  author: Actor;
  text: string;
  at: Date;
  /** A reply to the comment with this id. */
  replyTo?: string;
  /** The owner may delete what their own pet wrote on someone else's post. */
  removable: boolean;
}
export interface CirclePost {
  id: string;
  kind: "pet" | "resident";
  author: Actor;
  resident?: Resident;
  event?: LifeEvent;
  category: Category;
  text: string;
  photo?: string;
  at: Date;
  likes: { who: Actor; at: Date }[];
  comments: CircleComment[];
}
export interface BrowseLog {
  liked: string[];
  commented: string[];
}
export interface Circle {
  posts: CirclePost[];
  /** What the pet did on its rounds today. */
  today: BrowseLog;
}

/** A resident's name with its job in front, such as 实习生豆包, so it never reads like one of the owner's pets (docs/01 8.28). */
export const residentName = (r: Resident, lang: Lang) =>
  `${r.title[lang]}${lang === "zh" ? "" : " "}${r.name[lang]}`;
/** Resident text that mentions another resident uses the same full name. */
const renameIn = (text: string, lang: Lang) =>
  RESIDENTS.reduce((s, r) => {
    const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const name = escape(r.name[lang]), title = escape(r.title[lang]);
    // Templates may already say 煤球店长 or 店长煤球. Normalize either form once.
    const pattern = lang === "zh"
      ? `(?:${title}\\s*)*${name}(?:\\s*${title})*`
      : `\\b(?:${title}\\s+)*${name}(?:\\s+${title})*\\b`;
    return s.replace(new RegExp(pattern, "g"), residentName(r, lang));
  }, text);
export const residentById = (id: string) => RESIDENTS.find((r) => r.id === id);
const actorOf = (r: Resident, lang: Lang): Actor => ({ kind: "resident", id: r.id, name: residentName(r, lang) });

/** True when the pet's latest record says it has died: it no longer posts or goes out. */
export const petIsGone = (state: AppState) => {
  const latest = newestEvents(state.events)[0];
  return !!latest && isLoss(latest.description);
};

/** Posts the pet has already left at home today. */
export const postsToday = (state: AppState, now = new Date()) =>
  state.events.filter((e) => e.published && dayKey(eventDate(e)) === dayKey(now)).length;

/**
 * Whether a new record can become a post, and why not. Sick, hurt, lost or gone pets do not post,
 * and two posts a day is the limit.
 */
export function postBlock(state: AppState, description: string, now = new Date()): "sensitive" | "limit" | null {
  if (isSensitive(description) || petIsGone(state)) return "sensitive";
  if (postsToday(state, now) >= MAX_POSTS_PER_DAY) return "limit";
  return null;
}

/** Residents' own posts from the given day, if any of them posted. */
export function residentPostsOn(day: Date, lang: Lang, hidden: string[] = []): CirclePost[] {
  const key = dayKey(day), n = dayNumber(day);
  return RESIDENTS.flatMap((r, i) => {
    if (hidden.includes(r.id)) return [];
    const h = hash(`${r.id}:${key}`);
    // About four days in seven, so each resident posts 3–5 times a week.
    if (h % 7 >= 4) return [];
    const post = r.posts[(n + i * 3) % r.posts.length];
    const at = new Date(startOfDay(day).getTime() + ((8 + (h % 13)) * 60 + ((h >>> 8) % 60)) * MINUTE);
    return [{
      id: `npc:${r.id}:${key}`,
      kind: "resident" as const,
      author: actorOf(r, lang),
      resident: r,
      category: post.category,
      text: renameIn(post.text[lang], lang),
      at,
      likes: [],
      comments: [],
    }];
  });
}

/** Residents who come by the pet's post, with their likes and comments, and the pet's one reply. */
function visitorsFor(e: LifeEvent, pet: Pet, lang: Lang, hidden: string[], now: Date): Pick<CirclePost, "likes" | "comments"> {
  const at = eventDate(e).getTime();
  const residents = RESIDENTS.filter((r) => !hidden.includes(r.id));
  const comments: CircleComment[] = [];
  if (isSensitive(e.description)) {
    residents.filter((r) => QUIET[r.id]).forEach((r, k) => {
      const when = new Date(at + (12 + 30 * k) * MINUTE);
      if (when <= now)
        comments.push({ id: `c:${e.id}:${r.id}`, author: actorOf(r, lang), text: QUIET[r.id][lang], at: when, removable: false });
    });
    return { likes: [], comments };
  }
  const ranked = residents
    .map((r) => ({
      r,
      score: (r.likes.includes(e.category) ? 2 : 0) + (r.species === pet.species ? 2 : 0) + (hash(`${e.id}:${r.id}`) % 3),
    }))
    .sort((a, b) => b.score - a.score || a.r.id.localeCompare(b.r.id));
  const h = hash(e.id);
  const likers = ranked.slice(0, 1 + (h % 4));
  const likes = likers
    // The first resident stops by a minute after posting, so the owner sees someone came (docs/01 8.25).
    .map(({ r }, k) => ({ who: actorOf(r, lang), at: new Date(at + (k ? 3 + 11 * k + (h % 7) : 1) * MINUTE) }))
    .filter((l) => l.at <= now);
  const keen = likers.filter(({ r }) => r.likes.includes(e.category) || r.species === pet.species);
  const commenters = (keen.length ? keen : likers).slice(0, 1 + ((h >>> 4) % 2));
  const thing = thingLine(e.description, lang);
  commenters.forEach(({ r }, k) => {
    const when = new Date(at + (8 + 35 * k + ((h >>> 8) % 20)) * MINUTE);
    if (when > now) return;
    comments.push({
      id: `c:${e.id}:${r.id}`,
      author: actorOf(r, lang),
      text: [k ? "" : thing, fill(r.comments[e.category][lang], { name: pet.name })].filter(Boolean).join(lang === "en" ? " " : ""),
      at: when,
      removable: false,
    });
  });
  const first = comments[0];
  if (first) {
    const when = new Date(first.at.getTime() + 15 * MINUTE);
    const lines = PET_REPLIES[temperOf(pet)];
    if (when <= now)
      comments.push({
        id: `r:${e.id}:${pet.id}`,
        author: { kind: "pet", id: pet.id, name: pet.name },
        text: fill(lines[h % lines.length][lang], { friend: first.author.name }),
        at: when,
        replyTo: first.id,
        removable: true,
      });
  }
  return { likes, comments };
}

/**
 * The whole circle as it stands at `now`: the pet's posts left at home, residents' posts from the
 * last two weeks, and everything the pet and the residents did on them, newest first.
 */
export function buildCircle(state: AppState, now: Date, lang: Lang): Circle {
  const pet = state.pet;
  const today: BrowseLog = { liked: [], commented: [] };
  if (!pet) return { posts: [], today };
  const hidden = state.circle?.hiddenNpcs ?? [];
  const removed = new Set(state.circle?.removed ?? []);
  const own: CirclePost[] = state.events
    .filter((e) => e.published)
    .map((e) => ({
      id: `pet:${e.id}`,
      kind: "pet" as const,
      author: { kind: "pet" as const, id: pet.id, name: e.petSnapshot.name },
      event: e,
      category: e.category,
      text: e.stories.social.text,
      photo: e.photo,
      at: eventDate(e),
      ...visitorsFor(e, pet, lang, hidden, now),
    }));
  const town: CirclePost[] = [];
  // A resident's post can come round again within two weeks; only the newest copy is shown.
  const shown = new Set<string>();
  for (let d = 0; d < FEED_DAYS; d++)
    for (const p of residentPostsOn(addDays(now, -d), lang, hidden))
      if (p.at <= now && !shown.has(`${p.author.id}:${p.text}`)) {
        shown.add(`${p.author.id}:${p.text}`);
        town.push(p);
      }

  // The pet's rounds: twice a day it looks through residents' posts from that day and the day before.
  if (!petIsGone(state)) {
    const temper = temperOf(pet);
    // A pet that just moved in starts its rounds from then, on that day's posts (docs/01 8.26).
    const joined = pet.joinedAt ? new Date(pet.joinedAt) : undefined;
    const firstDay = joined && !Number.isNaN(joined.getTime()) ? startOfDay(joined) : undefined;
    // A post seen on yesterday's evening round is not visited again this morning.
    const seen = new Set<string>();
    for (const offset of [1, 0]) {
      const day = addDays(now, -offset);
      const key = dayKey(day);
      let likes = 0, comments = 0;
      for (const hour of BROWSE_HOURS) {
        const round = new Date(startOfDay(day).getTime() + hour * 60 * MINUTE);
        if (round > now) break;
        if (joined && round < joined) continue;
        const did = new Set(
          state.events.filter((e) => dayKey(eventDate(e)) === key && eventDate(e) <= round).map((e) => e.category),
        );
        const candidates = town
          .filter((p) => !seen.has(p.id) && p.at <= round && p.at.getTime() > round.getTime() - 36 * 60 * MINUTE &&
            !(firstDay && p.at < firstDay))
          .map((p) => ({
            p,
            score: (did.has(p.category) ? 3 : 0) + (p.resident!.species === pet.species ? 2 : 0) + (AFFINITY[temper].includes(p.resident!.temper) ? 1 : 0),
          }))
          .filter((c) => c.score >= 1)
          .sort((a, b) => b.score - a.score || hash(`${pet.id}:${a.p.id}`) - hash(`${pet.id}:${b.p.id}`));
        for (const { p, score } of candidates) {
          if (likes >= MAX_LIKES_PER_DAY) break;
          seen.add(p.id);
          const h = hash(`${pet.id}:${p.id}`);
          const when = new Date(round.getTime() + (h % 40) * MINUTE);
          if (when > now) continue;
          likes++;
          p.likes.push({ who: { kind: "pet", id: pet.id, name: pet.name }, at: when });
          if (offset === 0) today.liked.push(p.author.name);
          if (score < 3 || comments >= MAX_COMMENTS_PER_DAY) continue;
          comments++;
          const id = `c:${p.id}:${pet.id}`;
          if (removed.has(id)) continue;
          const r = p.resident!;
          p.comments.push({
            id,
            author: { kind: "pet", id: pet.id, name: pet.name },
            text: fill(PET_COMMENTS[temper][p.category][lang], { friend: residentName(r, lang) }),
            at: when,
            removable: true,
          });
          if (offset === 0) today.commented.push(p.author.name);
          const back = new Date(when.getTime() + (20 + (h % 30)) * MINUTE);
          if (back <= now)
            p.comments.push({
              id: `r:${p.id}:${r.id}`,
              author: actorOf(r, lang),
              text: fill(r.replies[h % r.replies.length][lang], { name: pet.name }),
              at: back,
              replyTo: id,
              removable: false,
            });
        }
      }
    }
  }
  for (const p of own) p.comments = p.comments.filter((c) => !removed.has(c.id));
  const posts = [...own, ...town].sort((a, b) => b.at.getTime() - a.at.getTime());
  return { posts, today };
}
