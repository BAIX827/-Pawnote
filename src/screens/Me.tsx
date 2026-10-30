import { t, tList } from "../i18n";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { progress, titleFor } from "../domain/life";
import { pawsonaCard } from "../domain/pawsona";
import { ageLabel, speciesLabel } from "../domain/pet-profile";
import HouseholdPets from "../components/HouseholdPets";
import { Avatar, Button, Heading, Icon, Meter, colors, display, shadow, styles } from "../components/ui";
import Onboarding from "./Onboarding";

type Tool = {
  label: string;
  plain: string;
  icon: "zap" | "briefcase" | "book" | "bell" | "file-text" | "share-2" | "settings";
  bg: string;
  to: "/pawsona" | "/life" | "/dates" | "/report" | "/bonds" | "/settings";
};

/** 我的: the pet's own card and every tool that isn't a diary or a memory (docs/01 8.37). */
export default function Me() {
  const { state } = useStore();
  const [petsOpen, setPetsOpen] = useState(false);
  if (!state.pet) return <Onboarding />;
  const pet = state.pet;
  const p = progress(state.events);
  const tools: Tool[] = [
    { label: state.pawsona ? pawsonaCard(pet, state.pawsona).name : t("爪格"), plain: t("性格测试"), icon: "zap", bg: colors.lavender, to: "/pawsona" },
    { label: t("爪迹"), plain: pet.route === "work" ? t("打工经历") : t("上学经历"), icon: pet.route === "work" ? "briefcase" : "book", bg: colors.orange, to: "/life" },
    { label: t("爪约"), plain: t("提醒"), icon: "bell", bg: colors.yellow, to: "/dates" },
    { label: t("本月回顾"), plain: t("这个月过得怎样"), icon: "file-text", bg: colors.mint, to: "/report" },
    { label: t("关系网"), plain: t("它的朋友们"), icon: "share-2", bg: colors.paper, to: "/bonds" },
    { label: t("设置"), plain: t("语言、备份"), icon: "settings", bg: colors.paper, to: "/settings" },
  ];
  return (
    <View style={[styles.stack, { gap: 14, maxWidth: 760, width: "100%", alignSelf: "center" }]}>
      <Heading title={t("我的")} accent={colors.orange}
        action={<Button label={t("编辑档案")} icon="edit-2" tone="soft" onPress={() => router.push({ pathname: "/onboarding", params: { edit: "1" } })} />} />
      <View style={[{ backgroundColor: colors.orange, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14, padding: 14, gap: 10 }, shadow(4)]}>
        <View style={[styles.row, { gap: 12 }]}>
          <Avatar pet={pet} demo={state.demo} size={60} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text numberOfLines={2} style={{ fontFamily: display, fontSize: 30, lineHeight: 36, color: colors.ink }}>{pet.name}</Text>
            <Text style={[styles.small, { color: colors.ink }]}>{speciesLabel(pet)} · {ageLabel(pet.ageMonths)}</Text>
            <Text style={[styles.small, { color: colors.ink }]}>
              {tList(pet.personality)} · {t(pet.route === "work" ? "岗位 · {role}" : "班级 · {role}", { role: t(pet.role) })}
            </Text>
          </View>
        </View>
        <View style={{ gap: 4 }}>
          <View style={styles.between}>
            <Text style={[styles.small, { color: colors.ink, fontWeight: "800" }]}>Lv.{p.level} {titleFor(p.level, pet.route)}</Text>
            <Text style={[styles.small, { color: colors.ink }]}>{t("还差 {n} XP · 每条新记录 +20", { n: p.toNext })}</Text>
          </View>
          <Meter value={p.current} color={colors.yellow} />
        </View>
        <View style={[styles.row, { justifyContent: "space-between", gap: 8 }]}>
          <Text style={[styles.small, { color: colors.ink, flexShrink: 1 }]}>
            {state.events.length} {t("篇日记")} · {state.events.filter((e) => e.published).length} {t("条爪友圈动态")}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("我家的毛孩子")}
            accessibilityState={{ expanded: petsOpen }}
            onPress={() => setPetsOpen(!petsOpen)}
            style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", paddingHorizontal: 4, opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={[styles.small, { color: colors.ink, fontWeight: "800" }]}>{t("我家的毛孩子")} {petsOpen ? "−" : "+"}</Text>
          </Pressable>
        </View>
      </View>
      {petsOpen && <HouseholdPets />}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {tools.map((tool, i) => (
          <Pressable
            key={tool.to}
            accessibilityRole="button"
            accessibilityLabel={`${tool.label} · ${tool.plain}`}
            onPress={() => router.push(tool.to)}
            style={({ pressed }) => [
              { flexGrow: 1, flexBasis: 150, minHeight: 92, backgroundColor: tool.bg, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14,
                padding: 14, gap: 6, transform: [{ rotate: `${[-1, 0.8, -0.6, 1, -0.8, 0.6][i]}deg` }, { translateY: pressed ? 2 : 0 }] },
              shadow(pressed ? 1 : 3),
            ]}
          >
            <Icon name={tool.icon} size={22} color={colors.ink} />
            <Text numberOfLines={1} style={{ fontFamily: display, fontSize: 21, lineHeight: 27, color: colors.ink }}>{tool.label}</Text>
            <Text style={[styles.small, { color: colors.ink }]}>{tool.plain}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
