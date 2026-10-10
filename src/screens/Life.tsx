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
  colors,
  styles,
} from "../components/ui";
import Onboarding from "./Onboarding";
import { ageLabel, speciesLabel } from "../domain/pet-profile";
export default function Life() {
  const { state } = useStore();
  const { width } = useWindowDimensions();
  if (!state.pet) return <Onboarding />;
  const pet = state.pet,
    p = progress(state.events),
    work = pet.route === "work",
    accent = work ? colors.jade : colors.lavender;
  return (
    <View style={styles.stack}>
      <Heading
        title="毛孩人生"
        eyebrow={work ? "CAREER CLUB / 职场路线" : "CAMPUS CLUB / 校园路线"}
      />
      <View
        style={{ flexDirection: width >= 1100 ? "row" : "column", gap: 22 }}
      >
        <View
          style={{
            flex: width >= 1100 ? 1.3 : undefined,
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: work ? colors.green : "#EAE4F8",
            borderWidth: 1,
            borderColor: accent,
          }}
        >
          <View style={{ backgroundColor: accent, padding: 20, gap: 4 }}>
            <Text style={{ color: "#FFF", fontSize: 11, letterSpacing: 3 }}>
              {work ? "PAW LIFE GROUP" : "PAW LIFE ACADEMY"}
            </Text>
            <Text style={{ color: "#FFF", fontSize: 24, fontWeight: "800" }}>
              {work ? "员工通行证" : "学生通行证"}{" "}
              <Text style={{ fontSize: 13 }}> / PASS</Text>
            </Text>
          </View>
          <View style={{ padding: 24, gap: 24 }}>
            <View style={[styles.row, { gap: 20 }]}>
              <Portrait
                pet={pet}
                demo={state.demo}
                size={width < 500 ? 82 : 110}
              />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.h1, { fontSize: 29 }]}>{pet.name}</Text>
                <Text style={styles.body}>{pet.role}</Text>
                <Text style={styles.small}>
                  {speciesLabel(pet)} · {ageLabel(pet.ageMonths)}
                </Text>
                <Text style={styles.small}>{pet.personality}</Text>
              </View>
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderStyle: "dashed",
                borderColor: accent,
                paddingTop: 20,
                gap: 12,
              }}
            >
              <View style={styles.between}>
                <View>
                  <Text style={styles.small}>当前身份</Text>
                  <Text style={styles.h2}>{titleFor(p.level, pet.route)}</Text>
                </View>
                <Text
                  style={{ color: accent, fontSize: 34, fontWeight: "900" }}
                >
                  Lv.{p.level}
                </Text>
              </View>
              <Text style={[styles.small, { letterSpacing: 2, color: accent }]}>
                ID {pet.id.slice(-8).toUpperCase()} ·{" "}
                {state.demo ? "示例" : "毛孩市"}
              </Text>
            </View>
          </View>
        </View>
        <Card
          style={{
            flex: width >= 1100 ? 1 : undefined,
            gap: 20,
            justifyContent: "center",
          }}
        >
          <Icon name="flag" size={28} color={accent} />
          <Text style={styles.h2}>下一站，Lv.{p.level + 1}</Text>
          <Text style={{ fontSize: 48, fontWeight: "800", color: accent }}>
            {p.xp}
            <Text style={{ fontSize: 17 }}> XP</Text>
          </Text>
          <Meter value={p.current} color={accent} />
          <Text style={styles.body}>还差 {p.toNext} XP · 每条新记录 +20</Text>
          <Button
            label="添一段经历"
            icon="plus"
            onPress={() => router.push("/record")}
          />
        </Card>
      </View>
      <Text style={styles.h2}>成长路线</Text>
      <View style={{ paddingHorizontal: 12 }}>
        {[
          { at: 1, name: work ? "第一次营业" : "第一次入学" },
          { at: 3, name: work ? "正式营业员" : "校园活跃分子" },
          { at: 5, name: work ? "资深摸鱼专家" : "校园传说" },
        ].map((m, i) => (
          <View key={m.at} style={{ flexDirection: "row", gap: 20 }}>
            <View style={{ alignItems: "center", width: 42 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  backgroundColor: p.level >= m.at ? accent : colors.line,
                  borderRadius: 21,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Icon
                  name={p.level >= m.at ? "check" : "lock"}
                  size={18}
                  color={p.level >= m.at ? "#FFF" : colors.muted}
                />
              </View>
              {i < 2 && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 36,
                    backgroundColor: colors.line,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: 30, paddingTop: 6, gap: 3 }}>
              <Text
                style={[
                  styles.h2,
                  { color: p.level >= m.at ? colors.ink : colors.muted },
                ]}
              >
                {m.name}
              </Text>
              <Text style={styles.small}>
                Lv.{m.at} ·{" "}
                {p.level >= m.at ? "已解锁" : `${(m.at - 1) * 100} XP 解锁`}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
