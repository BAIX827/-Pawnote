import StoryStylePicker, { storyColors } from "../components/StoryStylePicker";
import { t } from "../i18n";
import { useEffect, useRef, useState } from "react";
import { Image, Platform, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../data/store";
import {
  detectCategory,
  generateStories,
  retellDraft,
  voiceVariant,
  generationSignature,
  ownerName,
  selfName,
} from "../domain/story-engine";
import { dayDate, eventDay, eventTimestamp, isPastDay, localDay } from "../domain/dates";
import { saveEvent } from "../domain/life";
import { postBlock } from "../domain/paw-circle";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  Category,
  Draft,
  LifeEvent,
  TONES,
  newDraft,
} from "../domain/types";
import { homePets, mentionedPets } from "../domain/household";
import { TONE_LABELS, guessTone } from "../domain/bonds";
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
  Wobble,
  colors,
  display,
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

export default function Record() {
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const { state } = useStore();
  const original = state.events.find((e) => e.id === id);
  if (id && !original) return <Empty title={t("这条记录已移除")} action={<Button label={t("返回爪册")} onPress={() => router.replace("/profile")} />} />;
  return <Recorder key={id ?? "new"} original={original} initialDate={date} />;
}
function Recorder({ original, initialDate }: { original?: LifeEvent; initialDate?: string }) {
  const { state, update, notify } = useStore();
  const [seed] = useState(() => ({ ...newDraft(state.preferences, state.events.length), occurredOn: initialDate ?? localDay() }));
  const [editDraft, setEditDraft] = useState<Draft | undefined>(() => original ? {
    id: original.id, description: original.description, category: original.category,
    photo: original.photo, stories: original.stories, selectedStyle: original.selectedStyle,
    published: original.published, occurredOn: eventDay(original), together: original.together,
    signature: generationSignature(original.petSnapshot, original.description, original.category),
  } : undefined);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(!!original || !!initialDate);
  const [manualTag, setManualTag] = useState(!!original);
  const [manualTone, setManualTone] = useState(!!original?.together);
  const [manualCompanions, setManualCompanions] = useState(!!original);
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
      stories: generateStories(pet, s.draft.description, s.draft.category, voiceVariant(s.events, s.draft.category)),
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
  const others = homePets(state).filter((p) => p.id !== pet.id);
  const tone = draft.together ? (manualTone ? draft.together.tone : guessTone(draft.description)) : undefined;
  function toggleCompanion(petId: string) {
    setManualCompanions(true);
    const now = draft.together?.pets ?? [];
    const pets = now.includes(petId) ? now.filter((p) => p !== petId) : [...now, petId];
    patch({ together: pets.length ? { pets, tone: draft.together?.tone ?? "neutral" } : undefined });
  }
  function patch(changes: Partial<Draft>) {
    if (original) setEditDraft((d) => ({ ...(d ?? seed), ...changes }));
    else update((s) => ({ ...s, draft: { ...(s.draft ?? seed), ...changes } }));
  }
  // Every keystroke on the owner's side re-tells the story on the pet's side.
  function retell(description: string, category: Category) {
    const next = retellDraft(pet!, draft, description, category, voiceVariant(state.events, category, original));
    // Pets named in the owner's words are ticked under 和谁一起 until the owner picks by hand (docs/01 8.24).
    if (!manualCompanions && others.length) {
      const named = mentionedPets(description, others);
      patch({ ...next, together: named.length ? { pets: named, tone: draft.together?.tone ?? "neutral" } : undefined });
    } else patch(next);
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
      together: draft.together && tone ? { pets: draft.together.pets, tone } : undefined,
    };
    try {
      const next = saveEvent(state, event);
      submitted.current = true;
      update(next);
      notify(original ? t("日记已更新，经验保持不变。")
        : t("{tag}已保存 · +20 XP", { tag: t(CATEGORY_LABELS[draft.category]) }));
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
        accent={colors.pink}
        action={
          <Button label={t("返回")} icon="x" tone="plain" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} />
        }
      />

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
          <View style={[styles.row, { marginTop: 8, justifyContent: "flex-end" }]}>
            <Text style={styles.small}>{draft.description.length} / 500</Text>
          </View>
        </Bubble>
      </View>

      <View style={{ gap: 8 }}>
        {draft.photo && (
          <Image
            source={{ uri: draft.photo }}
            accessibilityLabel={t("照片")}
            style={{ width: 88, height: 88, borderRadius: 10, backgroundColor: colors.pale }}
            resizeMode="cover"
          />
        )}
        <View style={[styles.row, { flexWrap: "wrap", gap: 8 }]}>
          <Button
            label={busy ? t("照片处理中…") : draft.photo ? t("更换照片") : t("选择照片")}
            icon="image"
            tone="plain"
            disabled={busy}
            onPress={() => { void pick(); }}
          />
          {Platform.OS !== "web" && (
            <Button
              label={t("拍一张")}
              icon="camera"
              tone="plain"
              disabled={busy}
              onPress={() => { void pick("camera"); }}
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
        </View>
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
        <Bubble tail="left" bg={generated ? storyColors[draft.selectedStyle] : colors.line}>
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
            </View>
          ) : (
            <Text style={[styles.body, { color: colors.muted, minHeight: 60 }]}>
              {t("（{name}正盯着你）", { name: pet.name })}
            </Text>
          )}
        </Bubble>
      </View>

      {generated && <View style={{ gap: 8 }}>
        {/* The voice can always be switched here, not only when random voices are off (docs/01 8.26). */}
        <StoryStylePicker route={pet.route} selected={draft.selectedStyle} onSelect={(selectedStyle) => patch({ selectedStyle })} />
      </View>}
      {draft.expressionNeedsReview && <View style={{ gap: 10 }}>
        <Text accessibilityRole="alert" style={styles.body}>{t("原话或分类已改动，已保留你润色过的表达。请选择如何处理后保存。")}</Text>
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Button label={t("保留我的润色")} tone="soft" onPress={() => patch({ expressionNeedsReview: false })} />
          <Button label={t("按新原话更新表达")} tone="plain" onPress={() => patch({
            stories: generateStories(pet, draft.description, draft.category, voiceVariant(state.events, draft.category, original)),
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
        </View>
      )}
      {others.length > 0 && <View style={{ gap: 10 }}>
        <Text style={styles.caps}>{t("和谁一起")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {others.map((p) => (
            <Chip key={p.id} label={p.name} active={!!draft.together?.pets.includes(p.id)} onPress={() => toggleCompanion(p.id)} />
          ))}
        </View>
        {draft.together && tone && <View style={{ gap: 8 }}>
          <Text style={styles.small}>
            {t("这次相处")}{manualTone ? "" : t(" · 已按原话猜了一个")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {TONES.map((k) => (
              <Chip key={k} label={t(TONE_LABELS[k])}
                color={k === "bad" ? colors.pink : k === "good" ? colors.green : colors.lilac}
                active={tone === k}
                onPress={() => { setManualTone(true); patch({ together: { pets: draft.together!.pets, tone: k } }); }} />
            ))}
          </View>
        </View>}
      </View>}
      <Button label={more ? t("收起更多选项") : t("更多选项 · 日期、分类与动态")}
        icon="sliders" tone="plain" onPress={() => setMore(!more)} />
      {more && <View style={{ gap: 22 }}>
        <View style={{ gap: 8 }}>
          <Label>{t("实际发生日期")}</Label>
          <DateField compact label={t("实际发生日期")} value={draft.occurredOn ?? localDay()} onChange={(occurredOn) => patch({ occurredOn })} />
          {(draft.occurredOn ?? localDay()) !== localDay() && (
            <Button label={t("改回今天")} tone="plain" style={{ alignSelf: "flex-start" }} onPress={() => patch({ occurredOn: localDay() })} />
          )}
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
            {block && <Text style={styles.small}>
              {block === "sensitive"
                ? t("写到不舒服、走失或离开的事，这次不发动态。")
                : t("今天已经发了 2 条，{name}说明天再发。", { name: pet.name })}
            </Text>}
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
