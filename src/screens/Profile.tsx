import { locale, t, tList } from "../i18n";
import { useState } from "react";
import JournalFilters from "../components/JournalFilters";
import { filterJournal, JournalFilter } from "../domain/memories";
import { eventDate } from "../domain/dates";
import { Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { LifeEvent, Pet, formatDate } from "../domain/types";
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
import { ageLabel, speciesLabel } from "../domain/pet-profile";
export default function Profile() {
  const { state } = useStore();
  const [filter, setFilter] = useState<JournalFilter>({});
  const [limit, setLimit] = useState(30);
  const events = filterJournal(state.events, filter);
  if (!state.pet) return <Onboarding />;
  const pet = state.pet;
  // What another pet at home recorded with this one shows here too, read-only (docs/01 8.24).
  const filtering = Object.values(filter).some((v) => v !== undefined && v !== false && v !== "");
  const shared = filtering ? [] : (state.household ?? []).flatMap((b) =>
    b.events.filter((e) => e.together?.pets.includes(pet.id)).map((e) => ({ e, with: b.pet })));
  const rows: ({ e: LifeEvent; with?: Pet })[] = [...events.map((e) => ({ e })), ...shared]
    .sort((a, b) => eventDate(b.e).getTime() - eventDate(a.e).getTime());
  return (
    <View style={styles.stack}>
      <Heading
        title={t("爪册")}
        hint={t("档案和日记本")}
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
            <Text style={styles.small}>{t("条爪友圈动态")}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.h2, { fontSize: 17 }]}>
              {pet.route === "work" ? t("职场") : t("校园")}
            </Text>
            <Text style={styles.small}>{t(pet.route === "work" ? "岗位 · {role}" : "班级 · {role}", { role: t(pet.role) })}</Text>
          </View>
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Chip label={t("日记")} active={!filter.photosOnly} onPress={() => { setFilter({ ...filter, photosOnly: false }); setLimit(30); }} />
          <Chip label={t("照片")} active={filter.photosOnly === true} onPress={() => { setFilter({ ...filter, photosOnly: true }); setLimit(30); }} />
          <Button label={t("成长纪念册")} icon="book" tone="soft" onPress={() => router.push("/timemachine")} />
        </View>
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
      {rows.length ? (
        rows.slice(0, limit).map(({ e, with: other }, i) => {
          const date = eventDate(e);
          if (other)
            return (
              <View key={`with:${e.id}`} style={[styles.card, { marginLeft: 66, padding: 14, gap: 6, backgroundColor: colors.pale }]}>
                <Text style={styles.caps}>{t("和{name}一起", { name: other.name })} · {formatDate(date.toISOString())}</Text>
                <Text style={styles.body} numberOfLines={3}>{e.description}</Text>
                <Text style={styles.small}>{t("记在{name}的日记里", { name: other.name })}</Text>
              </View>
            );
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
                    {e.published ? t("已发爪友圈") : t("只在日记里")}
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
      {rows.length > limit && <Button label={t("看更早的日记")} tone="soft" onPress={() => setLimit(limit + 30)} />}
    </View>
  );
}
