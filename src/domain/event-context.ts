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
