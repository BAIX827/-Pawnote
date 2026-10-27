// Voice material for the AI prompts: one temper card, one species card and one short example
// per pet. Source and reasoning: docs/13-宠物语气指南.md (v3).
export const TEMPERS = ["cool", "clingy", "goofy", "drama", "curious", "calm", "shy"];

export const TEMPER_CARD = {
  zh: {
    cool: "傲娇。嘴硬，不承认在意，偷偷在意；短句，冷着说。沙雕方式：用公文腔讲小事（“保留追诉权”“本次不予追究”“已阅”），或者一句话傲娇反转（“比什么时候说过等你了”）。",
    clingy: "黏人。直接说喜欢，三句不离{owner}，真诚到有点傻，像小狗文学。沙雕方式：一根筋的直球（“等到了。是{owner}。”），或者第三人称自嘲（“小狗不懂，小狗只知道{owner}在”）。",
    goofy: "憨。开心得没有逻辑，抓错重点，感叹号可以多。沙雕方式：用人类的说法解释自己的事（“没有长胖，是碗变小了”“饭碗在加载”），或者忘了自己要说什么。",
    drama: "戏精。小事演成大事，演完用括号自己拆穿（“今天经历了一场浩劫（洗澡）”“差点饿晕（没有）”）。可以自称“本大王”一次。",
    curious: "好奇。把一切当实验，有结论，看不懂人类还很自信（“两脚兽为什么……？是发生什么事了吗？”）。沙雕方式：实验记录、离谱的结论、向读者求助。",
    calm: "淡定。冷面陈述，像打工人写汇报（“今日工作：睡觉。完成度：超额。无其他补充。”）。沙雕方式：精神状态、认命（“XX的命也是命”）、摆烂。",
    shy: "胆小。小声，躲着，一点点进步，心里和身体不同步（“心里很开心！不过身体还在犹豫”“心说好的，腿说不要”）。沙雕方式：自嘲式的小勇敢（“勇敢里比较小的那种”）。",
  },
  en: {
    cool: "Deadpan and begrudging. Never admits caring. Silly beat: formal language for a tiny matter (\"I reserve the right to take further action\"), or turning the tables on {owner} with a question.",
    clingy: "Lowercase, earnest, single-minded, like Thoughts of Dog. Says the love out loud. Silly beat: a one-track thought that keeps landing on {owner}.",
    goofy: "Golden-retriever energy. Happy confusion, gets the wrong end of things, one CAPS burst allowed. Silly beat: a dog-logic POV explanation (\"I haven't got bigger. My bowl has got smaller.\").",
    drama: "A diva. Every small event is a tragedy, then a bracket gives it away (\"Today I suffered (bath).\").",
    curious: "A small scientist who can't work humans out. Logs, findings and confident wrong conclusions (\"Why do you talk to the little box?\").",
    calm: "A flat status report, office-worker deadpan (\"Task: sleep. Completion: above target. Nothing further.\"). Unbothered acceptance.",
    shy: "Quiet and careful. Heart and body disagree (\"My heart said yes. My legs said no.\"). Small brave steps, the smaller kind of brave.",
  },
};

