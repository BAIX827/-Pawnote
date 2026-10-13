import { t } from "../i18n";
import React, { useEffect, useRef, useState } from "react";
import { Image, Platform, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../data/store";
import {
  detectCategory,
  generateStories,
  retellDraft,
  generationSignature,
  ownerName,
  selfName,
} from "../domain/story-engine";
import { dayDate, eventDay, eventTimestamp, isPastDay, localDay } from "../domain/dates";
import { saveEvent } from "../domain/life";
import { isLoss } from "../domain/temper";
import { postBlock } from "../domain/paw-circle";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  Category,
  Draft,
  LifeEvent,
  STYLES,
  StoryStyle,
  newDraft,
} from "../domain/types";
import { choosePhoto } from "../platform/photo";
import { AIError, Quota, aiAvailable, fetchQuota, generateWithAI } from "../platform/ai";
import {
  Avatar,
  Bubble,
  Button,
  Chip,
  Field,
  Empty,
  Label,
  Heading,
  Icon,
  Stamp,
  Sticker,
  Tape,
  Wobble,
  colors,
  display,
  shadow,
  styles,
} from "../components/ui";
import DateField from "../components/DateField";
import Onboarding from "./Onboarding";

const bare = {
  borderWidth: 0,
  backgroundColor: "transparent",
  paddingHorizontal: 0,
  paddingVertical: 0,
  minHeight: 0,
  // react-native-web draws a focus ring that the bubble already stands in for.
  ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
} as const;
const tones: Record<StoryStyle, string> = {
  diary: colors.yellow,
  life: colors.green,
  social: colors.pink,
  news: colors.sky,
};

