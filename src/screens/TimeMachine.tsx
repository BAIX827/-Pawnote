import { petLine } from "../domain/story-engine";
import { locale, t } from "../i18n";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { eventDate } from "../domain/dates";
import { firsts, milestones, monthlyPhotos } from "../domain/timeline";
import { LifeEvent, formatDate } from "../domain/types";
import {
  Button,
  Card,
  Empty,
  Heading,
  Icon,
  Tape,
  colors,
  display,
  numeric,
  shadow,
  styles,
} from "../components/ui";
import PastMemories from "../components/PastMemories";
import { pawsonaCard } from "../domain/pawsona";
import Onboarding from "./Onboarding";

const FIRST_LABELS = {
  entry: "第一条记录",
  photo: "第一张照片",
  sleep: "第一次睡觉被记下",
  snack: "第一次偷吃",
  bath: "第一次洗澡",
  chaos: "第一次拆家",
  walk: "第一次散步",
  other: "第一件小事",
} as const;
const monthShort = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale(), { year: "2-digit", month: "short" });
};
const open = (event: LifeEvent) => router.push({ pathname: "/event", params: { id: event.id } });

function Polaroid({ event, caption, size, tilt }: { event: LifeEvent; caption: string; size: number; tilt: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("打开日记：{text}", { text: event.stories[event.selectedStyle].title })}
      onPress={() => open(event)}
      style={[
        { backgroundColor: "#FFF", padding: 7, paddingBottom: 8, borderWidth: 2.5, borderColor: colors.ink, transform: [{ rotate: `${tilt}deg` }] },
        shadow(3),
      ]}
    >
      <Image source={{ uri: event.photo }} style={{ width: size, height: size, backgroundColor: colors.pale }} />
      <Text numberOfLines={1} style={{ width: size, textAlign: "center", marginTop: 6, fontSize: 12, fontFamily: display, fontWeight: "400", color: colors.ink }}>
        {caption}
      </Text>
    </Pressable>
  );
}

type Shelf = { label: string; icon: "mic" | "gift" | "mail" | "zap" | "book"; bg: string; to: "/sounds" | "/anniversaries" | "/mail" | "/pawsona" | "/keepsake" };

