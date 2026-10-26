import { getLang, locale, t, tList } from "../i18n";
import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { progress, titleFor } from "../domain/life";
import { formatDate } from "../domain/types";
import { ownerName, petLine } from "../domain/story-engine";
import { greeting } from "../domain/greetings";
import {
  Button,
  Empty,
  Icon,
  Meter,
  PetSticker,
  Sticker,
  Tape,
  Ticker,
  colors,
  display,
  numeric,
  shadow,
  styles,
} from "../components/ui";
import Neighborhood from "../components/Neighborhood";
import PawDatesCard from "../components/PawDatesCard";
import PastMemories from "../components/PastMemories";
import { eventDate, eventDay, localDay, newestEvents } from "../domain/dates";
import OccasionPreview from "../components/OccasionPreview";
import HomeLetters from "../components/HomeLetters";
import BackupNudge from "../components/BackupNudge";
import Onboarding from "./Onboarding";

// The poster changes with the hour, the way a pet's day does.
function moment(hour: number) {
  if (hour < 6) return { label: t("深夜档"), icon: "moon" as const };
  if (hour < 11) return { label: t("早安档"), icon: "sun" as const };
  if (hour < 14) return { label: t("午间档"), icon: "sun" as const };
  if (hour < 18) return { label: t("下午档"), icon: "coffee" as const };
  return { label: t("晚间档"), icon: "moon" as const };
}
const notes = [colors.paper, colors.lavender, colors.mint, colors.yellow];

