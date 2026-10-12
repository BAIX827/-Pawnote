import test from "node:test";
import assert from "node:assert/strict";
import { demoState } from "../src/data/demo";
import { eventDate, eventDay, eventTimestamp, isDay, isPastDay, localDay, dayDistance } from "../src/domain/dates";
import { calendarDays, filterJournal, onThisDay, shiftMonth, memoryLine } from "../src/domain/memories";
import { makeKeepsake, keepsakeHTML } from "../src/domain/keepsake";
import { nextOccasions, occasionForYear, occasionLetter, occasionSVG } from "../src/domain/occasions";
import { saveEvent, progress } from "../src/domain/life";
import { isAppState } from "../src/data/validation";
import { parseBackup } from "../src/domain/backup";
import { monthReport } from "../src/domain/report";
import { firsts, milestones } from "../src/domain/timeline";
import { applyLang } from "../src/i18n/core";
import { LifeEvent, SoundMemory, newDraft } from "../src/domain/types";
applyLang("zh");
const at = (day: string, id = day): LifeEvent => ({ ...demoState().events[0], id, occurredOn: day, createdAt: eventTimestamp(day), published: false });
const audio = "data:audio/wav;base64,UklGRg==";
const sound: SoundMemory = { id: "sound", petId: demoState().pet!.id, title: "小时候的叫声", note: "午后", recordedOn: "2024-10-12", createdAt: "2024-10-12T12:00:00Z", stage: "baby", source: "recording", duration: 2, audio };

test("日期拒绝非法和未来日期，日历天数跨夏令时保持准确", () => {
  assert.equal(isDay("2024-02-29"), true);
  for (const day of ["2023-02-29", "2024-13-01", "2024-04-31", "1969-12-31"]) assert.equal(isDay(day), false);
  assert.equal(isPastDay("2099-01-01"), false);
  assert.throws(() => eventTimestamp("2099-01-01"));
  assert.equal(dayDistance("2026-10-03", "2026-10-05"), 2);
  const event = { ...at("2024-01-01"), createdAt: "2024-01-02T12:00:00Z" };
  assert.equal(eventDay(event), "2024-01-01");
  assert.equal(localDay(eventDate(event)), "2024-01-01");
});

test("编辑旧记录保留身份、创建时间和新草稿，XP不重复，补记按发生日期排序", () => {
  const state = demoState(), old = at("2024-03-01", "old");
  state.events = [old, at("2024-05-01", "new")];
  state.draft = { ...newDraft(), description: "正在写的新日记", occurredOn: "2024-" };
  state.pet = { ...state.pet!, personality: "温柔", route: "campus" };
  const edited = saveEvent(state, { ...old, description: "补上当时在海边散步的事", occurredOn: "2024-04-01", createdAt: eventTimestamp("2024-04-01", old), petSnapshot: state.pet });
  assert.equal(progress(edited.events).xp, 40);
  assert.equal(edited.events[0].id, "new");
  assert.equal(edited.events[1].petSnapshot.personality, old.petSnapshot.personality);
  assert.equal(edited.events[1].savedAt, old.createdAt);
  assert.equal(edited.draft?.description, state.draft.description);
  assert.equal(isAppState(edited), true);
  assert.equal(parseBackup(JSON.stringify(edited)).events[1].occurredOn, "2024-04-01");
  assert.equal(monthReport(edited.events, "2024-04").entries, 1);
  assert.equal(monthReport(edited.events, "2024-03").entries, 0);
  assert.equal(firsts(edited.events)[0].event.id, "old");
  const backfill = saveEvent(edited, at("2023-01-01"));
  assert.equal(backfill.events.at(-1)?.occurredOn, "2023-01-01");
  assert.equal(progress(backfill.events).xp, 60);
});

test("搜索原话和四种表达，月份/日期/分类/照片联合筛选，输入保持原样", () => {
  const beach = { ...at("2024-05-01"), category: "walk" as const, description: "海边散步", photo: "data:image/jpeg;base64,AAAA" };
  const bath = { ...at("2024-06-01"), category: "bath" as const, description: "洗澡", stories: { ...beach.stories, diary: { ...beach.stories.diary, text: "Bath Time" } } };
  const entries = [beach, bath];
  assert.equal(filterJournal(entries, { query: "海边", month: "2024-05", day: "2024-05-01", category: "walk", photosOnly: true })[0].id, beach.id);
  assert.equal(filterJournal(entries, { query: "BATH time", category: "bath" }).length, 1);
  assert.equal(filterJournal(entries, { query: "海边", photosOnly: false, month: "2024-06" }).length, 0);
  assert.equal(entries[0].id, beach.id);
});

test("日历以周一开头，闰月天数、填充和计数正确", () => {
  const days = calendarDays("2024-02", [at("2024-02-29", "a"), at("2024-02-29", "b")]);
  assert.equal(days.length, 35);
  assert.equal(days[0], undefined);
  assert.equal(days[3]?.n, 1);
  assert.equal(days.filter(Boolean).length, 29);
  assert.equal(days.find((d) => d?.n === 29)?.count, 2);
  assert.equal(shiftMonth("2024-12", 1), "2025-01");
  assert.equal(shiftMonth("2024-01", -1), "2023-12");
});

