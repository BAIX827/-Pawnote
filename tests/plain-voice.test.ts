import { test } from "node:test";
import assert from "node:assert/strict";
import { zh } from "../src/domain/voice-bank";
import { BANNED } from "../server/voice.mjs";

// PRD 8.43: Chinese pet lines are spoken and stubborn, never office-speak.
const OFFICE = /此事|处理完毕|复盘|对外公布|追诉|不予追究|另案|已阅|请知悉|再议|批准|驳回|验收|审批|汇报|以上。|无其他补充|到岗|外勤|特此|宣布/;

test("本机中文句库不用公文腔", () => {
  for (const [temper, set] of Object.entries(zh)) {
    const lines = [...Object.values(set.line).flat(), ...Object.values(set.social).flat(), ...set.closers, ...set.silly];
    for (const line of lines) assert.doesNotMatch(line, OFFICE, `${temper}: ${line}`);
  }
});

test("AI 写出公文腔会被要求重写", () => {
  assert.match("此事已处理完毕，汪保留追诉权。", BANNED.zh);
  assert.doesNotMatch("今天跟小黑干了一架。别问，问就是汪赢了。", BANNED.zh);
});
