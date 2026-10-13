/** Ground the response in explicit actions; other sentences remain wishes or opinions. */
export function eventContext(description: string, owner: string, lang: "zh" | "en"): string | undefined {
  if (/如果|要是|打算|计划|准备|明天|\b(?:if|tomorrow|plan(?:ning)? to)\b/i.test(description)) return undefined;
  const refusal = /不肯走|不愿(?:意)?走|走不动|refused to (?:walk|move)|would(?:n't| not) (?:walk|move)/i.test(description);
  const lying = /趴(?:在|下|到)|躺(?:在|下)|lay down|lying down/i.test(description);
  const halfway = /一半|半路|halfway|half way/i.test(description);
  const carriedHome = /(?:我|主人|妈妈|爸爸|铲屎官)(?:把[^，。！？\n]{1,10})?抱[^，。！？\n]{0,12}回家|被[^，。！？\n]{0,10}抱[^，。！？\n]{0,6}回家|\b(?:I|we|my human) carried (?:him|her|them|it|me) home\b|\b(?:was |got )?carried home\b/i.test(description)
    && !/没(?:有)?[^，。！？\n]{0,6}抱|(?:didn't|did not|wasn't|was not|never) (?:carry|carried)/i.test(description);
  if (refusal && carriedHome) {
    const start = lang === "zh"
      ? `${halfway ? "走到一半，" : ""}${lying ? "我趴下来" : "我停下来"}不肯继续走，剩下的路由${owner}抱我回家。`
      : `${halfway ? "Halfway through the walk, " : "On the walk, "}I ${lying ? "lay down and refused to keep walking" : "refused to keep walking"}, so ${owner} carried me home.`;
    return start + (lang === "zh" ? "下次也想给自己的节奏留点余地。" : " Next time, I'd like room for my own pace too.");
  }
  if (/窗边|窗台|window/i.test(description) && /看|望|watch|look/i.test(description))
    return lang === "zh" ? "窗边望出去的这一会儿，我想让时间慢一点。" : "That time watching from the window deserves a slower clock.";
  if (/睡|sleep|slept|nap/i.test(description) && /毯子|被窝|blanket/i.test(description))
    return lang === "zh" ? "睡在毯子里的这段时间，我想多留一会儿。" : "I'd like a little more time for that sleep in the blanket.";
  if (/闻|嗅|sniff/i.test(description) && /草地|草丛|grass/i.test(description))
    return lang === "zh" ? "草地上的气味，想一条一条慢慢闻。" : "Those scents in the grass deserve time, one sniff at a time.";
  return undefined;
}

/** The pet's answer to an everyday action the owner wrote about, put before its usual reaction. */
export function actionLine(description: string, lang: "zh" | "en"): string | undefined {
  if (/如果|要是|打算|计划|准备|明天|\b(?:if|tomorrow|plan(?:ning)? to)\b/i.test(description)) return undefined;
  return ACTIONS.find(([pattern]) => pattern.test(description))?.[1][lang];
}

// Everyday moments owners write about most (docs/01 8.24): the pet answers the thing that happened,
// then carries on in its own temper. First match wins, so the more specific ones come first.
const ACTIONS: [RegExp, Record<"zh" | "en", string>][] = [
  [/推(?:下|倒|翻|掉)|打翻|打碎|碰(?:掉|倒)|扫(?:下|掉)|弄(?:倒|翻|掉)|摔(?:碎|了)|knock(?:ed|s|ing)? (?:\w+ ){0,4}(?:off|over)|push(?:ed|es|ing)? (?:\w+ ){0,4}off/i,
    { zh: "那个东西是自己从桌边掉下去的，我只是确认了一下重力还在。", en: "It went over the edge on its own. I was only checking that gravity still works." }],
  [/纸箱|箱子|\b(?:box|boxes|cardboard)\b/i,
    { zh: "纸箱一出现，我就知道它是给我的。", en: "The moment a box shows up, I know it's for me." }],
  [/追(?:着|自己的?)?尾巴|chas(?:e|ed|es|ing) (?:its|his|her|their) (?:own )?tail/i,
    { zh: "尾巴一直跟着我，我得查清楚它是谁派来的。", en: "My tail kept following me. I had to find out who sent it." }],
  [/打架|打起来|互咬|抢(?:了|走|食|东西)?|哈气|\b(?:fight|fought|fighting|hiss(?:ed|ing)?|squabbl\w*)\b/i,
    { zh: "这件事双方各有说法，我的那一版比较有道理。", en: "We each have our side of the story. Mine is more convincing." }],
  [/叼(?:走|来|着|回)?|ran off with|(?:stole|took) (?:my|a|the|his|her) (?:sock|slipper|shoe|glove)/i,
    { zh: "叼走的东西我会好好保管，暂时不打算还。", en: "Whatever I carried off is in safe keeping. Giving it back isn't on the agenda yet." }],
  [/(?:抓|挠)(?:了|坏|破|烂)?(?:沙发|椅子|床垫)|scratch(?:ed|es|ing)? (?:up )?(?:the )?(?:sofa|couch|chair)/i,
    { zh: "那一块是我的磨爪区，我只是在做日常维护。", en: "That spot is my claw station. I was doing routine maintenance." }],
  [/键盘|笔记本电脑|\b(?:keyboard|laptop)\b/i,
    { zh: "键盘暖暖的，正适合我上班。", en: "The keyboard was warm. A sensible place to start work." }],
  [/门口(?:等|接)|等(?:我|你|主人|妈妈|爸爸)?回家|在门口(?:等|蹲|趴)|(?:waiting|waited) (?:at|by) the door/i,
    { zh: "一听见门响，我就先到门口了。等人这件事，我做得很认真。", en: "I heard the door and got there first. I take waiting seriously." }],
  [/纸巾|卫生纸|抽纸|拆(?:了)?快递|\b(?:tissues?|toilet paper|unbox\w*)\b/i,
    { zh: "纸巾和快递都得先有人检查一遍，我很负责。", en: "Tissues and parcels need inspecting first. I'm very thorough." }],
  [/钻(?:进)?(?:被窝|被子)|\bunder the (?:covers|duvet|blanket)\b/i,
    { zh: "被窝里很暖，我决定在这里多待一会儿。", en: "It was warm under the covers. I decided to stay a while." }],
];
