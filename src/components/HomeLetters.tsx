import { t } from "../i18n";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { remindersPaused } from "../domain/paw-dates";
import { newMail } from "../domain/paw-mail";
import { Icon, colors, display, shadow } from "./ui";

// Only one letter opens by itself per launch; the rest wait on 爪窝's card (docs/01 8.29).
let opened = false;
function claimAutoOpen() {
  if (opened) return false;
  opened = true;
  return true;
}

/**
 * 爪窝's corner for 爪信 and 爪格 (until the test has been taken). The first time 爪窝 shows after launch,
 * a new letter opens by itself, monthly first (docs/01 8.29); the other stays here as a card.
 */
/** Opens a new letter by itself once per launch, whether or not its card has the home note. */
export function LetterAutoOpen() {
  const { state } = useStore();
  const next = newMail(state)[0];
  useEffect(() => {
    if (!next || state.demo || !claimAutoOpen()) return;
    router.push({ pathname: "/mail", params: { kind: next } });
  }, [next, state.demo]);
  return null;
}

export default function HomeLetters() {
  const { state } = useStore();
  const pet = state.pet;
  const fresh = newMail(state);
  if (!pet) return null;
  const mail = fresh.length > 0;
  const quiz = !state.pawsona && !remindersPaused(state.events);
  if (!mail && !quiz) return null;
  const tile = (label: string, bg: string, icon: "mail" | "zap", to: "/mail" | "/pawsona", kind?: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push({ pathname: to, params: kind ? { kind } : {} })}
      style={({ pressed }) => [
        { flexGrow: 1, flexBasis: 240, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: bg, borderWidth: 2.5, borderColor: colors.ink, borderRadius: 14, padding: 14 },
        shadow(pressed ? 1 : 3),
      ]}
    >
      <Icon name={icon} size={26} color={colors.ink} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: display, fontSize: 19, lineHeight: 26, color: colors.ink }}>{label}</Text>
      </View>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {mail && tile(t("{name}给你写了一封信", { name: pet.name }), colors.pink, "mail", "/mail", fresh[0])}
      {quiz && tile(t("测测{name}的爪格", { name: pet.name }), colors.lavender, "zap", "/pawsona")}
    </View>
  );
}
