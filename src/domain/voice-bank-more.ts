import type { Category } from "./types";
import type { Temper } from "./temper";

// More lines for each temper and kind of event (docs/01 8.27), so an owner who writes about sleep every
// day doesn't meet the same sentence every day. They come after the two in voice-bank.ts and follow the
// same brief (docs/13, docs/15): thoughts, wishes and opinions only, never a new visitor, place or action.
export type MoreLines = Record<Temper, { line: Record<Category, string[]>; social: Record<Category, string[]> }>;

export const moreZh: MoreLines = {
  cool: {
    line: {
      sleep: ["醒着的时候我也挺忙，只是忙的事不方便告诉{owner}。现在先睡。", "睡姿是我自己选的，不接受点评。拍照可以，别出声。", "这一觉我不打算解释。困了就睡，道理很简单。"],
      snack: ["好吃，但我不会表现得太明显。{owner}自己看着办。", "这一口我认可。认可不代表下次可以少给。", "我吃得很克制。剩下的那点，是留给下次的面子。"],
      bath: ["湿着的时候别跟我说话。等毛干了，我再决定原不原谅。", "洗澡我配合了，配合不等于喜欢。这两件事请分开记。", "现在的香味不是我的风格。过两天会变回来的。"],
      chaos: ["东西在哪儿，我比{owner}清楚。只是我不负责放回去。", "结果{owner}已经看到了。动机属于个人隐私。", "我不道歉，但下次可以考虑换个地方。只是考虑。"],
      walk: ["外面还行。比我想的稍微好一点，别告诉别人。", "路线我记下了。下次谁带路，可以再商量。", "要是能多待一会儿就更好。不过我不会说出来，{owner}自己体会。"],
      other: ["今天这件事，我参与了，但不打算承认。", "看起来是小事，在我这里也是小事。记下来也行。", "{owner}觉得有意思，我就当它有意思。"],
    },
    social: {
      sleep: ["今日营业状态：睡。有事留言，不保证回。", "睡觉中。打扰前请先准备好理由。"],
      snack: ["吃过了，评价：还行。这已经是很高的评价。", "零食的事我有意见，意见是还要。"],
      bath: ["洗了。别问感受，问就是还行。", "干净了，脾气还湿着。"],
      chaos: ["现场已经被{owner}看过了，我就不补充了。", "这件事，我保留解释权。"],
      walk: ["出去了一趟，评价：可以再去。", "外面的事，我看过了。下次叫我，我考虑。"],
      other: ["今天有件事，算我同意它发生了。", "日常一条，看完请安静离开。"],
    },
  },
  clingy: {
    line: {
      sleep: ["睡着前最后看见{owner}的话，会睡得最香。", "我想睡在能听见{owner}脚步声的地方。醒来第一眼也想找到{owner}。", "睡觉的时候也想贴着点什么。最好是{owner}，其次是{owner}的衣服。"],
      snack: ["好吃的东西，{owner}在旁边看着我吃，就更好吃了。", "吃东西的时候，我也想确认{owner}还在。", "这一顿我很满足。还想听{owner}夸我吃得乖。"],
      bath: ["洗澡的时候，只要{owner}在，我就还能撑住。", "洗完了，想被毛巾裹着让{owner}抱一会儿。", "我不喜欢洗澡，但喜欢洗完被{owner}夸香香。"],
      chaos: ["我只是想让{owner}多看我一会儿。方法可能不太对。", "{owner}别生气太久好不好。我已经在旁边等了。", "这件事我想先认个错，再要一个摸摸头。"],
      walk: ["出门最好的地方是，{owner}一直在我旁边。", "走到哪里都想回头看看{owner}跟上没有。", "外面很好玩，但我最想要的是回家路上{owner}也在。"],
      other: ["今天也想黏着{owner}。这件小事也算黏着。", "只要和{owner}有关的事，我都想记住。", "{owner}在的时候，今天就是好的一天。"],
    },
    social: {
      sleep: ["睡觉也要挨着{owner}，这是我的规矩。", "想在{owner}旁边睡一整个下午。"],
      snack: ["今天吃得很好，想让{owner}也在旁边。", "好吃的要和{owner}一起，这样才算数。"],
      bath: ["洗完了，正在等{owner}抱抱。", "今天勇敢地洗了澡，奖励是{owner}夸我。"],
      chaos: ["做了点小事，希望{owner}还是最喜欢我。", "{owner}笑了没有？笑了就好。"],
      walk: ["今天和{owner}一起出门，开心。", "出门最好是和{owner}一起，一直一起。"],
      other: ["今天也在{owner}身边。", "和{owner}待在一起的又一天，记一下。"],
    },
  },
  goofy: {
    line: {
      sleep: ["我本来只想眯一下，醒来发现自己睡得特别认真。", "我觉得自己在梦里也在玩，可能比醒着还开心！", "睡饱了！现在可以开始想下一件好玩的事了！"],
      snack: ["吃完了！要是碗里还能再变出一点就好了！", "我对吃的事一向很热情！希望{owner}也被我感染！", "这一口太好吃了，我决定记住这个味道，然后马上忘掉，下次重新惊喜。"],
      bath: ["洗完澡最想做的，就是疯跑三圈！先申请一下！", "我很想知道泡泡是什么味道！{owner}大概不会同意我试试！", "现在我是一只香喷喷的小动物了！香到我自己都想闻！"],
      chaos: ["我本来只是想玩一下，后来就玩大了一点点！", "这件事的过程很好玩，结果……结果{owner}已经看到了！", "我觉得这次发挥不错！{owner}的表情好像不太同意！"],
      walk: ["出门这件事太好了，好到我每次都像第一次！", "外面的每个味道我都想打个招呼！", "我还没玩够！回家的路能不能走慢一点！"],
      other: ["今天的事我很满意！具体满意哪里，还在想！", "这件事好像很普通，但我觉得超好玩！", "我又干了一件让{owner}笑的事！大概！"],
    },
    social: {
      sleep: ["睡觉也是一种玩！我今天玩得很认真！", "睡醒了！今天还能再玩一轮吗！"],
      snack: ["吃完了！还想再来一份！", "今天的吃的：好吃！明天的吃的：也想好吃！"],
      bath: ["洗完澡香喷喷！谁来闻闻！", "洗澡结束！申请疯跑时间！"],
      chaos: ["今天玩得有点大！但是很开心！", "我觉得这次挺成功的！{owner}说再议！"],
      walk: ["今天出门了！明天还想出门！", "外面太好玩了！谁也去过！"],
      other: ["今天又是开心的一天！", "干了一件事！很满意！"],
    },
  },
  drama: {
    line: {
      sleep: ["这一觉睡得像谢幕。醒来之后，掌声可以响起了。", "我今天累到需要一场完整的休息。请把灯光调暗。", "睡着之前，我回顾了今天的每一个精彩瞬间。主角都是我。"],
      snack: ["这一口让我深受感动。我决定把今天定为美食纪念日。", "零食来的那一刻，我的世界亮了。份量要是再多一点，就更亮了。", "我吃得很有仪式感。{owner}看懂了吗？"],
      bath: ["这场洗澡，是我本周最艰难的一场戏。我演完了。", "我被洗了。这句话请用悲伤的语气读。", "洗完了。我要一条最软的毛巾，和一句真诚的道歉。"],
      chaos: ["这不是捣乱，是一场即兴表演。{owner}只看到了结局。", "我承认场面有点大。但是艺术本来就需要一点牺牲。", "如果{owner}看到我一脸无辜，那也是表演的一部分。"],
      walk: ["我走出门的那一刻，整条路都是我的舞台。", "出门这一趟，我把每一步都走得很有气场。", "出门这件事很适合我。下次请继续安排，最好隆重一点。"],
      other: ["今天这一段，如果没有我，就太平淡了。", "这件事被我演得比它本来精彩一点。", "我觉得今天值得一个特写镜头。"],
    },
    social: {
      sleep: ["今日剧目：一场安静的睡眠。主演：我。", "睡觉也要睡得有排面，今天做到了。"],
      snack: ["今天的吃的，让我感动到想发言。", "这顿饭值得写进我的个人传记。"],
      bath: ["洗澡这场戏我演完了。请送花，最好送零食。", "今天经历了洗澡。我还在恢复中。"],
      chaos: ["今天的即兴演出反响热烈，至少{owner}的反应很大。", "场面有点大，主角依旧是我。"],
      walk: ["今天出门走了一场秀。", "外面的路很适合我，我已经决定下次还去。"],
      other: ["今天的我，依旧是主角。", "一段日常，被我演成了名场面。"],
    },
  },
  curious: {
    line: {
      sleep: ["我想知道为什么下午总是比早上更困。今天先睡，明天再验证。", "最暖和的睡觉位置到底在哪儿？值得多试几次。", "醒来的时候，我在想刚才的梦是从哪儿来的。还没想出来。"],
      snack: ["吃之前，我很想先好好闻一闻。味道和想象的一不一样，值得比较。", "为什么好吃的东西总是吃得特别快？这个问题值得研究。", "我对吃的从哪儿来也很好奇。{owner}好像不太理解我的研究方法。"],
      bath: ["水为什么会从毛上流下来？这个问题比洗澡本身有意思。", "洗澡的时候我在想，泡泡到底去哪了。到最后也没找到。", "洗完以后，我身上多了一个新味道。它是从哪儿来的，还在分析。"],
      chaos: ["我只是想知道，它掉下去会发生什么。现在我知道了。", "这个实验的结果很清楚。{owner}的反应也被我记录了。", "我在测试东西能不能被移动。结论是能。"],
      walk: ["路上有好多我没见过的味道。我挨个记下来了。", "外面的东西每天都不太一样。我想知道是哪儿变了。", "这一趟我收集了好多新问题，回家慢慢想。"],
      other: ["这件事我还没研究完，先记一笔。", "我发现了一个小规律，还要多观察几次。", "为什么会这样，我打算继续观察。"],
    },
    social: {
      sleep: ["今日实验：在不同地方睡觉。结论待定。", "睡前想了一个问题，醒来忘了。"],
      snack: ["今天研究了一种吃的，结论：值得再研究。", "吃之前先闻一闻，是我的科学习惯。"],
      bath: ["洗澡这件事里，泡泡最神秘。", "洗完多了一个新味道，正在研究。"],
      chaos: ["今天做了一个实验，现场有点乱。", "实验成功，{owner}不太同意。"],
      walk: ["今天出门收集了新的气味样本。", "外面有新发现，还在整理。"],
      other: ["今日观察：又有新问题了。", "记录一条小发现。"],
    },
  },
  calm: {
    line: {
      sleep: ["睡一觉，什么都会好一点。这是我一直相信的事。", "能找个舒服的角落睡久一点，就是好日子。", "醒来的时候不着急起，再躺一会儿也没关系。"],
      snack: ["吃饱了，心里也踏实了。", "不急着吃完，好吃的东西值得慢一点。", "这顿饭简单，但我很满意。"],
      bath: ["洗完了，干干净净，心也静下来了。", "洗澡这件事，熬过去就好了。现在挺舒服。", "毛慢慢干，我也慢慢恢复。"],
      chaos: ["弄成这样也不是故意的。收拾的时候，我可以在旁边陪着。", "事情已经发生了，别太往心里去。", "我没想闹，只是顺手了。下次慢一点。"],
      walk: ["走一走，看一看，回来刚好。", "外面的风要是舒服，我愿意多站一会儿。", "出门不用走太远，走得舒服就够了。"],
      other: ["日子就是这样一件一件过的，挺好。", "这件事不大，记下来也不错。", "今天平平常常，我很喜欢。"],
    },
    social: {
      sleep: ["睡了个好觉，今天就这样。", "休息好了，日子照常。"],
      snack: ["吃得刚刚好。", "一顿安稳的饭。"],
      bath: ["洗完了，挺舒服。", "干干净净，安安静静。"],
      chaos: ["有点小乱，问题不大。", "事情过去了，大家别急。"],
      walk: ["出门走了走，心情不错。", "外面挺好，走得不急。"],
      other: ["平常的一天，记一笔。", "今天也不错。"],
    },
  },
  shy: {
    line: {
      sleep: ["我喜欢在只有自己知道的地方睡觉。那里最让我放心。", "睡着的时候不想被看见。醒了再说。", "我睡得很浅，一点声音就会醒。{owner}轻一点就好。"],
      snack: ["{owner}要是走开一点点，我会更敢吃。其实很好吃。", "我想小口小口地吃……味道还不错。", "我吃得慢，是因为在确认这是给我的。"],
      bath: ["洗澡的时候我很想缩成一团。{owner}的手轻一点，我会记住的。", "洗完想躲起来一会儿。等我准备好再出来。", "我很努力了。现在想安静地待着。"],
      chaos: ["我也不知道怎么就变成这样了……{owner}别太大声。", "我想先躲一会儿。不是不认错，是还不敢出来。", "我想说对不起，但声音有点小。"],
      walk: ["外面有点吓人，但{owner}在的话，我愿意多走几步。", "我走得很慢，因为每一步都在确认安不安全。", "回家的时候，我心里悄悄觉得，今天还挺勇敢。"],
      other: ["……今天这件事，我悄悄觉得还不错。", "我躲在旁边看着，其实也有参与。", "这件事我不太敢说，但想被记住。"],
    },
    social: {
      sleep: ["小声发一条：睡了个好觉。", "找到一个安全的地方，睡着了。"],
      snack: ["偷偷吃了一点……很好吃。", "今天勇敢地吃完了。"],
      bath: ["洗澡了……现在想安静一会儿。", "今天洗了澡，有点累。"],
      chaos: ["不小心弄乱了……对不起。", "今天有点小意外，想先躲一会儿。"],
      walk: ["今天出门了，想再勇敢一点点。", "外面有点吓人，但我走完了。"],
      other: ["小声说……今天还好。", "鼓起勇气发一条。"],
    },
  },
};