export default function Record() {
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const { state } = useStore();
  const original = state.events.find((e) => e.id === id);
  if (id && !original) return <Empty title={t("这条记录已移除")} action={<Button label={t("返回爪册")} onPress={() => router.replace("/profile")} />} />;
  return <Recorder key={id ?? "new"} original={original} initialDate={date} />;
}
function Recorder({ original, initialDate }: { original?: LifeEvent; initialDate?: string }) {
  const { state, update, notify } = useStore();
  const [seed] = useState(() => ({ ...newDraft(state.preferences), occurredOn: initialDate ?? localDay() }));
  const [editDraft, setEditDraft] = useState<Draft | undefined>(() => original ? {
    id: original.id, description: original.description, category: original.category,
    photo: original.photo, stories: original.stories, selectedStyle: original.selectedStyle,
    published: original.published, occurredOn: eventDay(original),
    signature: generationSignature(original.petSnapshot, original.description, original.category),
  } : undefined);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(!!original || !!initialDate);
  const [manualTag, setManualTag] = useState(!!original);
  // Bubbles grow with their text, so nothing scrolls inside a speech bubble.
  const [heights, setHeights] = useState({ owner: 96, pet: 120 });
  const [quota, setQuota] = useState<Quota>();
  const [asking, setAsking] = useState(false);
  const submitted = useRef(false);
  const latest = useRef("");
  useEffect(() => {
    void fetchQuota().then(setQuota);
  }, []);
  useEffect(() => {
    if (!original && initialDate && isPastDay(initialDate)) {
      update((s) => ({ ...s, draft: { ...(s.draft ?? seed), occurredOn: initialDate } }));
    }
  }, [initialDate, original, seed, update]);
  const pet = original?.petSnapshot ?? state.pet,
    draft = editDraft ?? state.draft ?? seed,
    signature = pet
      ? generationSignature(pet, draft.description, draft.category)
      : "",
    generated = !!draft.stories && draft.signature === signature;
  useEffect(() => {
    if (!original && !submitted.current && state.pet && !state.draft)
      update((s) => ({ ...s, draft: s.draft ?? seed }));
  }, [original, state.pet, state.draft, seed, update]);
  // A restored draft, or a pet whose profile changed, gets its pet-voice text refreshed.
  useEffect(() => {
    if (original || submitted.current || !pet || generated || !draft.description.trim()) return;
    update((s) => s.draft ? { ...s, draft: { ...s.draft,
      stories: generateStories(pet, s.draft.description, s.draft.category),
      signature: generationSignature(pet, s.draft.description, s.draft.category),
    } } : s);
  }, [original, pet, generated, draft.description, update]);
  useEffect(() => {
    latest.current = draft.description;
  }, [draft.description]);
  if (!pet) return <Onboarding />;
  const self = selfName(pet),
    owner = ownerName(pet),
    story = generated ? draft.stories![draft.selectedStyle] : undefined;
  const postingState = { ...state, events: state.events.filter((e) => e.id !== original?.id) };
  const postingDate = isPastDay(draft.occurredOn) ? dayDate(draft.occurredOn) : new Date();
  const block = postBlock(postingState, draft.description, postingDate),
    posting = draft.published && !block;
  const labels: Record<StoryStyle, string> = {
    diary: t("内心独白"),
    life: pet.route === "work" ? t("打工日记") : t("校园日记"),
    social: t("爪友圈动态"),
    news: t("爪报"),
  };
  function patch(changes: Partial<Draft>) {
    if (original) setEditDraft((d) => ({ ...(d ?? seed), ...changes }));
    else update((s) => ({ ...s, draft: { ...(s.draft ?? seed), ...changes } }));
  }
  // Every keystroke on the owner's side re-tells the story on the pet's side.
  function retell(description: string, category: Category) {
    patch(retellDraft(pet!, draft, description, category));
  }
  async function askAI() {
    const asked = { description: draft.description, signature };
    setAsking(true);
    try {
      const result = await generateWithAI(pet!, asked.description);
      if (result.quota) setQuota(result.quota);
      // If the owner kept typing while the AI wrote, its answer is about an older sentence.
      if (latest.current !== asked.description) {
        notify(t("原话已经改了，AI 的这一版没有采用。"));
        return;
      }
      patch({ stories: result.stories, signature: asked.signature, expressionNeedsReview: false });
      notify(t("{name}用 AI 重新说了一遍。", { name: pet!.name }));
    } catch (e) {
      if (e instanceof AIError && e.quota) setQuota(e.quota);
      notify(e instanceof Error ? e.message : t("AI 生成失败，已保留本机版本。"));
    } finally {
      setAsking(false);
    }
  }
  function edit(changes: { title?: string; text?: string }) {
    patch({
      stories: {
        ...draft.stories!,
        [draft.selectedStyle]: {
          ...draft.stories![draft.selectedStyle],
          ...changes,
          edited: true,
        },
      },
    });
  }
  async function pick(source: "library" | "camera" = "library") {
    setBusy(true);
    try {
      const photo = await choosePhoto(source);
      if (photo) patch({ photo });
    } catch (e) {
      notify(e instanceof Error ? e.message : t("照片读取失败。"));
    } finally {
      setBusy(false);
    }
  }
  function save() {
    if (submitted.current) return;
    if (!generated || !draft.stories || !draft.description.trim() || draft.expressionNeedsReview) {
      notify(t("先写下今天的事，{name}才能开口。", { name: pet!.name }));
      return;
    }
    if (Object.values(draft.stories).some((s) => !s.text.trim())) {
      notify(t("故事内容需要至少一个字。"));
      return;
    }
    if (original && !state.events.some((e) => e.id === original.id)) {
      notify(t("这条记录已移除")); return;
    }
    let createdAt: string;
    try { createdAt = eventTimestamp(draft.occurredOn ?? localDay(), original); }
    catch { notify(t("记录日期请填写真实日期，且不晚于今天。")); return; }
    const event = {
      id: draft.id,
      description: draft.description.trim(),
      category: draft.category,
      photo: draft.photo,
      createdAt,
      occurredOn: draft.occurredOn ?? localDay(),
      petSnapshot: { ...pet! },
      stories: draft.stories,
      selectedStyle: draft.selectedStyle,
      published: draft.published && !postBlock(postingState, draft.description, postingDate),
    };
    try {
      const next = saveEvent(state, event);
      submitted.current = true;
      update(next);
      notify(original ? t("日记已更新，经验保持不变。") : t("日常已保存 · +20 XP"));
      if (original && router.canGoBack()) router.back();
      else router.replace({ pathname: "/event", params: { id: event.id } });
    } catch (e) {
      notify(e instanceof Error ? e.message : t("保存失败。"));
    }
  }
  return (
    <View style={{ gap: 22, maxWidth: 760, width: "100%", alignSelf: "center" }}>
      <Heading
        title={original ? t("编辑日记") : t("爪语")}
        eyebrow={t("你说人话 → {name}说{kind}话", { name: pet.name, kind: self.length > 1 ? self.slice(1) : t("自己的") })}
        accent={colors.pink}
        action={
          <Button label={t("返回")} icon="x" tone="plain" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} />
        }
      />

      <View
        style={[
          {
            backgroundColor: "#FFF",
            borderRadius: 10,
            padding: 12,
            gap: 12,
            marginTop: 6,
            transform: [{ rotate: "-0.8deg" }],
          },
          shadow(4),
        ]}
      >
        <Tape color={colors.sky} />
        {draft.photo ? (
          <Image
            source={{ uri: draft.photo }}
            style={{ width: "100%", height: 240, backgroundColor: colors.pale }}
            resizeMode="cover"
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("选择照片")}
            disabled={busy}
            onPress={() => {
              void pick();
            }}
            style={{
              height: 120,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: colors.muted,
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Icon name="image" size={26} color={colors.muted} />
            <Text style={styles.small}>
              {busy ? t("照片处理中…") : t("贴一张现场照片（可选）")}
            </Text>
          </Pressable>
        )}
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          {draft.photo && (
            <Button
              label={busy ? t("照片处理中…") : t("更换照片")}
              icon="image"
              tone="soft"
              disabled={busy}
              onPress={() => {
                void pick();
              }}
            />
          )}
          {Platform.OS !== "web" && (
            <Button
              label={t("拍一张")}
              icon="camera"
              tone="soft"
              disabled={busy}
              onPress={() => {
                void pick("camera");
              }}
            />
          )}
          {draft.photo && (
            <Button
              label={t("移除照片")}
              tone="plain"
              disabled={busy}
              onPress={() => patch({ photo: undefined })}
            />
          )}
          <Text style={styles.small}>{t("1 张 · ≤25 MB · 压缩后保存")}</Text>
        </View>
      </View>

      <Text style={styles.small}>{t("记录日期：{date}", { date: draft.occurredOn ?? localDay() })}</Text>
      <View style={{ gap: 8 }}>
        <View style={[styles.row, { justifyContent: "flex-end", gap: 8 }]}>
          <Text style={styles.caps}>{t("你（{owner}）说", { owner })}</Text>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              borderWidth: 2.5,
              borderColor: colors.ink,
              backgroundColor: colors.paper,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="user" size={18} color={colors.ink} />
          </View>
        </View>
        <Bubble tail="right" bg={colors.paper}>
          <Field
            accessibilityLabel={t("今天发生了什么")}
            value={draft.description}
            onChangeText={(description) =>
              retell(
                description,
                manualTag ? draft.category : detectCategory(description),
              )
            }
            multiline
            maxLength={500}
            onContentSizeChange={(e) => {
              const owner = Math.max(96, Math.ceil(e.nativeEvent.contentSize.height));
              setHeights((h) => (h.owner === owner ? h : { ...h, owner }));
            }}
            style={[bare, { height: heights.owner, fontSize: 17, lineHeight: 28 }]}
            placeholder={t("照你看到的写就行。例如：今天{name}把我的水杯推下去了，还一脸无辜。", { name: pet.name })}
          />
          <View style={[styles.between, { marginTop: 8 }]}>
            <Text style={styles.small}>{original ? t("修改在保存后生效。") : t("草稿自动保存在本机")}</Text>
            <Text style={styles.small}>{draft.description.length} / 500</Text>
          </View>
        </Bubble>
      </View>

      <View style={[styles.row, { justifyContent: "center", gap: 14, marginVertical: -4 }]}>
        <View style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: colors.edge }} />
        <Wobble degrees={generated ? 6 : 0}>
          <Stamp
            top={generated ? t("已翻译") : t("待翻译")}
            main={self.length > 1 ? t("{kind}语", { kind: self.slice(1) }) : t("宠语")}
            color={generated ? colors.orange : colors.muted}
            size={72}
            rotate={0}
            style={{ backgroundColor: colors.paper }}
          />
        </Wobble>
        <View style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: colors.edge }} />
      </View>

      <View style={{ gap: 8 }}>
        <View style={[styles.row, { gap: 8 }]}>
          <Avatar pet={pet} demo={state.demo} size={34} />
          <Text style={styles.caps}>{t("{name}说", { name: pet.name })}</Text>
          {story && (
            <Sticker bg={story.generator === "ai" ? colors.lilac : colors.paper} rotate={2}>
              {story.generator === "ai" ? t("AI 生成") : t("本机生成")}
              {story.edited ? t(" · 主人润色") : ""}
            </Sticker>
          )}
        </View>
        <Bubble tail="left" bg={generated ? tones[draft.selectedStyle] : colors.line}>
          {story ? (
            <View style={{ gap: 8 }}>
              <Field
                accessibilityLabel={t("故事标题")}
                value={story.title}
                maxLength={160}
                onChangeText={(title) => edit({ title })}
                style={[
                  bare,
                  { fontSize: 20, lineHeight: 28, fontWeight: "400", fontFamily: display },
                ]}
              />
              <View style={{ height: 2, backgroundColor: colors.ink, opacity: 0.25 }} />
              <Field
                accessibilityLabel={t("故事内容")}
                multiline
                maxLength={2000}
                value={story.text}
                onChangeText={(text) => edit({ text })}
                onContentSizeChange={(e) => {
                  const pet = Math.max(120, Math.ceil(e.nativeEvent.contentSize.height));
                  setHeights((h) => (h.pet === pet ? h : { ...h, pet }));
                }}
                style={[bare, { height: heights.pet, fontSize: 16, lineHeight: 28 }]}
              />
              <Text style={[styles.small, { color: colors.ink, opacity: 0.7 }]}>
                {isLoss(draft.description)
                  ? t("写到离别的这一条，按你的原话保存，不让它开口。")
                  : t("点文字可以直接改 · 润色后的表达会保留供你确认")}
              </Text>
            </View>
          ) : (
            <Text style={[styles.body, { color: colors.muted, minHeight: 60 }]}>
              {t("……（{name}正盯着你，等你先开口）", { name: pet.name })}
            </Text>
          )}
        </Bubble>
      </View>

      {generated && <View style={{ gap: 8 }}>
        <Sticker bg={tones[draft.selectedStyle]} rotate={0}>{labels[draft.selectedStyle]}</Sticker>
        {state.preferences?.randomStyle !== false && !original
          ? <Text style={styles.small}>{t("本篇口吻已随机选好，写字时保持不变；可在设置关闭随机。")}</Text>
          : <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {STYLES.map((s) => <Chip key={s} label={labels[s]} color={tones[s]}
                active={draft.selectedStyle === s} onPress={() => patch({ selectedStyle: s })} />)}
            </View>}
      </View>}
      {draft.expressionNeedsReview && <View style={{ gap: 10 }}>
        <Text accessibilityRole="alert" style={styles.body}>{t("原话或分类已改动，已保留你润色过的表达。请选择如何处理后保存。")}</Text>
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Button label={t("保留我的润色")} tone="soft" onPress={() => patch({ expressionNeedsReview: false })} />
          <Button label={t("按新原话更新表达")} tone="plain" onPress={() => patch({
            stories: generateStories(pet, draft.description, draft.category),
            signature, expressionNeedsReview: false,
          })} />
        </View>
      </View>}

      {generated && aiAvailable && (
        <View
          style={{
            backgroundColor: colors.lilac,
            borderRadius: 14,
            padding: 16,
            gap: 10,
          }}
        >
          <View style={[styles.between, { flexWrap: "wrap" }]}>
            <Text style={[styles.body, { fontWeight: "700", flex: 1 }]}>
              {t("想让它说得更像它自己？")}
            </Text>
            <Text style={styles.small}>
              {quota
                ? quota.member
                  ? t("会员 · AI 不限次数")
                  : t("本周免费 AI 还剩 {left} / {limit} 次", { left: quota.remaining ?? 0, limit: quota.limit ?? 0 })
                : t("暂时查不到剩余次数")}
            </Text>
          </View>
          <Button
            label={asking ? t("{name}正在组织语言…", { name: pet.name }) : t("让 AI 来说（用 1 次）")}
            icon="zap"
            tone="soft"
            disabled={asking || (!!quota && !quota.member && quota.remaining === 0)}
            onPress={() => {
              void askAI();
            }}
          />
          <Text style={styles.small}>
            {t("一次生成四种口吻。本机版本不限次数；改上面的原话会回到本机版本。")}
          </Text>
        </View>
      )}

      <Button label={more ? t("收起更多选项") : t("更多选项 · 日期、分类与动态")}
        icon="sliders" tone="plain" onPress={() => setMore(!more)} />
      {more && <View style={{ gap: 22 }}>
        <View style={{ gap: 8 }}>
          <Label>{t("实际发生日期")}</Label>
          <DateField label={t("实际发生日期")} value={draft.occurredOn ?? localDay()} onChange={(occurredOn) => patch({ occurredOn })} />
          <View style={[styles.row, { flexWrap: "wrap" }]}>
            <Button label={t("今天")} tone="plain" onPress={() => patch({ occurredOn: localDay() })} />
            <Text style={[styles.small, { flex: 1 }]}>{t("旧照片也可以补上，日记会按这一天排列。")}</Text>
          </View>
          {original && <Text style={styles.small}>{t("沿用这条日记当时的人设，保留已润色的表达供你确认。")}</Text>}
        </View>
        <View style={{ gap: 10 }}>
          <Text style={styles.caps}>
            {t("这算哪类事")}{manualTag ? "" : t(" · 已按原话自动判断")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={t(CATEGORY_LABELS[c])}
                active={draft.category === c}
                onPress={() => {
                  setManualTag(true);
                  retell(draft.description, c);
                }}
              />
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={t("让{name}发到爪友圈", { name: pet.name })}
          accessibilityState={{ checked: posting, disabled: !!block }}
          aria-checked={posting}
          disabled={!!block}
          onPress={() => patch({ published: !draft.published })}
          style={[styles.row, { minHeight: 48, opacity: block ? 0.6 : 1 }]}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              borderWidth: 2.5,
              borderColor: colors.ink,
              backgroundColor: posting ? colors.orange : colors.paper,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {posting && <Icon name="check" color={colors.ink} size={16} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.body, { fontWeight: "700" }]}>
              {t("让{name}发到爪友圈", { name: pet.name })}
            </Text>
            <Text style={styles.small}>
              {block === "sensitive"
                ? t("写到不舒服、走失或离开的事，这次不发动态。")
                : block === "limit"
                  ? t("今天已经发了 2 条，{name}说明天再发。", { name: pet.name })
                  : t("它用爪友圈口吻自己写 · 留在窝里，只在这台设备上")}
            </Text>
          </View>
        </Pressable>
      </View>}
      <Button
        label={original ? t("保存修改") : t("保存日记 · +20 XP")}
        icon="check"
        disabled={busy || asking || !generated || !draft.description.trim() || !!draft.expressionNeedsReview}
        onPress={save}
        style={{ minHeight: 54 }}
      />
    </View>
  );
}
