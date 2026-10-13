import { locale, t } from "../i18n";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import {
  appraisal,
  currency,
  monthReport,
  payslip,
  reportCard,
  reportMonths,
} from "../domain/report";
import { ownerName } from "../domain/story-engine";
import { CATEGORY_LABELS } from "../domain/types";
import {
  Bubble,
  Button,
  Card,
  Chip,
  Heading,
  Stamp,
  Wobble,
  colors,
  display,
  numeric,
  shadow,
  styles,
} from "../components/ui";
import Onboarding from "./Onboarding";

const monthName = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale(), { year: "numeric", month: "long" });
};
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export default function Report() {
  const { state } = useStore();
  const months = reportMonths(state.events);
  const [month, setMonth] = useState(months[0]);
  if (!state.pet) return <Onboarding />;
  const pet = state.pet,
    work = pet.route === "work",
    accent = work ? colors.jade : colors.lavender,
    soft = work ? colors.green : colors.lilac,
    report = monthReport(state.events, month),
    owner = ownerName(pet),
    words = appraisal(pet, report, owner),
    pay = payslip(report),
    card = reportCard(report),
    unit = currency(pet);
  const row = { flexDirection: "row" as const, justifyContent: "space-between" as const, gap: 12, paddingVertical: 7 };
  return (
    <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
      <Heading
        title={t("月度回顾")}
        accent={soft}
        action={<Button label={t("返回")} tone="plain" onPress={() => router.replace("/life")} />}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {months.slice(0, 6).map((m) => (
          <Chip key={m} label={monthName(m)} active={m === month} color={accent} onPress={() => setMonth(m)} />
        ))}
      </View>

      <View
        style={[
          { backgroundColor: colors.paper, borderRadius: 14, borderWidth: 2.5, borderColor: colors.ink, padding: 22, gap: 6 },
          shadow(4),
        ]}
      >
        <View style={styles.between}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.caps, { color: accent }]}>{work ? "PAWNOTE GROUP" : "PAWNOTE ACADEMY"}</Text>
            <Text style={[styles.h1, { fontSize: 30, lineHeight: 40 }]}>
              {work ? t("工资条") : t("生活笔记")}
            </Text>
            <Text style={styles.small}>
              {pet.name} · {t(pet.role)} · {monthName(month)}
            </Text>
          </View>
          <Wobble>
            <Stamp top={t("生活片刻")} main={String(report.entries)} color={colors.orange} size={76} rotate={0} />
          </Wobble>
        </View>
        <View style={{ borderTopWidth: 1.5, borderStyle: "dashed", borderColor: colors.ink, marginTop: 10, paddingTop: 8 }}>
          {work
            ? pay.lines.map((l) => (
                <View key={l.label} style={row}>
                  <Text style={styles.body}>
                    {l.label}
                    {l.count !== undefined && <Text style={styles.small}>  × {l.count}</Text>}
                  </Text>
                  <View style={l.amount < 0 ? { backgroundColor: colors.pink, borderWidth: 2, borderColor: colors.ink, borderRadius: 5, paddingHorizontal: 5 } : undefined}>
                    <Text style={{ fontFamily: numeric, fontSize: 16, lineHeight: 24, color: colors.ink }}>{signed(l.amount)}</Text>
                  </View>
                </View>
              ))
            : card.rows.map((r) => (
                <View key={r.subject} style={row}>
                  <Text style={styles.body}>
                    {r.subject}
                    {r.count > 0 && <Text style={styles.small}>  × {r.count}</Text>}
                  </Text>
                  <Text style={[styles.body, { fontWeight: "700", color: r.count === 0 ? colors.muted : colors.ink }]}>
                    {r.count ? r.count === 1 ? t("1 条记录") : t("{n} 条记录", { n: r.count }) : t("还没记录到")}
                  </Text>
                </View>
              ))}
        </View>
        <View
          style={[
            row,
            {
              alignItems: "flex-end",
              marginTop: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: accent,
              borderWidth: 2.5,
              borderColor: colors.ink,
              borderRadius: 12,
            },
            shadow(3),
          ]}
        >
          <Text style={[styles.body, { fontWeight: "700" }]}>{work ? t("实发") : t("本月学分")}</Text>
          <Text style={{ fontFamily: numeric, fontSize: 48, lineHeight: 54, color: colors.ink }}>
            {work ? pay.total : card.credits}
            <Text style={{ fontSize: 14 }}> {work ? unit : t("分")}</Text>
          </Text>
        </View>
      </View>

      <Card style={{ gap: 14, backgroundColor: soft }}>
        <Text style={[styles.h2, { fontSize: 24, lineHeight: 32 }]}>{t("这一月")}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { n: report.days, label: t("记录天数") },
            { n: report.entries, label: t("记录数") },
            { n: report.top ? t(CATEGORY_LABELS[report.top]) : "—", label: t("最常做的事") },
          ].map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: colors.paper, borderRadius: 14, padding: 12 }}>
              <Text numberOfLines={1} style={{ fontFamily: display, fontWeight: "400", fontSize: 24, lineHeight: 32, color: colors.ink }}>
                {s.n}
              </Text>
              <Text style={styles.small}>{s.label}</Text>
            </View>
          ))}
        </View>
        {report.highlight && (
          <View>
            <Text style={styles.caps}>{t("本月代表作")}</Text>
            <Button
              label={report.highlight.stories[report.highlight.selectedStyle].title}
              tone="plain"
              style={{ alignSelf: "flex-start", paddingHorizontal: 0 }}
              onPress={() => router.push({ pathname: "/event", params: { id: report.highlight!.id } })}
            />
          </View>
        )}
        <View style={{ gap: 6 }}>
          <Text style={styles.caps}>{t("和{owner}一起回看", { owner })}</Text>
          <Bubble tail="right">
            <Text style={styles.body}>{words.manager}</Text>
          </Bubble>
        </View>
        <View style={{ gap: 6, marginTop: 6 }}>
          <Text style={styles.caps}>{t("{name}自评", { name: pet.name })}</Text>
          <Bubble tail="left" bg={colors.yellow}>
            <Text style={[styles.body, { fontWeight: "600" }]}>{words.self}</Text>
          </Bubble>
        </View>
      </Card>
      <Button label={t("添一段经历")} icon="plus" onPress={() => router.push("/record")} />
    </View>
  );
}
