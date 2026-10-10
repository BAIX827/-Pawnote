import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import {
  generateStories,
  generateStory,
  generationSignature,
} from "../domain/story-engine";
import { saveEvent } from "../domain/life";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  Draft,
  STYLES,
  StoryStyle,
  newDraft,
} from "../domain/types";
import { choosePhoto } from "../platform/photo";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Field,
  Icon,
  Label,
  Tag,
  colors,
  styles,
} from "../components/ui";
import Onboarding from "./Onboarding";
export default function Record() {
  const { state, update, notify } = useStore();
  const [seed] = useState(newDraft);
  const [busy, setBusy] = useState(false);
  const [variant, setVariant] = useState(0);
  const submitted = useRef(false);
  useEffect(() => {
    if (!submitted.current && state.pet && !state.draft)
      update((s) => ({ ...s, draft: s.draft ?? seed }));
  }, [state.pet, state.draft, seed, update]);
  if (!state.pet) return <Onboarding />;
  const pet = state.pet,
    draft = state.draft ?? seed,
    signature = generationSignature(pet, draft.description, draft.category),
    generated = !!draft.stories && draft.signature === signature;
  const labels: Record<StoryStyle, string> = {
    diary: "内心独白",
    life: pet.route === "work" ? "打工日记" : "校园日记",
    social: "毛圈动态",
    news: "今日喵闻",
  };
  function patch(changes: Partial<Draft>) {
    update((s) => ({ ...s, draft: { ...(s.draft ?? seed), ...changes } }));
  }
  function generate() {
    try {
      patch({
        stories: generateStories(pet, draft.description, draft.category),
        signature,
      });
      notify("故事准备好了，选一种口吻继续编辑。");
    } catch (e) {
      notify(e instanceof Error ? e.message : "生成失败，请重试。");
    }
  }
  function regenerate() {
    if (!draft.stories) return;
    const next = variant + 1;
    setVariant(next);
    patch({
      stories: {
        ...draft.stories,
        [draft.selectedStyle]: generateStory(
          pet,
          draft.description,
          draft.category,
          draft.selectedStyle,
          next,
        ),
      },
    });
    notify("当前口吻已重新生成。");
  }
  async function pick() {
    setBusy(true);
    try {
      const photo = await choosePhoto();
      if (photo) patch({ photo });
    } catch (e) {
      notify(e instanceof Error ? e.message : "照片读取失败。");
    } finally {
      setBusy(false);
    }
  }
  function save() {
    if (!generated || !draft.stories) {
      notify("先生成故事，再保存这件小事。");
      return;
    }
    if (Object.values(draft.stories).some((s) => !s.text.trim())) {
      notify("故事内容需要至少一个字。");
      return;
    }
    const event = {
      id: draft.id,
      description: draft.description.trim(),
      category: draft.category,
      photo: draft.photo,
      createdAt: new Date().toISOString(),
      petSnapshot: { ...pet },
      stories: draft.stories,
      selectedStyle: draft.selectedStyle,
      published: draft.published,
    };
    try {
      const next = saveEvent(state, event);
      submitted.current = true;
      update(next);
      notify("日常已保存 · +20 XP");
      router.replace("/");
    } catch (e) {
      notify(e instanceof Error ? e.message : "保存失败。");
    }
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ gap: 22, maxWidth: 800, width: "100%", alignSelf: "center" }}
    >
      <View style={[styles.between, { alignItems: "flex-start" }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>记录今天的小事</Text>
          <Text style={styles.muted}>你写下真实日常，它负责认真“营业”。</Text>
        </View>
        <Button
          label="返回"
          icon="x"
          tone="plain"
          onPress={() => router.replace("/")}
        />
      </View>
      <Card style={{ gap: 22 }}>
        <View style={styles.row}>
          <Avatar pet={pet} demo={state.demo} />
          <View>
            <Text style={styles.h2}>{pet.name}</Text>
            <Text style={styles.small}>
              {pet.role} · {pet.personality} · 草稿自动保留在本机
            </Text>
          </View>
        </View>
        <View>
          <Label>今天发生了什么？</Label>
          <Field
            accessibilityLabel="今天发生了什么"
            value={draft.description}
            onChangeText={(description) =>
              patch({ description, stories: undefined, signature: undefined })
            }
            multiline
            maxLength={500}
            style={{ minHeight: 115 }}
            placeholder="例如：今天把我的水杯推下去了，还一脸无辜。"
          />
          <Text style={[styles.small, { textAlign: "right", marginTop: 5 }]}>
            {draft.description.length} / 500
          </Text>
        </View>
        <View>
          <Label>给这件事一个标签</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                label={CATEGORY_LABELS[c]}
                active={draft.category === c}
                onPress={() =>
                  patch({
                    category: c,
                    stories: undefined,
                    signature: undefined,
                  })
                }
              />
            ))}
          </View>
          <Text style={[styles.small, { marginTop: 8 }]}>
            标签会影响虚拟故事。选择“其他”可围绕原始描述生成。
          </Text>
        </View>
        <View>
          <Label>加一张照片，留住这一刻（可选）</Label>
          {draft.photo && (
            <Image
              source={{ uri: draft.photo }}
              style={{
                width: "100%",
                height: 220,
                borderRadius: 14,
                marginBottom: 10,
              }}
              resizeMode="cover"
            />
          )}
          <View style={styles.row}>
            <Button
              label={
                busy ? "照片处理中…" : draft.photo ? "更换照片" : "选择照片"
              }
              icon="image"
              tone="soft"
              disabled={busy}
              onPress={() => {
                void pick();
              }}
            />
            {draft.photo && (
              <Button
                label="移除照片"
                tone="plain"
                disabled={busy}
                onPress={() => patch({ photo: undefined })}
              />
            )}
          </View>
          <Text style={[styles.small, { marginTop: 7 }]}>
            最多 1 张 · 5 MB 以内 · 照片会压缩后保存在本机
          </Text>
        </View>
        {!generated && (
          <Button
            label="写成毛孩的故事"
            icon="zap"
            disabled={!draft.description.trim() || busy}
            onPress={generate}
          />
        )}
      </Card>
      {generated && draft.stories && (
        <Card style={{ gap: 20 }}>
          <View style={styles.between}>
            <Text style={styles.h2}>同一件小事，换个口吻</Text>
            <Tag>模板生成</Tag>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {STYLES.map((s) => (
              <Chip
                key={s}
                label={labels[s]}
                active={draft.selectedStyle === s}
                onPress={() => patch({ selectedStyle: s })}
              />
            ))}
          </View>
          <View>
            <Label>
              {draft.selectedStyle === "news" ? "新闻标题" : "故事标题"}
            </Label>
            <Field
              accessibilityLabel="故事标题"
              value={draft.stories[draft.selectedStyle].title}
              maxLength={160}
              onChangeText={(title) =>
                patch({
                  stories: {
                    ...draft.stories!,
                    [draft.selectedStyle]: {
                      ...draft.stories![draft.selectedStyle],
                      title,
                      edited: true,
                    },
                  },
                })
              }
            />
          </View>
          <View>
            <Label>改成你觉得最像它的那句话</Label>
            <Field
              accessibilityLabel="故事内容"
              multiline
              style={{ minHeight: 210, lineHeight: 26 }}
              maxLength={2000}
              value={draft.stories[draft.selectedStyle].text}
              onChangeText={(text) =>
                patch({
                  stories: {
                    ...draft.stories!,
                    [draft.selectedStyle]: {
                      ...draft.stories![draft.selectedStyle],
                      text,
                      edited: true,
                    },
                  },
                })
              }
            />
          </View>
          <Button
            label="重新生成当前口吻"
            icon="refresh-cw"
            tone="plain"
            onPress={regenerate}
          />
          <View style={styles.divider} />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel="同步到本机毛圈预览"
            accessibilityState={{ checked: draft.published }}
            aria-checked={draft.published}
            onPress={() => patch({ published: !draft.published })}
            style={[styles.row, { minHeight: 48 }]}
          >
            <View
              style={{
                width: 23,
                height: 23,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: draft.published ? colors.orange : "#C9CCC5",
                backgroundColor: draft.published ? colors.orange : "#FFF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {draft.published && <Icon name="check" color="#FFF" size={16} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.body}>同步到本机毛圈预览</Text>
              <Text style={styles.small}>
                发布当前选中的口吻；仅这个设备可见。好友社交将在联机版开放。
              </Text>
            </View>
          </Pressable>
          <Button
            label="保存这件小事 · +20 XP"
            icon="check"
            disabled={busy}
            onPress={save}
          />
          <Text style={[styles.small, { textAlign: "center" }]}>
            保存日记默认私密 · 分享由你决定
          </Text>
        </Card>
      )}
    </KeyboardAvoidingView>
  );
}
