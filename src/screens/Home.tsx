import React from "react";
import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { progress, titleFor } from "../domain/life";
import { selfName, toPetVoice } from "../domain/story-engine";
import { formatDate } from "../domain/types";
import {
  Bubble,
  Button,
  Empty,
  Icon,
  Meter,
  Portrait,
  Stamp,
  Sticker,
  Tape,
  Wobble,
  colors,
  display,
  shadow,
  styles,
} from "../components/ui";
import Neighborhood from "../components/Neighborhood";
import Onboarding from "./Onboarding";

// The poster changes with the hour, the way a pet's day does.
function moment(hour: number) {
  if (hour < 6) return { bg: colors.lilac, fg: colors.ink, label: "深夜档", line: "嘘，夜间巡逻中。", icon: "moon" as const };
  if (hour < 11) return { bg: colors.yellow, fg: colors.ink, label: "早安档", line: "早，今天的早饭呢？", icon: "sun" as const };
  if (hour < 14) return { bg: colors.pale, fg: colors.ink, label: "午间档", line: "中午了，适合找块太阳躺下。", icon: "sun" as const };
  if (hour < 18) return { bg: colors.pink, fg: colors.ink, label: "下午档", line: "下午的风不错，我批准了。", icon: "coffee" as const };
  return { bg: colors.green, fg: colors.ink, label: "晚间档", line: "你回来啦？我可没有在等你。", icon: "moon" as const };
}
const notes = [colors.paper, colors.sky, colors.yellow, colors.green];

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
  const saying = latest
    ? toPetVoice(latest.petSnapshot, latest.description).text
    : m.line;
  return (
    <View style={styles.stack}>
      <View
        style={[
          {
            backgroundColor: m.bg,
            borderRadius: 28,
            borderWidth: 1.5,
            borderColor: colors.edge,
            padding: narrow ? 20 : 30,
            gap: 18,
            overflow: "hidden",
          },
          shadow(6),
        ]}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: -60,
            top: -60,
            width: 220,
            height: 220,
            borderRadius: 110,
            borderWidth: 1.5,
            borderColor: colors.edge,
            backgroundColor: "#FFFFFF33",
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: -20,
            top: -20,
            width: 140,
            height: 140,
            borderRadius: 70,
            borderWidth: 1.5,
            borderColor: colors.edge,
            borderStyle: "dashed",
          }}
        />
        <View style={styles.between}>
          <Sticker bg={colors.paper} rotate={-3}>
            {now.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" })}
            {" · "}
            {m.label}
          </Sticker>
          <Icon name={m.icon} color={m.fg} size={24} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 14 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.caps, { color: m.fg, opacity: 0.85 }]}>
              今日主角
            </Text>
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              style={{
                fontFamily: display,
                fontWeight: "700",
                color: m.fg,
                fontSize: narrow ? 52 : 76,
                lineHeight: narrow ? 62 : 88,
              }}
            >
              {pet.name}
            </Text>
            <Text style={{ color: m.fg, fontSize: 14, fontWeight: "600" }}>
              {titleFor(p.level, pet.route)} · {pet.personality}
            </Text>
          </View>
          <View style={{ marginBottom: 8, marginRight: 6 }}>
            <Portrait pet={pet} demo={state.demo} size={narrow ? 96 : 140} tape={colors.sky} />
            <Wobble style={{ position: "absolute", left: -34, bottom: -22 }}>
              <Stamp
                top="PAWNOTE"
                main={`Lv.${p.level}`}
                color={colors.ink}
                size={66}
                rotate={0}
                style={{ backgroundColor: colors.paper }}
              />
            </Wobble>
          </View>
        </View>
        <Bubble tail="right" bg={colors.paper} style={{ marginTop: 6, marginBottom: 8 }}>
          <Text style={[styles.caps, { color: colors.orange, marginBottom: 4 }]}>
            {pet.name}说
          </Text>
          <Text numberOfLines={3} style={[styles.body, { fontSize: 16, fontWeight: "600" }]}>
            {saying}
          </Text>
        </Bubble>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="记录今天，翻成宠物的话"
        onPress={() => router.push("/record")}
        style={({ pressed }) => [
          {
            backgroundColor: colors.paper,
            borderWidth: 1.5,
            borderColor: colors.edge,
            borderRadius: 28,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
          shadow(pressed ? 2 : 5, colors.orange),
        ]}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.yellow,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="edit-3" color={colors.ink} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.ink, fontSize: 20, fontWeight: "700", fontFamily: display }}>
            它今天干了啥？
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
            你照实写，{pet.name}自己用{selfName(pet) === "我" ? "它" : selfName(pet)}的口吻再说一遍
          </Text>
        </View>
        <Icon name="arrow-right" color={colors.orange} size={24} />
      </Pressable>

      <View style={{ flexDirection: wide ? "row" : "column", gap: 24 }}>
        <View style={{ flex: wide ? 1.3 : undefined }}>
          <Neighborhood work={pet.route === "work"} />
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 24 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {[
              { n: p.xp, unit: "XP", label: "成长经验", bg: colors.green },
              { n: state.events.length, unit: "篇", label: "生活片刻", bg: colors.sky },
              { n: p.toNext, unit: "XP", label: "离升级还差", bg: colors.lilac },
            ].map((s, i) => (
              <View
                key={s.label}
                style={[
                  {
                    flex: 1,
                    backgroundColor: s.bg,
                    borderWidth: 1.5,
                    borderColor: colors.edge,
                    borderRadius: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    transform: [{ rotate: `${[-2, 1.5, -1][i]}deg` }],
                  },
                  shadow(3),
                ]}
              >
                <Text style={{ fontFamily: display, fontWeight: "700", fontSize: 30, lineHeight: 36, color: colors.ink }}>
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
              <Text style={styles.small}>每条新记录 +20 XP</Text>
            </View>
            <Meter value={p.current} color={colors.orange} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={latest ? "制作最新记录的喵闻" : "记录小事制作喵闻"}
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
                  borderWidth: 1.5,
                  borderColor: colors.edge,
                  borderRadius: 22,
                  padding: 20,
                  gap: 10,
                  transform: [{ rotate: "1deg" }],
                },
                shadow(5, colors.lavender),
              ]}
            >
              <View style={styles.between}>
                <Text style={styles.caps}>THE PAW TIMES · 独家</Text>
                <Icon name="arrow-up-right" color={colors.ink} />
              </View>
              <Text
                style={{
                  fontSize: 40,
                  lineHeight: 50,
                  fontWeight: "700",
                  fontFamily: display,
                  color: colors.ink,
                  letterSpacing: 4,
                  borderBottomWidth: 3,
                  borderTopWidth: 1,
                  borderColor: colors.ink,
                  paddingVertical: 4,
                }}
              >
                今日喵闻
              </Text>
              <Text style={[styles.h2, { fontSize: 19 }]} numberOfLines={3}>
                {latest ? latest.stories.news.title : "头条，等你来写"}
              </Text>
              <Text style={styles.small}>点开做成新闻卡 · 虚构娱乐报道</Text>
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
          <Text style={[styles.h2, { fontSize: 26, lineHeight: 34 }]}>最近发生</Text>
        </View>
        <Button label="翻开手账" tone="plain" onPress={() => router.push("/profile")} />
      </View>
      {state.events.length ? (
        <View style={{ gap: 20 }}>
          {state.events.slice(0, 3).map((e, i) => (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={`查看记录：${e.description}`}
              onPress={() => router.push({ pathname: "/event", params: { id: e.id } })}
              style={({ pressed }) => [
                {
                  backgroundColor: notes[i % notes.length],
                  borderWidth: 1.5,
                  borderColor: colors.edge,
                  borderRadius: 22,
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
                  fontWeight: "700",
                  fontFamily: display,
                  width: 52,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </Text>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.small}>
                  {formatDate(e.createdAt)} · {e.published ? "本机毛圈" : "私密"}
                </Text>
                <Text style={[styles.h2, { fontSize: 18, lineHeight: 26 }]} numberOfLines={2}>
                  {e.stories[e.selectedStyle].title}
                </Text>
                <Text style={styles.muted} numberOfLines={2}>
                  主人说：{e.description}
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
          title="今天的故事还空着"
          action={<Button label="写第一条日记" onPress={() => router.push("/record")} />}
        />
      )}
    </View>
  );
}
