import { t, useLang } from "../i18n";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { BOND_LABELS, BondLink, BondNode, TONE_LABELS, bondNetwork, setBond } from "../domain/bonds";
import { MAX_PETS, homePets } from "../domain/household";
import { BOND_LEVELS, BondLevel, formatDate } from "../domain/types";
import { eventDate } from "../domain/dates";
import { Avatar, Button, Chip, Empty, Heading, colors, shadow, styles } from "../components/ui";
import Onboarding from "./Onboarding";

// 关系网 (docs/01 8.23): the household's pets in the middle, 爪爪镇 residents around them, and a line
// for every pair coloured by how they get on. Tap a face to see just its relationships.
const RED = "#E0433A";
const LINE: Record<BondLevel, { color: string; width: number; faint?: boolean }> = {
  bestie: { color: "#5E9E00", width: 5 },
  friend: { color: "#8CC63F", width: 3 },
  normal: { color: "#A89F95", width: 2 },
  stranger: { color: "#A89F95", width: 1.5, faint: true },
  foe: { color: RED, width: 3 },
};
const CHIP: Record<BondLevel, string> = {
  bestie: colors.green,
  friend: colors.green,
  normal: colors.paper,
  stranger: colors.lilac,
  foe: colors.pink,
};

export default function Bonds() {
  const { state, update, notify } = useStore();
  const lang = useLang();
  const { width } = useWindowDimensions();
  const [focus, setFocus] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const homeOnly = state.preferences?.bondsHomeOnly === true;
  const network = useMemo(() => bondNetwork(state, new Date(), homeOnly), [state, homeOnly]);
  if (!state.pet) return <Onboarding />;
  const byId = new Map(network.nodes.map((n) => [n.id, n]));
  const name = (n: BondNode) => n.pet?.name ?? n.resident!.name[lang];
  const size = Math.min(width - 32, 560);
  const pos = layout(network.nodes, size);
  const touches = (l: BondLink) => !focus || l.a === focus || l.b === focus;
  const pets = homePets(state);
  const setHomeOnly = (value: boolean) => {
    setFocus(null);
    update((s) => ({ ...s, preferences: { ...s.preferences, bondsHomeOnly: value } }));
  };
  const listed = network.links
    .filter(touches)
    .sort((x, y) => rank(x, byId) - rank(y, byId) || y.score - x.score);
  return (
    <View style={styles.stack}>
      <Heading
        title={t("关系网")}
        accent={colors.green}
        action={<Button label={t("返回")} icon="x" tone="plain" onPress={() => router.canGoBack() ? router.back() : router.replace("/circle")} />}
      />
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        <Chip label={t("全部")} active={!homeOnly} onPress={() => setHomeOnly(false)} />
        <Chip label={t("只看自家宠物")} active={homeOnly} onPress={() => setHomeOnly(true)} />
      </View>

      {homeOnly && pets.length < 2 ? (
        <Empty
          title={t("家里只有{name}一只", { name: state.pet.name })}
          action={pets.length < MAX_PETS ? <Button label={t("添加宠物")} icon="plus" onPress={() => router.push({ pathname: "/onboarding", params: { add: "1" } })} /> : undefined}
        />
      ) : (
        <View style={[{ width: size, height: size, alignSelf: "center", backgroundColor: colors.paper, borderRadius: 18, borderWidth: 2.5, borderColor: colors.ink }, shadow(4)]}>
          {network.links.map((l) => {
            const a = pos.get(l.a)!, b = pos.get(l.b)!;
            const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
            const look = LINE[l.level];
            const lit = touches(l);
            return (
              <View
                key={`${l.a}|${l.b}`}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: (a.x + b.x) / 2 - len / 2,
                  top: (a.y + b.y) / 2 - look.width / 2,
                  width: len,
                  height: look.width,
                  borderRadius: look.width,
                  backgroundColor: look.color,
                  opacity: lit ? (look.faint ? 0.35 : 0.9) : 0.07,
                  transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                }}
              />
            );
          })}
          {network.nodes.map((n) => {
            const p = pos.get(n.id)!;
            const d = n.kind === "pet" ? 52 : 42;
            const on = focus === n.id;
            const dim = !!focus && !on && !network.links.some((l) => (l.a === focus && l.b === n.id) || (l.b === focus && l.a === n.id));
            return (
              <Pressable
                key={n.id}
                accessibilityRole="button"
                accessibilityLabel={name(n)}
                accessibilityState={{ selected: on }}
                onPress={() => setFocus(on ? null : n.id)}
                style={{ position: "absolute", left: p.x - 40, top: p.y - d / 2 - 2, width: 80, alignItems: "center", opacity: dim ? 0.3 : 1 }}
              >
                <View style={{ borderRadius: d, borderWidth: on ? 3 : 0, borderColor: colors.orange, padding: on ? 1 : 0 }}>
                  {n.pet ? (
                    <Avatar pet={n.pet} demo={state.demo} size={d} />
                  ) : (
                    <View style={{ width: d, height: d, borderRadius: d / 2, borderWidth: 2.5, borderColor: colors.ink, backgroundColor: n.resident!.color, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: d * 0.5 }}>{n.resident!.emoji}</Text>
                    </View>
                  )}
                </View>
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: n.kind === "pet" ? "800" : "600", color: colors.ink, backgroundColor: "rgba(255,255,255,0.85)", paddingHorizontal: 4, borderRadius: 6, marginTop: 2 }}>
                  {name(n)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={[styles.row, { flexWrap: "wrap", gap: 14, justifyContent: "center" }]}>
        {[...BOND_LEVELS].reverse().map((level) => (
          <View key={level} style={[styles.row, { gap: 6 }]}>
            <View style={{ width: 22, height: LINE[level].width, borderRadius: 3, backgroundColor: LINE[level].color, opacity: LINE[level].faint ? 0.45 : 1 }} />
            <Text style={styles.small}>{t(BOND_LABELS[level])}</Text>
          </View>
        ))}
      </View>

      {focus && byId.get(focus) && (
        <View style={styles.between}>
          <Text style={styles.h2}>{t("{name}的关系", { name: name(byId.get(focus)!) })}</Text>
          <Button label={t("看全部")} tone="plain" onPress={() => setFocus(null)} />
        </View>
      )}
      <View style={{ gap: 12 }}>
        {listed.map((l) => {
          const key = `${l.a}|${l.b}`;
          const a = byId.get(l.a)!, b = byId.get(l.b)!;
          const last = l.history[0];
          return (
            <View key={key} style={[styles.card, { padding: 14, gap: 8 }]}>
              <View style={[styles.between, { flexWrap: "wrap" }]}>
                <Text style={[styles.body, { fontWeight: "800", flex: 1 }]}>{name(a)} × {name(b)}</Text>
                <View style={[styles.row, { gap: 8 }]}>
                  <Chip label={t(BOND_LABELS[l.level])} active color={CHIP[l.level]} />
                  <Text style={[styles.small, { color: l.score < 0 ? RED : colors.ink, fontWeight: "700" }]}>{l.score > 0 ? `+${l.score}` : l.score}</Text>
                </View>
              </View>
              <Text style={styles.small}>
                {l.editable
                  ? l.chosen ? t("初始：{level}（你设的）", { level: t(BOND_LABELS[l.start]) }) : t("初始：{level}（默认）", { level: t(BOND_LABELS[l.start]) })
                  : t("爪爪镇的老相识")}
                {l.circle > 0 ? t(" · 爪友圈互动 +{n}", { n: l.circle }) : ""}
              </Text>
              {last && (
                <Text style={styles.small} numberOfLines={2}>
                  {t("最近：{date} {tone} {delta}「{text}」", {
                    date: formatDate(eventDate(last.event).toISOString()),
                    tone: t(TONE_LABELS[last.event.together!.tone]),
                    delta: last.delta > 0 ? `+${last.delta}` : String(last.delta),
                    text: last.event.description,
                  })}
                  {l.history.length > 1 ? t(" · 共 {n} 件事", { n: l.history.length }) : ""}
                </Text>
              )}
              {l.editable && (editing === key ? (
                <View style={{ gap: 8 }}>
                  <View style={[styles.row, { flexWrap: "wrap", gap: 8 }]}>
                    {BOND_LEVELS.map((level) => (
                      <Chip key={level} label={t(BOND_LABELS[level])} color={CHIP[level]} active={l.chosen && l.start === level}
                        onPress={() => {
                          update((s) => setBond(s, l.a, l.b, level));
                          setEditing(null);
                          notify(t("{a}和{b}的初始关系设为“{level}”。", { a: name(a), b: name(b), level: t(BOND_LABELS[level]) }));
                        }} />
                    ))}
                  </View>
                  <View style={[styles.row, { flexWrap: "wrap" }]}>
                    {l.chosen && <Button label={t("恢复默认")} tone="plain" onPress={() => { update((s) => setBond(s, l.a, l.b, null)); setEditing(null); }} />}
                    <Button label={t("取消")} tone="plain" onPress={() => setEditing(null)} />
                  </View>
                </View>
              ) : (
                <Button label={t("设初始关系")} icon="edit-2" tone="plain" style={{ alignSelf: "flex-start" }} onPress={() => setEditing(key)} />
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Own pets together first, then pets with residents, then residents among themselves. */
const rank = (l: BondLink, byId: Map<string, BondNode>) =>
  (byId.get(l.a)!.kind === "resident" ? 1 : 0) + (byId.get(l.b)!.kind === "resident" ? 1 : 0);

/** Household pets on an inner ring (or alone in the middle), residents on the outer ring. */
function layout(nodes: BondNode[], size: number) {
  const c = size / 2;
  const pets = nodes.filter((n) => n.kind === "pet"), town = nodes.filter((n) => n.kind === "resident");
  const pos = new Map<string, { x: number; y: number }>();
  const ring = (list: BondNode[], r: number, turn: number) =>
    list.forEach((n, i) => {
      const a = turn + (2 * Math.PI * i) / list.length - Math.PI / 2;
      pos.set(n.id, { x: c + r * Math.cos(a), y: c + r * Math.sin(a) });
    });
  const outer = c - 40;
  if (!town.length) ring(pets, pets.length < 2 ? 0 : outer * 0.75, pets.length === 2 ? Math.PI / 2 : 0);
  else {
    ring(pets, pets.length < 2 ? 0 : outer * 0.38, pets.length === 2 ? Math.PI / 2 : 0);
    ring(town, outer, Math.PI / town.length);
  }
  return pos;
}
