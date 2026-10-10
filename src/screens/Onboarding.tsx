import React, { useState } from "react";
import RestoreBackup from "../components/RestoreBackup";
import { Image, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { demoState } from "../data/demo";
import { Pet, Personality, Route, id, roleFor } from "../domain/types";
import { choosePhoto } from "../platform/photo";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Field,
  Label,
  Tag,
  colors,
  demoPhoto,
  styles,
} from "../components/ui";
export default function Onboarding({ editing = false }: { editing?: boolean }) {
  const { state, update, notify } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 1050;
  const original = editing ? state.pet : null;
  const [name, setName] = useState(original?.name ?? "");
  const [species, setSpecies] = useState<"cat" | "dog">(
    original?.species ?? "cat",
  );
  const [personality, setPersonality] = useState<Personality>(
    original?.personality ?? "傲娇",
  );
  const [route, setRoute] = useState<Route>(original?.route ?? "work");
  const [avatar, setAvatar] = useState(original?.avatar);
  const [busy, setBusy] = useState(false);
  const preview: Pet = {
    id: original?.id ?? "preview",
    name: name || "你的毛孩",
    species,
    personality,
    route,
    role: roleFor(route),
    avatar,
  };
  async function pick() {
    setBusy(true);
    try {
      const photo = await choosePhoto();
      if (photo) setAvatar(photo);
    } catch (e) {
      notify(e instanceof Error ? e.message : "照片读取失败，请重试。");
    } finally {
      setBusy(false);
    }
  }
  function create() {
    if (!name.trim()) {
      notify("给毛孩起个名字吧。");
      return;
    }
    const pet = { ...preview, id: original?.id ?? id(), name: name.trim() };
    update((s) => ({
      ...s,
      pet,
      events: editing ? s.events : [],
      draft: null,
      demo: editing ? s.demo : false,
    }));
    notify(
      editing
        ? "人设已更新，历史故事保留原来的身份。"
        : "居民身份已领取，第二人生开始啦。",
    );
    router.replace("/");
  }
  return (
    <View style={{ gap: 30 }}>
      <View>
        <Tag>真实日常 × 毛孩的第二人生</Tag>
        <Text style={[styles.h1, { marginTop: 15, fontSize: wide ? 40 : 30 }]}>
          {editing ? "它的人设，你来决定。" : "小小毛孩，\n也有大大的生活。"}
        </Text>
        <Text style={[styles.muted, { marginTop: 10 }]}>
          写下它的日常，让每一件小事都有自己的故事。
        </Text>
      </View>
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          gap: 28,
          alignItems: "stretch",
        }}
      >
        <View style={{ flex: wide ? 1.05 : undefined, gap: 20 }}>
          <View
            style={{
              height: wide ? 365 : 235,
              borderRadius: 24,
              overflow: "hidden",
              backgroundColor: colors.pale,
            }}
          >
            <Image
              source={demoPhoto}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                right: 20,
                backgroundColor: "#FFFFFFEE",
                borderRadius: 15,
                padding: 17,
              }}
            >
              <Text style={[styles.small, { color: colors.orange }]}>
                橘总 · 零食鉴定部 · 示例
              </Text>
              <Text style={[styles.h2, { fontSize: 18 }]}>
                今日目标：把午觉睡出业绩。
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
            <Chip label="01 记录真实小事" />
            <Chip label="02 写成毛孩故事" />
            <Chip label="03 收藏第二人生" />
          </View>
          <Text style={styles.small}>
            当前体验使用本机保存与模板文案；好友功能将在联机版本开放。
          </Text>
        </View>
        <Card style={{ flex: wide ? 1 : undefined, gap: 21 }}>
          <View style={styles.between}>
            <View>
              <Text style={styles.h2}>
                {editing ? "编辑宠物档案" : "办理毛孩居民证"}
              </Text>
              <Text style={styles.small}>从一份小小的身份开始</Text>
            </View>
            <Avatar pet={preview} size={54} />
          </View>
          <View>
            <Label>毛孩叫什么？</Label>
            <Field
              accessibilityLabel="宠物名字"
              value={name}
              onChangeText={setName}
              maxLength={20}
              placeholder="例如：橘总、糯米、旺财"
            />
          </View>
          <View>
            <Label>它是哪一位？</Label>
            <View style={styles.row}>
              <Chip
                label="🐈 猫猫"
                active={species === "cat"}
                onPress={() => setSpecies("cat")}
              />
              <Chip
                label="🐕 狗狗"
                active={species === "dog"}
                onPress={() => setSpecies("dog")}
              />
            </View>
          </View>
          <View>
            <Label>性格小标签</Label>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {(["傲娇", "憨厚", "戏精"] as const).map((p) => (
                <Chip
                  key={p}
                  label={p}
                  active={personality === p}
                  onPress={() => setPersonality(p)}
                />
              ))}
            </View>
          </View>
          <View>
            <Label>人生路线</Label>
            <View style={styles.row}>
              <Chip
                label="💼 进入职场"
                active={route === "work"}
                onPress={() => setRoute("work")}
              />
              <Chip
                label="🎒 去上学"
                active={route === "campus"}
                onPress={() => setRoute("campus")}
              />
            </View>
          </View>
          <View style={styles.row}>
            <Button
              label={
                busy ? "照片处理中…" : avatar ? "更换头像" : "添加真实头像"
              }
              icon="camera"
              tone="plain"
              disabled={busy}
              onPress={() => {
                void pick();
              }}
            />
            {avatar && (
              <Button
                label="移除头像"
                tone="plain"
                onPress={() => setAvatar(undefined)}
              />
            )}
          </View>
          <Button
            label={editing ? "保存档案" : "领取身份，开始营业"}
            icon="arrow-right"
            disabled={busy}
            onPress={create}
          />
          {!editing && !state.pet && (
            <Button
              label="先看看橘总的示例生活"
              tone="plain"
              onPress={() => {
                update(demoState());
                router.replace("/");
              }}
            />
          )}
          {!editing && !state.pet && <RestoreBackup />}
          {editing && (
            <Button
              label="返回"
              tone="plain"
              onPress={() => router.replace("/profile")}
            />
          )}
        </Card>
      </View>
    </View>
  );
}
