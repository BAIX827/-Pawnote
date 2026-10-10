import React, { useState } from "react";
import { Text, View } from "react-native";
import { QUESTIONS, questionnaireTraits } from "../domain/pet-profile";
import { Button, Chip, styles } from "./ui";

export default function PersonalityQuiz({ initialAnswers, onDraftChange, onApply }: {
  initialAnswers?: number[];
  onDraftChange: (answers: number[]) => void;
  onApply: (personality: string, answers: number[]) => void;
}) {
  const [answers, setAnswers] = useState<number[]>(initialAnswers ?? Array(QUESTIONS.length).fill(-1));
  const [result, setResult] = useState<string>();
  const [error, setError] = useState("");
  function answer(index: number, value: number) {
    const next = answers.map((a, i) => i === index ? value : a);
    setAnswers(next);
    onDraftChange(next);
    setResult(undefined);
    setError("");
  }
  return <View style={{ gap: 18, padding: 16, backgroundColor: "#F8F8F4", borderRadius: 14 }}>
    <Text style={styles.h2}>它的日常性格观察</Text>
    <Text style={styles.small}>根据平时已有的观察作答。适用于不同宠物，无法判断可选“暂不确定”。结果用于故事人设，可由主人修改。</Text>
    {QUESTIONS.map((q, i) => <View key={q.title} style={{ gap: 9 }}>
      <Text style={styles.body}>{i + 1}. {q.title}</Text>
      {[...q.choices.map(c => c.label), "暂不确定 / 不适用"].map((label, value) =>
        <Chip key={label} label={label} active={answers[i] === value} onPress={() => answer(i, value)} />)}
    </View>)}
    <Button label="查看性格结果" tone="soft" onPress={() => {
      try { setResult(questionnaireTraits(answers).join(" · ")); setError(""); }
      catch (e) { setError(e instanceof Error ? e.message : "请检查作答。"); }
    }} />
    {!!error && <Text accessibilityRole="alert" style={[styles.body, { color: "#AE4434" }]}>{error}</Text>}
    {result && <View style={{ gap: 10 }}>
      <Text style={styles.body}>根据你的观察，暂时总结为：{result}</Text>
      <Button label="采用这个性格" onPress={() => onApply(result, [...answers])} />
    </View>}
  </View>;
}
