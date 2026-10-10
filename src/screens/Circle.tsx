import { t } from "../i18n";
import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { formatDate } from "../domain/types";
import {
  Avatar,
  Button,
  Chip,
  Empty,
  Heading,
  Sticker,
  Tape,
  colors,
  display,
  shadow,
  styles,
} from "../components/ui";
import Onboarding from "./Onboarding";

const notes = [colors.paper, colors.yellow, colors.sky, colors.pink, colors.green];
const tapes = [colors.orange, colors.lavender, colors.pink, colors.jade];

export default function Circle() {
  const { state } = useStore();
  const [photosOnly, setPhotosOnly] = useState(false);
  if (!state.pet) return <Onboarding />;
  const published = state.events.filter((e) => e.published),
    events = published.filter((e) => !photosOnly || e.photo);
  return (
    <View
      style={[
        styles.stack,
        { maxWidth: 760, width: "100%", alignSelf: "center" },
      ]}
    >
      <Heading
        title={t("爪友圈")}
        eyebrow={t("公告墙 · 本机爪友圈")}
        accent={colors.sky}
        action={
          <Button label={t("贴一条")} icon="edit-3" onPress={() => router.push("/record")} />
        }
      />
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        <Chip
          label={t("全部 {n}", { n: published.length })}
          active={!photosOnly}
          onPress={() => setPhotosOnly(false)}
        />
        <Chip
          label={t("有照片")}
          active={photosOnly}
          onPress={() => setPhotosOnly(true)}
        />
        <Text style={styles.small}>{t("仅当前设备可见")}</Text>
      </View>
      {events.length ? (
        <View
          style={{
            backgroundColor: "#F5E8D5",
            borderWidth: 1.5,
            borderColor: colors.edge,
            borderRadius: 30,
            paddingHorizontal: 16,
            paddingVertical: 30,
            gap: 34,
          }}
        >
          {events.map((e, i) => (
            <View
              key={e.id}
              style={[
                {
                  backgroundColor: notes[i % notes.length],
                  borderWidth: 1.5,
                  borderColor: colors.edge,
                  borderRadius: 20,
                  padding: 18,
                  gap: 14,
                  transform: [{ rotate: `${[-1.4, 1.1, -0.6, 1.6][i % 4]}deg` }],
                },
                shadow(4),
              ]}
            >
              <Tape color={tapes[i % tapes.length]} rotate={i % 2 ? 6 : -6} />
              <View style={styles.row}>
                <Avatar pet={e.petSnapshot} demo={state.demo} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.h2}>{e.petSnapshot.name}</Text>
                  <Text style={[styles.small, { color: colors.ink }]}>
                    {formatDate(e.createdAt)} · {t(e.petSnapshot.role)}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.ink,
                    fontSize: 30,
                    fontWeight: "700",
                    fontFamily: display,
                    opacity: 0.35,
                  }}
                >
                  #{String(i + 1).padStart(2, "0")}
                </Text>
              </View>
              <Text style={[styles.body, { fontSize: 17, lineHeight: 30, fontWeight: "500" }]}>
                {e.stories[e.selectedStyle].text}
              </Text>
              {e.photo && (
                <View
                  style={{
                    backgroundColor: "#FFF",
                    padding: 8,
                    paddingBottom: 26,
                    borderWidth: 1.5,
                    borderColor: colors.edge,
                    transform: [{ rotate: i % 2 ? "-1.5deg" : "1.5deg" }],
                  }}
                >
                  <Image
                    source={{ uri: e.photo }}
                    style={{ width: "100%", height: 250 }}
                    resizeMode="cover"
                  />
                </View>
              )}
              <View style={[styles.between, { flexWrap: "wrap" }]}>
                <Sticker bg={colors.paper} rotate={-2}>
                  {e.stories[e.selectedStyle].generator === "ai" ? t("AI 生成") : t("本机生成")}{e.selectedStyle === "news" ? t(" · 娱乐报道") : ""}
                </Sticker>
                <Button
                  label={t("翻开这一天")}
                  tone="plain"
                  onPress={() =>
                    router.push({ pathname: "/event", params: { id: e.id } })
                  }
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Empty
          title={photosOnly ? t("还没有照片动态") : t("公告墙等着第一条动态")}
          subtitle={
            photosOnly ? undefined : t("保存日记时，勾选「贴到本机爪友圈」。")
          }
          action={
            <Button
              label={photosOnly ? t("查看全部") : t("写一条动态")}
              onPress={() =>
                photosOnly ? setPhotosOnly(false) : router.push("/record")
              }
            />
          }
        />
      )}
    </View>
  );
}
