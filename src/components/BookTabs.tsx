import { t } from "../i18n";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { newMail } from "../domain/paw-mail";
import { Chip, colors } from "./ui";

export type BookTab = "diary" | "photos" | "sounds" | "mail" | "memories";

/**
 * The row along the top of 爪册 and the pages that belong to it (docs/01 8.37). Switching replaces the
 * page instead of stacking it, so back still leads to wherever the owner came from.
 */
export default function BookTabs({ current, onLocal }: { current: BookTab; onLocal?: (tab: "diary" | "photos") => void }) {
  const { state } = useStore();
  const unread = !!state.pet && newMail(state).length > 0;
  const go = (tab: BookTab) => {
    if (tab === current) return;
    if ((tab === "diary" || tab === "photos") && onLocal) return onLocal(tab);
    if (tab === "diary") return router.replace("/profile");
    if (tab === "photos") return router.replace({ pathname: "/profile", params: { photos: "1" } });
    router.replace(tab === "sounds" ? "/sounds" : tab === "mail" ? "/mail" : "/timemachine");
  };
  const tabs: { key: BookTab; label: string }[] = [
    { key: "diary", label: t("日记") },
    { key: "photos", label: t("照片") },
    { key: "sounds", label: t("声音") },
    { key: "mail", label: t("爪信") },
    { key: "memories", label: t("纪念") },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }} contentContainerStyle={{ alignItems: "center", gap: 10, paddingTop: 4, paddingBottom: 4, paddingRight: 4 }}>
      {tabs.map((tab) => (
        <View key={tab.key}>
          <Chip label={tab.label} active={tab.key === current} onPress={() => go(tab.key)} />
          {tab.key === "mail" && unread && (
            <View pointerEvents="none" style={{ position: "absolute", top: -3, right: -3, width: 12, height: 12, borderRadius: 6,
              backgroundColor: colors.red, borderWidth: 2, borderColor: colors.ink }} />
          )}
        </View>
      ))}
    </ScrollView>
  );
}
