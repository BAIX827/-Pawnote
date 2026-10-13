import { eventDate } from "../domain/dates";
import { t, useLang } from "../i18n";
import React, { useEffect, useRef, useState } from "react";
import { Image, Platform, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../data/store";
import { LifeEvent, formatDate } from "../domain/types";
import {
  NEWS_TEMPLATES,
  NewsTemplate,
  bounty,
  isPlainNews,
  lead,
} from "../domain/news-card";
import { speciesEmoji } from "../domain/pet-profile";
import { canShareNews, exportNews, prepareNewsImage, shareNews } from "../platform/export";
import { Button, Chip, Empty, Heading, colors, demoPhoto, display, shadow, styles } from "../components/ui";

const LABELS: Record<NewsTemplate, string> = {
  daily: "日报",
  extra: "号外",
  wanted: "通缉令",
  cover: "封面",
};
const RED = "#E0483A";
const big = (size: number, lineHeight = Math.round(size * 1.25)) =>
  ({ fontSize: size, lineHeight, fontWeight: "400", fontFamily: display, color: colors.ink }) as const;

function Credit({ event, plain }: { event: LifeEvent; plain?: boolean }) {
  return (
    <Text style={styles.small}>
      {t("来源：{name}的本人日常记录", { name: event.petSnapshot.name })}
      {"\n"}
      {plain ? " · " : t(" · 虚构娱乐报道 · ")}
      {t("爪记 Pawnote")}
    </Text>
  );
}
// Layouts without a photo of the day fall back to the pet's portrait or its species emoji.
function Picture({ event, height, demo, onLoad, onError }: { event: LifeEvent; height: number; demo: boolean; onLoad: () => void; onError: () => void }) {
  const uri = event.photo ?? event.petSnapshot.avatar;
  return uri || demo ? (
    <Image onLoad={onLoad} onError={onError} source={uri ? { uri } : demoPhoto} style={{ width: "100%", height }} resizeMode="cover" />
  ) : (
    <View style={{ width: "100%", height, backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: height * 0.45 }}>{speciesEmoji(event.petSnapshot)}</Text>
    </View>
  );
}

export default function News() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, notify } = useStore();
  const event = state.events.find((e) => e.id === id);
  const card = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const lang = useLang();
  const [template, setTemplate] = useState<NewsTemplate>("daily");
  const [preparedImage, setPreparedImage] = useState<{ event: LifeEvent; template: NewsTemplate; lang: string; error?: string }>();
  const currentImage = preparedImage?.event === event && preparedImage?.template === template && preparedImage?.lang === lang;
  const imageReady = Platform.OS !== "web" || (currentImage && !preparedImage?.error);
  const imageError = currentImage ? preparedImage?.error : undefined;
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!event || Platform.OS !== "web") return;
    let active = true;
    void prepareNewsImage(event, template).then(() => { if (active) setPreparedImage({ event, template, lang }); })
      .catch(() => { if (active) setPreparedImage({ event, template, lang, error: t("图片生成失败，请重试。") }); });
    return () => { active = false; };
  }, [event, template, attempt, lang]);
  const [loadedPhoto, setLoadedPhoto] = useState<string>();
  const shown = event?.photo ?? (template === "wanted" || template === "cover" ? event?.petSnapshot.avatar : undefined);
  const photoReady = !shown || loadedPhoto === shown;
  async function share(save = false) {
    if (!event) return;
    setBusy(true);
    try {
      const result = await (save ? exportNews : shareNews)(event, card.current, template);
      if (result === "cancelled") return;
      notify(
        save && Platform.OS === "web"
          ? t("PNG 图片已准备保存，请在下载位置查看。")
          : result === "opened" ? t("分享面板已打开，请选择分享方式。") : t("分享面板已关闭，可在所选位置检查图片。"),
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
        action={<Button label={t("记录今天")} onPress={() => router.replace("/record")} />}
      />
    );
  const story = event.stories.news,
    pet = event.petSnapshot,
    plain = isPlainNews(event);
  const onLoad = () => setLoadedPhoto(shown),
    onError = () => notify(t("照片加载失败，请返回检查原始记录。"));
  const photo = event.photo && (
    <Image onLoad={onLoad} onError={onError} source={{ uri: event.photo }} style={{ width: "100%", height: 300 }} resizeMode="cover" />
  );
  const body = <Text style={[styles.body, { lineHeight: 29, fontSize: 16 }]}>{story.text}</Text>;
  const frame = { borderColor: colors.ink, borderWidth: 2, padding: 22, gap: 18 };
  return (
    <View style={{ gap: 22, maxWidth: 740, width: "100%", alignSelf: "center" }}>
      <Heading
        title={t("爪报编辑部")}
        accent={colors.sky}
        action={<Button label={t("返回")} tone="plain" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} />}
      />
      {plain ? (
        <Text style={styles.muted}>{t("这一条不适合做成报纸，只保留一张朴素的记录卡。")}</Text>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {NEWS_TEMPLATES.map((k) => (
            <Chip key={k} label={t(LABELS[k])} active={template === k} onPress={() => setTemplate(k)} />
          ))}
        </View>
      )}

      {plain ? (
        <View ref={card} collapsable={false} style={[{ backgroundColor: colors.paper, borderRadius: 14, borderWidth: 2.5, borderColor: colors.ink, padding: 22, gap: 16 }, shadow(4)]}>
          <Text style={styles.small}>{formatDate(eventDate(event).toISOString())}</Text>
          <Text style={big(26)}>{t("{name}的今日记录", { name: pet.name })}</Text>
          {photo}
          {body}
          <View style={styles.divider} />
          <Credit event={event} plain />
        </View>
      ) : template === "daily" ? (
        <View ref={card} collapsable={false} style={[frame, { backgroundColor: "#FFF9EF" }, shadow(6)]}>
          <View style={styles.between}>
            <Text style={[styles.small, { color: colors.ink }]}>{t("爪爪镇 · 生活特刊")}</Text>
            <Text style={styles.small}>{formatDate(eventDate(event).toISOString())}</Text>
          </View>
          <Text style={[big(52, 64), { textAlign: "center", letterSpacing: 8 }]}>{t("爪报")}</Text>
          <Text style={[styles.small, { textAlign: "center", letterSpacing: 3 }]}>PAW POST</Text>
          <View style={{ height: 4, backgroundColor: colors.ink }} />
          <Text style={big(28, 42)}>{story.title}</Text>
          {photo}
          {body}
          <View style={styles.divider} />
          <Credit event={event} />
        </View>
      ) : template === "extra" ? (
        <View ref={card} collapsable={false} style={[{ backgroundColor: "#FFF9EF", borderColor: colors.ink, borderWidth: 2 }, shadow(6)]}>
          <View style={{ backgroundColor: RED, paddingHorizontal: 22, paddingVertical: 14, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
            <Text style={[big(56, 64), { color: "#FFF", letterSpacing: 6 }]}>{t("号外")}</Text>
            <Text style={{ color: "#FFF", fontWeight: "700", letterSpacing: 2, fontSize: 12, marginBottom: 8 }}>
              {t("爪报")} · {formatDate(eventDate(event).toISOString())}
            </Text>
          </View>
          <View style={{ padding: 22, gap: 16 }}>
            <Text style={big(36, 48)}>{story.title}</Text>
            {photo}
            {body}
          </View>
          <View style={{ backgroundColor: colors.ink, paddingVertical: 8, paddingHorizontal: 22 }}>
            <Text numberOfLines={1} style={{ color: "#FFF", fontSize: 13, fontWeight: "700", letterSpacing: 1 }}>
              {t("快讯")} ▸ {t("目前当事宠物情绪稳定，事件仍在进一步调查中。")}
            </Text>
          </View>
          <View style={{ padding: 22, paddingTop: 14 }}>
            <Credit event={event} />
          </View>
        </View>
      ) : template === "wanted" ? (
        <View ref={card} collapsable={false} style={[frame, { backgroundColor: "#F6E7C8", alignItems: "center", borderWidth: 3 }, shadow(6)]}>
          <Text style={[big(78, 90), { letterSpacing: 16 }]}>{t("通缉")}</Text>
          <Text style={[styles.caps, { letterSpacing: 5 }]}>WANTED · {formatDate(eventDate(event).toISOString())}</Text>
          <View style={{ width: "78%", backgroundColor: "#FFF", padding: 8, borderWidth: 2, borderColor: colors.ink, transform: [{ rotate: "-1.5deg" }] }}>
            <Picture event={event} height={240} demo={state.demo} onLoad={onLoad} onError={onError} />
          </View>
          <Text style={big(34, 44)}>{pet.name}</Text>
          <View style={{ alignSelf: "stretch", gap: 6 }}>
            <Text style={[styles.caps, { letterSpacing: 4 }]}>{t("事由")}</Text>
            <Text style={big(22, 32)}>{story.title}</Text>
            <Text style={[styles.body, { lineHeight: 27 }]}>{lead(event)}</Text>
          </View>
          <View style={{ alignSelf: "stretch", borderTopWidth: 2, borderBottomWidth: 2, borderColor: colors.ink, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[styles.caps, { letterSpacing: 4 }]}>{t("悬赏")}</Text>
            <Text style={big(26, 34)}>{bounty(event)}</Text>
          </View>
          <Text style={[styles.small, { color: colors.ink, textAlign: "center" }]}>
            {t("知情者请向本报提供线索。当事宠物极其可爱，请勿轻易原谅。")}
          </Text>
          <View style={{ alignSelf: "stretch" }}>
            <Credit event={event} />
          </View>
        </View>
      ) : (
        <View ref={card} collapsable={false} style={[{ backgroundColor: colors.paper, borderColor: colors.ink, borderWidth: 2 }, shadow(6)]}>
          <View>
            <Picture event={event} height={420} demo={state.demo} onLoad={onLoad} onError={onError} />
            <View style={{ position: "absolute", top: 14, left: 18, right: 18 }}>
              <Text style={[big(72, 84), { color: "#FFF", letterSpacing: 6, textShadowColor: "#00000088", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }]}>
                {t("爪报")}
              </Text>
              <Text style={{ color: "#FFF", fontWeight: "700", letterSpacing: 3, fontSize: 12, textShadowColor: "#00000088", textShadowRadius: 6 }}>
                {pet.name} · {formatDate(eventDate(event).toISOString())}
              </Text>
            </View>
            <View style={{ position: "absolute", right: 14, bottom: 14, backgroundColor: colors.yellow, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, transform: [{ rotate: "-4deg" }] }}>
              <Text style={[styles.caps, { fontSize: 12 }]}>{t("本期封面人物")}</Text>
            </View>
          </View>
          <View style={{ padding: 22, gap: 12 }}>
            <Text style={big(30, 42)}>{story.title}</Text>
            <Text style={[styles.body, { lineHeight: 27 }]}>{lead(event)}</Text>
            <View style={styles.divider} />
            <Credit event={event} />
          </View>
        </View>
      )}

      {!!imageError && <Text accessibilityRole="alert" style={styles.small}>{imageError}</Text>}
      {!!imageError && <Button label={t("重新生成图片")} tone="soft" onPress={() => setAttempt((n) => n + 1)} />}
      {Platform.OS === "web" && <Button
        label={imageReady ? t("保存 PNG 图片") : t("正在准备新闻卡…")}
        icon="download"
        disabled={busy || !imageReady}
        onPress={() => { void share(true); }}
      />}
      {canShareNews() && <Button
        label={
          busy
            ? t("正在准备新闻卡…")
            : t("分享新闻图片")
        }
        icon="share"
        disabled={busy || (Platform.OS === "web" ? !imageReady : !photoReady)}
        onPress={() => {
          void share();
        }}
      />}
    </View>
  );
}
