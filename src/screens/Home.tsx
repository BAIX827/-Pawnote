import { locale, t, tList } from "../i18n";
import React from "react";
import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { progress, titleFor } from "../domain/life";
import { formatDate } from "../domain/types";
import { speciesEmoji } from "../domain/pet-profile";
import { milestones } from "../domain/timeline";
import {
  Button,
  Empty,
  Icon,
  Meter,
  Sticker,
  Tape,
  Ticker,
  demoPhoto,
  colors,
  display,
  shadow,
  styles,
} from "../components/ui";
import Neighborhood from "../components/Neighborhood";
import PawDatesCard from "../components/PawDatesCard";
import HomeLetters from "../components/HomeLetters";
import Onboarding from "./Onboarding";

// The poster changes with the hour, the way a pet's day does.
function moment(hour: number) {
  if (hour < 6) return { label: t("深夜档"), line: t("嘘，夜间巡逻中。"), icon: "moon" as const };
  if (hour < 11) return { label: t("早安档"), line: t("早，今天的早饭呢？"), icon: "sun" as const };
  if (hour < 14) return { label: t("午间档"), line: t("中午了，适合找块太阳躺下。"), icon: "sun" as const };
  if (hour < 18) return { label: t("下午档"), line: t("下午的风不错，我批准了。"), icon: "coffee" as const };
  return { label: t("晚间档"), line: t("你回来啦？我可没有在等你。"), icon: "moon" as const };
}
const notes = [colors.paper, colors.lavender, colors.green, colors.pink];

