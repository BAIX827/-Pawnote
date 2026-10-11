import { locale, t } from "../i18n";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import {
  ACTIVITIES,
  ALL_DAYS,
  MAX_LABEL,
  MAX_ROUTINES,
  PRESETS,
  RoutineInput,
  activityLabel,
  addRoutine,
  normalizeTime,
  reminderLine,
  remindersPaused,
  removeRoutine,
  updateRoutine,
} from "../domain/paw-dates";
import { AppState, Routine } from "../domain/types";
import {
  ReminderPermission,
  reminderPermission,
  remindersSupported,
  requestReminderPermission,
} from "../platform/reminders";
import { Button, Card, Chip, Field, Heading, Icon, Label, colors, display, numeric, shadow, styles } from "../components/ui";
import Onboarding from "./Onboarding";

// Monday first; 4 January 2026 is a Sunday, so 4 + d is weekday d.
const WEEK = [1, 2, 3, 4, 5, 6, 0];
// Chinese reads best as 一 二 三; English needs Mon Tue to tell the two Ts apart.
const dayName = (d: number) =>
  new Date(2026, 0, 4 + d).toLocaleDateString(locale(), { weekday: locale().startsWith("zh") ? "narrow" : "short" });
const QUICK_TIMES = ["08:00", "12:30", "18:30", "21:00"];