/** 成长纪念册 (docs/01 8.29): every memory in one place, sorted into shelves, then the growth timeline. */
export default function TimeMachine() {
  const { state } = useStore();
  if (!state.pet) return <Onboarding />;
  const pet = state.pet,
    marks = milestones(pet, state.events),
    photos = monthlyPhotos(state.events),
    // One card per entry: an entry that is several firsts at once lists them together (docs/01 8.25).
    moments = firsts(state.events).reduce<{ kind: string; label: string; event: LifeEvent }[]>((out, f) => {
      const same = out.find((m) => m.event.id === f.event.id);
      if (same) same.label += ` · ${t(FIRST_LABELS[f.kind])}`;
      else out.push({ kind: f.kind, label: t(FIRST_LABELS[f.kind]), event: f.event });
      return out;
    }, []);
  const stat = (n: number, label: string, bg: string) => (
    <View style={[{ flex: 1, minWidth: 140, backgroundColor: bg, borderRadius: 14, padding: 16 }, shadow(3)]}>
      <Text style={styles.small}>{label}</Text>
      <Text style={{ fontFamily: numeric, fontSize: 44, lineHeight: 52, color: colors.ink }}>
        {n}
        <Text style={{ fontSize: 14 }}> {t("天")}</Text>
      </Text>
    </View>
  );
  const shelves: Shelf[] = [
    { label: t("声音 · {n}", { n: state.sounds?.length ?? 0 }), icon: "mic", bg: colors.green, to: "/sounds" },
    { label: t("纪念日"), icon: "gift", bg: colors.pink, to: "/anniversaries" },
    { label: t("历史爪信"), icon: "mail", bg: colors.orange, to: "/mail" },
    { label: state.pawsona ? t("爪格：{name}", { name: pawsonaCard(pet, state.pawsona).name }) : t("爪格"), icon: "zap", bg: colors.lavender, to: "/pawsona" },
    { label: t("年度纪念册"), icon: "book", bg: colors.sky, to: "/keepsake" },
  ];
  return (
    <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
      <Heading
        title={t("成长纪念册")}
        accent={colors.lavender}
        action={<Button label={t("返回")} tone="plain" onPress={() => router.canGoBack() ? router.back() : router.replace("/profile")} />}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }} contentContainerStyle={{ alignItems: "center", gap: 12, paddingBottom: 6 }}>
        {shelves.map((shelf) => (
          <Pressable
            key={shelf.to}
            accessibilityRole="button"
            accessibilityLabel={shelf.label}
            onPress={() => router.push(shelf.to)}
            style={({ pressed }) => [
              { minWidth: 140, flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: shelf.bg, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14, padding: 14 },
              shadow(pressed ? 1 : 3),
            ]}
          >
            <Icon name={shelf.icon} size={22} color={colors.ink} />
            <Text style={{ fontFamily: display, fontSize: 18, lineHeight: 24, color: colors.ink, flexShrink: 1 }}>{shelf.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {marks.anniversaryToday !== undefined && (
        <Card style={{ backgroundColor: colors.pink, gap: 4 }}>
          <Text style={[styles.h2, { fontSize: 24, lineHeight: 32 }]}>
            {t("今天是 {name} 到家 {n} 周年", { name: pet.name, n: marks.anniversaryToday })}
          </Text>
          <Text style={styles.body}>{t("写一条今天的记录，留给明年的今天看。")}</Text>
        </Card>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {marks.homeDay !== undefined && stat(marks.homeDay, t("{name}来到你身边的第", { name: pet.name }), colors.yellow)}
        {marks.recordingDay !== undefined && stat(marks.recordingDay, t("开始记录的第"), colors.green)}
      </View>
      {marks.nextAnniversary && marks.anniversaryToday === undefined && (
        <Text style={styles.muted}>
          {t("距离到家 {n} 周年还有 {d} 天", { n: marks.nextAnniversary.years, d: marks.nextAnniversary.inDays })}
        </Text>
      )}
      {marks.homeDay === undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("填写到家日期")}
          onPress={() => router.push({ pathname: "/onboarding", params: { edit: "1" } })}
          style={[styles.row, { backgroundColor: colors.paper, borderRadius: 14, borderWidth: 2.5, borderStyle: "dashed", borderColor: colors.ink, padding: 14 }]}
        >
          <Icon name="edit-2" color={colors.muted} />
          <Text style={[styles.muted, { flex: 1 }]}>
            {t("填写到家日期")}
          </Text>
        </Pressable>
      )}

      <PastMemories />
      <Text style={[styles.h2, { fontSize: 24, lineHeight: 32, marginTop: 4 }]}>{t("成长对比")}</Text>
      {photos.length ? (
        <>
          {photos.length >= 2 && (
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 14, paddingVertical: 6 }}>
              <Polaroid event={photos[0].event} caption={monthShort(photos[0].month)} size={128} tilt={-3} />
              <Icon name="arrow-right" color={colors.orange} size={26} />
              <Polaroid event={photos[photos.length - 1].event} caption={monthShort(photos[photos.length - 1].month)} size={128} tilt={3} />
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, padding: 10 }}>
            {photos.map((p, i) => (
              <Polaroid key={p.month} event={p.event} caption={monthShort(p.month)} size={96} tilt={i % 2 ? 2 : -2} />
            ))}
          </ScrollView>
        </>
      ) : (
        <Empty
          title={t("还没有带照片的记录")}
          action={<Button label={t("记录今天")} onPress={() => router.push("/record")} />}
        />
      )}

      <Text style={[styles.h2, { fontSize: 24, lineHeight: 32, marginTop: 4 }]}>{t("“第一次”")}</Text>
      {moments.length ? (
        <View style={{ gap: 16 }}>
          {moments.map((m, i) => (
            <Pressable
              key={m.kind}
              accessibilityRole="button"
              accessibilityLabel={t("打开日记：{text}", { text: m.event.stories[m.event.selectedStyle].title })}
              onPress={() => open(m.event)}
              style={[
                {
                  backgroundColor: [colors.paper, colors.green, colors.lavender][i % 3],
                  borderRadius: 14,
                  borderWidth: 2.5,
                  borderColor: colors.ink,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                },
                shadow(3),
              ]}
            >
              <Tape color={[colors.pink, colors.sky, colors.green][i % 3]} rotate={i % 2 ? 4 : -4} style={{ left: "auto", right: 26, marginLeft: 0 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.small}>{formatDate(eventDate(m.event).toISOString())}</Text>
                <Text style={[styles.h2, { fontSize: 19, lineHeight: 27 }]}>{m.label}</Text>
                <Text style={styles.muted} numberOfLines={2}>
                  {petLine(m.event)}
                </Text>
              </View>
              {m.event.photo && (
                <Image
                  source={{ uri: m.event.photo }}
                  style={{ width: 58, height: 68, borderWidth: 2.5, borderColor: colors.ink, transform: [{ rotate: "4deg" }] }}
                />
              )}
            </Pressable>
          ))}
        </View>
      ) : (
        <Empty title={t("第一次，等你来记")} action={<Button label={t("记录今天")} onPress={() => router.push("/record")} />} />
      )}
    </View>
  );
}
