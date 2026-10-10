import test from "node:test";
import assert from "node:assert/strict";
import { demoState } from "../src/data/demo";
import { isAppState } from "../src/data/validation";
import { deleteEvent, progress, saveEvent } from "../src/domain/life";
import {
  generateStories,
  generationSignature,
} from "../src/domain/story-engine";
import { escapeXML, newsSVG } from "../src/domain/news-card";
import { Pet, newDraft } from "../src/domain/types";
import { MAX_BACKUP_BYTES, parseBackup } from "../src/domain/backup";
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
test("四种风格保留真实描述，人设变化使生成签名失效", () => {
  const s = demoState(),
    p = s.pet!;
  const description = "只在窗边看了一会儿雨。";
  const stories = generateStories(p, description, "other");
  for (const story of Object.values(stories))
    assert.ok(story.text.includes(description));
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
