import React from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { progress, titleFor } from "../domain/life";
import { Avatar, Button, Card, Tag, colors, styles } from "../components/ui";
import Onboarding from "./Onboarding";
export default function Life() {
  const { state } = useStore();
  const { width } = useWindowDimensions();
  if (!state.pet) return <Onboarding />;
  const pet = state.pet,
    p = progress(state.events),
    work = pet.route === "work";
  return (
    <View style={styles.stack}>
      <View>
        <Text style={styles.h1}>毛孩人生</Text>
        <Text style={styles.muted}>真实的小日常，慢慢长成它的人生履历。</Text>
      </View>
      <View
        style={{ flexDirection: width >= 1000 ? "row" : "column", gap: 24 }}
      >
        <Card
          style={{
            flex: 1,
            backgroundColor: work ? "#EAF0E5" : "#F8ECD8",
            gap: 26,
            borderColor: work ? "#D9E3D2" : "#EEDCBF",
          }}
        >
          <View style={styles.between}>
            <Text
              style={[styles.small, { letterSpacing: 2, color: "#6B7F62" }]}
            >
              {work ? "PAW LIFE GROUP" : "PAW LIFE ACADEMY"}
            </Text>
            <Tag>{work ? "正式员工证" : "毛孩学生证"}</Tag>
          </View>
          <View style={styles.row}>
            <Avatar pet={pet} demo={state.demo} size={95} />
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={[styles.h1, { fontSize: 31 }]}>{pet.name}</Text>
              <Text style={styles.body}>{pet.role}</Text>
              <Text style={styles.small}>
                {pet.species === "cat" ? "猫猫居民" : "狗狗居民"} ·{" "}
                {pet.personality}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.between}>
            <View>
              <Text style={styles.small}>当前身份</Text>
              <Text style={styles.h2}>{titleFor(p.level, pet.route)}</Text>
            </View>
            <Text
              style={{ fontSize: 36, fontWeight: "800", color: colors.ink }}
            >
              Lv.{p.level}
            </Text>
          </View>
          <Text style={[styles.small, { letterSpacing: 1 }]}>
            RESIDENT · {pet.id.slice(-8).toUpperCase()}
          </Text>
        </Card>
        <Card style={{ flex: 1, gap: 22 }}>
          <Text style={styles.h2}>把成长写进每一天</Text>
          <View style={styles.between}>
            <Text style={styles.body}>累计经验</Text>
            <Text style={styles.h2}>{p.xp} XP</Text>
          </View>
          <View
            style={{
              height: 9,
              backgroundColor: "#F0F1EB",
              borderRadius: 9,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${p.current}%`,
                height: "100%",
                backgroundColor: "#8DA57B",
              }}
            />
          </View>
          <Text style={styles.muted}>再积累 {p.toNext} XP，领取下一等级。</Text>
          <Text style={styles.body}>
            记录一件真实小事 +20 XP。{"\n"}换口吻和分享保留当前经验。
          </Text>
          <Button
            label="添加一段新经历"
            icon="plus"
            onPress={() => router.push("/record")}
          />
        </Card>
      </View>
      <Text style={styles.h2}>人生里程碑</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {[
          { at: 1, level: "Lv.1", name: work ? "第一次营业" : "第一次入学" },
          { at: 3, level: "Lv.3", name: work ? "正式营业员" : "校园活跃分子" },
          { at: 5, level: "Lv.5", name: work ? "资深摸鱼专家" : "校园传说" },
        ].map((m) => (
          <Card
            key={m.at}
            style={{
              flexGrow: 1,
              flexBasis: 210,
              gap: 12,
              opacity: p.level >= m.at ? 1 : 0.65,
            }}
          >
            <Text style={{ fontSize: 25 }}>
              {p.level >= m.at ? "🏅" : "🔒"}
            </Text>
            <Text style={styles.h2}>{m.name}</Text>
            <Text style={styles.small}>
              {m.level} · {p.level >= m.at ? "已解锁" : "继续积累真实日常"}
            </Text>
          </Card>
        ))}
      </View>
      <Text style={styles.small}>
        称号由记录成长解锁。学校、公司和好友共同故事将在后续版本开放。
      </Text>
    </View>
  );
}
