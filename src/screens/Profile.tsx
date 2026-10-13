import { locale, t, tList } from "../i18n";
import React, { useState } from "react";
import JournalFilters from "../components/JournalFilters";
import { filterJournal, JournalFilter } from "../domain/memories";
import { eventDate } from "../domain/dates";
import { Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { formatDate } from "../domain/types";
import {
  Button,
  Chip,
  Empty,
  Heading,
  Portrait,
  Sticker,
  Tag,
  Tape,
  colors,
  display,
  shadow,
  styles,
} from "../components/ui";
import Onboarding from "./Onboarding";
import HouseholdPets from "../components/HouseholdPets";
import { pawsonaCard } from "../domain/pawsona";
import { ageLabel, speciesLabel } from "../domain/pet-profile";
export default function Profile() {
  const { state } = useStore();
  const [filter, setFilter] = useState<JournalFilter>({});
  const [tools, setTools] = useState(false);
  const [limit, setLimit] = useState(30);
  const events = filterJournal(state.events, filter);
  if (!state.pet) return <Onboarding />;
  const pet = state.pet;
  return (
    <View style={styles.stack}>
      <Heading
        title={t("爪册")}
        accent={colors.lilac}
        action={
          <Button
            label={t("编辑档案")}
            icon="edit-2"
            tone="soft"
            onPress={() =>
              router.push({ pathname: "/onboarding", params: { edit: "1" } })
            }
          />
        }
      />
      <HouseholdPets />
      <View
        style={[
          {
            backgroundColor: colors.lavender,
            padding: 22,
            paddingTop: 28,
            borderRadius: 14,
            gap: 20,
          },
          shadow(6),
        ]}
      >
        <View style={[styles.row, { gap: 22, alignItems: "center" }]}>
          <Portrait pet={pet} demo={state.demo} size={90} />
          <View style={{ flex: 1, gap: 6 }}>
            <Sticker bg={colors.yellow} rotate={-3}>
              {state.demo ? t("示例居民") : t("爪爪镇居民")}
            </Sticker>
            <Text numberOfLines={2} style={[styles.h1, { fontSize: 36, color: colors.ink }]}>
              {pet.name}
            </Text>
            <Text style={[styles.body, { color: colors.ink, fontWeight: "700" }]}>
              {speciesLabel(pet)} · {ageLabel(pet.ageMonths)}
            </Text>
            <Text style={[styles.small, { color: colors.ink }]}>{tList(pet.personality)}</Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: colors.paper,
            borderWidth: 2.5,
            borderColor: colors.ink,
            borderRadius: 14,
            padding: 14,
            flexDirection: "row",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.h2}>{state.events.length}</Text>
            <Text style={styles.small}>{t("篇日记")}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.h2}>
              {state.events.filter((e) => e.published).length}
            </Text>
            <Text style={styles.small}>{t("条本机动态")}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.h2, { fontSize: 17 }]}>
              {pet.route === "work" ? t("职场") : t("校园")}
            </Text>
            <Text style={styles.small}>{t(pet.role)}</Text>
          </View>
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Chip label={t("日记")} active={!filter.photosOnly} onPress={() => { setFilter({ ...filter, photosOnly: false }); setLimit(30); }} />
          <Chip label={t("照片")} active={filter.photosOnly === true} onPress={() => { setFilter({ ...filter, photosOnly: true }); setLimit(30); }} />
          <Button label={t("声音相册 · {n} 段叫声", { n: state.sounds?.length ?? 0 })} icon="mic" tone="soft" onPress={() => router.push("/sounds")} />
          <Button label={t("成长纪念册")} icon="book" tone="soft" onPress={() => router.push("/keepsake")} />
          <Button label={t("生日与纪念日")} icon="gift" tone="soft" onPress={() => router.push("/anniversaries")} />
          <Button label={t("关系网")} icon="share-2" tone="soft" onPress={() => router.push("/bonds")} />
        </View>
        <Button label={tools ? t("收起更多工具") : t("更多工具 · 爪约、爪信与时光机")} icon="grid" tone="plain" onPress={() => setTools(!tools)} style={{ alignSelf: "flex-start" }} />
        {tools && <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Button
            label={t("爪约")}
            icon="bell"
            tone="soft"
            onPress={() => router.push("/dates")}
            style={{ alignSelf: "flex-start" }}
          />
          <Button
            label={state.pawsona ? t("爪格：{name}", { name: pawsonaCard(pet, state.pawsona).name }) : t("爪格测试")}
            icon="zap"
            tone="soft"
            onPress={() => router.push("/pawsona")}
            style={{ alignSelf: "flex-start" }}
          />
          <Button
            label={t("爪信")}
            icon="mail"
            tone="soft"
            onPress={() => router.push("/mail")}
            style={{ alignSelf: "flex-start" }}
          />
          <Button
            label={t("时光机")}
            icon="clock"
            tone="soft"
            onPress={() => router.push("/timemachine")}
            style={{ alignSelf: "flex-start" }}
          />
          <Button
            label={t("设置")}
            icon="settings"
            tone="soft"
            onPress={() => router.push("/settings")}
            style={{ alignSelf: "flex-start" }}
          />
        </View>}
      </View>
      <JournalFilters events={state.events} filter={filter} onChange={(value) => { setFilter(value); setLimit(30); }} />
      <View style={[styles.between, { marginTop: 6 }]}>
        <View>
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: -4, right: -6, bottom: 3, height: 10, backgroundColor: colors.yellow }}
          />
          <Text style={[styles.h2, { fontSize: 26, lineHeight: 34 }]}>{t("人生日记")}</Text>
        </View>
        <Text style={styles.small}>{t("{n} 条真实记录", { n: events.length })}</Text>
      </View>
      {events.length ? (
        events.slice(0, limit).map((e, i) => {
          const date = eventDate(e);
          return (
            <View key={e.id} style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ alignItems: "center", width: 54 }}>
                <View
                  style={[
                    {
                      width: 54,
                      borderWidth: 2.5,
                      borderColor: colors.ink,
                      borderRadius: 10,
                      backgroundColor: colors.paper,
                      overflow: "hidden",
                      alignItems: "center",
                    },
                    shadow(2),
                  ]}
                >
                  <Text
                    style={{
                      alignSelf: "stretch",
                      textAlign: "center",
                      backgroundColor: colors.orange,
                      color: colors.ink,
                      fontSize: 11,
                      fontWeight: "700",
                      lineHeight: 18,
                    }}
                  >
                    {date.toLocaleDateString(locale(), { month: "short" })}
                  </Text>
                  <Text style={{ fontFamily: display, fontWeight: "400", fontSize: 24, lineHeight: 32, color: colors.ink }}>
                    {date.getDate()}
                  </Text>
                </View>
                <View
                  style={{ flex: 1, width: 0, borderLeftWidth: 2, borderStyle: "dashed", borderColor: colors.ink, marginTop: 4 }}
                />
              </View>
              <View
                style={[
                  {
                    flex: 1,
                    backgroundColor: [colors.paper, colors.green, colors.lavender][i % 3],
                    padding: 16,
                    gap: 10,
                    borderRadius: 14,
                    borderWidth: 2.5,
                    borderColor: colors.ink,
                    marginBottom: 8,
                    transform: [{ rotate: `${i % 2 ? 0.6 : -0.6}deg` }],
                  },
                  shadow(4),
                ]}
              >
                <Tape color={[colors.pink, colors.sky, colors.green][i % 3]} rotate={i % 2 ? 4 : -4} style={{ left: "auto", right: 24, marginLeft: 0 }} />
                <View style={[styles.between, { flexWrap: "wrap" }]}>
                  <Text style={styles.small}>{formatDate(eventDate(e).toISOString())}</Text>
                  <Tag bg={e.published ? colors.green : colors.paper}>
                    {e.published ? t("留在窝里") : t("私密")}
                  </Tag>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("打开日记：{text}", { text: e.description })}
                  onPress={() =>
                    router.push({ pathname: "/event", params: { id: e.id } })
                  }
                >
                  <View style={[styles.row, { alignItems: "flex-start" }]}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={[styles.h2, { fontSize: 19, lineHeight: 28 }]} numberOfLines={2}>
                        {e.stories[e.selectedStyle].title}
                      </Text>
                      <Text style={styles.body} numberOfLines={3}>
                        {e.stories[e.selectedStyle].text}
                      </Text>
                    </View>
                    {e.photo && (
                      <Image
                        source={{ uri: e.photo }}
                        style={{
                          width: 70,
                          height: 84,
                          borderWidth: 2.5,
                          borderColor: colors.ink,
                          transform: [{ rotate: "-4deg" }],
                        }}
                      />
                    )}
                  </View>
                </Pressable>
                <View
                  style={[
                    styles.row,
                    { flexWrap: "wrap", justifyContent: "space-between" },
                  ]}
                >
                  <Text style={styles.small}>
                    {e.petSnapshot.name} ·{" "}
                    {e.petSnapshot.route === "work" ? t("职场") : t("校园")}
                  </Text>
                  <Button
                    label={t("制作爪报")}
                    tone="plain"
                    onPress={() =>
                      router.push({ pathname: "/news", params: { id: e.id } })
                    }
                  />
                </View>
              </View>
            </View>
          );
        })
      ) : (
        <Empty
          title={state.events.length ? t("没有符合筛选的日记") : t("日记本还是空的")}
          action={
            <Button label={filter.day ? t("补记这一天") : t("记录今天")} onPress={() => router.push({ pathname: "/record", params: { date: filter.day } })} />
          }
        />
      )}
      {events.length > limit && <Button label={t("看更早的日记")} tone="soft" onPress={() => setLimit(limit + 30)} />}
    </View>
  );
}
