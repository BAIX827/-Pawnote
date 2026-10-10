import React, { useRef, useState } from "react";
import { Image, Platform, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../data/store";
import { formatDate } from "../domain/types";
import { exportNews } from "../platform/export";
import { Button, Empty, colors, styles } from "../components/ui";
export default function News() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, notify } = useStore();
  const event = state.events.find((e) => e.id === id);
  const card = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const [loadedPhoto, setLoadedPhoto] = useState<string>();
  const photoReady = !event?.photo || loadedPhoto === event.photo;
  async function share() {
    if (!event) return;
    setBusy(true);
    try {
      await exportNews(event, card.current);
      notify(Platform.OS === "web"
        ? "新闻卡已导出，可用浏览器打开 SVG 文件。"
        : "分享面板已关闭，可在所选位置检查图片。");
    } catch (e) { notify(e instanceof Error ? e.message : "导出失败，请重试。"); }
    finally { setBusy(false); }
  }
  if (!event)
    return (
      <Empty
        title="先记录一件小事"
        subtitle="保存日常后，再来制作个人喵闻。"
        action={
          <Button label="记录今天" onPress={() => router.replace("/record")} />
        }
      />
    );
  return (
    <View
      style={{ gap: 22, maxWidth: 740, width: "100%", alignSelf: "center" }}
    >
      <View style={[styles.between, { flexWrap: "wrap" }]}>
        <View>
          <Text style={styles.h1}>它的生活，值得上头条</Text>
          <Text style={styles.muted}>
            把一段日常，变成一份可收藏的个人特刊。
          </Text>
        </View>
        <Button label="返回" tone="plain" onPress={() => router.replace("/")} />
      </View>
      <View
        ref={card}
        collapsable={false}
        style={{
          backgroundColor: "#FFF9EF",
          borderColor: "#E5DFD0",
          borderWidth: 1,
          borderRadius: 5,
          padding: 25,
          gap: 20,
        }}
      >
        <View style={styles.between}>
          <Text style={[styles.small, { color: colors.ink }]}>
            毛孩市 · 生活特刊
          </Text>
          <Text style={styles.small}>{formatDate(event.createdAt)}</Text>
        </View>
        <Text
          style={{
            fontSize: 47,
            textAlign: "center",
            letterSpacing: 5,
            fontWeight: "900",
            color: colors.ink,
          }}
        >
          今日喵闻
        </Text>
        <Text style={[styles.small, { textAlign: "center", letterSpacing: 3 }]}>
          THE DAILY PAW
        </Text>
        <View style={{ height: 4, backgroundColor: colors.ink }} />
        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            lineHeight: 42,
            color: colors.ink,
          }}
        >
          {event.stories.news.title}
        </Text>
        {event.photo && (
          <Image
            onLoad={() => setLoadedPhoto(event.photo)}
            onError={() => notify("照片加载失败，请返回检查原始记录。")}
            source={{ uri: event.photo }}
            style={{ width: "100%", height: 300 }}
            resizeMode="cover"
          />
        )}
        <Text style={[styles.body, { lineHeight: 29, fontSize: 16 }]}>
          {event.stories.news.text}
        </Text>
        <View style={styles.divider} />
        <Text style={styles.small}>
          来源：{event.petSnapshot.name}的本人日常记录{"\n"}模板生成
          {event.stories.news.edited ? " · 主人编辑" : ""} · 虚构娱乐报道 ·
          毛孩营业中
        </Text>
      </View>
      <Button
        label={busy ? "正在准备新闻卡…" : Platform.OS === "web" ? "保存新闻卡（SVG）" : "分享新闻图片"}
        icon="download"
        disabled={busy || (Platform.OS !== "web" && !photoReady)}
        onPress={() => { void share(); }}
      />
      <Text style={[styles.small, { textAlign: "center" }]}>
        {Platform.OS === "web"
          ? "SVG 卡片可在浏览器打开。"
          : "导出完整新闻卡 PNG，可通过系统分享保存到文件或发送。"}
      </Text>
    </View>
  );
}
