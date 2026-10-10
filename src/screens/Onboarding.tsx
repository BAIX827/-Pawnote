import React, { useState } from "react";
import RestoreBackup from "../components/RestoreBackup";
import PersonalityQuiz from "../components/PersonalityQuiz";
import { Image, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { demoState } from "../data/demo";
import { PERSONALITIES, SPECIES, Pet, PersonalitySource, Route, RouteSource, Species, id, roleFor } from "../domain/types";
import { SPECIES_INFO, parseAge, recommendRoute } from "../domain/pet-profile";
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
  const [species, setSpecies] = useState<Species>(original?.species ?? "cat");
  const [speciesName, setSpeciesName] = useState(original?.speciesName ?? "");
  const [personality, setPersonality] = useState(original?.personality ?? "傲娇");
  const [personalitySource, setPersonalitySource] = useState<PersonalitySource>(original?.personalitySource ?? "tag");
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState(original?.questionnaire?.answers);
  const [quizDraftAnswers, setQuizDraftAnswers] = useState(original?.questionnaire?.answers);
  const [years, setYears] = useState(original?.ageMonths === undefined ? "" : String(Math.floor(original.ageMonths / 12)));
  const [months, setMonths] = useState(original?.ageMonths === undefined ? "" : String(original.ageMonths % 12));
  const [routeSource, setRouteSource] = useState<RouteSource>(original?.routeSource ?? (editing ? "manual" : "age"));
  const [manualRoute, setManualRoute] = useState<Route>(original?.route ?? "work");
  const [avatar, setAvatar] = useState(original?.avatar);
  const [busy, setBusy] = useState(false);
  let ageMonths: number | undefined, ageError = "";
  try { ageMonths = parseAge(years, months); }
  catch (e) { ageError = e instanceof Error ? e.message : "请检查年龄。"; }
  const recommended = recommendRoute(species, ageMonths);
  const effectiveRouteSource = species === "cat" || species === "dog" ? routeSource : "manual";
  const route = effectiveRouteSource === "age" ? recommended ?? original?.route ?? "work" : manualRoute;
  const preview: Pet = {
    id: original?.id ?? "preview", name: name || "你的宠物", species,
    ...(species === "other" ? { speciesName: speciesName.trim() } : {}),
    personality: personality.trim(), personalitySource,
    ...(personalitySource === "questionnaire" && quizAnswers ? { questionnaire: { version: 1 as const, answers: quizAnswers } } : {}),
    ...(ageMonths !== undefined ? { ageMonths, ageRecordedAt: original?.ageMonths === ageMonths
      ? original.ageRecordedAt ?? new Date().toISOString() : new Date().toISOString() } : {}),
    route, routeSource: effectiveRouteSource, role: roleFor(route), avatar,
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
    if (species === "other" && !speciesName.trim()) { notify("请填写宠物类型，例如刺猬、蜜袋鼯。"); return; }
    if (!personality.trim()) { notify("选一个性格标签，或写下你了解的它。"); return; }
    if (ageError) { notify(ageError); return; }
    if (effectiveRouteSource === "age" && !recommended) { notify("填写年龄后可推荐路线，也可以手动选择上学或职场。"); return; }
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
            {avatar || species === "cat" ? <Image
              source={avatar ? { uri: avatar } : demoPhoto}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            /> : <View style={{ flex: 1, alignItems: "center", paddingTop: wide ? 45 : 12 }}>
              <Text style={{ fontSize: wide ? 115 : 90 }}>{SPECIES_INFO[species].emoji}</Text>
            </View>}
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
                {species === "cat" && !avatar && !name.trim() ? "橘总 · 零食鉴定部 · 示例"
                  : `${preview.name} · ${species === "other" ? speciesName.trim() || "其他宠物" : SPECIES_INFO[species].label} · 第二人生`}
              </Text>
              <Text style={[styles.h2, { fontSize: 18 }]}>
                {species === "cat" ? "今日目标：把午觉睡出业绩。" : "每一种小伙伴，都有自己的生活。"}
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
          <View style={{ gap: 10 }}>
            <Label>它是哪一位？</Label>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {SPECIES.map(value => <Chip key={value}
                label={`${SPECIES_INFO[value].emoji} ${SPECIES_INFO[value].label}`}
                active={species === value} onPress={() => setSpecies(value)} />)}
            </View>
            {species === "other" && <Field accessibilityLabel="其他宠物类型" value={speciesName}
              onChangeText={setSpeciesName} maxLength={20} placeholder="例如：刺猬、蜜袋鼯、蜘蛛" />}
          </View>
          <View style={{ gap: 10 }}>
            <Label>它现在多大？</Label>
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 6 }}>
                <Field accessibilityLabel="年龄岁数" value={years} onChangeText={setYears}
                  keyboardType="number-pad" maxLength={3} placeholder="0" />
                <Text style={styles.small}>岁</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Field accessibilityLabel="年龄月数" value={months} onChangeText={setMonths}
                  keyboardType="number-pad" maxLength={2} placeholder="0" />
                <Text style={styles.small}>个月（0–11）</Text>
              </View>
            </View>
            <Text style={styles.small}>可以填写大致年龄。年龄不清楚时，留空并手动选择人生路线。</Text>
            {!!ageError && <Text accessibilityRole="alert" style={{ color: "#AE4434" }}>{ageError}</Text>}
          </View>
          <View style={{ gap: 12 }}>
            <Label>性格，你最了解它</Label>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {PERSONALITIES.map(p => <Chip key={p} label={p} active={personality === p}
                onPress={() => { setPersonality(p); setPersonalitySource("tag"); }} />)}
            </View>
            <Field accessibilityLabel="自定义性格" value={personality}
              onChangeText={value => { setPersonality(value); setPersonalitySource("custom"); }}
              maxLength={60} placeholder="例如：慢热但很亲人，喜欢安静地观察" multiline />
            <Text style={styles.small}>直接输入你的描述（最多 60 字），或用 5 道观察题了解它。</Text>
            <Button label={quizOpen ? "收起性格问卷" : "做一次性格问卷"} tone="soft"
              onPress={() => setQuizOpen(!quizOpen)} />
            {quizOpen && <PersonalityQuiz initialAnswers={quizDraftAnswers} onDraftChange={setQuizDraftAnswers} onApply={(value, answers) => {
              setPersonality(value); setPersonalitySource("questionnaire"); setQuizAnswers(answers);
              setQuizOpen(false); notify("观察结果已填入性格，可以继续修改。");
            }} />}
            {personalitySource === "questionnaire" && <Text style={styles.small}>当前性格来自主人行为观察问卷。</Text>}
          </View>
          <View style={{ gap: 10 }}>
            <Label>它的第二人生</Label>
            {(species === "cat" || species === "dog") ? <>
              <View style={[styles.row, { flexWrap: "wrap" }]}>
                <Chip label="按年龄推荐" active={effectiveRouteSource === "age"} onPress={() => setRouteSource("age")} />
                <Chip label="主人自己选" active={effectiveRouteSource === "manual"} onPress={() => {
                  setManualRoute(route); setRouteSource("manual");
                }} />
              </View>
              <Text style={styles.small}>{recommended
                ? `按填写年龄推荐：${recommended === "campus" ? "去上学" : "进入职场"}。`
                : "填写年龄后可推荐，也可以由主人直接选择。"}
                {"\n"}虚拟人生规则：12 个月以下推荐校园，12 个月起推荐职场。你可以随时修改。</Text>
            </> : <Text style={styles.small}>不同宠物的成长节奏各有特点，这条人生路线由你来选。</Text>}
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              <Chip label="🎒 去上学" active={route === "campus" && (effectiveRouteSource === "manual" || !!recommended)} onPress={() => {
                setManualRoute("campus"); setRouteSource("manual");
              }} />
              <Chip label="💼 进入职场" active={route === "work" && (effectiveRouteSource === "manual" || !!recommended)} onPress={() => {
                setManualRoute("work"); setRouteSource("manual");
              }} />
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
