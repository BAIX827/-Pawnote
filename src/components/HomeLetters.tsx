import { t } from "../i18n";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { remindersPaused } from "../domain/paw-dates";
import { hasNewMail } from "../domain/paw-mail";
import { Icon, colors, display, shadow, styles } from "./ui";

/** 爪窝's corner for 爪信 (a new weekly letter) and 爪格 (until the test has been taken). */
export default function HomeLetters() {
  const { state } = useStore();
  const pet = state.pet;
  if (!pet) return null;
  const mail = hasNewMail(state);
  const quiz = !state.pawsona && !remindersPaused(state.events);
  if (!mail && !quiz) return null;
  const tile = (label: string, sub: string, bg: string, icon: "mail" | "zap", to: "/mail" | "/pawsona") => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push(to)}
      style={({ pressed }) => [
        { flexGrow: 1, flexBasis: 240, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: bg, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14, padding: 14 },
        shadow(pressed ? 1 : 3),
      ]}
    >
      <Icon name={icon} size={26} color={colors.ink} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: display, fontSize: 19, lineHeight: 26, color: colors.ink }}>{label}</Text>
        <Text style={styles.small}>{sub}</Text>
      </View>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {mail && tile(t("{name}给你写了一封信", { name: pet.name }), t("上周的周信，点开看看"), colors.pink, "mail", "/mail")}
      {quiz && tile(t("测测{name}的爪格", { name: pet.name }), t("8 道题，看看它是哪种小动物"), colors.lavender, "zap", "/pawsona")}
    </View>
  );
}