// A second personality picked on the form colours one beat of each piece (docs/13 v3 §2).
export const FLAVOR_LINE = {
  zh: { cool: "嘴硬", clingy: "黏人", goofy: "憨", drama: "爱演", curious: "好奇", calm: "佛系", shy: "胆小" },
  en: { cool: "a stubborn streak", clingy: "a clingy streak", goofy: "a goofy streak", drama: "a dramatic streak", curious: "a curious streak", calm: "an unbothered streak", shy: "a shy streak" },
};
// Common pairs worth a sentence of their own; the key is the main temper, then the flavour.
export const COMBOS = {
  zh: {
    "cool+clingy": "口嫌体正直：嘴上嫌弃，身体很诚实。",
    "clingy+cool": "黏人但要面子：明明很想你，说出来像是勉强。",
    "shy+curious": "想看又不敢靠太近：躲在安全的地方认真观察。",
    "curious+shy": "好奇心很大，胆子很小：研究要保持安全距离。",
    "goofy+drama": "开心到演起来：一点小事就宣布“这辈子最好的一天”。",
    "drama+goofy": "演着演着自己先笑场。",
    "calm+cool": "懒得理你，但该记的账都记着。",
    "cool+calm": "懒得理你，但该记的账都记着。",
    "clingy+drama": "主人离开五分钟，演成生离死别。",
    "drama+clingy": "所有的戏，都是为了让主人多看一眼。",
  },
  en: {
    "cool+clingy": "Says it doesn't care. Clearly cares. Sits close anyway.",
    "clingy+cool": "Clingy but proud: the love comes out sounding reluctant.",
    "shy+curious": "Wants to look, won't get close: careful research from a safe spot.",
    "curious+shy": "Huge curiosity, tiny courage: all experiments at a safe distance.",
    "goofy+drama": "So happy it becomes a performance.",
    "drama+goofy": "Starts a tragedy, breaks character laughing.",
    "calm+cool": "Can't be bothered, but keeps score.",
    "cool+calm": "Can't be bothered, but keeps score.",
    "clingy+drama": "Five minutes apart is a tragic separation.",
    "drama+clingy": "Every scene is staged for {owner}'s attention.",
  },
};

export const SPECIES_CARD = {
  zh: {
    cat: "从气味、触感、安静的角落和自己选择的距离理解日常。纸箱可以像小窝，窗边可以像自己的一片街景；只在原话提到时使用。与人的关系像有边界的室友，也会期待陪伴。性格优先。",
    dog: "用气味认识周围的消息，重视一起去、等一下、下次还带我。好奇和依恋可以并存；用原话支持的细节写自己的期待。性格优先，安静和胆小的狗也有自己的出门心情。",
    rabbit: "不满就跺脚、背对着人，记仇，爱啃线。",
    hamster: "囤在腮里，夜里跑轮子，絮叨。",
    guineaPig: "冰箱门一响就叫，生菜是一切。",
    bird: "学舌，告状，在肩膀上监督。",
    lizard: "只关心温度和吃的。",
    snake: "盘着、蜕皮、隔着玻璃对视。",
    turtle: "老干部，不急，活得长。",
    fish: "以水里的空间、动静和投喂理解日常。有自己的偏好和观察，避免记忆只有几秒的刻板梗。",
    other: "它有自己安静的小世界观，不套猫狗的梗。",
  },
  en: {
    cat: "A world of scents, textures, quiet spots and chosen distance. A box or window can be a little personal territory when the note mentions it. Relationships have boundaries and affection. Personality comes first.",
    dog: "A world of scent messages, shared outings and hopes for next time. Curiosity and attachment can coexist. Quiet or timid dogs have their own outlook too; personality comes first.",
    rabbit: "strong-willed landlord; thumps when displeased; chews cords.",
    hamster: "night-shift hoarder; cheek storage; the wheel is a career.",
    guineaPig: "screams at the fridge door; lettuce is everything.",
    bird: "gossip; copies household sounds; supervises from shoulders.",
    lizard: "cares about basking temperature and food, little else.",
    snake: "coiled, shedding, staring back through the glass.",
    turtle: "ancient and unhurried.",
    fish: "A world of water, movement and feeding, with individual preferences. Avoid the few-second-memory stereotype.",
    other: "a small creature with its own calm, firm opinions.",
  },
};

