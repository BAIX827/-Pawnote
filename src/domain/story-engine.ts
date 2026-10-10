import { Category, Pet, Stories, Story, StoryStyle } from "./types";
const incidents: Record<
  Category,
  { diary: string; work: string; campus: string; social: string; title: string }
> = {
  sleep: {
    diary: "今日主要工作：闭眼，翻身，再闭眼。梦里已经把生活安排得明明白白。",
    work: "完成一场沉浸式带薪休息研究。工作可以等，午觉的黄金窗口只有一次。",
    campus: "睡眠研究课已完成实地实践。闭眼认真听讲，也是我的学习方式。",
    social: "忙了一下午，忙着把梦做完。",
    title: "睡眠研究员今日再次延长实验时间",
  },
  snack: {
    diary: "零食路过我的嘴，这是一场命中注定的相遇。",
    work: "作为零食鉴定员，我对产品进行了深入抽样。建议补货，继续研究。",
    campus: "完成食堂风味调研，样本数量仍有提升空间。申请下一轮实践经费。",
    social: "尝一口是礼貌，多尝几口是对食物的尊重。",
    title: "零食抽样研究取得阶段性进展",
  },
  bath: {
    diary: "今日接受泡泡的洗礼。身上的香味，暂时保留意见。",
    work: "参加清洁主题团建，已提出用零食补偿的建议。",
    campus: "卫生实践课顺利结束，建议下次改为阳光浴选修课。",
    social: "今日新造型：香香的，有点委屈的。",
    title: "泡泡主题活动引发当事宠物热议",
  },
  chaos: {
    diary: "今天对家里的摆设提出了一些物理意见。艺术创作，需要一点动静。",
    work: "完成环境结构压力测试。项目经验已增加，预算请另行讨论。",
    campus: "完成空间改造实践作业，期待老师给出有创意的评语。",
    social: "关于今天的现场，我选择把它称为创作过程。",
    title: "毛孩创意改造项目引发家庭关注",
  },
  walk: {
    diary: "今天巡视了我的小小世界。每一阵风都有新消息。",
    work: "外勤巡逻结束，收集了沿途气味信息。申请零食作为差旅补助。",
    campus: "完成户外观察课。气味地图又增加了一页。",
    social: "出门巡逻，顺便让人类运动一下。",
    title: "街区巡逻员完成新一轮外勤任务",
  },
  other: {
    diary: "这件小事，也值得放进我的人生档案。",
    work: "已将这段日常归档为今日工作纪要。",
    campus: "已将这段日常收录为校园生活笔记。",
    social: "我的生活，又添了一条值得记住的动态。",
    title: "毛孩生活档案新增一段独家记录",
  },
};
const voices = {
  傲娇: "本喵自有安排。",
  憨厚: "能和你一起过这一天，我很开心。",
  戏精: "请把聚光灯给我，今日主角已就位！",
};
export const generationSignature = (
  pet: Pet,
  description: string,
  category: Category,
) =>
  JSON.stringify([
    pet.id,
    pet.name,
    pet.species,
    pet.personality,
    pet.route,
    pet.role,
    description.trim(),
    category,
  ]);
export function generateStory(
  pet: Pet,
  description: string,
  category: Category,
  style: StoryStyle,
  variant = 0,
): Story {
  const fact = description.trim();
  if (!fact || fact.length > 500)
    throw new Error("请填写 1–500 字的真实日常。");
  const v = incidents[category];
  const voice =
    pet.species === "dog"
      ? voices[pet.personality].replace("本喵", "本汪")
      : voices[pet.personality];
  const suffix = variant % 2 ? "好了，今天的营业到这里。" : voice;
  const perspective =
    style === "life"
      ? pet.route === "work"
        ? v.work
        : v.campus
      : style === "social"
        ? v.social
        : v.diary;
  const text =
    style === "news"
      ? `本报收到 ${pet.name} 的生活记录：“${fact}”\n\n在毛孩世界里，这被写进了${pet.route === "work" ? "营业" : "校园"}档案。${perspective}\n\n${variant % 2 ? "这件小事，已收录进毛孩人生特刊。" : "以上为基于主人记录的虚构娱乐报道。"}`
      : `今天的真实记录：${fact}\n\n${perspective} ${suffix}`;
  const title =
    style === "news"
      ? `${pet.name}：${v.title}`
      : style === "life"
        ? `${pet.name}的${pet.route === "work" ? "营业报告" : "校园笔记"}`
        : style === "social"
          ? `${pet.name}正在营业`
          : `${pet.name}的今日小事`;
  return { title, text, generator: "template", edited: false };
}
export function generateStories(
  pet: Pet,
  description: string,
  category: Category,
): Stories {
  return {
    diary: generateStory(pet, description, category, "diary"),
    life: generateStory(pet, description, category, "life"),
    social: generateStory(pet, description, category, "social"),
    news: generateStory(pet, description, category, "news"),
  };
}
