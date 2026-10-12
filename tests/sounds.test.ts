import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { demoState } from "../src/data/demo";
import { isAppState } from "../src/data/validation";
import { parseBackup } from "../src/domain/backup";
import { SOUND_STAGES } from "../src/domain/types";
import { addSound, isSoundDay, localDay, soundAge, soundRange, stageForAge, validSoundAudio, MAX_SOUND_TOTAL } from "../src/domain/sounds";
import { applyLang, t } from "../src/i18n/core";

applyLang("zh");
const audio = "data:audio/wav;base64,UklGRg==";
const input = () => ({ audio, duration: 2, source: "recording" as const, title: "门铃汪汪", note: "听到了门铃", recordedOn: "2026-01-01", ageMonths: 4, stage: "baby" as const });
test("声音与旧备份兼容，完整音频、历史月龄和手选阶段保留", () => {
  const old = demoState();
  assert.equal(isAppState(old), true);
  const state = addSound(old, input());
  assert.equal(isAppState(state), true);
  const restored = parseBackup(JSON.stringify(state));
  assert.deepEqual(restored.sounds, state.sounds);
  const older = state.sounds![0];
  state.pet!.ageMonths = 24;
  assert.equal(older.ageMonths, 4);
  assert.equal(older.stage, "baby");
  assert.equal(addSound(state, { ...input(), source: "video", stage: "senior" }).sounds![1].source, "video");
});
test("历史月龄随记录日期计算，档案缺少年龄基准时允许留空", () => {
  const pet = { ...demoState().pet!, ageMonths: 8, ageRecordedAt: "2026-10-12T00:00:00Z" };
  assert.equal(soundAge(pet, "2026-10-12"), 8);
  assert.equal(soundAge(pet, "2026-07-12"), 5);
  assert.equal(soundAge(pet, "2026-01-01"), undefined);
  assert.equal(soundAge({ ...pet, ageRecordedAt: undefined }, "2020-01-01"), undefined);
  assert.deepEqual([undefined, 0, 5, 6, 11, 12, 83, 84].map(stageForAge), ["unknown", "baby", "baby", "young", "young", "adult", "adult", "senior"]);
});
test("拦截无效日期、超出视频的片段、无效音频与元数据", () => {
  assert.equal(isSoundDay("2026-02-30"), false);
  assert.equal(isSoundDay("2024-02-29"), true);
  assert.equal(isSoundDay("2026-13-01"), false);
  assert.equal(validSoundAudio("https://example.com/audio.m4a"), false);
  assert.equal(validSoundAudio("data:video/mp4;base64,AAAA"), false);
  assert.deepEqual(soundRange("2.5", "5", 8), { start: 2.5, duration: 5 });
  for (const [start, duration] of [["-1", "3"], ["0", "61"], ["8", "1"], ["5", "5"], ["wat", "1"], ["0", ""]])
    assert.throws(() => soundRange(start, duration, 8));
  for (const change of [{ title: " " }, { ageMonths: -1 }, { ageMonths: 1.5 }, { duration: NaN }, { duration: 80 }, { recordedOn: "2999-01-01" }])
    assert.throws(() => addSound(demoState(), { ...input(), ...change }));
  const state = addSound(demoState(), input());
  for (const change of [{ audio: "file:///cache/temporary.m4a" }, { petId: "other-pet" }, { stage: "bogus" }, { recordedOn: "2026-02-30" }, { duration: -1 }])
    assert.equal(isAppState({ ...state, sounds: [{ ...state.sounds![0], ...change }] }), false);
  assert.equal(isAppState({ ...state, sounds: [state.sounds![0], state.sounds![0]] }), false);
});
test("相册容量受限，删除可释放容量且不影响日记", () => {
  const largeAudio = `data:audio/mp4;base64,${"AAAA".repeat(600000)}`;
  let state = addSound(demoState(), { ...input(), audio: largeAudio });
  while ((state.sounds!.length + 1) * largeAudio.length <= MAX_SOUND_TOTAL)
    state = addSound(state, { ...input(), audio: largeAudio });
  assert.throws(() => addSound(state, { ...input(), audio: largeAudio }));
  const events = state.events;
  state = { ...state, sounds: state.sounds!.slice(1) };
  assert.doesNotThrow(() => addSound(state, { ...input(), audio: largeAudio }));
  assert.equal(state.events, events);
  assert.equal(isAppState(state), true);
});
test("声音页面、元数据与错误提示有英文，日期使用本地日历", () => {
  applyLang("en");
  assert.equal(t("声音相册"), "Voice album");
  for (const stage of SOUND_STAGES) assert.ok(stageForAge(stage === "unknown" ? undefined : 1));
  for (const file of ["src/screens/Sounds.tsx", "src/components/SoundRecorder.tsx", "src/components/SoundPlayer.tsx", "src/domain/sounds.ts", "src/platform/sounds.ts", "src/platform/sounds.native.ts"]) {
    const content = readFileSync(file, "utf8");
    for (const [, text] of content.matchAll(/t\("([^"\n]+)"/g))
      if (/[\u3400-\u9fff]/.test(text)) assert.notEqual(t(text), text, `${file}: ${text}`);
  }
  assert.equal(localDay(new Date(2026, 9, 12, 0, 1)), "2026-10-12");
  applyLang("zh");
});