export default function Home() {
  const { state } = useStore();
  const { width } = useWindowDimensions();
  if (!state.pet) return <Onboarding />;
  const pet = state.pet,
    p = progress(state.events),
    latest = newestEvents(state.events)[0],
    wide = width >= 1100,
    narrow = width < 500,
    now = new Date(),
    m = moment(now.getHours()),
    month = state.events.filter((e) => {
      const d = eventDate(e);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  // What the pet itself said today, never the owner's words quoted back (docs/01 8.24); on a day
  // with nothing recorded yet, the greeting for the hour (docs/01 8.26).
  const saying = (latest && eventDay(latest) === localDay(now) && petLine(latest)) || greeting(pet, now.getHours(), getLang());
  return (
    // Without the town panels the home is one column; on a desktop it stays a readable width (docs/01 8.26).
    <View style={[styles.stack, narrow && { gap: 14 },
      state.preferences?.homeExtras !== true && { maxWidth: 860, width: "100%", alignSelf: "center" }]}>
      {/* The poster: one orange block, the pet's own photo stuck on as a sticker (docs/01 8.30). */}
      <View style={{ backgroundColor: colors.orange, borderRadius: 14, borderBottomLeftRadius: narrow ? 40 : 64, overflow: "hidden" }}>
        <Ticker text={`${t("今日主角")} ★ ${pet.name} ★ ${t("今日主角")} ★ ${pet.name} ★ ${t("今日主角")} ★ ${pet.name} ★`} height={narrow ? 24 : 28} />
        <View style={{ padding: narrow ? 14 : 24, paddingTop: narrow ? 12 : 18, paddingBottom: narrow ? 18 : 28, minHeight: narrow ? 196 : 270, gap: narrow ? 8 : 12, marginRight: narrow ? 128 : 220 }}>
          <Sticker bg={colors.paper} rotate={0}>
            {now.toLocaleDateString(locale(), { month: "long", day: "numeric", weekday: "short" })}
            {" · "}
            {m.label}
          </Sticker>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            style={{
              fontFamily: display,
              color: colors.ink,
              fontSize: narrow ? 52 : 92,
              lineHeight: narrow ? 58 : 98,
            }}
          >
            {pet.name}
          </Text>
          <View style={{ alignItems: "flex-start", gap: 7 }}>
            <View style={{ backgroundColor: colors.yellow, borderWidth: 2, borderColor: colors.ink, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ color: colors.ink, fontSize: 12, fontWeight: "800" }}>
                Lv.{p.level} {titleFor(p.level, pet.route)}
              </Text>
            </View>
            <View style={{ backgroundColor: colors.lavender, borderWidth: 2, borderColor: colors.ink, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, transform: [{ rotate: "-4deg" }] }}>
              <Text numberOfLines={1} style={{ color: colors.ink, fontSize: 12, fontWeight: "800", maxWidth: 170 }}>
                {tList(pet.personality)}
              </Text>
            </View>
          </View>
        </View>
        <PetSticker
          pet={pet}
          demo={state.demo}
          width={narrow ? 104 : 176}
          height={narrow ? 124 : 200}
          style={{ position: "absolute", right: narrow ? 14 : 30, top: narrow ? 44 : 56 }}
        />
      </View>

      <View style={[{ backgroundColor: colors.paper, borderRadius: 18, borderWidth: 2.5, borderColor: colors.ink, padding: 14, gap: 6, marginTop: 4, transform: [{ rotate: "-1deg" }] }, shadow(3)]}>
        <View
          pointerEvents="none"
          style={{ position: "absolute", left: 28, top: -11, width: 18, height: 18, backgroundColor: colors.paper, borderLeftWidth: 2.5, borderTopWidth: 2.5, borderColor: colors.ink, transform: [{ rotate: "45deg" }] }}
        />
        <Text style={{ fontFamily: display, fontSize: 14, color: colors.orange }}>{t("{name}说", { name: pet.name })}</Text>
        <Text numberOfLines={3} style={[styles.body, { fontSize: 16, lineHeight: 24, fontWeight: "800" }]}>
          {saying}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("记录今天，翻成宠物的话")}
        onPress={() => router.push("/record")}
        style={({ pressed }) => [
          {
            backgroundColor: colors.ink,
            borderRadius: 18,
            paddingVertical: 12,
            paddingLeft: 18,
            paddingRight: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            transform: [{ translateY: pressed ? 2 : 0 }],
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.bg, fontSize: 24, lineHeight: 30, fontFamily: display }}>
            {t("它今天干了啥？")}
          </Text>
        </View>
        <View style={{ width: 46, height: 46, borderRadius: 12, borderWidth: 2.5, borderColor: colors.bg, backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center", transform: [{ rotate: "6deg" }] }}>
          <Icon name="arrow-right" color={colors.ink} size={22} />
        </View>
      </Pressable>

      {/* This month in three real counts, straight from the record categories (docs/01 8.30). */}
      {state.events.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { n: month.length, unit: t("篇"), label: t("本月记录"), bg: colors.yellow, radius: { borderBottomLeftRadius: 32 } },
            { n: month.filter((e) => e.category === "snack").length, unit: t("次"), label: t("本月零食"), bg: colors.mint, radius: {} },
            { n: month.filter((e) => e.category === "chaos").length, unit: t("次"), label: t("本月拆家"), bg: colors.lavender, radius: { borderTopLeftRadius: 32 } },
          ].map((s) => (
            <View
              key={s.label}
              accessible
              accessibilityLabel={`${s.label} ${s.n}${s.unit}`}
              style={[{ flex: 1, backgroundColor: s.bg, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12 }, s.radius]}
            >
              <Text style={{ fontFamily: numeric, fontSize: narrow ? 30 : 38, lineHeight: narrow ? 36 : 46, color: colors.ink }}>
                {s.n}
                <Text style={{ fontFamily: undefined, fontSize: 12, fontWeight: "800" }}> {s.unit}</Text>
              </Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.ink }}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* A new home sees how to start on the first screen, ahead of the 爪约 (docs/01 8.26). */}
      {!state.events.length && (
        <Empty
          title={t("今天的故事还空着")}
          action={<Button label={t("写第一条日记")} onPress={() => router.push("/record")} />}
        />
      )}
      <PawDatesCard />
      <OccasionPreview />
      {state.events.length > 0 && <>
      <View style={[styles.between, { marginTop: 4 }]}>
        <View>
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: -4, right: -6, bottom: 3, height: 10, backgroundColor: colors.yellow }}
          />
          <Text style={[styles.h2, { fontSize: 26, lineHeight: 34 }]}>{t("最近发生")}</Text>
        </View>
        <Button label={t("翻开爪册")} tone="plain" onPress={() => router.push("/profile")} />
      </View>
        <View style={{ gap: 20 }}>
          {newestEvents(state.events).slice(0, 3).map((e, i) => (
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
              <Tape color={i % 2 ? colors.lavender : colors.orange} rotate={i % 2 ? 5 : -5} />
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
                  {formatDate(eventDate(e).toISOString())} · {e.published ? t("已发爪友圈") : t("只在日记里")}
                </Text>
                <Text style={[styles.h2, { fontSize: 18, lineHeight: 26 }]} numberOfLines={2}>
                  {e.stories[e.selectedStyle].title}
                </Text>
                <Text style={styles.muted} numberOfLines={2}>
                  {t("{owner}说：{text}", { owner: ownerName(e.petSnapshot), text: e.description })}
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
      </>}
      <HomeLetters />
      <BackupNudge />
      <PastMemories />
      {state.preferences?.homeExtras === true && (
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
                  shadow(5),
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
              </View>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
