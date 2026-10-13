import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { locale, t } from "../i18n";
import { dayDate, isPastDay, localDay } from "../domain/dates";
import { calendarDays, shiftMonth } from "../domain/memories";
import { Button, Field, Icon, colors, styles } from "./ui";

/** Calendar selection and direct typing share the same local YYYY-MM-DD value. */
/** `compact` drops the text box: one button shows the date and opens the calendar (docs/01 8.24). */
export default function DateField({ value, onChange, label, compact = false }: { value: string; onChange: (day: string) => void; label: string; compact?: boolean }) {
  const [open, setOpen] = useState(false), [month, setMonth] = useState(() => isPastDay(value) ? value.slice(0, 7) : localDay().slice(0, 7));
  const today = localDay(), cells = calendarDays(month, []);
  const nav = (delta: number, text: string, icon: "chevron-left" | "chevron-right") => {
    const next = shiftMonth(month, delta), disabled = next < "1970-01" || next > today.slice(0, 7);
    return <Pressable accessibilityRole="button" accessibilityLabel={text} disabled={disabled} onPress={() => setMonth(next)}
      style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.3 : 1 }}><Icon name={icon} /></Pressable>;
  };
  return <View style={{ gap: 8 }}>
    {!compact && <Field accessibilityLabel={label} value={value} onChangeText={onChange} maxLength={10} placeholder={t("比如 2024-03-15")} autoCapitalize="none" />}
    <Button label={compact ? (isPastDay(value) ? dayDate(value).toLocaleDateString(locale(), { year: "numeric", month: "long", day: "numeric", weekday: "short" }) : t("选择日期")) : open ? t("收起日期选择") : t("选择日期")}
      icon="calendar" tone={compact ? "soft" : "plain"} style={{ alignSelf: "flex-start" }} onPress={() => {
      if (!open && isPastDay(value)) setMonth(value.slice(0, 7)); setOpen(!open);
    }} />
    {open && <View style={{ borderWidth: 2, borderColor: colors.ink, borderRadius: 12, padding: 8, gap: 8, backgroundColor: colors.paper }}>
      <View style={styles.between}>
        {nav(-1, t("上个月"), "chevron-left")}
        <Text style={[styles.body, { flex: 1, textAlign: "center", fontWeight: "700" }]}>{dayDate(`${month}-01`).toLocaleDateString(locale(), { year: "numeric", month: "long" })}</Text>
        {nav(1, t("下个月"), "chevron-right")}
      </View>
      <View style={[styles.between, { flexWrap: "wrap" }]}>
        <Button label={t("往前一年")} tone="plain" disabled={shiftMonth(month, -12) < "1970-01"} onPress={() => setMonth(shiftMonth(month, -12))} />
        <Button label={t("往后一年")} tone="plain" disabled={shiftMonth(month, 12) > today.slice(0, 7)} onPress={() => setMonth(shiftMonth(month, 12))} />
      </View>
      <View style={{ flexDirection: "row" }}>{["一", "二", "三", "四", "五", "六", "日"].map((d) => <Text key={d} style={[styles.small, { width: "14.2857%", textAlign: "center" }]}>{t(`周${d}`)}</Text>)}</View>
      {Array.from({ length: cells.length / 7 }, (_, row) => <View key={row} style={{ flexDirection: "row" }}>
        {cells.slice(row * 7, row * 7 + 7).map((cell, column) => <View key={column} style={{ width: "14.2857%", padding: 2 }}>
          {cell && <Pressable accessibilityRole="button" accessibilityLabel={cell.day} disabled={cell.day > today}
            accessibilityState={{ selected: value === cell.day, disabled: cell.day > today }} onPress={() => { onChange(cell.day); setOpen(false); }}
            style={{ minHeight: 44, borderWidth: 2, borderColor: colors.ink, borderRadius: 8, backgroundColor: value === cell.day ? colors.green : colors.paper, opacity: cell.day > today ? 0.3 : 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={styles.body}>{cell.n}</Text>
          </Pressable>}
        </View>)}
      </View>)}
    </View>}
  </View>;
}
