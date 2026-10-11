// Voice material for the AI prompts: one temper card, one species card and one short example
// per pet. Source and reasoning: docs/13-宠物语气指南.md (v2), sections 5 and 8.
export const TEMPERS = ["cool", "clingy", "goofy", "drama", "curious", "calm", "shy"];

export const TEMPER_CARD = {
  zh: {
    cool: "有主见，珍惜自己的距离和时间。表面淡淡的，心里会惦记，下次愿意一起的邀请就是一点亲近。少用否认式嘴硬和口号。",
    clingy: "在意{owner}的声音、气味和陪伴。把普通小事当成一起过日子的片段，会直接说想念，也会担心对方愿不愿意理自己。温柔里有自己的小愿望。",
    goofy: "容易开心，对下一次、下一口有很具体的期待。思路会拐弯，认真地给自己的愿望找理由。允许一点兴奋，同时保留细小的惦记。",
    drama: "很在意自己有没有被认真听见，会给小事很大的分量。夸张是它争取关心的方式，热闹之后露一点真正的委屈或期待。避免每篇都演浩劫。",
    curious: "对气味、声音和人类的规矩有自己的问题，想理解，也想听朋友怎么想。让好奇落在原话的细节上，少用实验结论式口号。",
    calm: "喜欢自己的节奏，对小事有安静但明确的偏好。话少，感受有层次，愿意慢慢聊。避免空白的‘今天就这样’或流水账。",
    shy: "会犹豫，也想靠近和被听见。在意熟悉的声音、气味、距离和选择权。进步可以是愿意再试一次，避免强行编勇敢事迹。",
  },
  en: {
    cool: "Values personal space and choice. Quiet affection shows in a willingness to be invited again. Deadpan, with a private wish underneath; avoid constant denials.",
    clingy: "Earnest, often lowercase. Notices the meaning of {owner}'s voice, scent and company. Has little wishes of its own as well as affection.",
    goofy: "Easily delighted, with specific hopes about the next outing or bite. Takes a winding route through sincere thoughts. Excitement leaves room for small feelings.",
    drama: "Wants to be heard and cared about. Exaggeration is a bid for attention; let a genuine little wish show through it. Every event need not be a disaster.",
    curious: "Has questions about smells, sounds and human rules. Uses details from the note and wonders what friends think. Avoid canned experiment conclusions.",
    calm: "Values an unhurried pace and has quiet, specific preferences. Few words with feeling inside them. Avoid empty reports and generic sign-offs.",
    shy: "Hesitant but interested in connection. Values familiar sounds, scents, distance and choice. Another gentle try can be a wish rather than an invented brave deed.",
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
const BATH = {
  zh: {
    note: "今天给它洗了澡，洗完它躲在沙发底下不出来，叫了半天，饭好了才出来。",
    cool: "洗完澡，去了沙发底下。那段时间想留给自己。\n{owner}叫了好久，我听见了。饭好了才出来，毕竟吃饭也是我自己的安排。\n下次洗澡，希望提前跟我商量。",
    clingy: "洗完躲在沙发底下，心里有点委屈。\n{owner}一直叫我。我想出去，又想让{owner}再温柔一点。等到饭好了，才出来。\n想吃饭，也想让{owner}知道，我还需要一点安慰。",
    goofy: "洗完澡就去沙发底下了。{owner}叫了好久，我还想在里面待着。\n后来饭好了，我出来了。心里有点想笑，吃饭的安排比洗澡好理解多了。\n下次最好先跟我聊聊饭。",
    drama: "洗完澡，我去了沙发底下。想给自己的委屈留一点地方。\n{owner}叫了好久，我还在等一个更合心意的理由。饭好了，我出来了。\n吃饭可以开始，关于安慰的讨论也请继续。",
    curious: "洗完待在沙发底下，{owner}叫了好久。\n我想知道，为什么平时叫我和饭好了叫我，心里的感觉会差这么多。饭好了，我就出来了。\n这个问题想慢慢琢磨。最好有下一顿陪着想。",
    calm: "洗完澡，在沙发底下待着。{owner}叫了很久，我想按自己的节奏来。\n饭好了就出来了。休息和吃饭，各有各的时间。\n下次也想给自己留一点空闲。",
    shy: "洗完就躲进了沙发底下。那时候想先跟外面留一点距离。\n{owner}叫了好久。等饭好了，我才出来。心里还是想慢一点。\n下次如果能留更多时间给我准备，我可能会更放心。",
  },
  en: {
    note: "Gave her a bath today. She hid under the sofa after and only came out when dinner was ready.",
    cool: "After the bath, I went under the sofa. That time belonged to me.\n{owner} called for ages. I heard. I came out when dinner was ready; eating also belongs on my schedule.\nI'd like consultation before the next bath.",
    clingy: "i hid under the sofa after the bath. a little hurt in my feelings.\n{owner} kept calling. i wanted to come out, and wanted a softer invitation too. i came out when dinner was ready.\nfood sounds good. some reassurance would sound good too.",
    goofy: "Bath done. Under the sofa I went. {owner} called for ages, but I still wanted that space.\nDinner was ready, so I came out. Meals make more sense to me than baths.\nNext time, let's discuss dinner first.",
    drama: "After the bath I hid under the sofa. My feelings wanted a little room.\n{owner} called for ages. I was waiting for an invitation that suited me. Dinner arrived, and I came out.\nThe meal may begin. Discussions about comfort should continue.",
    curious: "After the bath I stayed under the sofa while {owner} kept calling.\nWhy does a call feel different when dinner is ready? I came out for that one.\nI'd like time to consider this. Another meal could help.",
    calm: "After the bath, some time under the sofa. {owner} called for a while. I wanted my own pace.\nDinner was ready, and I came out. Rest and meals each have their time.\nI'd like room for both next time.",
    shy: "I hid under the sofa after the bath. I wanted some distance from outside.\n{owner} called for ages. I came out when dinner was ready, still wanting to take things slowly.\nMore time to get ready might help next time.",
  },
};
// Used instead when the owner's own note is about a bath, so the model cannot copy the example.
const SNACK = {
  zh: {
    note: "它趁我不注意把桌上的鸡胸肉叼走了。",
    cool: "趁{owner}没留意，把桌上的鸡胸肉叼走了。\n我知道{owner}可能有意见。关于桌上的东西归谁，也许我们该有一次正式讨论。我的意见想先说。",
    clingy: "趁{owner}没注意，叼走了鸡胸肉。\n想要吃的，也在意{owner}会怎么想。希望这件事聊完了，还愿意好好叫我的名字。",
    goofy: "桌上的鸡胸肉，我趁{owner}没注意叼走了。\n有些愿望来得很快，想清楚规则要慢一点。我想跟{owner}商量，下次有没有可以直接给我的那份。",
    drama: "趁{owner}没注意，叼走了桌上的鸡胸肉。\n这件事在{owner}那里可能只有一句话，在我心里有很长一段期待。我希望讨论规则的时候，也给期待留个位置。",
    curious: "趁{owner}没注意，把鸡胸肉从桌上叼走了。\n桌上的东西为什么跟我的那份有不同的规矩？我想弄明白。要是{owner}能讲清楚，下次也许能少一个问号。",
    calm: "桌上的鸡胸肉，我趁{owner}没注意叼走了。\n这件事的经过很短。关于哪份可以拿，我想慢慢听{owner}讲清楚。",
    shy: "趁{owner}没注意，叼走了桌上的鸡胸肉。\n现在想起来，还有一点犹豫。希望{owner}愿意听听我，也希望下次能知道，哪一份是留给我的。",
  },
  en: {
    note: "She grabbed the chicken breast off the table when I wasn't looking.",
    cool: "I grabbed the chicken from the table while {owner} wasn't looking.\n{owner} may have opinions. Perhaps ownership of table food needs a proper discussion. I'd like the first speaking slot.",
    clingy: "i took the chicken while {owner} wasn't looking.\ni wanted it. i also care what {owner} thinks. when we talk about this, i'd like my name said gently.",
    goofy: "I grabbed the chicken while {owner} wasn't looking.\nA wish arrives quickly. Understanding the rules takes longer. Could the next serving have a part that is already mine?",
    drama: "I grabbed the chicken from the table while {owner} wasn't looking.\nA short event in {owner}'s account. A much larger hope in mine. Please leave room for that in any discussion of rules.",
    curious: "I took the chicken while {owner} wasn't looking.\nWhy do table things have different rules from my portion? I'd like an explanation. That could leave one fewer question next time.",
    calm: "I took the chicken from the table while {owner} wasn't looking.\nA short account. I'd like time to hear which serving is mine to take.",
    shy: "I grabbed the chicken while {owner} wasn't looking.\nThinking about it leaves a little hesitation. I'd like a gentle conversation about which part is meant for me next time.",
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
    cool: "今天出去玩了。下次还可以邀请我，跟谁去我倒是有要求。",
    clingy: "今天跟{owner}一起出去玩。好玩的事情很多，最想说的还是‘一起’。",
    goofy: "今天出去玩了，心里还没玩够。明天的名额，我想先占上！",
    drama: "今天出去玩了。我希望下次安排得再隆重一点，至少先问问我的意见。",
    curious: "出去玩的时候，总想多弄明白一点。大家平时最留意什么？",
    calm: "今天出去玩了。下次还想慢一点，给小事多留些时间。",
    shy: "出去玩这件事，还想慢慢试试。下次也想让{owner}陪着。",
  },
  en: {
    cool: "Went out today. Another invitation would be considered. I do have opinions about the company.",
    clingy: "went out with {owner}. plenty to like. the together part is what i want to tell you about.",
    goofy: "Went out. My mind is still playing. I'd like to save a spot for tomorrow!",
    drama: "Went out today. Next time I'd appreciate being consulted on the arrangements.",
    curious: "An outing makes me want to know more. What do you all tend to notice?",
    calm: "Went out today. A little more time for little things would suit me next time.",
    shy: "i'd like another gentle try at going out. with {owner} along again.",
  },
};

// Phrases that mark machine-flavoured or dated pet writing. A hit earns one rewrite.
export const BANNED = {
  zh: /\u6bdb\u5b69(?:儿|子)?|在小动物世界里|写进.{0,8}档案|收录.{0,12}(?:生活笔记|档案|特刊)|新增.{0,8}独家记录|仿佛|宛如|岁月静好|治愈|小确幸|满满的|暖暖的|这就是.{0,8}吧|的意义吧|彼此的全世界|小小的.{1,8}大大的|不仅.{1,15}更是|萌萌哒|么么哒|美美哒|伦家|喵星人|汪星人|喵星球|哈基米|曼波|yyds|绝绝子|栓Q|芭比Q|蓝瘦香菇|宝宝心里苦/,
  en: /in the pet world|life archive|added to.{0,20}(?:notebook|special edition)|testament|tapestry|symphony|embark|delve|boundless|in a world where|furry friend|fur-?ever|pawsitiv|pawsome|heartwarming|reminding us|i can ha[sz]|im in ur|\bfren\b|oh lawd|—/i,
};
