import React from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { t } from "../i18n";
import { nextOccasions } from "../domain/occasions";
import { remindersPaused } from "../domain/paw-dates";
import { Button, Card, colors, styles } from "./ui";

export default function OccasionPreview() {
  const { state } = useStore();
  if (!state.pet || remindersPaused(state.events)) return null;
  const occasions = nextOccasions(state.pet).filter((o) => o.inDays <= 7);
  if (!occasions.length) return null;
  return <Card style={{ backgroundColor: colors.pink, gap: 10 }}>
    <Text style={styles.h2}>{t("有个特别的日子")}</Text>
    {occasions.map((o) => <Text key={o.kind} style={styles.body}>
      {t(o.kind === "birthday" ? "{name}的生日" : "{name}的到家纪念日", { name: state.pet!.name })}
      {" · "}{o.inDays === 0 ? t("就是今天") : t("还有 {n} 天", { n: o.inDays })}
    </Text>)}
    <Button label={t("打开纪念卡与信")} tone="soft" icon="gift" onPress={() => router.push("/anniversaries")} />
  </Card>;
}
