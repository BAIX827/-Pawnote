import test from "node:test";
import assert from "node:assert/strict";
import { demoState } from "../src/data/demo";
import { isAppState } from "../src/data/validation";
import { deleteEvent, progress, saveEvent } from "../src/domain/life";
import {
  detectCategory,
  generateStories,
  generationSignature,
  toPetVoice,
} from "../src/domain/story-engine";
import { escapeXML, newsSVG } from "../src/domain/news-card";
import { Pet, newDraft } from "../src/domain/types";
import { MAX_BACKUP_BYTES, parseBackup } from "../src/domain/backup";
import { ageLabel, parseAge, questionnaireTraits, recommendRoute, speciesEmoji, speciesLabel } from "../src/domain/pet-profile";
import { SPECIES } from "../src/domain/types";
import { applyLang, t } from "../src/i18n/core";
import { temperOf } from "../src/domain/temper";
applyLang("zh");
test("新物种和自定义性格可生成、备份，旧猫狗备份保持兼容", () => {
  assert.equal(isAppState(demoState()), true);
  assert.doesNotThrow(() => generateStories({ ...demoState().pet!, personality: "constructor" }, "在休息。", "other"));
  for (const species of SPECIES) {
    const state = demoState();
    state.pet = { ...state.pet!, species, ...(species === "other" ? { speciesName: "蜜袋鼯" } : {}),
      personality: "慢热但亲人，喜欢安静地观察", personalitySource: "custom", ageMonths: 8, routeSource: "manual" };
    const stories = generateStories(state.pet, "今天在自己的角落休息。", "other");
    for (const story of Object.values(stories)) {
      assert.ok(story.text.includes("今天我在自己的角落休息。"));
      assert.ok(!story.text.includes("undefined"));
    }
    assert.ok(stories.news.text.includes("“今天在自己的角落休息。”"));
    if (species !== "cat") assert.ok(!stories.diary.text.includes("本喵"));
    if (species !== "dog") assert.ok(!stories.diary.text.includes("本汪"));
    assert.ok(speciesEmoji(state.pet));
    if (species === "other") assert.equal(speciesLabel(state.pet), "蜜袋鼯");
    if (species === "lizard") assert.equal(speciesLabel(state.pet), "蜥蜴");
    if (species === "rabbit") assert.equal(speciesLabel(state.pet), "兔子");
    assert.deepEqual(parseBackup(JSON.stringify(state)), state);
    assert.equal(state.events[0].petSnapshot.species, "cat");
  }
});
test("猫狗年龄推荐守住12个月边界，其他物种和未知年龄由主人选择", () => {
  assert.equal(parseAge("", ""), undefined);
  assert.equal(parseAge("", "8"), 8);
  assert.equal(parseAge("1", "0"), 12);
  assert.equal(parseAge("100", "0"), 1200);
  for (const species of ["cat", "dog"] as const) {
    assert.equal(recommendRoute(species, 0), "campus");
    assert.equal(recommendRoute(species, 11), "campus");
    assert.equal(recommendRoute(species, 12), "work");
    assert.equal(recommendRoute(species), undefined);
    assert.equal(recommendRoute(species, -1), undefined);
  }
  assert.equal(recommendRoute("rabbit", 12), undefined);
  assert.equal(recommendRoute("lizard", 12), undefined);
  assert.equal(ageLabel(14), "1 岁 2 个月");
  for (const [y, m] of [["1", "12"], ["-1", "0"], ["1.5", "0"], ["100", "1"], ["0", "x"]])
    assert.throws(() => parseAge(y, m));
  const state = demoState();
  state.pet = { ...state.pet!, ageMonths: 2, route: "work", routeSource: "manual" };
  assert.equal(isAppState(state), true);
  state.pet.routeSource = "age";
  assert.equal(isAppState(state), false);
  state.pet.route = "campus";
  assert.equal(isAppState(state), true);
});
test("问卷按已有观察汇总，缺答和观察不足不生成，回答与历史快照可保存", () => {
  const answers = [0, 0, 0, 2, 2];
  assert.deepEqual(questionnaireTraits(answers), ["活泼", "好奇", "亲人"]);
  assert.throws(() => questionnaireTraits([0, 0]));
  assert.throws(() => questionnaireTraits([0, 0, -1, 3, 3]));
  assert.throws(() => questionnaireTraits([3, 3, 3, 0, 0]));
  assert.ok(questionnaireTraits([0, 0, 0, 3, 3]).length > 0);
  const state = demoState();
  state.pet = { ...state.pet!, personality: questionnaireTraits(answers).join(" · "),
    personalitySource: "questionnaire", questionnaire: { version: 1, answers } };
  const next = saveEvent(state, { ...state.events[0], id: "quiz-event", petSnapshot: { ...state.pet },
    stories: generateStories(state.pet, "观察窗边的新玩具。", "other") });
  assert.deepEqual(parseBackup(JSON.stringify(next)).events[0].petSnapshot.questionnaire?.answers, answers);
  const signature = generationSignature(state.pet, "观察窗边的新玩具。", "other");
  assert.notEqual(signature, generationSignature({ ...state.pet, ageMonths: 8 }, "观察窗边的新玩具。", "other"));
  state.pet.questionnaire!.answers = [9, 0, 0, 0, 0];
  assert.equal(isAppState(state), false);
  assert.throws(() => parseBackup(JSON.stringify({ ...state, pet: { ...state.pet, species: "unknown" } })));
});
test("备份往返保留图片、私密状态、历史人设和草稿", () => {
  const state = demoState();
  state.pet!.avatar = "data:image/jpeg;base64,YQ==";
  state.events[0].photo = "data:image/jpeg;base64,Yg==";
  state.events[0].published = false;
  state.pet!.route = "campus";
  state.draft = { ...newDraft(), description: "还没写完的小事", photo: state.events[0].photo };
  const parsed = parseBackup("\uFEFF" + JSON.stringify(state));
  assert.deepEqual(parsed, state);
  assert.equal(parsed.events[0].petSnapshot.route, "work");
  assert.equal(progress(parsed.events).xp, 60);
});
test("导入拦截损坏、超大文件、重复事件与危险图片地址", () => {
  const state = demoState();
  assert.throws(() => parseBackup("{broken"));
  assert.throws(() => parseBackup(" ".repeat(MAX_BACKUP_BYTES + 1)));
  assert.throws(() => parseBackup(JSON.stringify({ ...state, schemaVersion: 3 })));
  assert.throws(() => parseBackup(JSON.stringify({ ...state, events: [...state.events, state.events[0]] })));
  state.events[0].photo = "https://untrusted.example/photo";
  assert.throws(() => parseBackup(JSON.stringify(state)));
});
test("同一事件保存和发布重试只获得一次经验", () => {
  const s = demoState();
  let result = saveEvent(s, s.events[0]);
  result = saveEvent(result, { ...s.events[0], published: true });
  assert.equal(result.events.length, 3);
  assert.equal(progress(result.events).xp, 60);
});
test("删除记录会移除全部衍生内容并回滚经验", () => {
  const s = demoState(),
    next = deleteEvent(s, s.events[0].id);
  assert.equal(next.events.length, 2);
  assert.equal(
    next.events.some((e) => e.id === s.events[0].id),
    false,
  );
  assert.equal(progress(next.events).xp, 40);
  assert.deepEqual(deleteEvent(next, "missing"), next);
});
test("等级在100 XP边界升级，去重统计", () => {
  const s = demoState();
  assert.equal(progress([]).level, 1);
  const events = Array.from({ length: 5 }, (_, i) => ({
    ...s.events[0],
    id: String(i),
  }));
  assert.deepEqual(progress(events), {
    xp: 100,
    level: 2,
    current: 0,
    toNext: 100,
  });
  assert.equal(progress([...events, events[0]]).xp, 100);
});
test("主人视角改写为宠物第一人称，并从原话猜出标签", () => {
  const cat = demoState().pet!;
  assert.equal(toPetVoice(cat, "今天把我的水杯推下去了，还一脸无辜").text,
    "今天我把铲屎官的水杯推下去了，还问心无愧。");
  const snack = toPetVoice(cat, "趁我转身的时候，它偷吃了一块小鱼干。");
  assert.equal(snack.text, "趁铲屎官转身的时候，我悄悄品鉴了一块小鱼干。");
  assert.equal(snack.spin, "偷吃");
  assert.equal(toPetVoice(cat, "橘总又把花瓶打碎了，我气死了！").text, "我又把花瓶打碎了，铲屎官气死了！");
  assert.equal(toPetVoice(cat, "我们家猫咪和其他小猫玩了一会儿").text, "我和其他小猫玩了一会儿。");
  const dog: Pet = { ...cat, name: "旺财", species: "dog" };
  assert.equal(toPetVoice(dog, "我带他去公园玩，我们都很开心").text, "主人带我去公园玩，我和主人都很开心。");
  assert.match(generateStories(cat, "趁我转身的时候，它偷吃了一块小鱼干。", "snack").diary.text, /管这叫“偷吃”/);
  const mine: Pet = { ...cat, ownerTitle: "妈妈" };
  assert.equal(toPetVoice(mine, "我给它买了新玩具").text, "妈妈给我买了新玩具。");
  assert.notEqual(generationSignature(cat, "x", "other"), generationSignature(mine, "x", "other"));
  assert.equal(isAppState({ ...demoState(), pet: mine, events: [] }), true);
  assert.equal(isAppState({ ...demoState(), pet: { ...cat, ownerTitle: "很".repeat(11) }, events: [] }), false);
  assert.equal(detectCategory("今天把我的水杯推下去了"), "chaos");
  assert.equal(detectCategory("给它洗澡洗了一小时"), "bath");
  assert.equal(detectCategory("在窗边睡了一下午"), "sleep");
  assert.equal(detectCategory("偷吃了小鱼干"), "snack");
  assert.equal(detectCategory("带它去公园"), "walk");
  assert.equal(detectCategory("看了一会儿雨"), "other");
  assert.ok(generateStories(cat, "我".repeat(500), "other").news.text.length <= 2000);
});
test("英文界面下词条、称号与本机故事使用英文，未收录的文字原样显示", () => {
  applyLang("en");
  try {
    assert.equal(t("街区"), "Town");
    assert.equal(t("全部 {n}", { n: 3 }), "All 3");
    assert.equal(t("主人自己写的话"), "主人自己写的话");
    const pet = demoState().pet!;
    const stories = generateStories(pet, "He stole a fish.", "snack");
    for (const story of Object.values(stories)) {
      assert.ok(story.text.includes("He stole a fish."));
      assert.ok(!/[\u4e00-\u9fff]/.test(story.title + story.text));
    }
    assert.match(stories.diary.text, /^The staff wrote/);
    assert.match(stories.diary.text, /left unattended/);
    assert.match(generateStories({ ...pet, species: "dog", personality: "亲人" }, "We went out.", "walk").diary.text, /^My human wrote[\s\S]*i kept looking back/);
    assert.equal(isAppState(demoState()), true);
  } finally {
    applyLang("zh");
  }
});
test("同一件事按性格写出不同口吻，未知性格按物种取默认", () => {
  const cat = demoState().pet!;
  const said = (personality: string, species: Pet["species"] = "cat") =>
    generateStories({ ...cat, species, personality }, "它把杯子推下去了。", "chaos").diary.text;
  assert.match(said("傲娇"), /碰巧伸了爪子/);
  assert.match(said("亲人"), /不是故意的/);
  assert.match(said("活泼"), /它先动的手/);
  assert.match(said("稳重"), /地心引力/);
  assert.match(said("敏感"), /吓了一跳/);
  assert.match(said("慢热但亲人，喜欢安静地观察"), /吓了一跳/);
  assert.match(said("说不清", "dog"), /不是故意的/);
  assert.match(said("说不清", "turtle"), /地心引力/);
  assert.equal(temperOf({ ...cat, personality: "活泼 · 好奇 · 亲人" }), "hyper");
  assert.match(generateStories({ ...cat, ownerTitle: "妈妈", personality: "亲人" }, "带它散步。", "walk").diary.text, /妈妈都在/);
});
test("四种风格保留真实描述，人设变化使生成签名失效", () => {
  const s = demoState(),
    p = s.pet!;
  const description = "只在窗边看了一会儿雨。";
  const stories = generateStories(p, description, "other");
  for (const story of Object.values(stories))
    assert.ok(story.text.includes("我只在窗边看了一会儿雨。"));
  assert.ok(stories.news.text.includes(description));
  const school: Pet = { ...p, route: "campus", role: "睡眠研究班" };
  assert.match(
    generateStories(school, description, "other").life.title,
    /校园/,
  );
  assert.notEqual(
    generationSignature(p, description, "other"),
    generationSignature(school, description, "other"),
  );
  assert.equal(s.events[0].petSnapshot.route, "work");
});
test("保存拦截空白描述、其他宠物和空白故事", () => {
  const s = demoState();
  assert.throws(() => saveEvent(s, { ...s.events[0], description: " " }));
  assert.throws(() =>
    saveEvent(s, { ...s.events[0], petSnapshot: { ...s.pet!, id: "other" } }),
  );
  assert.throws(() =>
    saveEvent(s, {
      ...s.events[0],
      stories: {
        ...s.events[0].stories,
        diary: { ...s.events[0].stories.diary, text: "" },
      },
    }),
  );
});
test("持久化schema识别损坏、未知版本和重复事件", () => {
  const s = demoState();
  assert.equal(isAppState(JSON.parse(JSON.stringify(s))), true);
  assert.equal(isAppState({ ...s, schemaVersion: 9 }), false);
  assert.equal(isAppState({ ...s, events: [{}, ...s.events] }), false);
  assert.equal(isAppState({ ...s, events: [...s.events, s.events[0]] }), false);
  assert.equal(
    isAppState({ ...s, pet: { ...s.pet, avatar: "javascript:alert(1)" } }),
    false,
  );
});
test("新闻导出转义XML且保留标识和完整正文", () => {
  const s = demoState(),
    e = s.events[0];
  e.stories.news.title = '橘总 <测试> & "引用"';
  e.stories.news.text = "一".repeat(1500);
  const svg = newsSVG(e);
  assert.ok(svg.includes("&lt;测试&gt; &amp; &quot;引用&quot;"));
  assert.ok(svg.includes("虚构娱乐报道"));
  assert.ok(svg.includes("模板生成"));
  assert.equal((svg.match(/一/g) || []).length, 1500);
  assert.equal(escapeXML("<>&\"'"), "&lt;&gt;&amp;&quot;&apos;");
});
