import { locale, t } from "../i18n";
import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { firsts, milestones, monthlyPhotos } from "../domain/timeline";
import { LifeEvent, formatDate } from "../domain/types";
import {
  Button,
  Card,
  Empty,
  Heading,
  Icon,
  Tape,
  colors,
  display,
  numeric,
  shadow,
  styles,
} from "../components/ui";
import Onboarding from "./Onboarding";

const FIRST_LABELS = {
  entry: "第一条记录",
  photo: "第一张照片",
  sleep: "第一次睡觉被记下",
  snack: "第一次偷吃",
  bath: "第一次洗澡",
  chaos: "第一次拆家",
  walk: "第一次散步",
  other: "第一件小事",
} as const;
const monthShort = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale(), { year: "2-digit", month: "short" });
};
const open = (event: LifeEvent) => router.push({ pathname: "/event", params: { id: event.id } });

function Polaroid({ event, caption, size, tilt }: { event: LifeEvent; caption: string; size: number; tilt: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("打开日记：{text}", { text: event.description })}
      onPress={() => open(event)}
      style={[
        { backgroundColor: "#FFF", padding: 7, paddingBottom: 8, borderWidth: 2.5, borderColor: colors.ink, transform: [{ rotate: `${tilt}deg` }] },
        shadow(3),
      ]}
    >
      <Image source={{ uri: event.photo }} style={{ width: size, height: size, backgroundColor: colors.pale }} />
      <Text numberOfLines={1} style={{ width: size, textAlign: "center", marginTop: 6, fontSize: 12, fontFamily: display, fontWeight: "400", color: colors.ink }}>
        {caption}
      </Text>
    </Pressable>
  );
}

export default function TimeMachine() {
  const { state } = useStore();
  if (!state.pet) return <Onboarding />;
  const pet = state.pet,
    marks = milestones(pet, state.events),
    photos = monthlyPhotos(state.events),
    moments = firsts(state.events);
  const stat = (n: number, label: string, bg: string) => (
    <View style={[{ flex: 1, minWidth: 140, backgroundColor: bg, borderRadius: 14, padding: 16 }, shadow(3)]}>
      <Text style={styles.small}>{label}</Text>
      <Text style={{ fontFamily: numeric, fontSize: 44, lineHeight: 52, color: colors.ink }}>
        {n}
        <Text style={{ fontSize: 14 }}> {t("天")}</Text>
      </Text>
    </View>
  );
  return (
    <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
      <Heading
        title={t("时光机")}
        eyebrow={t("成长 · 第一次 · 纪念日")}
        accent={colors.sky}
        action={<Button label={t("返回")} tone="plain" onPress={() => router.replace("/profile")} />}
      />

      {marks.anniversaryToday !== undefined && (
        <Card style={{ backgroundColor: colors.pink, gap: 4 }}>
          <Text style={[styles.h2, { fontSize: 24, lineHeight: 32 }]}>
            {t("今天是 {name} 到家 {n} 周年", { name: pet.name, n: marks.anniversaryToday })}
          </Text>
          <Text style={styles.body}>{t("写一条今天的记录，留给明年的今天看。")}</Text>
        </Card>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {marks.homeDay !== undefined && stat(marks.homeDay, t("{name}来到你身边的第", { name: pet.name }), colors.yellow)}
        {marks.recordingDay !== undefined && stat(marks.recordingDay, t("开始记录的第"), colors.green)}
      </View>
      {marks.nextAnniversary && marks.anniversaryToday === undefined && (
        <Text style={styles.muted}>
          {t("距离到家 {n} 周年还有 {d} 天", { n: marks.nextAnniversary.years, d: marks.nextAnniversary.inDays })}
        </Text>
      )}
      {marks.homeDay === undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("填写到家日期")}
          onPress={() => router.push({ pathname: "/onboarding", params: { edit: "1" } })}
          style={[styles.row, { backgroundColor: colors.paper, borderRadius: 14, borderWidth: 2.5, borderStyle: "dashed", borderColor: colors.ink, padding: 14 }]}
        >
          <Icon name="edit-2" color={colors.muted} />
          <Text style={[styles.muted, { flex: 1 }]}>
            {t("在档案里填上到家日期，就能看到它来到你身边的第几天和周年倒数。")}
          </Text>
        </Pressable>
      )}

      <Card style={{ backgroundColor: colors.green, gap: 10 }}>
        <View style={styles.row}><Icon name="mic" /><Text style={styles.h2}>{t("听它慢慢长大")}</Text></View>
        <Text style={styles.body}>{t("{n} 段叫声，留住每个成长阶段的声音。", { n: state.sounds?.length ?? 0 })}</Text>
        <Button label={t("打开声音相册")} tone="soft" onPress={() => router.push("/sounds")} />
      </Card>
      <Text style={[styles.h2, { fontSize: 24, lineHeight: 32, marginTop: 4 }]}>{t("成长对比")}</Text>
      {photos.length ? (
        <>
          {photos.length >= 2 && (
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 14, paddingVertical: 6 }}>
              <Polaroid event={photos[0].event} caption={monthShort(photos[0].month)} size={128} tilt={-3} />
              <Icon name="arrow-right" color={colors.orange} size={26} />
              <Polaroid event={photos[photos.length - 1].event} caption={monthShort(photos[photos.length - 1].month)} size={128} tilt={3} />
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, padding: 10 }}>
            {photos.map((p, i) => (
              <Polaroid key={p.month} event={p.event} caption={monthShort(p.month)} size={96} tilt={i % 2 ? 2 : -2} />
            ))}
          </ScrollView>
          <Text style={styles.small}>{t("每个月取第一张带照片的记录。每月拍一张，这里就会越排越长。")}</Text>
        </>
      ) : (
        <Empty
          title={t("还没有带照片的记录")}
          subtitle={t("每个月给它拍一张，这里会排出一条成长线。")}
          action={<Button label={t("记录今天")} onPress={() => router.push("/record")} />}
        />
      )}

      <Text style={[styles.h2, { fontSize: 24, lineHeight: 32, marginTop: 4 }]}>{t("“第一次”")}</Text>
      {moments.length ? (
        <View style={{ gap: 16 }}>
          {moments.map((m, i) => (
            <Pressable
              key={m.kind}
              accessibilityRole="button"
              accessibilityLabel={t("打开日记：{text}", { text: m.event.description })}
              onPress={() => open(m.event)}
              style={[
                {
                  backgroundColor: [colors.paper, colors.green, colors.lavender][i % 3],
                  borderRadius: 14,
                  borderWidth: 2.5,
                  borderColor: colors.ink,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                },
                shadow(3),
              ]}
            >
              <Tape color={[colors.pink, colors.sky, colors.green][i % 3]} rotate={i % 2 ? 4 : -4} style={{ left: "auto", right: 26, marginLeft: 0 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.small}>{formatDate(m.event.createdAt)}</Text>
                <Text style={[styles.h2, { fontSize: 19, lineHeight: 27 }]}>{t(FIRST_LABELS[m.kind])}</Text>
                <Text style={styles.muted} numberOfLines={2}>
                  {m.event.description}
                </Text>
              </View>
              {m.event.photo && (
                <Image
                  source={{ uri: m.event.photo }}
                  style={{ width: 58, height: 68, borderWidth: 2.5, borderColor: colors.ink, transform: [{ rotate: "4deg" }] }}
                />
              )}
            </Pressable>
          ))}
        </View>
      ) : (
        <Empty title={t("第一次，等你来记")} action={<Button label={t("记录今天")} onPress={() => router.push("/record")} />} />
      )}
    </View>
  );
}
