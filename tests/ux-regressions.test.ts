import test from "node:test";
import assert from "node:assert/strict";
import { demoState } from "../src/data/demo";
import { applyLang } from "../src/i18n/core";
import { generateStory } from "../src/domain/story-engine";
import { eventContext } from "../src/domain/event-context";
import { soundCopy } from "../src/domain/sound-copy";
import { appraisal, monthReport, reportCard } from "../src/domain/report";
import { SPECIES, STYLES } from "../src/domain/types";
import { wrap } from "../src/domain/news-card";

test("停下散步并被抱回家的细节进入四种回应，中英文与性格切换均保留", () => {
  const pet = { ...demoState().pet!, name: "小黄", species: "dog" as const, ownerTitle: "妈妈" };
  for (const lang of ["zh", "en"] as const) {
    applyLang(lang);
    try {
      for (const fact of [
        "今天晚上带小黄散步，走到一半它趴在地上不肯走，我抱它回家。",
        "Halfway through the walk, she lay down and refused to walk, so I carried her home.",
      ]) for (const personality of ["傲娇", "亲人", "活泼", "戏精", "好奇", "稳重", "慢热"])
        for (const style of STYLES) for (const variant of [0, 1]) {
          const story = generateStory({ ...pet, personality }, fact, "walk", style, variant);
          assert.match(story.text, lang === "zh" ? /走到一半，我趴下来.*妈妈抱我回家/ : /Halfway.*lay down.*妈妈 carried me home/);
          assert.doesNotMatch(story.text, /走在前面的一直是我|led the whole way/i);
          // English quotes the owner only where the context is needed: the post and the news (docs/01 8.25).
          if (style === "news" || (lang === "en" && style === "social")) assert.ok(story.text.includes(fact));
        }
    } finally { applyLang("zh"); }
  }
});

test("普通散步和否定的抱回家描述不会增加抱回家的事件，敏感事件保留克制表达", () => {
  assert.equal(eventContext("今天散步去了。", "妈妈", "zh"), undefined);
  assert.equal(eventContext("它不肯走，我没有抱它回家。", "妈妈", "zh"), undefined);
  assert.equal(eventContext("She refused to walk. I did not carry her home.", "my human", "en"), undefined);
  assert.equal(eventContext("如果明天它趴下不肯走，我抱它回家。", "妈妈", "zh"), undefined);
  const pet = { ...demoState().pet!, name: "小黄" };
  const story = generateStory(pet, "散步走到一半它趴下不肯走，我抱它回家，随后住院了。", "walk", "diary");
  assert.match(story.text, /想慢慢休息/);
  assert.doesNotMatch(story.text, /下次也想/);
  assert.equal(generateStory(pet, "小黄去世了。", "other", "news").text, "小黄去世了。");
});

test("新闻图片换行保留完整文字，常规英文单词保持完整，中英文和长词都能排版", () => {
  const text = "Halfway through the walk, I lay down and refused to keep walking.";
  const lines = wrap(text, 20);
  assert.equal(lines.join(""), text);
  for (const word of text.match(/[a-z]+/gi)!) assert.ok(lines.some((line) => line.includes(word)));
  const mixed = "原话：" + text + "\n" + "长".repeat(1500);
  assert.equal(wrap(mixed, 29).join(""), mixed.replaceAll("\n", ""));
  const longWord = "W".repeat(200);
  assert.ok(wrap(longWord, 29).every((line) => line.length <= 29));
});

test("所有物种的声音说明与空状态双语适配，自定义物种用中性声音", () => {
  for (const lang of ["zh", "en"] as const) {
    applyLang(lang);
    try {
      for (const species of SPECIES) {
        const copy = soundCopy({ species });
        const all = Object.values(copy).join(" ");
        if (species !== "dog") assert.doesNotMatch(all, /汪|狗|bark|woof|puppy/i);
        if (species !== "cat") assert.doesNotMatch(all, /喵|meow|purr/i);
        if (lang === "en") assert.doesNotMatch(all, /[\u4e00-\u9fff]/);
      }
    } finally { applyLang("zh"); }
  }
});

test("一条记录和空月份都不显示等级评价，空类别只保持零计数", () => {
  const state = demoState(), entry = state.events[0];
  for (const lang of ["zh", "en"] as const) {
    applyLang(lang);
    try {
      for (const events of [[], [entry]]) {
        const report = monthReport(events, entry.createdAt.slice(0, 7));
        assert.equal("grade" in report, false);
        assert.ok(reportCard(report).rows.every((row) => !("score" in row)));
        const words = appraisal(state.pet!, report, "妈妈");
        assert.doesNotMatch(words.manager, /缺考|下月多写|进步空间|Absent|room to grow|show up/i);
      }
    } finally { applyLang("zh"); }
  }
});
