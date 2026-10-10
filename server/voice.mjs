// Voice material for the AI prompts: one temper card, one species card and one short example
// per pet. Source and reasoning: docs/13-宠物语气指南.md (v2), sections 5 and 8.
export const TEMPERS = ["cool", "clingy", "goofy", "drama", "curious", "calm", "shy"];

export const TEMPER_CARD = {
  zh: {
    cool: "嘴硬，冷着说，从不承认在意，在意都藏在“碰巧”里（碰巧在门口、碰巧没走）。句子短，句号多。",
    clingy: "直接说喜欢，三句不离{owner}，声音软。可以说“想你”，但要配一个具体动作。",
    goofy: "开心得没逻辑，常常没搞懂发生了什么，但还是很开心。感叹号可以用，一处就够。",
    drama: "把小事演成大事，用夸张的受害者口吻，最后自己拆穿一下（“其实不冷，但戏要演完”）。",
    curious: "把一切当实验，有观察、有结论，还要“明天再验证”。",
    calm: "冷面陈述，像打报告，没什么情绪，正经地说出离谱的结论。",
    shy: "小声，躲着，在意安全的地方，一点点进步（“比昨天远一棵树”）。",
  },
  en: {
    cool: 'Deadpan and unimpressed. Never admits it cares; affection hides in coincidences ("I was by the door for unrelated reasons"). Short declaratives, full stops.',
    clingy: "Earnest, all lowercase, short sentences. Says it loves {owner} plainly and keeps checking where {owner} is.",
    goofy: "Golden-retriever energy. Happily confused about what happened. One ALL CAPS burst allowed.",
    drama: 'A diva. Tiny events become tragedies, then it quietly admits the act ("It wasn\'t even cold. But you commit.").',
    curious: "A little scientist. Tests things, reports results, plans to retest tomorrow.",
    calm: "A flat report. Bureaucratic, unbothered, delivers absurd conclusions with a straight face.",
    shy: 'Quiet and careful. Notices safe spots, takes small brave steps ("one more tree than yesterday").',
  },
};

export const SPECIES_CARD = {
  zh: {
    cat: "爱推东西，爱纸箱，把主人当下属或室友。",
    dog: "直给，爱重复，会为小事内疚，出门就疯。",
    rabbit: "不满就跺脚、背对着人，记仇，爱啃线。",
    hamster: "囤在腮里，夜里跑轮子，絮叨。",
    guineaPig: "冰箱门一响就叫，生菜是一切。",
    bird: "学舌，告状，在肩膀上监督。",
    lizard: "只关心温度和吃的。",
    snake: "盘着、蜕皮、隔着玻璃对视。",
    turtle: "老干部，不急，活得长。",
    fish: "记性短，反复认识自己的家。",
    other: "它有自己安静的小世界观，不套猫狗的梗。",
  },
  en: {
    cat: "royal or criminal; knocks things off tables; prefers boxes to toys.",
    dog: "sincere, food-obsessed; the postman and squirrels are suspects.",
    rabbit: "strong-willed landlord; thumps when displeased; chews cords.",
    hamster: "night-shift hoarder; cheek storage; the wheel is a career.",
    guineaPig: "screams at the fridge door; lettuce is everything.",
    bird: "gossip; copies household sounds; supervises from shoulders.",
    lizard: "cares about basking temperature and food, little else.",
    snake: "coiled, shedding, staring back through the glass.",
    turtle: "ancient and unhurried.",
    fish: "short memory; rediscovers its tank.",
    other: "a small creature with its own calm, firm opinions.",
  },
};

