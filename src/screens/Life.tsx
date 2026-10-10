import React from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { progress, titleFor } from "../domain/life";
import {
  Button,
  Card,
  Heading,
  Icon,
  Meter,
  Portrait,
  Stamp,
  Wobble,
  colors,
  display,
  shadow,
  styles,
} from "../components/ui";
import Onboarding from "./Onboarding";
import { ageLabel, speciesLabel } from "../domain/pet-profile";

// Bar widths for the pass's decorative barcode, derived from the pet id so each pass differs.
const bars = (seed: string) =>
  Array.from({ length: 26 }, (_, i) => 1 + ((seed.charCodeAt(i % seed.length) + i * 7) % 4));

export default function Life() {
  const { state } = useStore();
  const { width } = useWindowDimensions();
  if (!state.pet) return <Onboarding />;
  const pet = state.pet,
    p = progress(state.events),
    work = pet.route === "work",
    accent = work ? colors.jade : colors.lavender,
    soft = work ? colors.green : colors.lilac,
    wide = width >= 1100;
  const steps = [
    { at: 1, name: work ? "第一次营业" : "第一次入学" },
    { at: 3, name: work ? "正式营业员" : "校园活跃分子" },
    { at: 5, name: work ? "资深摸鱼专家" : "校园传说" },
  ];
  const notch = {
    position: "absolute" as const,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.edge,
    top: -13,
  };
  return (
    <View style={styles.stack}>
      <Heading
        title="毛孩人生"
        eyebrow={work ? "职场路线 · CAREER" : "校园路线 · CAMPUS"}
        accent={soft}
      />
      <View style={{ flexDirection: wide ? "row" : "column", gap: 26 }}>
        <View
          style={[
            {
              flex: wide ? 1.3 : undefined,
              borderRadius: 22,
              backgroundColor: soft,
              borderWidth: 1.5,
              borderColor: colors.edge,
              transform: [{ rotate: "-1deg" }],
            },
            shadow(6, accent),
          ]}
        >
          <View
            style={{
              backgroundColor: accent,
              padding: 18,
              borderTopLeftRadius: 19,
              borderTopRightRadius: 19,
              borderBottomWidth: 2,
              borderColor: colors.edge,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text style={{ color: "#FFF", fontSize: 11, letterSpacing: 3, fontWeight: "700" }}>
                {work ? "PAWNOTE GROUP" : "PAWNOTE ACADEMY"}
              </Text>
              <Text style={{ color: "#FFF", fontSize: 28, fontWeight: "700", fontFamily: display }}>
                {work ? "员工通行证" : "学生通行证"}
              </Text>
            </View>
            <Icon name={work ? "briefcase" : "book"} color="#FFF" size={30} />
          </View>
          <View style={{ padding: 22, paddingTop: 30, flexDirection: "row", gap: 20, alignItems: "center" }}>
            <Portrait pet={pet} demo={state.demo} size={width < 500 ? 88 : 116} rotate={-4} tape={colors.yellow} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                numberOfLines={2}
                style={[styles.h1, { fontSize: 34, lineHeight: 42 }]}
              >
                {pet.name}
              </Text>
              <Text style={[styles.body, { fontWeight: "700" }]}>{pet.role}</Text>
              <Text style={[styles.small, { color: colors.ink }]}>
                {speciesLabel(pet)} · {ageLabel(pet.ageMonths)}
              </Text>
              <Text style={[styles.small, { color: colors.ink }]} numberOfLines={2}>
                {pet.personality}
              </Text>
            </View>
          </View>
          <View
            style={{
              borderTopWidth: 2,
              borderStyle: "dashed",
              borderColor: colors.edge,
              padding: 22,
              gap: 14,
            }}
          >
            <View style={[notch, { left: -15 }]} />
            <View style={[notch, { right: -15 }]} />
            <View style={styles.between}>
              <View style={{ flex: 1 }}>
                <Text style={styles.caps}>当前身份</Text>
                <Text style={[styles.h2, { fontSize: 24, lineHeight: 34 }]}>
                  {titleFor(p.level, pet.route)}
                </Text>
              </View>
              <Wobble>
                <Stamp
                  top={state.demo ? "示例" : "毛孩市"}
                  main={`Lv.${p.level}`}
                  color={colors.orange}
                  size={78}
                  rotate={0}
                />
              </Wobble>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 2, height: 34, alignItems: "stretch" }}>
                {bars(pet.id).map((w, i) => (
                  <View key={i} style={{ width: w, backgroundColor: colors.ink }} />
                ))}
              </View>
              <Text style={[styles.caps, { letterSpacing: 3 }]}>
                {pet.id.slice(-8).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        <Card
          style={{
            flex: wide ? 1 : undefined,
            gap: 16,
            justifyContent: "center",
            backgroundColor: colors.yellow,
          }}
        >
          <View style={styles.between}>
            <Text style={styles.caps}>下一站 · Lv.{p.level + 1}</Text>
            <Icon name="flag" size={24} color={colors.ink} />
          </View>
          <Text style={{ fontSize: 68, lineHeight: 76, fontWeight: "700", fontFamily: display, color: colors.ink }}>
            {p.xp}
            <Text style={{ fontSize: 20 }}> XP</Text>
          </Text>
          <Meter value={p.current} color={accent} />
          <Text style={[styles.body, { fontWeight: "600" }]}>
            还差 {p.toNext} XP · 每条新记录 +20
          </Text>
          <Button label="添一段经历" icon="plus" onPress={() => router.push("/record")} />
        </Card>
      </View>
      <View style={{ alignSelf: "flex-start", marginTop: 6 }}>
        <View
          pointerEvents="none"
          style={{ position: "absolute", left: -4, right: -6, bottom: 3, height: 10, backgroundColor: soft }}
        />
        <Text style={[styles.h2, { fontSize: 26, lineHeight: 34 }]}>成长路线</Text>
      </View>
      <View style={{ gap: 16 }}>
        {steps.map((m, i) => {
          const done = p.level >= m.at;
          return (
            <View
              key={m.at}
              style={{
                flexDirection: i % 2 ? "row-reverse" : "row",
                alignItems: "center",
                gap: 16,
              }}
            >
              <View
                style={[
                  {
                    width: 78,
                    height: 78,
                    borderRadius: 39,
                    backgroundColor: done ? accent : colors.paper,
                    borderWidth: 1.5,
                    borderColor: colors.edge,
                    borderStyle: done ? "solid" : "dashed",
                    justifyContent: "center",
                    alignItems: "center",
                  },
                  done && shadow(3),
                ]}
              >
                <Text
                  style={{
                    fontFamily: display,
                    fontWeight: "700",
                    fontSize: 34,
                    color: done ? "#FFF" : colors.muted,
                  }}
                >
                  {m.at}
                </Text>
              </View>
              <View
                style={[
                  {
                    flex: 1,
                    backgroundColor: done ? soft : colors.paper,
                    borderWidth: 1.5,
                    borderColor: colors.edge,
                    borderStyle: done ? "solid" : "dashed",
                    borderRadius: 16,
                    padding: 14,
                    transform: [{ rotate: `${i % 2 ? 1 : -1}deg` }],
                  },
                ]}
              >
                <Text style={[styles.h2, { color: done ? colors.ink : colors.muted }]}>
                  {m.name}
                </Text>
                <View style={[styles.row, { gap: 6 }]}>
                  <Icon name={done ? "check" : "lock"} size={14} color={done ? accent : colors.muted} />
                  <Text style={styles.small}>
                    Lv.{m.at} · {done ? "已解锁" : `${(m.at - 1) * 100} XP 解锁`}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