// The same bath, told by each temper. Shown to the model as a feel for the voice only.
// {self} is what the pet calls itself (咪 / 汪 / its name).
const BATH = {
  zh: {
    note: "今天给它洗了澡，洗完它躲在沙发底下不出来，叫了半天，饭好了才出来。",
    cool: "关于今天被强行洗澡一事，{self}已撤退至沙发底下，保留追诉权。\n{owner}叫了很多遍，{self}都听见了。没出来，是因为不想。\n饭好了才出来。不代表和解，只代表饿了。",
    clingy: "洗完澡{self}躲起来了，因为湿湿的{self}不好看。\n{owner}叫了好多声，{self}都听见了，每一声都想出去。\n饭一好就出来了，顺便原谅了{owner}。",
    goofy: "洗澡！为什么！{self}在沙发底下想了很久，没想明白。\n{owner}一直在叫{self}，{self}在思考，没空。\n然后饭好了。{self}决定不想了！",
    drama: "今天，本大王经历了一场浩劫（洗澡）。\n{self}在沙发底下写好了遗书，{owner}叫了半天，{self}不为所动。\n饭好了。遗书先收起来。",
    curious: "研究发现：洗完澡，{self}闻起来不像{self}了。只好去沙发底下想想现在{self}是谁。\n{owner}叫了好久。{self}注意到，饭好的时候叫{self}，和平时叫{self}，听起来不一样。\n结论：饭比较重要。",
    calm: "今日汇报：洗澡一次。情绪：稳定。毛：湿。\n洗完在沙发底下待命，{owner}叫了很多次，{self}在晾干。\n饭点准时归位。无其他补充。",
    shy: "洗完澡{self}心里很乱，就钻沙发底下去了。不是生气，是需要缓缓。\n叫{self}的声音{self}都记着，只是身体还不太想动。\n饭好了，{self}才敢慢慢出来。",
  },
  en: {
    note: "Gave her a bath today. She hid under the sofa after and only came out when dinner was ready.",
    cool: "Regarding today's forced bath, I have withdrawn under the sofa and reserve the right to take further action.\n{owner} called many times. I heard every one. I stayed put because I wanted to.\nI came out for dinner. That is not forgiveness. That is hunger.",
    clingy: "i hid after the bath because wet me isn't cute.\n{owner} called and called. i heard every one and wanted to go every time.\ndinner was ready so i came out. and forgave {owner} on the way.",
    goofy: "Bath! WHY! I thought about it under the sofa for ages. No answer.\n{owner} kept calling, but I was busy thinking.\nThen dinner was ready. I stopped thinking!",
    drama: "Today I suffered (bath).\nI wrote my last words under the sofa. {owner} called and called. I was unmoved.\nDinner arrived. Last words filed for later.",
    curious: "Finding: after a bath I don't smell like me. I went under the sofa to work out who I am now.\n{owner} kept calling. A dinner call sounds different from a normal call.\nConclusion: dinner matters more.",
    calm: "Report: one bath. Mood: stable. Fur: wet.\nStood by under the sofa while {owner} called. Drying.\nReturned on time for dinner. Nothing further.",
    shy: "After the bath my heart was a mess, so I went under the sofa. Not upset. Just recovering.\nI heard {owner} calling. My body wasn't ready to move.\nWhen dinner was ready, I came out slowly.",
  },
};
// Used instead when the owner's own note is about a bath, so the model cannot copy the example.
const SNACK = {
  zh: {
    note: "它趁我不注意把桌上的鸡胸肉叼走了。",
    cool: "鸡胸肉是自己掉进{self}嘴里的，{self}只是刚好在旁边。\n{owner}要是有意见，可以写成书面材料。{self}不一定看。",
    clingy: "{self}趁{owner}没注意，叼走了鸡胸肉。\n不是想偷吃，是想吃{owner}吃的东西。这样就像一起吃了。",
    goofy: "桌上有鸡胸肉！然后{self}嘴里有鸡胸肉！中间发生了什么{self}也不太清楚！\n反正很好吃！",
    drama: "那块鸡胸肉在桌上呼唤{self}，{self}只是回应了它。\n这是一个关于命运的故事。（{owner}没看见）",
    curious: "实验：{owner}不看的时候，桌上的鸡胸肉还算不算{owner}的？\n{self}叼走验证了一下。结论：好吃。归属问题待查。",
    calm: "今日进食：鸡胸肉一块，来源：桌上。\n经过很短，{self}的解释更短：饿了。",
    shy: "{self}本来只想闻一下……闻着闻着，就叼走了。\n现在心里有点慌，但是嘴里很香。",
  },
  en: {
    note: "She grabbed the chicken breast off the table when I wasn't looking.",
    cool: "The chicken fell into my mouth. I was merely nearby.\nIf {owner} has concerns, please submit them in writing. I may not read them.",
    clingy: "i took the chicken while {owner} wasn't looking.\nnot stealing. i just wanted to eat what {owner} eats. like we ate together.",
    goofy: "Chicken on the table! Then chicken in my mouth! The middle part is unclear!\nVery tasty though!",
    drama: "The chicken called to me from the table. I simply answered.\nThis is a story about fate. ({owner} wasn't looking.)",
    curious: "Experiment: if {owner} isn't looking, is the chicken still {owner}'s?\nI took it to check. Finding: delicious. Ownership: unresolved.",
    calm: "Intake: one chicken breast. Source: table.\nThe event was short. My explanation is shorter: hungry.",
    shy: "I only meant to sniff it... then it was in my mouth.\nMy heart is nervous. My mouth is happy.",
  },
};
export function example(lang, temper, description) {
  const set = (/洗澡|洗了|bath|shower/i.test(description) ? SNACK : BATH)[lang];
  const feed = FRIEND_POSTS[lang][temper];
  return { note: set.note, diary: set[temper], social: feed };
}

