import { getLang, t, useLang } from "../i18n";
import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { remindersPaused } from "../domain/paw-dates";
import { PAWSONA_QUESTIONS, adoptPawsona, pawsonaCard, takePawsona } from "../domain/pawsona";
import { pawsonaSVG } from "../domain/share-cards";
import { temperOf } from "../domain/temper";
import { exportCard } from "../platform/export";
import { Avatar, Bubble, Button, Card, Chip, Empty, Heading, Meter, colors, display, numeric, shadow, styles } from "../components/ui";
import Onboarding from "./Onboarding";

/** 爪格 / Pawsona (docs/01 8.17): eight questions, one result card to keep or share. */
export default function Pawsona() {
  const { state, update, notify } = useStore();
  const lang = useLang();
  const saved = state.pawsona;
  const [answers, setAnswers] = useState<number[]>([]);
  const [taking, setTaking] = useState(!saved);
  const card = useRef<View>(null);
  if (!state.pet) return <Onboarding />;
  const pet = state.pet;
  const back = <Button label={t("返回")} tone="plain" onPress={() => router.replace("/profile")} />;
  if (remindersPaused(state.events))
    return (
      <View style={styles.stack}>
        <Heading title={t("爪格测试")} accent={colors.pink} action={back} />
        <Empty title={t("最新的记录写到它离开了。爪格测试先不打扰，这里不替它说话。")} />
      </View>
    );

  if (taking || !saved) {
    const i = answers.length;
    const q = PAWSONA_QUESTIONS[Math.min(i, PAWSONA_QUESTIONS.length - 1)];
    function choose(value: number) {
      const next = [...answers, value];
      if (next.length < PAWSONA_QUESTIONS.length) return setAnswers(next);
      update((s) => ({ ...s, pawsona: takePawsona(next) }));
      setAnswers([]);
      setTaking(false);
    }
    return (
      <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
        <Heading title={t("爪格测试")} accent={colors.pink} action={back} />
        <Meter value={Math.round((i / PAWSONA_QUESTIONS.length) * 100)} color={colors.orange} />
        <Card style={{ gap: 16 }}>
          <Text style={[styles.caps, { color: colors.muted }]}>
            {t("第 {n} / {total} 题", { n: i + 1, total: PAWSONA_QUESTIONS.length })}
          </Text>
          <Text style={[styles.h2, { fontSize: 24, lineHeight: 32 }]}>{q.title[lang]}</Text>
          <View style={{ gap: 10 }}>
            {q.choices.map((c, value) => (
              <Chip key={c.label.zh} label={c.label[lang]} color={colors.paper} onPress={() => choose(value)} />
            ))}
          </View>
        </Card>
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {i > 0 && <Button label={t("上一题")} tone="soft" icon="arrow-left" onPress={() => setAnswers(answers.slice(0, -1))} />}
          {saved && <Button label={t("取消重测")} tone="plain" onPress={() => { setAnswers([]); setTaking(false); }} />}
        </View>
      </View>
    );
  }

  const result = pawsonaCard(pet, saved, lang);
  const adopted = temperOf(pet) === saved.temper;
  async function share() {
    try {
      await exportCard(pawsonaSVG(pet, saved!), `pawsona-${pet.name}`, card.current, t("{name}的爪格", { name: pet.name }));
    } catch (e) {
      notify(e instanceof Error ? e.message : t("分享失败，请重试。"));
    }
  }
  return (
    <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
      <Heading title={t("爪格测试")} accent={colors.pink} action={back} />
      <View ref={card} collapsable={false} style={{ backgroundColor: colors.bg, gap: 18, padding: 4 }}>
        <View style={[{ backgroundColor: result.color, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14, padding: 20, gap: 6 }, shadow(5)]}>
          <View style={styles.between}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontFamily: numeric, fontSize: 15, letterSpacing: 4, color: colors.ink }}>{result.code}</Text>
              <Text style={{ fontFamily: display, fontSize: getLang() === "en" ? 34 : 44, lineHeight: getLang() === "en" ? 40 : 52, color: colors.ink }}>
                {result.name}
              </Text>
              <Text style={[styles.body, { fontWeight: "700" }]}>{pet.name}</Text>
            </View>
            <Avatar pet={pet} size={96} demo={state.demo} />
          </View>
        </View>
        <Bubble tail="left">
          <Text style={[styles.body, { fontWeight: "600" }]}>{result.intro}</Text>
        </Bubble>
        <Card style={{ gap: 12 }}>
          {result.bars.map((b) => (
            <View key={b.temper} style={{ gap: 6 }}>
              <View style={styles.between}>
                <Text style={[styles.body, { fontWeight: "700" }]}>{b.label}</Text>
                <Text style={{ fontFamily: numeric, fontSize: 15, color: colors.ink }}>{b.percent}%</Text>
              </View>
              <Meter value={b.percent} color={result.color === colors.bg ? colors.orange : result.color} />
            </View>
          ))}
        </Card>
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: t("使用说明"), text: result.manual },
            { label: t("最佳拍档"), text: result.match },
          ].map((s) => (
            <View key={s.label} style={[{ flexGrow: 1, flexBasis: 220, backgroundColor: colors.paper, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14, padding: 14, gap: 4 }, shadow(3)]}>
              <Text style={styles.caps}>{s.label}</Text>
              <Text style={[styles.body, { fontWeight: "700" }]}>{s.text}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ gap: 10 }}>
        <Button
          label={adopted ? t("已经是它的性格") : t("设为它的性格")}
          icon="check"
          disabled={adopted}
          onPress={() => {
            update((s) => (s.pet ? { ...s, pet: adoptPawsona(s.pet, saved.temper) } : s));
            notify(t("性格已更新，之后的记录会按这个脾气说话。"));
          }}
        />
        <Button label={t("分享这张卡")} icon="upload" tone="soft" onPress={() => void share()} />
        <Button label={t("重新测一次")} icon="refresh-cw" tone="plain" onPress={() => setTaking(true)} />
      </View>
    </View>
  );
}