function Days({ days, onToggle }: { days: number[]; onToggle: (day: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 5 }}>
      {WEEK.map((d) => {
        const on = days.includes(d);
        return (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={dayName(d)}
            accessibilityState={{ selected: on }}
            onPress={() => onToggle(d)}
            style={{ flexGrow: 1, flexBasis: 0, minWidth: 34, maxWidth: 56, minHeight: 40, paddingHorizontal: 2, borderRadius: 999, borderWidth: 2, borderColor: colors.ink, backgroundColor: on ? colors.ink : colors.paper, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: on ? colors.green : colors.ink }}>{dayName(d)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const toggle = (days: number[], d: number) => (days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);

function RoutineCard({ routine, index, say, change, remove }: {
  routine: Routine;
  index: number;
  say: string;
  change: (changes: Partial<Pick<Routine, "time" | "days" | "enabled">>) => void;
  remove: () => void;
}) {
  const [time, setTime] = useState(routine.time);
  const commit = () => {
    const clean = normalizeTime(time);
    if (clean && clean !== routine.time) change({ time: clean });
    else setTime(routine.time);
  };
  return (
    <Card style={{ gap: 12, opacity: routine.enabled ? 1 : 0.6, transform: [{ rotate: index % 2 ? "0.5deg" : "-0.5deg" }] }}>
      <View style={[styles.between, { flexWrap: "wrap" }]}>
        <Text style={[styles.h2, { flexShrink: 1 }]}>{activityLabel(routine)}</Text>
        <Chip
          label={routine.enabled ? t("开着") : t("关了")}
          active={routine.enabled}
          onPress={() => change({ enabled: !routine.enabled })}
        />
      </View>
      <Field
        accessibilityLabel={t("提醒时间")}
        value={time}
        onChangeText={setTime}
        onBlur={commit}
        onSubmitEditing={commit}
        maxLength={5}
        keyboardType="numbers-and-punctuation"
        style={{ fontFamily: numeric, fontSize: 26, width: 112, textAlign: "center", paddingVertical: 6 }}
      />
      <Days days={routine.days} onToggle={(d) => routine.days.length > 1 || !routine.days.includes(d) ? change({ days: toggle(routine.days, d) }) : undefined} />
      <View style={{ backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.ink, borderRadius: 12, padding: 10 }}>
        <Text style={styles.muted}>{say}</Text>
      </View>
      <Button label={t("删除")} icon="trash-2" tone="plain" onPress={remove} style={{ alignSelf: "flex-start" }} />
    </Card>
  );
}

export default function PawDates() {
  const { state, update, notify } = useStore();
  const [permission, setPermission] = useState<ReminderPermission>("unsupported");
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("19:00");
  const [days, setDays] = useState(ALL_DAYS);
  useEffect(() => {
    void reminderPermission().then(setPermission).catch(() => {});
  }, []);
  if (!state.pet) return <Onboarding />;
  const pet = state.pet;
  const routines = state.routines ?? [];
  const paused = remindersPaused(state.events);
  const now = new Date();

  function apply(change: (s: AppState) => AppState) {
    try {
      change(state);
      update(change);
      return true;
    } catch (e) {
      notify(e instanceof Error ? e.message : t("保存失败。"));
      return false;
    }
  }
  async function add(input: RoutineInput) {
    if (!apply((s) => addRoutine(s, input))) return false;
    notify(t("约好了：{time} {label}", { time: input.time, label: activityLabel(input) }));
    if (remindersSupported && permission === "undetermined") setPermission(await requestReminderPermission().catch(() => permission));
    return true;
  }
  const status =
    permission === "unsupported"
      ? t("网页版不发系统通知。打开爪窝时，到点的约定会在那里喊你。")
      : permission === "granted"
        ? t("到点会发通知。打开爪窝也能看到。")
        : permission === "denied"
          ? t("通知没打开，到点改在爪窝里提醒。想收通知，可以去系统设置里打开。")
          : t("加上第一条约定时，会问你要不要打开通知。");

  return (
    <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
      <Heading
        title={t("爪约")}
        eyebrow={t("{name}想和你一起做的事", { name: pet.name })}
        accent={colors.orange}
        action={<Button label={t("返回")} tone="plain" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />}
      />
      {paused ? (
        <Card style={{ backgroundColor: colors.lilac, gap: 6 }}>
          <Text style={styles.body}>
            {t("最近的一条记录写到{name}离开了。爪约先停下，不再替它说话，也不发提醒。约定还在，你可以留着，也可以删掉。", { name: pet.name })}
          </Text>
        </Card>
      ) : (
        <View style={[styles.row, { alignItems: "flex-start" }]}>
          <Icon name={permission === "granted" ? "bell" : "bell-off"} color={colors.muted} />
          <Text style={[styles.small, { flex: 1 }]}>{status}</Text>
        </View>
      )}

      {routines.length > 0 && (
        <View style={{ gap: 16 }}>
          {routines.map((r, i) => (
            <RoutineCard
              // Keyed on the time too, so the field resets when a saved time changes.
              key={`${r.id}-${r.time}`}
              routine={r}
              index={i}
              say={paused ? t("（已暂停）") : reminderLine(pet, r, i, { events: state.events, now })}
              change={(changes) => apply((s) => updateRoutine(s, r.id, changes))}
              remove={() => apply((s) => removeRoutine(s, r.id))}
            />
          ))}
        </View>
      )}

      <View style={{ gap: 12 }}>
        <Text style={[styles.h2, { fontSize: 24 }]}>{t("{name}常想做的", { name: pet.name })}</Text>
        <Text style={styles.small}>{t("点一下就加进爪约，每天这个时间提醒。时间和日子加好后还能改。")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {PRESETS[pet.species].map((key, i) => {
            const a = ACTIVITIES[key];
            const added = routines.some((r) => r.activity === key);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={t("加进爪约：{label}", { label: t(a.label) })}
                disabled={added || routines.length >= MAX_ROUTINES}
                onPress={() => void add({ activity: key, time: a.time })}
                style={({ pressed }) => [
                  { backgroundColor: added ? colors.paper : [colors.green, colors.pink, colors.lavender, colors.orange][i % 4], borderWidth: 2.5, borderColor: colors.ink, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, gap: 2, opacity: added ? 0.55 : 1, transform: [{ rotate: `${[-3, 2, -1.5, 3][i % 4]}deg` }, { translateY: pressed ? 2 : 0 }] },
                  shadow(added ? 0 : 3),
                ]}
              >
                <Text style={{ fontFamily: display, fontSize: 18, color: colors.ink }}>{t(a.label)}</Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.ink }}>{added ? t("已加入") : a.time}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Card style={{ gap: 14 }}>
        <Text style={[styles.h2, { fontSize: 22 }]}>{t("写一件它喜欢干的事")}</Text>
        <View>
          <Label>{t("它喜欢")}</Label>
          <Field value={label} onChangeText={setLabel} maxLength={MAX_LABEL} placeholder={t("比如：被摸肚子、咬毛线球")} />
        </View>
        <View>
          <Label>{t("几点")}</Label>
          <View style={[styles.row, { flexWrap: "wrap", gap: 8 }]}>
            <Field value={time} onChangeText={setTime} maxLength={5} keyboardType="numbers-and-punctuation" style={{ width: 100, textAlign: "center" }} accessibilityLabel={t("提醒时间")} />
            {QUICK_TIMES.map((q) => (
              <Chip key={q} label={q} active={time === q} onPress={() => setTime(q)} />
            ))}
          </View>
        </View>
        <View>
          <Label>{t("哪几天")}</Label>
          <Days days={days} onToggle={(d) => setDays(toggle(days, d))} />
        </View>
        {label.trim() !== "" && (
          <View style={{ backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.ink, borderRadius: 12, padding: 10, gap: 2 }}>
            <Text style={styles.caps}>{t("到点它会说")}</Text>
            <Text style={styles.body}>{reminderLine(pet, { activity: "custom", label: label.trim() }, routines.length, { events: state.events, now })}</Text>
          </View>
        )}
        <Button
          label={t("加进爪约")}
          icon="plus"
          disabled={routines.length >= MAX_ROUTINES}
          onPress={() => {
            const clean = normalizeTime(time);
            if (!clean) return notify(t("时间请按 08:30 这样填写。"));
            void add({ activity: "custom", label, time: clean, days }).then((ok) => {
              if (ok) setLabel("");
            });
          }}
          style={{ alignSelf: "flex-start" }}
        />
        <Text style={styles.small}>{t("最多 {n} 条约定。漏了也没关系，它不会记仇。", { n: MAX_ROUTINES })}</Text>
      </Card>
    </View>
  );
}
