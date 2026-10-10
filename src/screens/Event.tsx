import { t } from "../i18n";
import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../data/store";
import { STYLES, StoryStyle, formatDate } from "../domain/types";
import { deleteEvent } from "../domain/life";
import {
  Avatar,
  Bubble,
  Button,
  Chip,
  Empty,
  Heading,
  Icon,
  Tape,
  colors,
  display,
  shadow,
  styles,
} from "../components/ui";
import { ownerName } from "../domain/story-engine";
const tones: Record<StoryStyle, string> = {
  diary: colors.yellow,
  life: colors.green,
  social: colors.pink,
  news: colors.sky,
};
export default function Event() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, update, notify } = useStore();
  const event = state.events.find((e) => e.id === id);
  const [style, setStyle] = useState<StoryStyle>(
    event?.selectedStyle ?? "diary",
  );
  const [confirm, setConfirm] = useState(false);
  if (!event)
    return (
      <Empty
        title={t("这条记录已移除")}
        subtitle={t("在手账中查看其他记录。")}
        action={
          <Button label={t("返回档案")} onPress={() => router.replace("/profile")} />
        }
      />
    );
  const labels: Record<StoryStyle, string> = {
    diary: t("内心独白"),
    life: event.petSnapshot.route === "work" ? t("打工日记") : t("校园日记"),
    social: t("毛圈动态"),
    news: t("今日喵闻"),
  };
  return (
    <View
      style={{
        ...styles.stack,
        maxWidth: 800,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <Heading
        title={t("这一天")}
        eyebrow={`${formatDate(event.createdAt)} · ${t(event.petSnapshot.role)}`}
        accent={tones[style]}
        action={
          <Button label={t("返回手账")} tone="plain" onPress={() => router.replace("/profile")} />
        }
      />
      {event.photo && (
        <View
          style={[
            {
              backgroundColor: "#FFF",
              padding: 10,
              paddingBottom: 30,
              borderWidth: 1.5,
              borderColor: colors.edge,
              transform: [{ rotate: "-1.2deg" }],
              marginTop: 6,
            },
            shadow(5),
          ]}
        >
          <Tape color={colors.pink} />
          <Image
            source={{ uri: event.photo }}
            style={{ width: "100%", height: 300 }}
            resizeMode="cover"
          />
        </View>
      )}
      <View style={{ gap: 8 }}>
        <View style={[styles.row, { justifyContent: "flex-end", gap: 8 }]}>
          <Text style={styles.caps}>{t("{owner}的原话", { owner: ownerName(event.petSnapshot) })}</Text>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              borderWidth: 1.5,
              borderColor: colors.edge,
              backgroundColor: colors.paper,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="user" size={18} color={colors.ink} />
          </View>
        </View>
        <Bubble tail="right">
          <Text style={[styles.body, { fontSize: 16 }]}>{event.description}</Text>
        </Bubble>
      </View>
      <View style={{ gap: 8, marginTop: 6 }}>
        <View style={[styles.row, { gap: 8 }]}>
          <Avatar pet={event.petSnapshot} demo={state.demo} size={34} />
          <Text style={styles.caps}>{t("{name}说", { name: event.petSnapshot.name })}</Text>
        </View>
        <Bubble tail="left" bg={tones[style]}>
          <Text style={{ fontSize: 22, lineHeight: 32, fontWeight: "700", fontFamily: display, color: colors.ink, marginBottom: 8 }}>
            {event.stories[style].title}
          </Text>
          <Text style={[styles.body, { fontSize: 16, lineHeight: 29 }]}>
            {event.stories[style].text}
          </Text>
        </Bubble>
      </View>
      <View style={{ gap: 14, marginTop: 6 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {STYLES.map((s) => (
            <Chip
              key={s}
              label={labels[s]}
              color={tones[s]}
              active={style === s}
              onPress={() => setStyle(s)}
            />
          ))}
        </View>
        <Text style={styles.small}>
          {event.stories[style].generator === "ai" ? t("AI 生成") : t("本机生成")}{event.stories[style].edited ? t(" · 主人润色过") : ""} ·
          {t("采用保存当天的人设")}{style === "news" ? t(" · 虚构娱乐报道") : ""}
        </Text>
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Button
            label={t("制作喵闻卡")}
            icon="file-text"
            tone="soft"
            onPress={() =>
              router.push({ pathname: "/news", params: { id: event.id } })
            }
          />
          <Button
            label={t("删除记录")}
            icon="trash-2"
            tone="danger"
            onPress={() => setConfirm(true)}
          />
        </View>
        {confirm && (
          <View
            style={{
              gap: 12,
              backgroundColor: colors.pale,
              borderWidth: 1.5,
              borderColor: colors.edge,
              padding: 16,
              borderRadius: 12,
            }}
          >
            <Text style={styles.body}>
              {t("删除这件小事？关联故事、本机动态和新闻将一起移除，成长减少 20 XP。")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <Button
                label={t("确认删除这条记录")}
                tone="danger"
                onPress={() => {
                  update((s) => deleteEvent(s, event.id));
                  notify(t("记录已删除，成长已重新计算。"));
                  router.replace("/profile");
                }}
              />
              <Button
                label={t("取消")}
                tone="plain"
                onPress={() => setConfirm(false)}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
