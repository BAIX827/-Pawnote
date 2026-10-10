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
  Tag,
  colors,
  styles,
} from "../components/ui";
import Onboarding from "./Onboarding";
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
        { maxWidth: 800, width: "100%", alignSelf: "center" },
      ]}
    >
      <Heading
        title="毛圈广场"
        eyebrow="THE NOTICE BOARD / 本机毛圈"
        action={
          <Button
            label="发一条"
            icon="edit-3"
            onPress={() => router.push("/record")}
          />
        }
      />
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        <Chip
          label={`全部 ${published.length}`}
          active={!photosOnly}
          onPress={() => setPhotosOnly(false)}
        />
        <Chip
          label="有照片"
          active={photosOnly}
          onPress={() => setPhotosOnly(true)}
        />
        <Text style={styles.small}>仅当前设备可见</Text>
      </View>
      {events.length ? (
        events.map((e, i) => (
          <View
            key={e.id}
            style={{
              marginTop: 8,
              backgroundColor: i % 2 ? "#F1EDFA" : colors.paper,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 3,
              padding: 24,
              gap: 18,
              boxShadow: "3px 4px 0px #DAD9CC",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -8,
                alignSelf: "center",
                width: 65,
                height: 18,
                backgroundColor: i % 2 ? "#F5CC65CC" : "#BDD4B5CC",
                transform: [{ rotate: i % 2 ? "-3deg" : "3deg" }],
              }}
            />
            <View style={styles.row}>
              <Avatar pet={e.petSnapshot} demo={state.demo} />
              <View style={{ flex: 1 }}>
                <Text style={styles.h2}>{e.petSnapshot.name}</Text>
                <Text style={styles.small}>
                  {formatDate(e.createdAt)} · {e.petSnapshot.role}
                </Text>
              </View>
              <Text
                style={{
                  color: colors.lavender,
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                POST {String(i + 1).padStart(2, "0")}
              </Text>
            </View>
            <Text style={[styles.body, { fontSize: 16, lineHeight: 28 }]}>
              {e.stories[e.selectedStyle].text}
            </Text>
            {e.photo && (
              <Image
                source={{ uri: e.photo }}
                style={{ width: "100%", height: 270 }}
                resizeMode="cover"
              />
            )}
            <View style={[styles.between, { flexWrap: "wrap" }]}>
              <Tag>
                模板生成{e.selectedStyle === "news" ? " · 娱乐报道" : ""}
              </Tag>
              <Button
                label="翻开这一天 ↗"
                tone="plain"
                onPress={() =>
                  router.push({ pathname: "/event", params: { id: e.id } })
                }
              />
            </View>
          </View>
        ))
      ) : (
        <Empty
          title={photosOnly ? "还没有照片动态" : "广场等着第一条动态"}
          subtitle={
            photosOnly ? undefined : "保存日记时，勾选「发布到本机毛圈」。"
          }
          action={
            <Button
              label={photosOnly ? "查看全部" : "写一条动态"}
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