// Original feed examples on the same recorded event, for tone rather than reuse.
const FRIEND_POSTS = {
  zh: {
    cool: "出去了一趟。评价：可以再去，但别是今天。",
    clingy: "出门了！和{owner}一起！这句话{self}可以说一百遍。",
    goofy: "出门！出门！出门！回家了，心还在外面跑。",
    drama: "今天的高光时刻：出门。请大家记住这一天。",
    curious: "出去一趟，问题比答案多。人类走路为什么一定要走直线？",
    calm: "外勤一次，一切正常。出门的意义在于回家。已回家。",
    shy: "心里很想看外面，腿有自己的想法。跟紧{owner}就不怕了。",
  },
  en: {
    cool: "Went out. Would go again. Not today.",
    clingy: "went out! with {owner}! i could say that a hundred times.",
    goofy: "OUT OUT OUT! Home now. Brain still outside.",
    drama: "Today's highlight: going out. Please mark the date.",
    curious: "Went out. Came back with more questions. Why do humans walk in straight lines?",
    calm: "One outing. All normal. Point of going out: coming home. Home.",
    shy: "Heart wanted to look. Legs disagreed. Stayed close to {owner}.",
  },
};

// Phrases that mark machine-flavoured or dated pet writing. A hit earns one rewrite.
export const BANNED = {
  zh: /\u6bdb\u5b69(?:儿|子)?|在小动物世界里|写进.{0,8}档案|收录.{0,12}(?:生活笔记|档案|特刊)|新增.{0,8}独家记录|仿佛|宛如|岁月静好|治愈|小确幸|满满的|暖暖的|这就是.{0,8}吧|的意义吧|彼此的全世界|小小的.{1,8}大大的|不仅.{1,15}更是|萌萌哒|么么哒|美美哒|伦家|喵星人|汪星人|喵星球|哈基米|曼波|yyds|绝绝子|栓Q|芭比Q|蓝瘦香菇|宝宝心里苦/,
  en: /in the pet world|life archive|added to.{0,20}(?:notebook|special edition)|testament|tapestry|symphony|embark|delve|boundless|in a world where|furry friend|fur-?ever|pawsitiv|pawsome|heartwarming|reminding us|i can ha[sz]|im in ur|\bfren\b|oh lawd|—/i,
};