export const moreEn: MoreLines = {
  cool: {
    line: {
      sleep: ["I'm busy when I'm awake too. The details are classified. For now, sleep.", "I chose this sleeping position myself. Reviews are not accepted.", "I won't be explaining this nap. Tired means sleep. Simple."],
      snack: ["It was good. I won't make a show of it. {owner} can draw conclusions.", "I approve of this bite. Approval does not mean smaller portions.", "I ate with restraint. The leftover bit is for my dignity."],
      bath: ["Don't talk to me while I'm damp. Forgiveness will be decided once I'm dry.", "I cooperated with the bath. Cooperating is not the same as enjoying.", "This scent is not my style. It will wear off."],
      chaos: ["I know where things are better than {owner}. Putting them back is not my department.", "{owner} has seen the result. The motive is private.", "No apology. I may consider a different spot next time. May."],
      walk: ["Outside was fine. Slightly better than expected. Don't spread that around.", "I've noted the route. Who leads next time is open for discussion.", "A little longer out would have been better. I won't say so. {owner} can work it out."],
      other: ["I was involved in this. I won't be admitting it.", "Looks like a small thing. It is a small thing. Fine to note it.", "{owner} finds it interesting, so I'll allow it to be interesting."],
    },
    social: {
      sleep: ["Current status: asleep. Leave a message. No promises.", "Sleeping. Interruptions require a good reason."],
      snack: ["Eaten. Verdict: fine. That's high praise.", "I have notes on snacks. The note is: more."],
      bath: ["Washed. Don't ask how it went. It went.", "Clean coat. Mood still damp."],
      chaos: ["{owner} has seen the scene. Nothing to add.", "I reserve the right to explain later."],
      walk: ["Went out. Verdict: could go again.", "I've seen outside. Invite me next time and I'll consider it."],
      other: ["Something happened today. I've allowed it.", "Daily update. Read quietly and move along."],
    },
  },
  clingy: {
    line: {
      sleep: ["if the last thing i see before sleeping is {owner}, i sleep best.", "i want to sleep where i can hear {owner}'s footsteps. and find {owner} first thing when i wake.", "i like leaning on something when i sleep. {owner} first, {owner}'s jumper second."],
      snack: ["food tastes better when {owner} watches me eat it.", "even while eating, i like knowing {owner} is still there.", "i'm very full and very happy. i'd like {owner} to say i ate nicely."],
      bath: ["as long as {owner} is there during a bath, i can get through it.", "all done. i'd like to be wrapped in a towel and held by {owner} for a bit.", "i don't like baths. i do like {owner} saying i smell nice afterwards."],
      chaos: ["i only wanted {owner} to look at me a bit longer. the method needs work.", "please don't stay cross too long. i'm already waiting right here.", "i'd like to say sorry first, then ask for a head pat."],
      walk: ["the best thing about going out is {owner} beside me the whole time.", "wherever we go, i keep turning round to check {owner} is keeping up.", "outside is fun. the part i want most is {owner} on the way home too."],
      other: ["i wanted to stay close to {owner} today. this counts.", "anything that has {owner} in it, i want to remember.", "when {owner} is around, it's a good day."],
    },
    social: {
      sleep: ["sleeping next to {owner}. that's the rule.", "i'd like a whole afternoon napping beside {owner}."],
      snack: ["ate well today. would like {owner} right there too.", "nice food only counts if {owner} is nearby."],
      bath: ["bath done. waiting for a cuddle from {owner}.", "i was brave in the bath. the reward is {owner} saying so."],
      chaos: ["did a little something. hoping i'm still {owner}'s favourite.", "did {owner} laugh? then it's fine."],
      walk: ["went out with {owner} today. happy.", "going out is best with {owner}, all the way."],
      other: ["by {owner}'s side again today.", "another day close to {owner}. noting it down."],
    },
  },
  goofy: {
    line: {
      sleep: ["I only meant to rest my eyes. Turns out I slept very seriously.", "I think I keep playing in my dreams. Maybe even better than awake!", "Fully rested! Now I can start thinking about the next fun thing!"],
      snack: ["All gone! If only the bowl could magic up a bit more!", "I am always enthusiastic about food! I hope it's catching, {owner}!", "That bite was so good I'll remember it, then forget it, so it's a surprise again next time."],
      bath: ["After a bath, what I want most is three laps of zoomies! Applying now!", "I really want to know what bubbles taste like! {owner} probably won't let me check!", "I am a fresh-smelling animal now! I want to sniff myself!"],
      chaos: ["I only meant to play a little. It got slightly bigger than that!", "The process was great fun. The result... {owner} has seen the result!", "I thought I did brilliantly! {owner}'s face seems to disagree!"],
      walk: ["Going out is so good it feels like the first time, every time!", "I want to say hello to every smell out there!", "I haven't finished playing! Can we walk home slowly?"],
      other: ["I'm very pleased with today! Still working out which part!", "This looks ordinary, but I thought it was brilliant!", "I made {owner} laugh again! Probably!"],
    },
    social: {
      sleep: ["Sleeping counts as playing! I played very hard today!", "Awake! Can we have another round today?!"],
      snack: ["Finished! Would like seconds!", "Today's food: great! Tomorrow's food: hoping also great!"],
      bath: ["Fresh from the bath! Who wants a sniff?!", "Bath over! Requesting zoomie time!"],
      chaos: ["Played a bit too big today! Very happy though!", "I'd call it a success! {owner} says we'll discuss it!"],
      walk: ["Went out today! Want to go out tomorrow!", "Outside was so much fun! Anyone else been?!"],
      other: ["Another happy day!", "Did a thing! Very satisfied!"],
    },
  },
  drama: {
    line: {
      sleep: ["That sleep felt like a curtain call. Applause may begin.", "Today was exhausting enough to require a full intermission. Dim the lights, please.", "Before drifting off, I reviewed every highlight of my day. I starred in all of them."],
      snack: ["This bite moved me deeply. I declare today a festival of food.", "The moment the snack arrived, my world lit up. A larger portion would light it further.", "I ate with great ceremony. Did {owner} catch the symbolism?"],
      bath: ["This bath was the hardest performance of my week. I finished it.", "I was bathed. Please read that line in a tragic voice.", "It's over. I require the softest towel and a sincere apology."],
      chaos: ["This was not mischief. It was improvised theatre. {owner} only caught the finale.", "The scene was perhaps a little large. Art requires sacrifice.", "If {owner} saw an innocent face, that was part of the performance."],
      walk: ["The moment I stepped out, the whole path became my stage.", "I walked every step of that outing with presence.", "Outings suit me. Please book another, with a little more ceremony."],
      other: ["Without me, today would have been terribly plain.", "I performed this moment a little better than it deserved.", "Today deserved a close-up."],
    },
    social: {
      sleep: ["Tonight's production: a quiet sleep. Starring me.", "Even my naps have presence. Today proved it."],
      snack: ["Today's meal moved me to speak.", "This meal belongs in my memoirs."],
      bath: ["The bath performance is over. Flowers welcome. Treats preferred.", "Survived a bath today. Still recovering."],
      chaos: ["Today's improv got a big reaction. At least from {owner}.", "A dramatic scene. Same lead as always."],
      walk: ["Went out and gave a full show.", "The path suited me. I've decided to return."],
      other: ["Still the lead today.", "An ordinary moment, now a classic scene."],
    },
  },
  curious: {
    line: {
      sleep: ["Why are afternoons sleepier than mornings? Sleep first, test tomorrow.", "Where exactly is the warmest place to sleep? Worth several trials.", "When I woke up, I wondered where that dream came from. Still no answer."],
      snack: ["Before eating, I'd like a proper sniff. Comparing taste with expectation is worth doing.", "Why do good things get eaten so fast? Worth investigating.", "I'm curious where food comes from, too. {owner} doesn't seem to follow my method."],
      bath: ["Why does water run off fur like that? That question beats the bath itself.", "During the bath I wondered where the bubbles go. I never found out.", "There's a new smell on me after the bath. Its source is under analysis."],
      chaos: ["I just wanted to know what would happen if it fell. Now I know.", "The results are clear. I also recorded {owner}'s reaction.", "I was testing whether things could be moved. They can."],
      walk: ["So many smells I hadn't met before. I logged each one.", "Outside is slightly different every day. I'd like to know which part changed.", "I gathered lots of new questions on this trip. I'll think them over at home."],
      other: ["I haven't finished studying this. Noting it for now.", "I've spotted a small pattern. It needs a few more observations.", "Why did that happen? I plan to keep watching."],
    },
    social: {
      sleep: ["Today's experiment: sleeping in different spots. Results pending.", "Thought of a question before napping. Forgot it on waking."],
      snack: ["Studied a new food today. Conclusion: needs further study.", "Sniff before eating. It's my method."],
      bath: ["The most mysterious part of a bath: bubbles.", "New smell after the bath. Investigating."],
      chaos: ["Ran an experiment today. The lab got messy.", "Experiment successful. {owner} disagrees."],
      walk: ["Collected new scent samples on today's outing.", "New findings from outside. Still sorting them."],
      other: ["Today's observation: another new question.", "Logging one small discovery."],
    },
  },
  calm: {
    line: {
      sleep: ["A good sleep makes most things better. I've always believed that.", "A comfy corner and a long sleep make a good day.", "No hurry to get up after waking. Another lie-in is fine."],
      snack: ["Full tummy, settled mind.", "No rush to finish. Good food is worth slowing down for.", "A simple meal, and I'm content."],
      bath: ["All clean now, and calm again.", "The bath is the kind of thing you get through. I'm comfortable now.", "My fur dries slowly. I'm recovering slowly too."],
      chaos: ["It wasn't on purpose. I can keep {owner} company while it gets tidied.", "It's already happened. No need to dwell on it.", "I wasn't trying to cause trouble. It just happened. I'll go slower next time."],
      walk: ["A little walk, a little look, home at the right time.", "If the breeze is nice, I'm happy to stand in it a bit longer.", "No need to go far. Going comfortably is enough."],
      other: ["Days go by one thing at a time. That's fine.", "Not a big thing. Good to have it noted.", "An ordinary day. I liked it."],
    },
    social: {
      sleep: ["Slept well. That's today.", "Rested. Carrying on as usual."],
      snack: ["Ate just the right amount.", "A peaceful meal."],
      bath: ["Bath done. Feeling comfy.", "Clean and quiet."],
      chaos: ["A bit of a mess. Nothing serious.", "It's passed. No rush, everyone."],
      walk: ["Went for a walk. Good mood.", "Nice out there. Took it slow."],
      other: ["An ordinary day, noted.", "Good day today."],
    },
  },
  shy: {
    line: {
      sleep: ["I like sleeping somewhere only I know about. That's where I feel safest.", "I'd rather not be watched while sleeping. We can talk when I'm up.", "I sleep lightly. Small sounds wake me. If {owner} is gentle, that helps."],
      snack: ["If {owner} steps back a little, I'm braver about eating. It's really good.", "I'd like to take tiny bites... it's nice.", "I eat slowly because I'm checking it's really for me."],
      bath: ["During a bath I want to curl up small. If {owner}'s hands are gentle, I'll remember.", "After the bath I'd like to hide for a while. I'll come out when I'm ready.", "I tried very hard. Now I'd like some quiet."],
      chaos: ["I'm not sure how it ended up like this... please don't be loud.", "I'd like to hide for a bit. Not because I won't own up. I'm just not brave enough yet.", "I want to say sorry, but my voice is a bit small."],
      walk: ["Outside is a bit scary, but with {owner} there I'm willing to go a few steps further.", "I walk slowly because every step is a safety check.", "On the way home I quietly thought I'd been quite brave today."],
      other: ["...I quietly think today went okay.", "I was watching from the side. That counts as joining in.", "I'm not brave enough to say much, but I'd like this remembered."],
    },
    social: {
      sleep: ["Posting quietly: had a good sleep.", "Found a safe spot. Fell asleep."],
      snack: ["Had a little nibble... it was good.", "Finished the whole thing today. Bravely."],
      bath: ["Had a bath... would like some quiet now.", "Bath today. A bit tired."],
      chaos: ["Made a little mess by accident... sorry.", "Small accident today. Hiding for a bit."],
      walk: ["Went out today. Hoping to be a little braver.", "Outside was a bit scary, but I made it."],
      other: ["Whispering... today was okay.", "Found the courage to post."],
    },
  },
};
