import React, { useRef, useState } from "react";
import { Image, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { t } from "../i18n";
import { nextOccasions, occasionForYear, occasionLetter, occasionSVG, OccasionKind } from "../domain/occasions";
import { exportCard } from "../platform/export";
import { Button, Card, Chip, Empty, Heading, colors, styles } from "../components/ui";
import Onboarding from "./Onboarding";

export default function Anniversaries() {
  const { state, notify } = useStore();
  const [kind, setKind] = useState<OccasionKind>(state.pet?.birthDate ? "birthday" : "home");
  const next = state.pet ? nextOccasions(state.pet).find((o) => o.kind === kind) : undefined;
  const [year, setYear] = useState<number>();
  const [busy, setBusy] = useState(false), [loaded, setLoaded] = useState("");
  const card = useRef<View>(null);
  if (!state.pet) return <Onboarding />;
  const selectedYear = year ?? (Number(next?.day.slice(0, 4)) || new Date().getFullYear());
  const occasion = occasionForYear(state.pet, kind, selectedYear);
  const letter = occasion ? occasionLetter(state, occasion) : undefined;
  const origin = kind === "birthday" ? state.pet.birthDate : state.pet.homeDate;
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 3 + i).filter((y) => !origin || y >= Number(origin.slice(0, 4)));
  async function share() {
    if (!letter) return;
    setBusy(true);
    try { await exportCard(occasionSVG(letter), `pawnote-${kind}-${selectedYear}`, card.current, letter.title); }
    catch (e) { notify(e instanceof Error ? e.message : t("导出失败，请重试。")); }
    finally { setBusy(false); }
  }
  return <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
    <Heading title={t("生日与纪念日")} eyebrow={t("特别的一页 · 一张卡 · 一封信")} accent={colors.pink}
      action={<Button label={t("返回爪册")} tone="plain" onPress={() => router.replace("/profile")} />} />
    <View style={[styles.row, { flexWrap: "wrap" }]}>
      <Chip label={t("生日")} active={kind === "birthday"} onPress={() => { setKind("birthday"); setYear(undefined); }} />
      <Chip label={t("到家纪念日")} active={kind === "home"} onPress={() => { setKind("home"); setYear(undefined); }} />
    </View>
    {letter && occasion ? <>
      <View style={[styles.row, { flexWrap: "wrap" }]}>{years.map((y) => <Chip key={y} label={String(y)} active={y === selectedYear} onPress={() => setYear(y)} />)}</View>
      {occasion.inDays > 0 && <Text style={styles.small}>{t("还有 {n} 天 · 可以提前看看这封信", { n: occasion.inDays })}</Text>}
      <View ref={card} collapsable={false} style={{ backgroundColor: colors.paper, borderRadius: 14, borderWidth: 2.5, borderColor: colors.ink, overflow: "hidden" }}>
        <View style={{ backgroundColor: letter.memorial ? colors.lavender : colors.pink, padding: 22, gap: 8 }}>
          <Text style={[styles.h1, { fontSize: 32, lineHeight: 42 }]}>{letter.title}</Text>
          <Text style={styles.body}>{letter.subtitle}</Text>
        </View>
        {letter.photo && <Image key={letter.photo} source={{ uri: letter.photo }} style={{ width: "100%", height: 220 }}
          onLoad={() => setLoaded(letter.photo!)} onError={() => { setLoaded(""); notify(t("照片读取失败，请重新打开。")); }} />}
        <View style={{ padding: 22, gap: 18 }}>
          <Text style={styles.h2}>{letter.greeting}</Text>
          {letter.paragraphs.map((p, i) => <Text key={i} style={[styles.body, { lineHeight: 28 }]}>{p}</Text>)}
          <Text style={[styles.h2, { textAlign: "right", fontSize: 20 }]}>{letter.closing}</Text>
          <Text style={styles.small}>{t("爪记 Pawnote · 按已保存的记录写成")}</Text>
        </View>
      </View>
      <Button label={busy ? t("正在导出…") : t("分享纪念卡与信")} icon="upload" disabled={busy || (!!letter.photo && loaded !== letter.photo)} onPress={() => void share()} />
      <Button label={t("记录这一天")} tone="soft" disabled={occasion.inDays > 0} onPress={() => router.push({ pathname: "/record", params: { date: occasion.day } })} />
    </> : <Empty title={t(kind === "birthday" ? "先填上它的生日" : "先填上到家日期")}
      action={<Button label={t("编辑档案")} onPress={() => router.push({ pathname: "/onboarding", params: { edit: "1" } })} />} />}
    <Card style={{ gap: 8 }}><Text style={styles.small}>{t("2 月 29 日的生日或到家日，在平年按 2 月 28 日纪念。")}</Text>
      <Button label={t("修改生日与到家日期")} icon="edit-2" tone="plain" onPress={() => router.push({ pathname: "/onboarding", params: { edit: "1" } })} /></Card>
  </View>;
}