export default function Home() {
  const { state } = useStore();
  const { width } = useWindowDimensions();
  if (!state.pet) return <Onboarding />;
  const pet = state.pet,
    p = progress(state.events),
    latest = state.events[0],
    wide = width >= 1100,
    narrow = width < 500,
    now = new Date(),
    m = moment(now.getHours());
  const anniversary = milestones(pet, state.events, now).anniversaryToday;
  // The pet's latest line as it was saved, so it never changes with the interface language.
  const saying = latest
    ? latest.stories.diary.text.split("\n").find((line) => line.trim()) ?? m.line
    : m.line;
  return (
    <View style={styles.stack}>
      <View
        style={[
          {
            backgroundColor: colors.orange,
            borderRadius: 14,
            borderWidth: 2.5,
            borderColor: colors.ink,
            overflow: "hidden",
          },
          shadow(4),
        ]}
      >
        <View style={{ padding: narrow ? 14 : 24, paddingBottom: 14, minHeight: narrow ? 190 : 250, justifyContent: "space-between", gap: 10 }}>
          <View style={[styles.row, { gap: 8, flexWrap: "wrap", marginRight: narrow ? 120 : 190 }]}>
            <Sticker bg={colors.paper} rotate={0}>
              {now.toLocaleDateString(locale(), { month: "long", day: "numeric", weekday: "short" })}
              {" · "}
              {m.label}
            </Sticker>
          </View>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            style={{
              fontFamily: display,
              color: colors.ink,
              fontSize: narrow ? 70 : 104,
              lineHeight: narrow ? 74 : 108,
              marginRight: narrow ? 118 : 190,
            }}
          >
            {pet.name}
          </Text>
          <View style={{ alignItems: "flex-start", gap: 6, marginRight: narrow ? 118 : 190 }}>
            <View style={{ backgroundColor: colors.ink, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 }}>
              <Text style={{ color: colors.bg, fontSize: 12, fontWeight: "700" }}>
                {titleFor(p.level, pet.route)} · Lv.{p.level}
              </Text>
            </View>
            <View style={{ backgroundColor: colors.lavender, borderWidth: 2, borderColor: colors.ink, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, transform: [{ rotate: "-4deg" }] }}>
              <Text numberOfLines={1} style={{ color: colors.ink, fontSize: 12, fontWeight: "700", maxWidth: 170 }}>
                {tList(pet.personality)}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={{
            position: "absolute",
            right: -3,
            bottom: 26,
            width: narrow ? 118 : 180,
            height: narrow ? 160 : 220,
            borderWidth: 2.5,
            borderColor: colors.ink,
            borderTopLeftRadius: 12,
            overflow: "hidden",
            backgroundColor: colors.pink,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {pet.avatar || state.demo ? (
            <Image source={pet.avatar ? { uri: pet.avatar } : demoPhoto} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: narrow ? 64 : 96 }}>{speciesEmoji(pet)}</Text>
          )}
        </View>
        <Ticker text={`${t("今日主角")} ★ ${pet.name} ★ ${t("今日主角")} ★ ${pet.name} ★ ${t("今日主角")} ★ ${pet.name} ★`} />
      </View>
      <View style={[{ backgroundColor: colors.paper, borderRadius: 14, borderWidth: 2.5, borderColor: colors.ink, padding: 14, gap: 8, marginTop: 4 }, shadow(4)]}>
        <View
          pointerEvents="none"
          style={{ position: "absolute", left: 28, top: -11, width: 18, height: 18, backgroundColor: colors.paper, borderLeftWidth: 2.5, borderTopWidth: 2.5, borderColor: colors.ink, transform: [{ rotate: "45deg" }] }}
        />
        <View style={{ alignSelf: "flex-start", backgroundColor: colors.pink, borderWidth: 2, borderColor: colors.ink, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ fontFamily: display, fontSize: 13, color: colors.ink }}>{t("{name}说", { name: pet.name })}</Text>
        </View>
        <Text numberOfLines={3} style={[styles.body, { fontSize: 15, fontWeight: "700" }]}>
          {saying}
        </Text>
      </View>

      <PawDatesCard />
      <HomeLetters />
      {anniversary !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("打开时光机")}
          onPress={() => router.push("/timemachine")}
          style={[{ backgroundColor: colors.pink, borderRadius: 14, padding: 16 }, shadow(3)]}
        >
          <Text style={[styles.h2, { fontSize: 20 }]}>
            {t("今天是 {name} 到家 {n} 周年", { name: pet.name, n: anniversary })}
          </Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("记录今天，翻成宠物的话")}
        onPress={() => router.push("/record")}
        style={({ pressed }) => [
          {
            backgroundColor: colors.green,
            borderWidth: 2.5,
            borderColor: colors.ink,
            borderRadius: 14,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            transform: [{ translateX: pressed ? 2 : 0 }, { translateY: pressed ? 2 : 0 }],
          },
          shadow(pressed ? 2 : 4),
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.ink, fontSize: 24, lineHeight: 30, fontFamily: display }}>
            {t("它今天干了啥？")}
          </Text>
          <Text style={{ color: colors.ink, fontSize: 12, lineHeight: 18, fontWeight: "500" }}>
            {t("你照实写，{name}用自己的口吻再说一遍", { name: pet.name })}
          </Text>
        </View>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" }}>
          <Icon name="arrow-right" color={colors.green} size={22} />
        </View>
      </Pressable>

      <View style={{ flexDirection: wide ? "row" : "column", gap: 24 }}>
        <View style={{ flex: wide ? 1.3 : undefined }}>
          <Neighborhood work={pet.route === "work"} />
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 24 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {[
              { n: p.xp, unit: "XP", label: t("成长经验"), bg: colors.green },
              { n: state.events.length, unit: t("篇"), label: t("生活片刻"), bg: colors.sky },
              { n: p.toNext, unit: "XP", label: t("离升级还差"), bg: colors.lilac },
            ].map((s, i) => (
              <View
                key={s.label}
                style={[
                  {
                    flex: 1,
                    backgroundColor: s.bg,
                    borderWidth: 2.5,
                    borderColor: colors.ink,
                    borderRadius: 14,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    transform: [{ rotate: `${[-2, 1.5, -1][i]}deg` }],
                  },
                  shadow(3),
                ]}
              >
                <Text style={{ fontFamily: display, fontWeight: "400", fontSize: 30, lineHeight: 36, color: colors.ink }}>
                  {s.n}
                  <Text style={{ fontSize: 12 }}> {s.unit}</Text>
                </Text>
                <Text style={[styles.small, { color: colors.ink }]}>{s.label}</Text>
              </View>
            ))}
          </View>
          <View style={{ gap: 6 }}>
            <View style={styles.between}>
              <Text style={styles.caps}>Lv.{p.level} → Lv.{p.level + 1}</Text>
              <Text style={styles.small}>{t("每条新记录 +20 XP")}</Text>
            </View>
            <Meter value={p.current} color={colors.orange} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={latest ? t("制作最新记录的爪报") : t("记录小事制作爪报")}
            onPress={() =>
              latest
                ? router.push({ pathname: "/news", params: { id: latest.id } })
                : router.push("/record")
            }
          >
            <View
              style={[
                {
                  backgroundColor: colors.paper,
                  borderWidth: 2.5,
                  borderColor: colors.ink,
                  borderRadius: 14,
                  padding: 20,
                  gap: 10,
                  transform: [{ rotate: "1deg" }],
                },
                shadow(5, colors.lavender),
              ]}
            >
              <View style={styles.between}>
                <Text style={styles.caps}>{t("PAW POST · 独家")}</Text>
                <Icon name="arrow-up-right" color={colors.ink} />
              </View>
              <Text
                style={{
                  fontSize: 40,
                  lineHeight: 50,
                  fontWeight: "400",
                  fontFamily: display,
                  color: colors.ink,
                  letterSpacing: 4,
                  borderBottomWidth: 3,
                  borderTopWidth: 1,
                  borderColor: colors.ink,
                  paddingVertical: 4,
                }}
              >
                {t("爪报")}
              </Text>
              <Text style={[styles.h2, { fontSize: 19 }]} numberOfLines={3}>
                {latest ? latest.stories.news.title : t("头条，等你来写")}
              </Text>
              <Text style={styles.small}>{t("点开做成新闻卡 · 虚构娱乐报道")}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={[styles.between, { marginTop: 4 }]}>
        <View>
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: -4, right: -6, bottom: 3, height: 10, backgroundColor: colors.pink }}
          />
          <Text style={[styles.h2, { fontSize: 26, lineHeight: 34 }]}>{t("最近发生")}</Text>
        </View>
        <Button label={t("翻开爪册")} tone="plain" onPress={() => router.push("/profile")} />
      </View>
      {state.events.length ? (
        <View style={{ gap: 20 }}>
          {state.events.slice(0, 3).map((e, i) => (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={t("查看记录：{text}", { text: e.description })}
              onPress={() => router.push({ pathname: "/event", params: { id: e.id } })}
              style={({ pressed }) => [
                {
                  backgroundColor: notes[i % notes.length],
                  borderWidth: 2.5,
                  borderColor: colors.ink,
                  borderRadius: 14,
                  padding: 18,
                  flexDirection: "row",
                  gap: 14,
                  transform: [{ rotate: `${i % 2 ? 0.8 : -0.8}deg` }, { translateY: pressed ? 2 : 0 }],
                },
                shadow(4),
              ]}
            >
              <Tape color={i % 2 ? colors.pink : colors.orange} rotate={i % 2 ? 5 : -5} />
              <Text
                style={{
                  color: colors.ink,
                  fontSize: 44,
                  lineHeight: 50,
                  fontWeight: "400",
                  fontFamily: display,
                  width: 52,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </Text>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.small}>
                  {formatDate(e.createdAt)} · {e.published ? t("留在窝里") : t("私密")}
                </Text>
                <Text style={[styles.h2, { fontSize: 18, lineHeight: 26 }]} numberOfLines={2}>
                  {e.stories[e.selectedStyle].title}
                </Text>
                <Text style={styles.muted} numberOfLines={2}>
                  {t("主人说：{text}", { text: e.description })}
                </Text>
              </View>
              {e.photo && (
                <Image
                  source={{ uri: e.photo }}
                  style={{ width: 60, height: 72, borderRadius: 8, borderWidth: 3, borderColor: "#FFF", transform: [{ rotate: "4deg" }] }}
                />
              )}
            </Pressable>
          ))}
        </View>
      ) : (
        <Empty
          title={t("今天的故事还空着")}
          action={<Button label={t("写第一条日记")} onPress={() => router.push("/record")} />}
        />
      )}
    </View>
  );
}
