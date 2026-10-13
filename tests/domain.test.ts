import test from "node:test";
import assert from "node:assert/strict";
import { demoState } from "../src/data/demo";
import { isAppState } from "../src/data/validation";
import { deleteEvent, newestFirst, progress, saveEvent, savePet } from "../src/domain/life";
import {
  detectCategory,
  generateStory,
  generateStories,
  generationSignature,
  toPetVoice,
} from "../src/domain/story-engine";
import { NEWS_TEMPLATES, escapeXML, isPlainNews, newsSVG } from "../src/domain/news-card";
import { type Category, Pet, SPECIES, emptyState, newDraft } from "../src/domain/types";
import { MAX_BACKUP_BYTES, parseBackup } from "../src/domain/backup";
import { ageLabel, parseAge, questionnaireTraits, recommendRoute, speciesEmoji, speciesLabel } from "../src/domain/pet-profile";
import { applyLang, t } from "../src/i18n/core";
import { appraisal, monthReport, payslip, reportCard, reportMonths } from "../src/domain/report";
import { firsts, isHomeDate, milestones, monthlyPhotos } from "../src/domain/timeline";
import { isLoss, isSensitive, temperOf } from "../src/domain/temper";
import { allReminders, writeMail } from "../src/domain/paw-mail";
import { petIsGone } from "../src/domain/paw-circle";
import { remindersPaused } from "../src/domain/paw-dates";
import { takePawsona } from "../src/domain/pawsona";
import { addDays, dayKey, dayNumber, eventDay, eventTimestamp, monthKey } from "../src/domain/dates";
applyLang("zh");
test("编辑宠物保留它的记录，新建宠物清除上一只的约定、爪格、读信与圈子设置", () => {
  const state = {
    ...demoState(),
    draft: newDraft(),
    pawsona: takePawsona([0, 0, 0, 0, 0, 0, 0, 0]),
    mailRead: "2026-10-05",
    mailReminder: false,
    circle: { hiddenNpcs: ["npc"], removed: ["comment"] },
  };
  const edited = { ...state.pet!, name: "新名字" };
  assert.deepEqual(savePet(state, edited), { ...state, pet: edited, draft: null });
  assert.equal(state.events[0].petSnapshot.name, "橘总");
  const newPet = { ...edited, id: "new-pet" };
  const next = savePet(state, newPet);
  assert.deepEqual(next, { ...emptyState(), pet: newPet });
  assert.equal(isAppState(next), true);
});
test("导入乱序且带时区偏移的记录后，排序、重存和离世判断按实际时间一致", () => {
  const state = demoState();
  // No explicit calendar day, so the order comes from the timestamps alone.
  const older = { ...state.events[0], id: "older", createdAt: "2026-10-06T22:00:00+14:00", occurredOn: undefined };
  const latest = { ...state.events[1], id: "latest", createdAt: "2026-10-05T21:00:00-12:00", occurredOn: undefined, description: "它离世了" };
  state.events = [older, latest];
  const restored = parseBackup(JSON.stringify(state));
  assert.deepEqual(newestFirst(restored.events).map((e) => e.id), ["latest", "older"]);
  assert.deepEqual(restored.events.map((e) => e.id), ["older", "latest"]);
  // Re-saving on the same day keeps the original time, as the record screen does.
  const saved = saveEvent(restored, { ...older, createdAt: eventTimestamp(eventDay(older), older) });
  assert.deepEqual(saved.events.map((e) => e.id), ["latest", "older"]);
  assert.equal(saved.events[1].createdAt, older.createdAt);
  assert.equal(remindersPaused(restored.events), true);
  assert.equal(petIsGone(restored), true);
  assert.equal(writeMail(restored, "week"), undefined);
  assert.deepEqual(allReminders(restored), []);
  assert.equal(firsts(restored.events)[0].event.id, "older");
});
test("本地日期和纪念天数跨月、跨年与夏令时仍按日历计算", () => {
  const previousTZ = process.env.TZ;
  process.env.TZ = "Australia/Melbourne";
  try {
    // The clocks jump forward on 4 October: these midnights are only 23 hours apart.
    const before = new Date(2026, 9, 4), after = addDays(before, 1);
    assert.equal(after.getTime() - before.getTime(), 23 * 60 * 60 * 1000);
    assert.equal(dayNumber(after) - dayNumber(before), 1);
    assert.equal(dayKey("2026-10-03T14:00:00Z"), "2026-10-04");
    assert.equal(dayKey(addDays(new Date(2026, 11, 31), 1)), "2027-01-01");
    assert.equal(monthKey(addDays(new Date(2026, 9, 31), 1)), "2026-11");
    const state = demoState();
    const event = { ...state.events[0], createdAt: before.toISOString() };
    const marks = milestones({ ...state.pet!, homeDate: "2026-10-04" }, [event], after);
    assert.equal(marks.recordingDay, 2);
    assert.equal(marks.homeDay, 2);
  } finally {
    if (previousTZ === undefined) delete process.env.TZ;
    else process.env.TZ = previousTZ;
  }
});
test("新物种和自定义性格可生成、备份，旧猫狗备份保持兼容", () => {
  assert.equal(isAppState(demoState()), true);
  assert.doesNotThrow(() => generateStories({ ...demoState().pet!, personality: "constructor" }, "在休息。", "other"));
  for (const species of SPECIES) {
    const state = demoState();
    state.pet = { ...state.pet!, species, ...(species === "other" ? { speciesName: "蜜袋鼯" } : {}),
      personality: "慢热但亲人，喜欢安静地观察", personalitySource: "custom", ageMonths: 8, routeSource: "manual" };
    const stories = generateStories(state.pet, "今天在自己的角落休息。", "other");
    for (const [style, story] of Object.entries(stories)) {
      if (style !== "news") assert.ok(story.text.includes("今天我在自己的角落休息。"));
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
    "今天我把铲屎官的水杯推下去了，还一脸无辜。");
  const snack = toPetVoice(cat, "趁我转身的时候，它偷吃了一块小鱼干。");
  assert.equal(snack.text, "趁铲屎官转身的时候，我悄悄品鉴了一块小鱼干。");
  assert.equal(snack.spin, "偷吃");
  assert.equal(toPetVoice(cat, "橘总又把花瓶打碎了，我气死了！").text, "我又把花瓶打碎了，铲屎官气死了！");
  assert.equal(toPetVoice(cat, "我们家猫咪和其他小猫玩了一会儿").text, "我和其他小猫玩了一会儿。");
  const dog: Pet = { ...cat, name: "旺财", species: "dog" };
  assert.equal(toPetVoice(dog, "我带他去公园玩，我们都很开心").text, "我的人带我去公园玩，我和我的人都很开心。");
  assert.equal(toPetVoice(dog, "今天带她出去玩了").text, "今天我的人带我出去玩了。");
  assert.equal(toPetVoice(dog, "今天给她洗澡了").text, "今天我的人给我洗澡了。");
  assert.match(generateStories(cat, "趁我转身的时候，它偷吃了一块小鱼干。", "snack").diary.text, /悄悄品鉴/);
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
  assert.equal(detectCategory("今天带她出去玩了"), "walk");
  assert.equal(detectCategory("看了一会儿雨"), "other");
  assert.ok(generateStories(cat, "我".repeat(500), "other").news.text.length <= 2000);
});
test("小报只讲一次原话，回应补充态度，省去报道和归档套话", () => {
  const pet: Pet = { ...demoState().pet!, name: "小黄", species: "dog", personality: "活泼" };
  const fact = "今天带她出去玩了";
  for (const route of ["campus", "work"] as const) {
    for (const variant of [0, 1]) {
      const story = generateStory({ ...pet, route }, fact, detectCategory(fact), "news", variant);
      assert.match(story.title, /小黄.*出门/);
      assert.equal(story.text.split(fact).length - 1, 1);
      assert.match(story.text, /小黄：“.*(?:下一次|下次|明天|外面)/);
      assert.doesNotMatch(story.title + story.text, /本报讯|爆料|当事|随后回应|小动物世界|档案|收录|独家记录|虚构娱乐报道/);
      assert.ok(story.text.length < 120);
    }
    const other = generateStories({ ...pet, route }, "今天看了一会儿雨", "other");
    for (const story of Object.values(other)) assert.doesNotMatch(story.title + story.text, /档案|收录|独家记录/);
    assert.doesNotMatch(other.life.text, /\n2\./);
  }
  assert.match(generateStories({ ...pet, ownerTitle: "妈妈" }, fact, "walk").news.text, /^妈妈说/);
  applyLang("en");
  try {
    const story = generateStories(pet, "Took her out today.", "walk").news;
    assert.match(story.text, /another|tomorrow/);
    assert.doesNotMatch(story.title + story.text, /archive|file|special edition|fictional entertainment|13\/10/i);
  } finally {
    applyLang("zh");
  }
});
test("英文界面下词条、称号与本机故事使用英文，未收录的文字原样显示", () => {
  applyLang("en");
  try {
    assert.equal(t("爪窝"), "Home");
    assert.equal(t("全部 {n}", { n: 3 }), "All 3");
    assert.equal(t("主人自己写的话"), "主人自己写的话");
    const pet = demoState().pet!;
    const stories = generateStories(pet, "He stole a fish.", "snack");
    for (const story of Object.values(stories)) {
      assert.ok(story.text.includes("He stole a fish."));
      assert.ok(!/[\u4e00-\u9fff]/.test(story.title + story.text));
    }
    assert.match(stories.diary.text, /^My human wrote/);
    assert.match(stories.diary.text, /opinions about food/);
    assert.match(generateStories({ ...pet, species: "dog", personality: "亲人" }, "We went out.", "walk").diary.text, /^My human wrote[\s\S]*favourite part/);
    assert.equal(isAppState(demoState()), true);
  } finally {
    applyLang("zh");
  }
});
test("同一件事按性格写出不同口吻，未知性格按物种取默认", () => {
  const cat = demoState().pet!;
  const said = (personality: string, species: Pet["species"] = "cat") =>
    generateStories({ ...cat, species, personality }, "它把杯子推下去了。", "chaos").diary.text;
  assert.equal(new Set(["傲娇", "亲人", "活泼", "戏精", "好奇", "稳重", "敏感"].map(p => said(p))).size, 7);
  assert.match(said("亲人"), /愿意理我/);
  assert.match(said("好奇"), /为什么/);
  assert.match(said("慢热但亲人，喜欢安静地观察"), /慢慢讲/);
  assert.equal(said("说不清", "dog"), said("活泼", "dog"));
  assert.equal(said("说不清", "turtle"), said("稳重", "turtle"));
  assert.equal(temperOf({ ...cat, personality: "活泼 · 好奇 · 亲人" }), "goofy");
  assert.match(generateStories({ ...cat, ownerTitle: "妈妈", personality: "亲人" }, "带它散步。", "walk").diary.text, /跟妈妈一起/);
});
test("难过的事不开玩笑，离别按原话保存，日常小事不误判", () => {
  const cat = demoState().pet!;
  const sick = generateStories(cat, "它偷吃后生病住院了。", "snack");
  for (const story of Object.values(sick)) {
    assert.ok(!/品鉴|管这叫|本报讯|营业|团建/.test(story.title + story.text));
    assert.ok(story.text.includes("偷吃后生病住院了"));
  }
  assert.match(sick.diary.text, /想离铲屎官近一点/);
  const gone = generateStories(cat, "橘总今天去世了。", "other");
  for (const story of Object.values(gone)) assert.equal(story.text, "橘总今天去世了。");
  assert.equal(isSensitive("今天带它走了一圈，它把球丢了，找不到了"), false);
  assert.equal(isSensitive("今天带它去打针"), false);
  assert.equal(isSensitive("She went missing for two hours"), true);
  assert.equal(isLoss("we had to put him down"), true);
  const plain: Pet = { ...cat, personality: "亲人" };
  assert.ok(!generateStories(plain, "它睡了一下午。", "sleep").diary.title.includes("本喵"));
  assert.match(generateStories(cat, "它睡了一下午。", "sleep").life.text, /今日工作日记/);
  assert.doesNotMatch(generateStories(cat, "它睡了一下午。", "sleep").life.text, /备注：|研究已完成/);
});
test("爪友圈按性格和真实细节写心思，两版表达可切换且不补无关事件", () => {
  const pet = demoState().pet!;
  const fact = "今天带她出去玩了";
  for (const lang of ["zh", "en"] as const) {
    applyLang(lang);
    try {
      for (const personality of ["傲娇", "亲人", "活泼", "戏精", "好奇", "稳重", "敏感"]) {
        const p = { ...pet, name: "小黄", species: "dog" as const, personality };
        const description = lang === "zh" ? fact : "Took her out today.";
        const first = generateStory(p, description, "walk", "social", 0);
        const second = generateStory(p, description, "walk", "social", 1);
        assert.notEqual(first.text, second.text);
        assert.doesNotMatch(first.text + second.text, /扔垃圾|楼下多了.*箱子|二十分钟|路过的小孩|seventeen|twenty minutes|a child|taking the bin/i);
        assert.ok(first.text.length <= 2000 && second.text.length <= 2000);
      }
    } finally { applyLang("zh"); }
  }
  const curious = { ...pet, personality: "好奇" };
  assert.match(generateStories(curious, "它在窗边看了一会儿雨", "other").social.text, /窗边/);
  assert.doesNotMatch(generateStories(curious, "它看了一会儿雨", "other").social.text, /窗边/);
  assert.match(generateStories(curious, "出去闻了闻草地", "walk").social.text, /草地上的气味/);
  applyLang("en");
  try {
    assert.equal(t("爪爪镇"), "Pawtown");
    assert.equal(t("爪爪公司"), "Paw Inc.");
    assert.equal(t("欢迎搬进爪爪镇"), "Welcome to Pawtown");
  } finally { applyLang("zh"); }
});
test("月度回顾统计生活片刻与类别，奖励不扣款，难过的记录保留", () => {
  const s = demoState(), base = s.events[0];
  const at = (day: number, category: Category, description = "它玩了一会儿。") =>
    ({ ...base, id: `${category}-${day}-${description.length}`, category, description, createdAt: new Date(2026, 4, day, 12).toISOString() });
  const events = [at(1, "sleep"), at(1, "chaos"), at(2, "chaos"), at(3, "bath"), at(3, "chaos", "它拆家后受伤住院了。"), at(9, "walk"),
    { ...at(1, "snack"), id: "june", createdAt: new Date(2026, 5, 1, 12).toISOString() }];
  const r = monthReport(events, "2026-05");
  assert.deepEqual([r.entries, r.days, r.top, r.counts.chaos], [6, 4, "chaos", 2]);
  const pay = payslip(r);
  assert.equal(pay.total, 60 + 3 + 6 + 5 + 4);
  assert.ok(pay.lines.every((l) => l.amount >= 0));
  const card = reportCard(r);
  assert.equal(card.credits, 12);
  assert.equal(card.rows.find((x) => x.subject === "手工课")!.count, 2);
  assert.equal(card.rows.find((x) => x.subject === "食堂调研")!.count, 0);
  assert.equal(monthReport(events, "2026-04").entries, 0);
  assert.equal(payslip(monthReport([at(1, "chaos")], "2026-05")).total, 13);
  assert.deepEqual(reportMonths(events, new Date(2026, 6, 4)), ["2026-07", "2026-06", "2026-05"]);
  assert.match(appraisal({ ...s.pet!, personality: "亲人", ownerTitle: "妈妈" }, r, "妈妈").self, /妈妈一起/);
  assert.equal(monthReport(Array.from({ length: 20 }, (_, i) => at(i + 1, "sleep")), "2026-05").entries, 20);
});
test("时光机算出每月首张照片、各类第一次和到家天数与周年", () => {
  const s = demoState(), base = s.events[0], photo = "data:image/jpeg;base64,YQ==";
  const at = (y: number, m: number, d: number, category: Category, withPhoto = false) =>
    ({ ...base, id: `${y}-${m}-${d}-${category}`, category, photo: withPhoto ? photo : undefined, createdAt: new Date(y, m - 1, d, 12).toISOString() });
  const events = [at(2026, 3, 9, "walk", true), at(2026, 1, 5, "sleep"), at(2026, 1, 20, "bath", true), at(2026, 1, 25, "bath", true), at(2026, 3, 2, "sleep", true)];
  assert.deepEqual(monthlyPhotos(events).map((p) => [p.month, p.event.id]), [["2026-01", "2026-1-20-bath"], ["2026-03", "2026-3-2-sleep"]]);
  assert.deepEqual(firsts(events).map((f) => [f.kind, f.event.id]),
    [["entry", "2026-1-5-sleep"], ["photo", "2026-1-20-bath"], ["sleep", "2026-1-5-sleep"], ["bath", "2026-1-20-bath"], ["walk", "2026-3-9-walk"]]);
  const now = new Date(2026, 2, 15, 9);
  const home: Pet = { ...s.pet!, homeDate: "2024-03-15" };
  assert.deepEqual(milestones(home, events, now), { recordingDay: 70, homeDay: 731, anniversaryToday: 2, nextAnniversary: { years: 3, inDays: 365 } });
  assert.deepEqual(milestones({ ...home, homeDate: "2026-03-10" }, [], now), { homeDay: 6, nextAnniversary: { years: 1, inDays: 360 } });
  assert.deepEqual(milestones(s.pet!, [], now), {});
  for (const bad of ["2026-02-30", "2026-3-1", "abc", "2026-03-16", undefined]) assert.equal(isHomeDate(bad, now), false);
  assert.equal(isHomeDate("2026-03-15", now), true);
  assert.equal(isAppState({ ...s, pet: { ...s.pet!, homeDate: "2020-01-01" }, events: [] }), true);
  assert.equal(isAppState({ ...s, pet: { ...s.pet!, homeDate: "2999-01-01" }, events: [] }), false);
});
test("四种风格保留真实描述，人设变化使生成签名失效", () => {
  const s = demoState(),
    p = s.pet!;
  const description = "只在窗边看了一会儿雨。";
  const stories = generateStories(p, description, "other");
  for (const [style, story] of Object.entries(stories))
    if (style !== "news") assert.ok(story.text.includes("我只在窗边看了一会儿雨。"));
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
  e.photo = "data:image/jpeg;base64,YQ==";
  e.stories.news.text = "本报讯｜第一句。\n第二段。";
  for (const template of NEWS_TEMPLATES) {
    const out = newsSVG(e, template);
    assert.ok(out.startsWith("<svg") && out.includes("&lt;测试&gt;") && out.includes("虚构娱乐报道") && out.includes(e.photo));
    assert.ok(!out.includes("undefined") && !out.includes("NaN"));
  }
  assert.ok(newsSVG(e, "wanted").includes("通缉") && newsSVG(e, "extra").includes("号外"));
  const sick = { ...e, description: "它生病住院了。" };
  assert.equal(isPlainNews(sick), true);
  for (const template of NEWS_TEMPLATES) {
    const out = newsSVG(sick, template);
    assert.ok(!/通缉|号外|虚构娱乐报道/.test(out) && out.includes("今日记录"));
  }
});
