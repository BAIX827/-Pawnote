import { useState } from "react";
import { Image, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { t } from "../i18n";
import { memoryLine, memoryYears, onThisDay } from "../domain/memories";
import SoundPlayer from "./SoundPlayer";
import { Button, Card, colors, styles } from "./ui";

export default function PastMemories() {
  const { state } = useStore();
  const [index, setIndex] = useState(0), [playing, setPlaying] = useState(false);
  const memories = onThisDay(state.events, state.sounds);
  const memory = memories[index % (memories.length || 1)];
  if (!memory) return null;
  return <Card style={{ backgroundColor: colors.lavender, gap: 12 }}>
    <View style={[styles.between, { flexWrap: "wrap", gap: 8 }]}>
      <Text style={styles.h2}>{t("那年今天")}</Text>
      <Text style={styles.small}>{memoryYears(memory.years)} · {memory.day}</Text>
    </View>
    <Text style={styles.body}>{memoryLine(memory)}</Text>
    {memory.kind === "event" ? <>
      {memory.event.photo && <Image source={{ uri: memory.event.photo }} style={{ width: "100%", height: 200, borderRadius: 10, borderWidth: 2.5, borderColor: colors.ink }} />}
      <Text style={styles.h2} numberOfLines={2}>{memory.event.stories[memory.event.selectedStyle].title}</Text>
      <Text style={styles.body} numberOfLines={3}>{memory.event.description}</Text>
      <Button label={t("翻开这段回忆")} tone="soft" onPress={() => router.push({ pathname: "/event", params: { id: memory.event.id } })} />
    </> : <>
      <Text style={styles.h2}>{memory.sound.title}</Text>
      {!!memory.sound.note && <Text style={styles.body}>{memory.sound.note}</Text>}
      {playing ? <SoundPlayer key={memory.sound.id} audio={memory.sound.audio} duration={memory.sound.duration} onClose={() => setPlaying(false)} />
        : <Button label={t("再听这一声")} icon="play" tone="soft" onPress={() => setPlaying(true)} />}
    </>}
    {memories.length > 1 && <View style={styles.between}>
      <Text style={styles.small}>{t("第 {n} / {total} 段回忆", { n: index % memories.length + 1, total: memories.length })}</Text>
      <Button label={t("下一段回忆")} tone="plain" onPress={() => { setPlaying(false); setIndex(index + 1); }} />
    </View>}
  </Card>;
}
