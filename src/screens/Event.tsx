import StoryStylePicker, { storyColors } from "../components/StoryStylePicker";
import { t } from "../i18n";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../data/store";
import { StoryStyle, formatDate } from "../domain/types";
import { homePets } from "../domain/household";
import { TONE_DELTA, TONE_LABELS } from "../domain/bonds";
import { eventDate } from "../domain/dates";
import { deleteEvent } from "../domain/life";
import {
  Avatar,
  Bubble,
  Button,
  Empty,
  Heading,
  Icon,
  Tape,
  colors,
  display,
  shadow,
  styles,
} from "../components/ui";
import { ownerName } from "../domain/story-engine";
export default function Event() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, update, notify } = useStore();
  const event = state.events.find((e) => e.id === id);
  const [style, setStyle] = useState<StoryStyle>(
    event?.selectedStyle ?? "diary",
  );
  const [confirm, setConfirm] = useState(false);
  if (!event)
    return (
      <Empty
        title={t("这条记录已移除")}
        action={
          <Button label={t("返回档案")} onPress={() => router.replace("/profile")} />
        }
      />
    );
  return (
    <View
      style={{
        ...styles.stack,
        maxWidth: 800,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <Heading
        title={t("这一天")}
        eyebrow={`${formatDate(eventDate(event).toISOString())} · ${t(event.petSnapshot.role)}`}
        accent={storyColors[style]}
        action={
          <Button label={t("返回")} tone="plain" onPress={() => router.canGoBack() ? router.back() : router.replace("/profile")} />
        }
      />
      {event.together && (() => {
        const names = homePets(state).filter((p) => event.together!.pets.includes(p.id)).map((p) => p.name);
        return names.length > 0 && (
          <Pressable accessibilityRole="link" onPress={() => router.push("/bonds")}>
            <Text style={[styles.small, { color: colors.ink, fontWeight: "700" }]}>
              {t("和{names}一起 · {tone} {delta}", {
                names: names.join(t("、")),
                tone: t(TONE_LABELS[event.together!.tone]),
                delta: TONE_DELTA[event.together!.tone] > 0 ? `+${TONE_DELTA[event.together!.tone]}` : String(TONE_DELTA[event.together!.tone]),
              })}
            </Text>
          </Pressable>
        );
      })()}
      {event.photo && (
        <View
          style={[
            {
              backgroundColor: "#FFF",
              padding: 10,
              paddingBottom: 30,
              borderWidth: 2.5,
              borderColor: colors.ink,
              transform: [{ rotate: "-1.2deg" }],
              marginTop: 6,
            },
            shadow(5),
          ]}
        >
          <Tape color={colors.pink} />
          <Image
            source={{ uri: event.photo }}
            style={{ width: "100%", height: 300 }}
            resizeMode="cover"
          />
        </View>
      )}
      <View style={{ gap: 8 }}>
        <View style={[styles.row, { justifyContent: "flex-end", gap: 8 }]}>
          <Text style={styles.caps}>{t("{owner}的原话", { owner: ownerName(event.petSnapshot) })}</Text>
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
        <Bubble tail="right">
          <Text style={[styles.body, { fontSize: 16 }]}>{event.description}</Text>
        </Bubble>
      </View>
      <View style={{ gap: 8, marginTop: 6 }}>
        <View style={[styles.row, { gap: 8 }]}>
          <Avatar pet={event.petSnapshot} demo={state.demo} size={34} />
          <Text style={styles.caps}>{t("{name}说", { name: event.petSnapshot.name })}</Text>
        </View>
        <Bubble tail="left" bg={storyColors[style]}>
          <Text style={{ fontSize: 22, lineHeight: 32, fontWeight: "400", fontFamily: display, color: colors.ink, marginBottom: 8 }}>
            {event.stories[style].title}
          </Text>
          <Text style={[styles.body, { fontSize: 16, lineHeight: 29 }]}>
            {event.stories[style].text}
          </Text>
        </Bubble>
      </View>
      <View style={{ gap: 14, marginTop: 6 }}>
        <StoryStylePicker route={event.petSnapshot.route} selected={style} onSelect={setStyle} />
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Button label={t("编辑日记")} icon="edit-2" tone="soft"
            onPress={() => router.push({ pathname: "/record", params: { id: event.id } })} />
          <Button
            label={t("制作爪报卡")}
            icon="file-text"
            tone="soft"
            onPress={() =>
              router.push({ pathname: "/news", params: { id: event.id } })
            }
          />
          <Button
            label={t("删除记录")}
            icon="trash-2"
            tone="danger"
            onPress={() => setConfirm(true)}
          />
        </View>
        {confirm && (
          <View
            style={{
              gap: 12,
              backgroundColor: colors.pale,
              borderWidth: 2.5,
              borderColor: colors.ink,
              padding: 16,
              borderRadius: 12,
            }}
          >
            <Text style={styles.body}>
              {t("删除这件小事？关联故事、本机动态和新闻将一起移除，成长减少 20 XP。")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <Button
                label={t("确认删除这条记录")}
                tone="danger"
                onPress={() => {
                  update((s) => deleteEvent(s, event.id));
                  notify(t("记录已删除，成长已重新计算。"));
                  router.replace("/profile");
                }}
              />
              <Button
                label={t("取消")}
                tone="plain"
                onPress={() => setConfirm(false)}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
