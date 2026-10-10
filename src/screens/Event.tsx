import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../data/store";
import { STYLES, StoryStyle, formatDate } from "../domain/types";
import { deleteEvent } from "../domain/life";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Empty,
  Tag,
  styles,
} from "../components/ui";
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
        title="这条记录已移除"
        subtitle="在手账中查看其他记录。"
        action={
          <Button label="返回档案" onPress={() => router.replace("/profile")} />
        }
      />
    );
  const labels: Record<StoryStyle, string> = {
    diary: "内心独白",
    life: event.petSnapshot.route === "work" ? "打工日记" : "校园日记",
    social: "毛圈动态",
    news: "今日喵闻",
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
      <View style={styles.between}>
        <Text style={styles.h1}>这一天的日记</Text>
        <Button
          label="返回档案"
          tone="plain"
          onPress={() => router.replace("/profile")}
        />
      </View>
      <Card style={{ gap: 18 }}>
        <View style={styles.row}>
          <Avatar pet={event.petSnapshot} demo={state.demo} />
          <View>
            <Text style={styles.h2}>{event.petSnapshot.name}</Text>
            <Text style={styles.small}>
              {formatDate(event.createdAt)} · {event.petSnapshot.role}
            </Text>
          </View>
        </View>
        <Tag>真实日常</Tag>
        <Text style={styles.body}>{event.description}</Text>
        {event.photo && (
          <Image
            source={{ uri: event.photo }}
            style={{ width: "100%", height: 300, borderRadius: 13 }}
            resizeMode="cover"
          />
        )}
      </Card>
      <Card style={{ gap: 18 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {STYLES.map((s) => (
            <Chip
              key={s}
              label={labels[s]}
              active={style === s}
              onPress={() => setStyle(s)}
            />
          ))}
        </View>
        <Text style={styles.h2}>{event.stories[style].title}</Text>
        <Text style={styles.body}>{event.stories[style].text}</Text>
        <Text style={styles.small}>
          模板生成{event.stories[style].edited ? " · 主人编辑" : ""} ·
          采用保存当天的人设{style === "news" ? " · 虚构娱乐报道" : ""}
        </Text>
        <View style={styles.row}>
          <Button
            label="制作喵闻卡"
            icon="file-text"
            tone="soft"
            onPress={() =>
              router.push({ pathname: "/news", params: { id: event.id } })
            }
          />
          <Button
            label="删除记录"
            icon="trash-2"
            tone="danger"
            onPress={() => setConfirm(true)}
          />
        </View>
        {confirm && (
          <View
            style={{
              gap: 12,
              backgroundColor: "#FFF2EC",
              padding: 16,
              borderRadius: 12,
            }}
          >
            <Text style={styles.body}>
              删除这件小事？关联故事、本机动态和新闻将一起移除，成长减少 20 XP。
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <Button
                label="确认删除这条记录"
                tone="danger"
                onPress={() => {
                  update((s) => deleteEvent(s, event.id));
                  notify("记录已删除，成长已重新计算。");
                  router.replace("/profile");
                }}
              />
              <Button
                label="取消"
                tone="plain"
                onPress={() => setConfirm(false)}
              />
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}
