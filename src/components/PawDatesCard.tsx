import { locale, t } from "../i18n";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import {
  SNOOZE_MINUTES,
  activityLabel,
  dayVariant,
  diaryEntry,
  dueRoutines,
  markDone,
  nextRoutine,
  reminderLine,
  remindersPaused,
  snooze,
} from "../domain/paw-dates";
import { Routine, newDraft } from "../domain/types";
import { remindLater } from "../platform/reminders";
import { Button, Icon, colors, display, numeric, shadow, styles } from "./ui";

/** 爪窝's 爪约 corner: what the pet is asking for right now, and the way into the 爪约 page. */
export default function PawDatesCard() {
  const { state, update, notify } = useStore();
  const [now, setNow] = useState(() => new Date());
  const [done, setDone] = useState<Routine>();
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const pet = state.pet;
  if (!pet || remindersPaused(state.events)) return null;
  const routines = state.routines ?? [];
  const due = dueRoutines(routines, now);
  const next = nextRoutine(routines, now);
  const say = (r: Routine) =>
    reminderLine(pet, r, dayVariant(now, routines.indexOf(r)), { events: state.events, now });
  function log(r: Routine) {
    setDone(undefined);
    if (state.draft?.description.trim()) {
      notify(t("爪语里还有没保存的草稿，先把它写完吧。"));
    } else {
      update((s) => ({ ...s, draft: { ...newDraft(s.preferences), ...diaryEntry(pet!, r) } }));
    }
    router.push("/record");
  }
  const nextLine = next
    ? t("下一个：{when} {label}", {
        when:
          next.at.toDateString() === now.toDateString()
            ? next.routine.time
            : `${next.at.toLocaleDateString(locale(), { weekday: "short" })} ${next.routine.time}`,
        label: activityLabel(next.routine),
      })
    : routines.length
      ? t("约定都关着")
      : null;

  return (
    <View style={{ gap: 14 }}>
      {due.slice(0, 2).map((r, i) => (
        <View
          key={r.id}
          style={[
            { backgroundColor: colors.pink, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14, padding: 16, gap: 10, transform: [{ rotate: i % 2 ? "0.6deg" : "-0.6deg" }] },
            shadow(4),
          ]}
        >
          <View style={[styles.between, { flexWrap: "wrap" }]}>
            <View style={{ backgroundColor: colors.paper, borderWidth: 2, borderColor: colors.ink, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, transform: [{ rotate: "-3deg" }] }}>
              <Text style={{ fontFamily: display, fontSize: 14, color: colors.ink }}>{t("{name}在喊你", { name: pet.name })}</Text>
            </View>
            <Text style={[styles.caps, { letterSpacing: 1 }]}>
              {r.time} · {activityLabel(r)}
            </Text>
          </View>
          <View style={{ backgroundColor: colors.paper, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 12, padding: 12 }}>
            <Text style={[styles.body, { fontWeight: "700" }]}>{say(r)}</Text>
          </View>
          <View style={[styles.row, { gap: 10, flexWrap: "wrap" }]}>
            <Button
              label={t("陪了")}
              icon="check"
              onPress={() => {
                update((s) => markDone(s, r.id));
                setDone(r);
              }}
            />
            <Button
              label={t("晚点")}
              icon="clock"
              tone="soft"
              onPress={() => {
                update((s) => snooze(s, r.id));
                void remindLater(pet.name, say(r), SNOOZE_MINUTES).catch(() => {});
                notify(t("好，{n} 分钟后再叫你。", { n: SNOOZE_MINUTES }));
              }}
            />
          </View>
        </View>
      ))}
      {due.length > 2 && <Text style={styles.small}>{t("还有 {n} 件在等你，去爪约看看。", { n: due.length - 2 })}</Text>}
      {done && (
        <View style={[{ backgroundColor: colors.green, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14, padding: 16, gap: 10 }, shadow(4)]}>
          <Text style={[styles.h2, { fontSize: 19, lineHeight: 26 }]}>
            {t("{label}，陪过了。", { label: activityLabel(done) })}
          </Text>

          <View style={[styles.row, { gap: 10, flexWrap: "wrap" }]}>
            <Button label={t("记进爪语")} icon="edit-3" tone="soft" onPress={() => log(done)} />
            <Button label={t("不用了")} tone="plain" onPress={() => setDone(undefined)} />
          </View>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("打开爪约")}
        onPress={() => router.push("/dates")}
        style={({ pressed }) => [
          { backgroundColor: colors.lavender, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12, transform: [{ translateX: pressed ? 2 : 0 }, { translateY: pressed ? 2 : 0 }] },
          shadow(pressed ? 2 : 4),
        ]}
      >
        <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }] }}>
          <Icon name="bell" color={colors.green} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: display, fontSize: 22, lineHeight: 28, color: colors.ink }}>{t("爪约")}</Text>
          <Text numberOfLines={1} style={[styles.small, { color: colors.ink }]}>{nextLine ?? t("它想和你一起做的事")}</Text>
        </View>
        {routines.length > 0 && (
          <Text style={{ fontFamily: numeric, fontSize: 22, color: colors.ink }}>{routines.filter((r) => r.enabled).length}</Text>
        )}
        <Icon name="arrow-right" color={colors.ink} size={20} />
      </Pressable>
    </View>
  );
}