test("那年今天同时包含日记和声音，排除同年、其他日期；难过的记录使用平静旁白", () => {
  const now = new Date(2026, 9, 12);
  const memories = onThisDay([at("2024-10-12"), at("2025-10-12"), at("2026-10-12"), at("2025-10-11")], [sound], now);
  assert.equal(memories.length, 3);
  assert.equal(memories[0].years, 1);
  assert.equal(memories.filter((m) => m.kind === "sound").length, 1);
  const sensitive = { ...at("2025-10-12"), description: "生病了" };
  assert.equal(memoryLine({ kind: "event", event: sensitive, years: 1, day: "2025-10-12" }), "这一天的记录，留在这里。");
  assert.equal(onThisDay([at("2024-02-29")], [], new Date(2026, 1, 28)).length, 0);
});

test("生日和到家纪念日同时保留，闰日按2月28日纪念，计数不受DST影响", () => {
  const pet = { ...demoState().pet!, birthDate: "2020-02-29", homeDate: "2022-02-28" };
  const both = nextOccasions(pet, new Date(2026, 1, 28));
  assert.equal(both.length, 2);
  assert.ok(both.every((o) => o.inDays === 0));
  assert.equal(both[0].years, 6);
  assert.equal(occasionForYear(pet, "birthday", 2024)?.day, "2024-02-29");
  assert.equal(occasionForYear(pet, "birthday", 2019), undefined);
  assert.ok(nextOccasions(pet, new Date(2026, 2, 1)).every((o) => o.day === "2027-02-28"));
  assert.equal(milestones({ ...pet, homeDate: "2026-10-03" }, [], new Date(2026, 9, 5)).homeDay, 3);
});

test("纪念信引用真实记录，离世记录保留纪念页，SVG转义用户文本", () => {
  const state = demoState(); state.pet = { ...state.pet!, birthDate: "2020-02-29" };
  state.events = [{ ...at("2025-02-27"), description: "去了海边 <script>alert(1)</script>" }];
  const occasion = occasionForYear(state.pet, "birthday", 2025)!;
  const letter = occasionLetter(state, occasion);
  assert.ok(letter.paragraphs.some((p) => p.includes(state.events[0].description)));
  assert.ok(!occasionSVG(letter).includes("<script>"));
  state.events = [{ ...at("2025-02-27"), description: "它去世了" }];
  const memorial = occasionLetter(state, occasion);
  assert.equal(memorial.memorial, true);
  assert.equal(memorial.closing, state.pet.name);
});

test("纪念册按选择和年份导出，完整内嵌照片声音，转义文字和拒绝外部媒体", () => {
  const state = demoState(); state.events = [{ ...at("2024-10-12"), photo: "data:image/jpeg;base64,AAAA" }, at("2025-01-01")]; state.sounds = [sound];
  const book = makeKeepsake(state, { title: "<script>回忆</script>", year: "2024", events: state.events.map((e) => e.id), sounds: [sound.id] });
  assert.equal(book.events.length, 1); assert.equal(book.sounds.length, 1); assert.equal(book.days, 1);
  const html = keepsakeHTML(book);
  assert.ok(html.includes(audio)); assert.ok(html.includes("data:image/jpeg;base64,AAAA"));
  assert.ok(!html.includes("<script>回忆</script>")); assert.ok(html.includes("&lt;script&gt;回忆&lt;/script&gt;"));
  assert.ok(html.includes("@media print")); assert.ok(html.includes("window.print()"));
  assert.ok(!keepsakeHTML({ ...book, events: [{ ...book.events[0], photo: 'https://tracking.example/image' }] }).includes('https://tracking.example'));
  assert.throws(() => makeKeepsake(state, { title: "", events: [], sounds: [] }));
  assert.throws(() => makeKeepsake(state, { title: "回忆", events: [], sounds: [] }));
});

test("新日期字段随备份往返，旧版本仍可恢复，半填的草稿不影响存储", () => {
  const old = demoState(); assert.equal(isAppState(old), true);
  const state = { ...old, pet: { ...old.pet!, birthDate: "2024-02-29" }, draft: { ...newDraft(), occurredOn: "2024-" } };
  assert.equal(isAppState(state), true);
  assert.equal(parseBackup(JSON.stringify(state)).pet?.birthDate, "2024-02-29");
  assert.equal(isAppState({ ...state, pet: { ...state.pet, birthDate: "2024-02-30" } }), false);
});

test("新增页面文案均有英文，纪念册和纪念信使用英文标题与日期", async () => {
  const { readFileSync } = await import("node:fs");
  const { t } = await import("../src/i18n/core");
  applyLang("en");
  try {
    const files = ["src/screens/Anniversaries.tsx", "src/screens/Keepsake.tsx", "src/components/DateField.tsx", "src/components/JournalFilters.tsx", "src/components/PastMemories.tsx", "src/components/OccasionPreview.tsx", "src/domain/keepsake.ts", "src/domain/memories.ts"];
    for (const file of files) for (const match of readFileSync(file, "utf8").matchAll(/\bt\("([^"\n]+)"/g)) {
      assert.ok(!/[\u4e00-\u9fff]/.test(t(match[1])), `${file}: ${match[1]}`);
    }
    const state = demoState(); state.pet = { ...state.pet!, name: "Miso", birthDate: "2020-01-01" };
    state.events = [at("2025-01-01")];
    const letter = occasionLetter(state, occasionForYear(state.pet, "birthday", 2025)!, "en");
    assert.equal(letter.title, "Miso's birthday");
    const book = makeKeepsake(state, { title: "Miso's memories", events: state.events.map((e) => e.id), sounds: [] });
    assert.ok(keepsakeHTML(book).includes("Growth keepsake"));
  } finally { applyLang("zh"); }
});
