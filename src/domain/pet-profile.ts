import { Pet, Route, Species } from "./types";

export const SPECIES_INFO: Record<Species, { label: string; emoji: string }> = {
  cat: { label: "猫猫", emoji: "🐈" }, dog: { label: "狗狗", emoji: "🐕" },
  rabbit: { label: "兔子", emoji: "🐇" }, lizard: { label: "蜥蜴", emoji: "🦎" },
  hamster: { label: "仓鼠", emoji: "🐹" }, guineaPig: { label: "豚鼠", emoji: "🐾" },
  bird: { label: "鸟类", emoji: "🐦" }, turtle: { label: "龟类", emoji: "🐢" },
  snake: { label: "蛇类", emoji: "🐍" }, fish: { label: "鱼类", emoji: "🐟" },
  other: { label: "其他宠物", emoji: "🐾" },
};
export const speciesLabel = (pet: Pet) =>
  pet.species === "other" ? pet.speciesName ?? "其他宠物" : SPECIES_INFO[pet.species].label;
export const speciesEmoji = (pet: Pet) => SPECIES_INFO[pet.species].emoji;
export const ageLabel = (months?: number) => months === undefined ? "年龄待补充"
  : months < 12 ? `${months} 个月` : `${Math.floor(months / 12)} 岁${months % 12 ? ` ${months % 12} 个月` : ""}`;

export function parseAge(years: string, months: string): number | undefined {
  if (!years.trim() && !months.trim()) return undefined;
  if ((years.trim() && !/^\d{1,3}$/.test(years.trim())) || (months.trim() && !/^\d{1,2}$/.test(months.trim())))
    throw new Error("年龄请填写整数，月数填写 0–11。");
  const y = Number(years || 0), m = Number(months || 0);
  if (y > 100 || m > 11 || y * 12 + m > 1200) throw new Error("年龄请填写 0–100 岁，月数填写 0–11。");
  return y * 12 + m;
}
// A virtual-life product rule; species maturity is not inferred from this cutoff.
export function recommendRoute(species: Species, ageMonths?: number): Route | undefined {
  if ((species !== "cat" && species !== "dog") || ageMonths === undefined ||
    !Number.isInteger(ageMonths) || ageMonths < 0 || ageMonths > 1200) return undefined;
  return ageMonths < 12 ? "campus" : "work";
}

export const QUESTIONS = [
  { title: "在熟悉且安全的环境里，它通常怎样与你相处？", choices: [
    { label: "常主动靠近、关注我", traits: ["亲人", "温柔"] },
    { label: "更喜欢按自己的节奏相处", traits: ["独立", "有主见"] },
    { label: "先观察，熟悉后才靠近", traits: ["慢热", "稳重"] },
  ] },
  { title: "平时清醒时，它的活动节奏更接近哪一种？", choices: [
    { label: "经常探索，活动比较多", traits: ["活泼", "好奇"] },
    { label: "比较安静，习惯固定位置", traits: ["稳重", "独立"] },
    { label: "动静结合，节奏比较随和", traits: ["随和", "温柔"] },
  ] },
  { title: "面对日常出现的新物品，它通常会怎样？", choices: [
    { label: "主动观察或探索", traits: ["好奇", "活泼"] },
    { label: "保持距离，多看一会儿", traits: ["慢热", "敏感"] },
    { label: "兴趣不大，继续原来的活动", traits: ["稳重", "独立"] },
  ] },
  { title: "根据已有经历，日常环境有变化时它的反应如何？", choices: [
    { label: "较快恢复平常状态", traits: ["随和", "稳重"] },
    { label: "需要较长时间适应", traits: ["敏感", "慢热"] },
    { label: "主动查看发生了什么", traits: ["好奇", "有主见"] },
  ] },
  { title: "它通常怎样表达自己的需求或偏好？", choices: [
    { label: "主动引起我的注意", traits: ["亲人", "有主见"] },
    { label: "安静表达，动作比较轻柔", traits: ["温柔", "稳重"] },
    { label: "动作或表情很丰富", traits: ["戏精", "活泼"] },
  ] },
] as const;

export function questionnaireTraits(answers: number[]): string[] {
  if (answers.length !== QUESTIONS.length || answers.some(a => !Number.isInteger(a) || a < 0 || a > 3))
    throw new Error("请完成每一道观察题，也可以选择暂不确定。");
  if (answers.filter(a => a < 3).length < 3)
    throw new Error("至少需要 3 道明确观察，才能总结性格。也可以直接输入你的描述。");
  const scores = new Map<string, number>();
  QUESTIONS.forEach((q, i) => {
    if (answers[i] === 3) return;
    q.choices[answers[i]].traits.forEach(t => scores.set(t, (scores.get(t) ?? 0) + 1));
  });
  return [...scores].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([trait]) => trait);
}
