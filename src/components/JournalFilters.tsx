import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { locale, t } from "../i18n";
import { CATEGORIES, CATEGORY_LABELS, LifeEvent } from "../domain/types";
import { eventDay, dayDate, localDay } from "../domain/dates";
import { calendarDays, filterJournal, JournalFilter, shiftMonth } from "../domain/memories";
import { Button, Card, Chip, Field, Icon, colors, styles } from "./ui";

export default function JournalFilters({ events, filter, onChange }: {
  events: LifeEvent[]; filter: JournalFilter; onChange: (filter: JournalFilter) => void;
}) {
  const [calendar, setCalendar] = React.useState(false);
  // A short diary doesn't need the whole filter panel; it opens on request (docs/01 8.24).
  const [expanded, setExpanded] = React.useState(false);
  const full = expanded || events.length >= 10 || !!(filter.category || filter.photosOnly || filter.month || filter.day);
  const today = localDay(), month = filter.month ?? today.slice(0, 7);
  const months = [...new Set([today.slice(0, 7), ...events.map((e) => eventDay(e).slice(0, 7))])].sort().reverse();
  const candidates = filterJournal(events, { query: filter.query, category: filter.category, photosOnly: filter.photosOnly });
  const patch = (change: Partial<JournalFilter>) => onChange({ ...filter, ...change });
  const heading = dayDate(`${month}-01`).toLocaleDateString(locale(), { year: "numeric", month: "long" });
  const cells = calendarDays(month, candidates);
  const search = (
    <Field accessibilityLabel={t("搜索日记")} placeholder={t("搜洗澡、海边，或日记里的一句话")}
      value={filter.query ?? ""} onChangeText={(query) => patch({ query })} />
  );
  if (!full) return (
    <View style={[styles.row, { gap: 8 }]}>
      <View style={{ flex: 1 }}>{search}</View>
      <Pressable accessibilityRole="button" accessibilityLabel={t("更多筛选")}
        accessibilityState={{ expanded: false }} onPress={() => setExpanded(true)}
        style={({ pressed }) => ({ width: 48, minHeight: 48, alignItems: "center", justifyContent: "center",
          borderRadius: 14, borderWidth: 2.5, borderColor: colors.ink, backgroundColor: colors.paper,
          opacity: pressed ? 0.6 : 1 })}>
        <Icon name="sliders" size={20} />
      </Pressable>
    </View>
  );
  return <Card style={{ gap: 14 }}>
    {search}
    {full && <>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
      <Chip label={t("全部分类")} active={!filter.category} onPress={() => patch({ category: undefined })} />
      {CATEGORIES.map((category) => <Chip key={category} label={t(CATEGORY_LABELS[category])} active={filter.category === category} onPress={() => patch({ category })} />)}
    </ScrollView>
    <View style={[styles.row, { flexWrap: "wrap" }]}>
      <Chip label={t("只看有照片")} active={filter.photosOnly} onPress={() => patch({ photosOnly: !filter.photosOnly })} />
      <Button label={calendar ? t("收起日历") : t("打开日历")} icon="calendar" tone="plain" onPress={() => {
        setCalendar(!calendar); if (!calendar) patch({ month, day: undefined });
      }} />
      <Button label={t("重置筛选")} tone="plain" onPress={() => onChange({})} />
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
      <Chip label={t("全部月份")} active={!filter.month} onPress={() => { patch({ month: undefined, day: undefined }); setCalendar(false); }} />
      {months.map((m) => <Chip key={m} label={m} active={filter.month === m} onPress={() => patch({ month: m, day: undefined })} />)}
    </ScrollView>
    {calendar && <View style={{ gap: 10 }}>
      <View style={styles.between}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("上个月")} disabled={month <= "1970-01"}
          onPress={() => patch({ month: shiftMonth(month, -1), day: undefined })}
          style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", opacity: month <= "1970-01" ? 0.3 : 1 }}><Icon name="chevron-left" /></Pressable>
        <Text style={[styles.body, { flex: 1, textAlign: "center", fontWeight: "700" }]}>{heading}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t("下个月")} disabled={month >= today.slice(0, 7)}
          onPress={() => patch({ month: shiftMonth(month, 1), day: undefined })}
          style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", opacity: month >= today.slice(0, 7) ? 0.3 : 1 }}><Icon name="chevron-right" /></Pressable>
      </View>
      <View style={{ flexDirection: "row" }}>
        {["一", "二", "三", "四", "五", "六", "日"].map((d) => <Text key={d} style={[styles.small, { width: "14.2857%", textAlign: "center" }]}>{t(`周${d}`)}</Text>)}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, row) => <View key={row} style={{ flexDirection: "row" }}>
        {cells.slice(row * 7, row * 7 + 7).map((cell, column) => <View key={column} style={{ width: "14.2857%", padding: 2 }}>
          {cell && <Pressable accessibilityRole="button" accessibilityLabel={t("{date}，{n} 条日记", { date: cell.day, n: cell.count })}
            accessibilityState={{ selected: filter.day === cell.day, disabled: cell.day > today }} disabled={cell.day > today}
            onPress={() => patch({ day: filter.day === cell.day ? undefined : cell.day, month })}
            style={{ minHeight: 48, borderRadius: 8, borderWidth: 2, borderColor: cell.day === today ? colors.orange : colors.ink,
              backgroundColor: filter.day === cell.day ? colors.green : colors.paper, opacity: cell.day > today ? 0.35 : 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={styles.body}>{cell.n}</Text>
            <Text style={[styles.small, { fontSize: 10, lineHeight: 12 }]}>{cell.count ? `• ${cell.count}` : " "}</Text>
          </Pressable>}
        </View>)}
      </View>)}

      {filter.day && <View style={[styles.row, { flexWrap: "wrap" }]}>
        <Text style={styles.body}>{filter.day}</Text>
        <Button label={t("补记这一天")} icon="plus" tone="soft" onPress={() => router.push({ pathname: "/record", params: { date: filter.day } })} />
      </View>}
    </View>}
    </>}
  </Card>;
}
