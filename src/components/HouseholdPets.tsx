import { t } from "../i18n";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { MAX_PETS, homePets, removePet, switchPet } from "../domain/household";
import { Avatar, Button, Icon, colors, styles } from "./ui";

/** 我家的毛孩子: every pet at home, tap one to switch, add another, remove one that isn't current. */
export default function HouseholdPets() {
  const { state, update, notify } = useStore();
  const [managing, setManaging] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const pets = homePets(state);
  const current = state.pet?.id;
  const doomed = pets.find((p) => p.id === confirm);
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.between}>
        <Text style={styles.caps}>{t("我家的毛孩子")} · {pets.length}</Text>
        {pets.length > 1 && (
          <Button label={managing ? t("完成") : t("管理")} tone="plain" onPress={() => { setManaging(!managing); setConfirm(null); }} />
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ alignItems: "flex-start", gap: 14, paddingVertical: 4 }}>
        {pets.map((pet) => {
          const active = pet.id === current;
          return (
            <View key={pet.id} style={{ alignItems: "center", gap: 4, minWidth: 66, flexShrink: 0 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={active ? t("{name}（当前）", { name: pet.name }) : t("切换到{name}", { name: pet.name })}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  if (managing && !active) { setConfirm(pet.id); return; }
                  if (active) return;
                  update((s) => switchPet(s, pet.id));
                  notify(t("现在是{name}的视角。", { name: pet.name }));
                }}
                style={({ pressed }) => ({
                  padding: 3,
                  borderRadius: 40,
                  borderWidth: 3,
                  borderColor: active ? colors.orange : "transparent",
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Avatar pet={pet} demo={state.demo} size={50} />
                {managing && !active && (
                  <View style={{ position: "absolute", right: -2, top: -2, backgroundColor: colors.pink, borderRadius: 12, borderWidth: 2, borderColor: colors.ink, padding: 2 }}>
                    <Icon name="x" size={12} color={colors.ink} />
                  </View>
                )}
              </Pressable>
              <Text numberOfLines={1} style={[styles.small, { color: colors.ink, fontWeight: active ? "800" : "500" }]}>
                {pet.name}
              </Text>
            </View>
          );
        })}
        {pets.length < MAX_PETS && !managing && (
          <View style={{ alignItems: "center", gap: 4, minWidth: 66, flexShrink: 0 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("添加宠物")}
              onPress={() => router.push({ pathname: "/onboarding", params: { add: "1" } })}
              style={({ pressed }) => ({
                width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, borderStyle: "dashed",
                borderColor: colors.ink, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1,
              })}
            >
              <Icon name="plus" size={22} color={colors.ink} />
            </Pressable>
            <Text style={styles.small}>{t("添加")}</Text>
          </View>
        )}
      </ScrollView>
      {doomed && (
        <View style={[styles.card, { gap: 10, backgroundColor: colors.pale }]}>
          <Text accessibilityRole="alert" style={styles.body}>
            {t("删除{name}的档案？它的日记、声音和关系都会一起删掉，不能恢复。", { name: doomed.name })}
          </Text>
          <View style={[styles.row, { flexWrap: "wrap" }]}>
            <Button label={t("删除")} tone="danger" onPress={() => {
              update((s) => removePet(s, doomed.id));
              notify(t("已删除{name}的档案。", { name: doomed.name }));
              setConfirm(null);
            }} />
            <Button label={t("取消")} tone="plain" onPress={() => setConfirm(null)} />
          </View>
        </View>
      )}
    </View>
  );
}
