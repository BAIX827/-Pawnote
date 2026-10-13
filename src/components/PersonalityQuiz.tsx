import { t } from "../i18n";
import { useState } from "react";
import { Text, View } from "react-native";
import { QUESTIONS, questionnaireTraits } from "../domain/pet-profile";
import { Button, Chip, styles } from "./ui";

export default function PersonalityQuiz({
  initialAnswers,
  onDraftChange,
  onApply,
}: {
  initialAnswers?: number[];
  onDraftChange: (answers: number[]) => void;
  onApply: (personality: string, answers: number[]) => void;
}) {
  const [answers, setAnswers] = useState<number[]>(
    initialAnswers ?? Array(QUESTIONS.length).fill(-1),
  );
  const [result, setResult] = useState<string>();
  const [error, setError] = useState("");
  function answer(index: number, value: number) {
    const next = answers.map((a, i) => (i === index ? value : a));
    setAnswers(next);
    onDraftChange(next);
    setResult(undefined);
    setError("");
  }
  return (
    <View
      style={{
        gap: 18,
        padding: 16,
        backgroundColor: "#E4DDFB",
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#EBDCC8",
      }}
    >
      <Text style={styles.h2}>{t("它的日常性格观察")}</Text>
      {QUESTIONS.map((q, i) => (
        <View key={q.title} style={{ gap: 9 }}>
          <Text style={styles.body}>
            {i + 1}. {t(q.title)}
          </Text>
          {[...q.choices.map((c) => t(c.label)), t("暂不确定 / 不适用")].map(
            (label, value) => (
              <Chip
                key={label}
                label={label}
                active={answers[i] === value}
                onPress={() => answer(i, value)}
              />
            ),
          )}
        </View>
      ))}
      <Button
        label={t("查看性格结果")}
        tone="soft"
        onPress={() => {
          try {
            setResult(questionnaireTraits(answers).join(" · "));
            setError("");
          } catch (e) {
            setError(e instanceof Error ? e.message : t("请检查作答。"));
          }
        }}
      />
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={[styles.body, { color: "#AE4434" }]}
        >
          {error}
        </Text>
      )}
      {result && (
        <View style={{ gap: 10 }}>
          <Text style={styles.body}>{t("观察结果：{result}", { result: result ?? "" })}</Text>
          <Button
            label={t("采用这个性格")}
            onPress={() => onApply(result, [...answers])}
          />
        </View>
      )}
    </View>
  );
}
