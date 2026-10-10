import React from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { progress, titleFor } from "../domain/life";
import { formatDate } from "../domain/types";
import {
  Button,
  Card,
  Empty,
  Heading,
  Icon,
  Meter,
  Portrait,
  Tag,
  colors,
  styles,
} from "../components/ui";
import Neighborhood from "../components/Neighborhood";
import Onboarding from "./Onboarding";
export default function Home() {
  const { state } = useStore();
  const { width } = useWindowDimensions();
  if (!state.pet) return <Onboarding />;
  const pet = state.pet,
    p = progress(state.events),
    latest = state.events[0],
    wide = width >= 1100;
  return (
    <View style={styles.stack}>
      <Heading
        title="生活街区"
        eyebrow={new Date().toLocaleDateString("zh-CN", {
          month: "long",
          day: "numeric",
          weekday: "long",
        })}
        action={
          <Button
            label="记一笔"
            icon="plus"
            onPress={() => router.push("/record")}
          />
        }
      />
      <View style={{ flexDirection: wide ? "row" : "column", gap: 22 }}>
        <View style={{ flex: wide ? 1.4 : undefined, gap: 22 }}>
          <View
            style={{
              backgroundColor: colors.yellow,
              borderRadius: 24,
              padding: width < 500 ? 22 : 30,
              gap: 22,
              overflow: "hidden",
            }}
          >
            <View style={styles.between}>
              <Text
                style={{
                  fontSize: 12,
                  letterSpacing: 2,
                  fontWeight: "700",
                  color: colors.ink,
                }}
              >
                今日主角 / THE MAIN CHARACTER
              </Text>
              <Icon name="sun" color={colors.ink} />
            </View>
            <View style={[styles.row, { alignItems: "center", gap: 18 }]}>
              <View style={{ flex: 1, gap: 8 }}>
                <Text
                  style={[
                    styles.h1,
                    {
                      fontSize: width < 500 ? 34 : 48,
                      lineHeight: width < 500 ? 45 : 60,
                    },
                  ]}
                >
                  {pet.name}
                </Text>
                <Text style={styles.body}>{pet.personality}</Text>
                <Tag
                  style={{ backgroundColor: "#FFFDF7BB", color: colors.ink }}
                >
                  {titleFor(p.level, pet.route)}
                </Tag>
              </View>
              <Portrait
                pet={pet}
                demo={state.demo}
                size={width < 500 ? 91 : 132}
              />
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderColor: "#242B2940",
                paddingTop: 16,
                flexDirection: "row",
                gap: 22,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.h2, { fontSize: 26 }]}>Lv.{p.level}</Text>
                <Text style={[styles.small, { color: colors.ink }]}>
                  {pet.role}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.h2, { fontSize: 26 }]}>
                  {state.events.length}
                </Text>
                <Text style={[styles.small, { color: colors.ink }]}>
                  段生活片刻
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.h2, { fontSize: 26 }]}>{p.xp}</Text>
                <Text style={[styles.small, { color: colors.ink }]}>
                  成长经验 XP
                </Text>
              </View>
            </View>
          </View>
          <Neighborhood work={pet.route === "work"} />
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 20 }}>
          <Card
            style={{
              backgroundColor: colors.ink,
              borderColor: colors.ink,
              gap: 15,
            }}
          >
            <View style={styles.between}>
              <Text style={[styles.h2, { color: colors.paper }]}>成长存折</Text>
              <Icon name="trending-up" color={colors.green} />
            </View>
            <View style={styles.between}>
              <Text
                style={{ color: colors.green, fontSize: 30, fontWeight: "800" }}
              >
                {p.xp} <Text style={{ fontSize: 14 }}>XP</Text>
              </Text>
              <Text style={{ color: colors.paper, fontSize: 12 }}>
                下一等级还差 {p.toNext}
              </Text>
            </View>
            <Meter value={p.current} color={colors.yellow} />
            <Text style={{ color: "#C9CEBF", fontSize: 12 }}>
              每条新记录 +20 XP
            </Text>
          </Card>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              latest ? "制作最新记录的喵闻" : "记录小事制作喵闻"
            }
            onPress={() =>
              latest
                ? router.push({ pathname: "/news", params: { id: latest.id } })
                : router.push("/record")
            }
          >
            <View
              style={{
                backgroundColor: colors.paper,
                borderWidth: 1,
                borderColor: colors.ink,
                padding: 22,
                gap: 12,
                boxShadow: "4px 4px 0px #DAD9CC",
              }}
            >
              <View style={styles.between}>
                <Text
                  style={[
                    styles.small,
                    { color: colors.ink, letterSpacing: 2 },
                  ]}
                >
                  THE PAW TIMES
                </Text>
                <Icon name="arrow-up-right" color={colors.ink} />
              </View>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "900",
                  color: colors.ink,
                  borderBottomWidth: 3,
                  borderColor: colors.ink,
                  paddingBottom: 10,
                }}
              >
                今日喵闻
              </Text>
              <Text style={styles.h2} numberOfLines={3}>
                {latest ? latest.stories.news.title : "头条，等你来写"}
              </Text>
              <Text style={styles.small}>个人新闻卡 · 模板娱乐报道</Text>
            </View>
          </Pressable>
        </View>
      </View>
      <View style={styles.between}>
        <Text style={styles.h2}>最近发生</Text>
        <Button
          label="翻开日记本 →"
          tone="plain"
          onPress={() => router.push("/profile")}
        />
      </View>
      {state.events.length ? (
        state.events.slice(0, 3).map((e, i) => (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            accessibilityLabel={`查看记录：${e.description}`}
            onPress={() =>
              router.push({ pathname: "/event", params: { id: e.id } })
            }
          >
            <View
              style={{
                flexDirection: "row",
                gap: 16,
                paddingVertical: 18,
                borderTopWidth: 1,
                borderColor: colors.line,
              }}
            >
              <Text
                style={{
                  color: colors.orange,
                  fontSize: 27,
                  fontWeight: "800",
                  width: 40,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </Text>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={styles.small}>
                  {formatDate(e.createdAt)} ·{" "}
                  {e.published ? "本机毛圈" : "私密"}
                </Text>
                <Text style={styles.h2} numberOfLines={1}>
                  {e.stories[e.selectedStyle].title}
                </Text>
                <Text style={styles.muted} numberOfLines={2}>
                  {e.description}
                </Text>
              </View>
              <Icon name="arrow-up-right" color={colors.ink} />
            </View>
          </Pressable>
        ))
      ) : (
        <Empty
          title="今天的故事还空着"
          action={
            <Button
              label="写第一条日记"
              onPress={() => router.push("/record")}
            />
          }
        />
      )}
    </View>
  );
}