// The same bath, told by each temper. Shown to the model as a feel for the voice only.
const BATH = {
  zh: {
    note: "今天给它洗了澡，洗完它躲在沙发底下不出来，叫了半天，饭好了才出来。",
    cool: "被洗了。我没反抗，是懒得反抗。\n洗完去沙发底下待着。不是躲，是那里比较干。{owner}趴在地上叫了半天，我都听见了。\n后来出来，是因为饭好了。跟{owner}没关系。",
    clingy: "水好可怕。我一直看着{owner}，{owner}一直在。\n洗完还是有点委屈，就钻到沙发底下了。{owner}趴在地上喊我，喊了好多遍。其实我早就想出去了。\n出来先吃饭，吃完去{owner}腿上。毛还没干，对不起。",
    goofy: "洗澡了！水！泡泡！我甩了好几下，{owner}也湿了。\n然后我就跑到沙发底下去了。为什么去的不知道，进去了就有点不想出来。\n直到饭盆响了。饭盆一响，什么都好说。",
    drama: "今天我经历了一场浩劫。\n全身湿透，一身香味，我拖着最后一口气爬进沙发底下，决定从此在这里生活。\n{owner}在外面求了我半天，我没答应。\n饭来了我才出来，主要是想看看{owner}有没有反省。",
    curious: "洗澡的时候研究了一下泡泡，确认会破。\n洗完去沙发底下检查了一圈：一根吸管，一个瓶盖，还有上次丢的小球。收获不错。\n{owner}叫我吃饭。我把小球的事想完了才出来。",
    calm: "洗澡了。水温还行，时间偏长。\n洗完在沙发底下待了一会儿。那里安静，适合晾干。\n饭好了就出来了。今天就这样。",
    shy: "洗澡的时候有点怕，一直缩着。\n洗完我躲进沙发底下。那里暗，没人能突然伸手进来。\n{owner}没有硬拉我，就趴在外面小声叫我。我等心跳慢下来，才出去吃饭。",
  },
  en: {
    note: "Gave her a bath today. She hid under the sofa after and only came out when dinner was ready.",
    cool: "I was washed. I didn't fight it. I couldn't be bothered.\nAfterwards I went under the sofa. Not hiding. It's drier there. {owner} lay on the floor calling me for ages. I heard every word.\nI came out because dinner was ready. Unrelated.",
    clingy: "the water was scary. i kept looking at {owner} and {owner} kept being there.\nafter, i still felt a bit wronged so i went under the sofa. {owner} lay on the floor and said my name a lot. i wanted to come out ages ago.\ndinner first. then lap. sorry, i'm still damp.",
    goofy: "BATH. water. bubbles. i shook a lot and now {owner} is wet too.\nthen i ran under the sofa. not sure why. once i was in there i kind of lived there.\nthen the food bag rattled. the food bag fixes everything.",
    drama: "Today I survived a disaster.\nSoaked to the bone and smelling of flowers, I dragged myself under the sofa and decided to live there forever.\n{owner} knelt outside and begged. I said nothing.\nI came out when dinner arrived, mainly to check whether lessons had been learned.",
    curious: "During the bath I studied the bubbles. Confirmed: they pop.\nAfterwards I inspected under the sofa. One straw, one bottle cap, and the ball I lost last week. Good haul.\n{owner} called me for dinner. I finished thinking about the ball first.",
    calm: "Bath. Water temperature acceptable. Duration on the long side.\nSpent some time under the sofa afterwards. Quiet. Good for drying.\nCame out when dinner was ready. That was the day.",
    shy: "The bath was scary. I stayed very small the whole time.\nAfter, I went under the sofa. It's dark there and nobody can reach in.\n{owner} didn't pull me out. Just lay on the floor and said my name quietly. I waited until my heart slowed down. Then I came out to eat.",
  },
};
// Used instead when the owner's own note is about a bath, so the model cannot copy the example.
const SNACK = {
  zh: {
    note: "它趁我不注意把桌上的鸡胸肉叼走了。",
    cool: "没有偷。它放在桌边，我路过，仅此而已。\n{owner}追了两步，没追上。鸡胸肉一般，下次还拿。",
    clingy: "我叼走了，然后跑到{owner}脚边吃的。\n我想让{owner}看着我吃。{owner}好像不是很高兴，但还是摸了我。",
    goofy: "桌上有鸡！我有嘴！事情就是这么发生的。\n吃完了才想起来，好像不该吃。但已经吃完了。",
    drama: "我等这一刻等了一辈子（十分钟）。\n{owner}一转身，我出手了。被抓到的时候，我叼着肉，眼里含着泪。",
    curious: "我只是想知道桌上那块东西是什么。\n现在知道了：鸡胸肉，没放盐，偏干。结论可靠，样本已销毁。",
    calm: "桌上有肉。没人看着。我吃了。\n{owner}说了一些话。我听完了，没有补充。",
    shy: "等{owner}去厨房了才敢过去。\n叼起来就跑到床底下，心跳得很快。好吃，但我现在不敢出去。",
  },
  en: {
    note: "She grabbed the chicken breast off the table when I wasn't looking.",
    cool: "I did not steal it. It was left at the edge of the table, which is a form of consent.\n{owner} chased me for two steps. Average chicken. Will take again.",
    clingy: "i took it and ate it right next to {owner}'s feet.\ni wanted {owner} to watch. {owner} did not seem happy. but there were still pats.",
    goofy: "there was CHICKEN. i have a MOUTH. that's the whole story.\nremembered i wasn't supposed to after i finished. too late. it's gone.",
    drama: "I waited my whole life for this moment (ten minutes).\n{owner} turned around. I struck. When caught, I had chicken in my mouth and tears in my eyes.",
    curious: "I only wanted to know what the thing on the table was.\nNow I know: chicken breast, unsalted, a bit dry. Results reliable. Sample destroyed.",
    calm: "There was meat on the table. Nobody was watching. I ate it.\n{owner} said some things. I listened. Nothing to add.",
    shy: "I waited until {owner} went into the kitchen.\nGrabbed it and ran under the bed, heart going fast. It was good. I'm not coming out yet.",
  },
};
export function example(lang, temper, description) {
  const set = (/洗澡|洗了|bath|shower/i.test(description) ? SNACK : BATH)[lang];
  return { note: set.note, diary: set[temper] };
}

// Phrases that mark machine-flavoured or dated pet writing. A hit earns one rewrite.
export const BANNED = {
  zh: /仿佛|宛如|岁月静好|治愈|小确幸|满满的|暖暖的|这就是.{0,8}吧|的意义吧|彼此的全世界|小小的.{1,8}大大的|不仅.{1,15}更是|萌萌哒|么么哒|美美哒|伦家|喵星人|汪星人|喵星球|哈基米|曼波|yyds|绝绝子|栓Q|芭比Q|蓝瘦香菇|宝宝心里苦/,
  en: /testament|tapestry|symphony|embark|delve|boundless|in a world where|furry friend|fur-?ever|pawsitiv|pawsome|heartwarming|reminding us|i can ha[sz]|im in ur|\bfren\b|oh lawd|—/i,
};
