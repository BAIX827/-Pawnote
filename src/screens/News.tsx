import { t } from "../i18n";
import React, { useRef, useState } from "react";
import { Image, Platform, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../data/store";
import { formatDate } from "../domain/types";
import { exportNews } from "../platform/export";
import { Button, Empty, Heading, colors, display, shadow, styles } from "../components/ui";
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
      notify(
        Platform.OS === "web"
          ? t("新闻卡已导出，可用浏览器打开 SVG 文件。")
          : t("分享面板已关闭，可在所选位置检查图片。"),
      );
    } catch (e) {
      notify(e instanceof Error ? e.message : t("导出失败，请重试。"));
    } finally {
      setBusy(false);
    }
  }
  if (!event)
    return (
      <Empty
        title={t("先记录一件小事")}
        subtitle={t("保存日常后，再来制作个人喵闻。")}
        action={
          <Button label={t("记录今天")} onPress={() => router.replace("/record")} />
        }
      />
    );
  return (
    <View
      style={{ gap: 22, maxWidth: 740, width: "100%", alignSelf: "center" }}
    >
      <Heading
        title={t("喵闻编辑部")}
        eyebrow={t("THE DAILY PAW · 号外")}
        accent={colors.sky}
        action={<Button label={t("返回")} tone="plain" onPress={() => router.replace("/")} />}
      />
      <View
        ref={card}
        collapsable={false}
        style={[
          {
            backgroundColor: "#FFF9EF",
            borderColor: colors.edge,
            borderWidth: 2,
            padding: 22,
            gap: 18,
          },
          shadow(6, colors.lavender),
        ]}
      >
        <View style={styles.between}>
          <Text style={[styles.small, { color: colors.ink }]}>
            {t("毛孩市 · 生活特刊")}
          </Text>
          <Text style={styles.small}>{formatDate(event.createdAt)}</Text>
        </View>
        <Text
          style={{
            fontSize: 52,
            lineHeight: 64,
            textAlign: "center",
            letterSpacing: 8,
            fontWeight: "700",
            fontFamily: display,
            color: colors.ink,
          }}
        >
          {t("今日喵闻")}
        </Text>
        <Text style={[styles.small, { textAlign: "center", letterSpacing: 3 }]}>
          THE DAILY PAW
        </Text>
        <View style={{ height: 4, backgroundColor: colors.ink }} />
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            fontFamily: display,
            lineHeight: 42,
            color: colors.ink,
          }}
        >
          {event.stories.news.title}
        </Text>
        {event.photo && (
          <Image
            onLoad={() => setLoadedPhoto(event.photo)}
            onError={() => notify(t("照片加载失败，请返回检查原始记录。"))}
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
          {t("来源：{name}的本人日常记录", { name: event.petSnapshot.name })}
          {"\n"}
          {event.stories.news.generator === "ai" ? t("AI 生成") : t("本机生成")}
          {event.stories.news.edited ? t(" · 主人润色") : ""}
          {t(" · 虚构娱乐报道 · ")}
          {t("爪记 Pawnote")}
        </Text>
      </View>
      <Button
        label={
          busy
            ? t("正在准备新闻卡…")
            : Platform.OS === "web"
              ? t("保存新闻卡（SVG）")
              : t("分享新闻图片")
        }
        icon="download"
        disabled={busy || (Platform.OS !== "web" && !photoReady)}
        onPress={() => {
          void share();
        }}
      />
      <Text style={[styles.small, { textAlign: "center" }]}>
        {Platform.OS === "web" ? t("SVG 卡片可在浏览器打开。") : t("PNG · 系统分享")}
      </Text>
    </View>
  );
}
