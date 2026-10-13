import DateField from "../components/DateField";
import { t, tList } from "../i18n";
import React, { useState } from "react";
import RestoreBackup from "../components/RestoreBackup";
import PersonalityQuiz from "../components/PersonalityQuiz";
import { Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { demoState } from "../data/demo";
import {
  PERSONALITIES,
  SPECIES,
  Pet,
  PersonalitySource,
  Route,
  RouteSource,
  Species,
  id,
  roleFor,
} from "../domain/types";
import { SPECIES_INFO, ageFromBirthday, parseAge, recommendRoute } from "../domain/pet-profile";
import { defaultOwnerName } from "../domain/story-engine";
import { isHomeDate } from "../domain/timeline";
import { MAX_PETS, addPet, homePets } from "../domain/household";
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
  Portrait,
  Heading,
  styles,
} from "../components/ui";
export default function Onboarding({ editing = false, adding = false }: { editing?: boolean; adding?: boolean }) {
  const { state, update, notify } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 1050;
  const original = editing ? state.pet : null;
  const [name, setName] = useState(original?.name ?? "");
  const [species, setSpecies] = useState<Species>(original?.species ?? "cat");
  const [speciesName, setSpeciesName] = useState(original?.speciesName ?? "");
  const [personality, setPersonality] = useState(
    original?.personality ?? "傲娇",
  );
  const [personalitySource, setPersonalitySource] = useState<PersonalitySource>(
    original?.personalitySource ?? "tag",
  );
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState(
    original?.questionnaire?.answers,
  );
  const [quizDraftAnswers, setQuizDraftAnswers] = useState(
    original?.questionnaire?.answers,
  );
  const [years, setYears] = useState(
    original?.ageMonths === undefined
      ? ""
      : String(Math.floor(original.ageMonths / 12)),
  );
  const [months, setMonths] = useState(
    original?.ageMonths === undefined ? "" : String(original.ageMonths % 12),
  );
  const [routeSource, setRouteSource] = useState<RouteSource>(
    original?.routeSource ?? (editing ? "manual" : "age"),
  );
  const [manualRoute, setManualRoute] = useState<Route>(
    original?.route ?? "work",
  );
  const [avatar, setAvatar] = useState(original?.avatar);
  const [ownerTitle, setOwnerTitle] = useState(original?.ownerTitle ?? "");
  const [birthDate, setBirthDate] = useState(original?.birthDate ?? "");
  const [homeDate, setHomeDate] = useState(original?.homeDate ?? "");
  const [busy, setBusy] = useState(false);
  let ageMonths: number | undefined,
    ageError = "";
  try {
    ageMonths = parseAge(years, months) ?? ageFromBirthday(birthDate.trim());
  } catch (e) {
    ageError = e instanceof Error ? e.message : t("请检查年龄。");
  }
  const recommended = recommendRoute(species, ageMonths);
  const effectiveRouteSource =
    species === "cat" || species === "dog" ? routeSource : "manual";
  const route =
    effectiveRouteSource === "age"
      ? (recommended ?? "work")
      : manualRoute;
  const preview: Pet = {
    id: original?.id ?? "preview",
    name: name || t("你的宠物"),
    species,
    ...(species === "other" ? { speciesName: speciesName.trim() } : {}),
    personality: personality.trim(),
    personalitySource,
    ...(personalitySource === "questionnaire" && quizAnswers
      ? { questionnaire: { version: 1 as const, answers: quizAnswers } }
      : {}),
    ...(ageMonths !== undefined
      ? {
          ageMonths,
          ageRecordedAt:
            original?.ageMonths === ageMonths
              ? (original.ageRecordedAt ?? new Date().toISOString())
              : new Date().toISOString(),
        }
      : {}),
    route,
    routeSource: effectiveRouteSource,
    role: roleFor(route),
    ...(ownerTitle.trim() ? { ownerTitle: ownerTitle.trim() } : {}),
    ...(isHomeDate(birthDate.trim()) ? { birthDate: birthDate.trim() } : {}),
    ...(isHomeDate(homeDate.trim()) ? { homeDate: homeDate.trim() } : {}),
    avatar,
  };
  async function pick() {
    setBusy(true);
    try {
      const photo = await choosePhoto();
      if (photo) setAvatar(photo);
    } catch (e) {
      notify(e instanceof Error ? e.message : t("照片读取失败，请重试。"));
    } finally {
      setBusy(false);
    }
  }
  function create() {
    if (!name.trim()) {
      notify(t("给小动物起个名字吧。"));
      return;
    }
    if (species === "other" && !speciesName.trim()) {
      notify(t("请填写宠物类型，例如刺猬、蜜袋鼯。"));
      return;
    }
    if (!personality.trim()) {
      notify(t("选一个性格标签，或写下你了解的它。"));
      return;
    }
    if (ageError) {
      notify(ageError);
      return;
    }
    if (birthDate.trim() && !isHomeDate(birthDate.trim())) {
      notify(t("生日请按 2024-03-15 这样填写，且不晚于今天。")); return;
    }
    if (homeDate.trim() && !isHomeDate(homeDate.trim())) {
      notify(t("到家日期请按 2024-03-15 这样填写，且不晚于今天。"));
      return;
    }
    const pet = { ...preview, id: original?.id ?? id(), name: name.trim() };
    if (adding && state.pet) {
      if (homePets(state).length >= MAX_PETS) {
        notify(t("最多养 {n} 只。", { n: MAX_PETS }));
        return;
      }
      update((s) => addPet(s, pet));
      notify(t("{name}搬进来了，现在是{name}的视角。", { name: pet.name }));
      router.replace("/");
      return;
    }
    update((s) => ({
      ...s,
      pet,
      events: editing ? s.events : [],
      sounds: editing ? s.sounds : [],
      draft: null,
      demo: editing ? s.demo : false,
    }));
    notify(
      editing
        ? t("人设已更新，历史故事保留原来的身份。")
        : t("居民身份已领取，第二人生开始啦。"),
    );
    router.replace("/");
  }
  return (
    <View style={{ gap: 30 }}>
      <Heading
        title={editing ? t("编辑居民档案") : adding && state.pet ? t("添加宠物") : t("欢迎搬进爪爪镇")}
      />
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
              backgroundColor: colors.yellow,
              borderRadius: 14,
              borderWidth: 2.5,
              borderColor: colors.ink,
              boxShadow: "0px 8px 24px rgba(150, 110, 80, 0.16)",
              padding: wide ? 30 : 20,
              gap: 20,
            }}
          >
            <Text style={{ letterSpacing: 2, fontSize: 11, color: colors.ink }}>
              {t("爪爪镇 · 居民证 / PREVIEW")}
            </Text>
            <View
              style={{
                flexDirection: wide ? "column" : "row",
                alignItems: "center",
                gap: 22,
              }}
            >
              <Portrait pet={preview} demo={editing && state.demo} size={wide ? 170 : 76} />
              <View
                style={{
                  alignItems: wide ? "center" : "flex-start",
                  gap: 7,
                  flex: wide ? undefined : 1,
                }}
              >
                <Text style={[styles.h1, { fontSize: wide ? 32 : 25 }]}>
                  {preview.name}
                </Text>
                <Text style={styles.small}>{tList(preview.personality)}</Text>
                <Tag bg={colors.paper}>
                  {t(preview.role)}
                </Tag>
              </View>
            </View>
          </View>
        </View>
        <Card style={{ flex: wide ? 1 : undefined, gap: 21 }}>
          <View style={styles.between}>
            <View>
              <Text style={styles.h2}>
                {editing ? t("编辑宠物档案") : t("办理小镇居民证")}
              </Text>
            </View>
            <Avatar pet={preview} demo={editing && state.demo} size={54} />
          </View>
          <View>
            <Label>{t("01 / 名字")}</Label>
            <Field
              accessibilityLabel={t("宠物名字")}
              value={name}
              onChangeText={setName}
              maxLength={20}
              placeholder={t("例如：橘总、糯米、旺财")}
            />
          </View>
          <View style={{ gap: 10 }}>
            <Label>{t("02 / 宠物类型")}</Label>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {SPECIES.map((value) => (
                <Chip
                  key={value}
                  label={`${SPECIES_INFO[value].emoji} ${t(SPECIES_INFO[value].label)}`}
                  active={species === value}
                  onPress={() => setSpecies(value)}
                />
              ))}
            </View>
            {species === "other" && (
              <Field
                accessibilityLabel={t("其他宠物类型")}
                value={speciesName}
                onChangeText={setSpeciesName}
                maxLength={20}
                placeholder={t("例如：刺猬、蜜袋鼯、蜘蛛")}
              />
            )}
          </View>
          <View style={{ gap: 10 }}>
            <Label>{t("03 / 年龄（可选）")}</Label>
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 6 }}>
                <Field
                  accessibilityLabel={t("年龄岁数")}
                  value={years}
                  onChangeText={setYears}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholder={t("可留空")}
                />
                <Text style={styles.small}>{t("岁")}</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Field
                  accessibilityLabel={t("年龄月数")}
                  value={months}
                  onChangeText={setMonths}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder={t("可留空")}
                />
                <Text style={styles.small}>{t("个月（0–11）")}</Text>
              </View>
            </View>
            {!!ageError && (
              <Text accessibilityRole="alert" style={{ color: "#AE4434" }}>
                {ageError}
              </Text>
            )}
          </View>
          <View style={{ gap: 12 }}>
            <Label>{t("04 / 性格")}</Label>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {PERSONALITIES.map((p) => (
                <Chip
                  key={p}
                  label={t(p)}
                  active={personality === p}
                  onPress={() => {
                    setPersonality(p);
                    setPersonalitySource("tag");
                  }}
                />
              ))}
            </View>
            <Field
              accessibilityLabel={t("自定义性格")}
              value={personality}
              onChangeText={(value) => {
                setPersonality(value);
                setPersonalitySource("custom");
              }}
              maxLength={60}
              placeholder={t("例如：慢热但很亲人，喜欢安静地观察")}
              multiline
            />
            <Button
              label={quizOpen ? t("收起性格问卷") : t("做一次性格问卷")}
              tone="soft"
              onPress={() => setQuizOpen(!quizOpen)}
            />
            {quizOpen && (
              <PersonalityQuiz
                initialAnswers={quizDraftAnswers}
                onDraftChange={setQuizDraftAnswers}
                onApply={(value, answers) => {
                  setPersonality(value);
                  setPersonalitySource("questionnaire");
                  setQuizAnswers(answers);
                  setQuizOpen(false);
                  notify(t("观察结果已填入性格，可以继续修改。"));
                }}
              />
            )}
          </View>
          <View style={{ gap: 10 }}>
            <Label>{t("05 / 人生路线")}</Label>
            {species === "cat" || species === "dog" ? (
              <>
                <View style={[styles.row, { flexWrap: "wrap" }]}>
                  <Chip
                    label={t("按年龄自动匹配")}
                    active={effectiveRouteSource === "age"}
                    onPress={() => setRouteSource("age")}
                  />
                  <Chip
                    label={t("主人自己选")}
                    active={effectiveRouteSource === "manual"}
                    onPress={() => {
                      setManualRoute(route);
                      setRouteSource("manual");
                    }}
                  />
                </View>
              </>
            ) : (
              null
            )}
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              <Chip
                label={t("🎒 去上学")}
                active={
                  route === "campus"
                }
                onPress={() => {
                  setManualRoute("campus");
                  setRouteSource("manual");
                }}
              />
              <Chip
                label={t("💼 进入职场")}
                active={
                  route === "work"
                }
                onPress={() => {
                  setManualRoute("work");
                  setRouteSource("manual");
                }}
              />
            </View>
          </View>
          <View style={{ gap: 10 }}>
            <Label>{t("06 / 它在日记里怎么称呼你")}</Label>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {[t("妈妈"), t("爸爸"), t("姐姐"), t("哥哥"), t("铲屎官"), t("两脚兽"), t("我的人"), t("主人")].map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={ownerTitle.trim() === t}
                  onPress={() => setOwnerTitle(t)}
                />
              ))}
            </View>
            <Field
              accessibilityLabel={t("宠物对你的称呼")}
              value={ownerTitle}
              onChangeText={setOwnerTitle}
              maxLength={10}
              placeholder={t("也可以自己写，例如：老张。留空就叫“{owner}”", { owner: defaultOwnerName(species) })}
            />
          </View>
          <View style={{ gap: 10 }}>
            <Label>{t("07 / 到家日期（可选）")}</Label>
            <DateField label={t("到家日期")} value={homeDate} onChange={setHomeDate} />
          </View>
          <View style={{ gap: 10 }}>
            <Label>{t("08 / 生日（可选）")}</Label>
            <DateField label={t("宠物生日")} value={birthDate} onChange={setBirthDate} />
          </View>
          <View style={styles.row}>
            <Button
              label={
                busy ? t("照片处理中…") : avatar ? t("更换头像") : t("添加真实头像")
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
                label={t("移除头像")}
                tone="plain"
                onPress={() => setAvatar(undefined)}
              />
            )}
          </View>
          <Button
            label={editing ? t("保存档案") : adding && state.pet ? t("添加到我家") : t("领取居民证")}
            icon="arrow-right"
            disabled={busy}
            onPress={create}
          />
          {!editing && !state.pet && (
            <Button
              label={t("体验橘总的生活")}
              tone="plain"
              onPress={() => {
                update(demoState());
                router.replace("/");
              }}
            />
          )}
          {!editing && !state.pet && <RestoreBackup />}
          {(editing || (adding && !!state.pet)) && (
            <Button
              label={t("返回")}
              tone="plain"
              onPress={() => router.replace("/profile")}
            />
          )}
        </Card>
      </View>
    </View>
  );
}
