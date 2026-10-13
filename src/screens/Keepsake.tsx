import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { t } from "../i18n";
import { eventDay, newestEvents } from "../domain/dates";
import { keepsakeHTML, keepsakeYears, makeKeepsake } from "../domain/keepsake";
import { exportKeepsake } from "../platform/export";
import SoundPlayer from "../components/SoundPlayer";
import { Button, Card, Chip, Empty, Field, Heading, Icon, colors, styles } from "../components/ui";
import Onboarding from "./Onboarding";

export default function Keepsake() {
  const { state, notify } = useStore();
  const [title, setTitle] = useState(t("{name}的成长纪念册", { name: state.pet?.name ?? "" }));
  const [year, setYear] = useState<string>();
  const [eventIds, setEventIds] = useState(() => new Set(state.events.map((e) => e.id)));
  const [soundIds, setSoundIds] = useState(() => new Set((state.sounds ?? []).map((s) => s.id)));
  const [busy, setBusy] = useState(false), [playing, setPlaying] = useState<string>();
  const [preview, setPreview] = useState(false), [limit, setLimit] = useState(30);
  if (!state.pet) return <Onboarding />;
  const events = newestEvents(state.events).filter((e) => !year || eventDay(e).startsWith(year));
  const sounds = (state.sounds ?? []).filter((s) => !year || s.recordedOn.startsWith(year)).sort((a, b) => b.recordedOn.localeCompare(a.recordedOn));
  const selectedEvents = events.filter((e) => eventIds.has(e.id)), selectedSounds = sounds.filter((s) => soundIds.has(s.id));
  const selectedCount = selectedEvents.length + selectedSounds.length;
  const toggle = (id: string, ids: Set<string>, set: (ids: Set<string>) => void) => { const next = new Set(ids); if (next.has(id)) next.delete(id); else next.add(id); set(next); };
  async function share() {
    setBusy(true);
    try {
      const book = makeKeepsake(state, { title, year, events: [...eventIds], sounds: [...soundIds] });
      await exportKeepsake(keepsakeHTML(book), `pawnote-keepsake-${year ?? "all"}-${Date.now()}`);
      notify(t("纪念册已导出，照片与声音一起保存在文件里。"));
    } catch (e) { notify(e instanceof Error ? e.message : t("导出失败，请重试。")); }
    finally { setBusy(false); }
  }
  const pick = (id: string, label: string, selected: boolean, onPress: () => void, photo?: string) =>
    <Pressable key={id} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: selected }} onPress={onPress}
      style={[styles.row, { borderWidth: 2, borderColor: colors.ink, borderRadius: 10, padding: 12, minHeight: 58, backgroundColor: selected ? colors.green : colors.paper }]}>
      <Icon name={selected ? "check" : "square"} />
      <Text style={[styles.body, { flex: 1 }]} numberOfLines={2}>{label}</Text>
      {photo && <Image source={{ uri: photo }} style={{ width: 44, height: 44, borderRadius: 6 }} />}
    </Pressable>;
  return <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
    <Heading title={t("成长纪念册")} accent={colors.lavender}
      action={<Button label={t("返回")} tone="plain" onPress={() => router.canGoBack() ? router.back() : router.replace("/profile")} />} />
    <Card style={{ gap: 14 }}>
      <Field accessibilityLabel={t("纪念册标题")} value={title} onChangeText={setTitle} maxLength={60} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
        <Chip label={t("全部年份")} active={!year} onPress={() => { setYear(undefined); setLimit(30); setPreview(false); }} />
        {keepsakeYears(state).map((y) => <Chip key={y} label={y} active={year === y} onPress={() => { setYear(y); setLimit(30); setPreview(false); }} />)}
      </ScrollView>
      <Text style={styles.body}>{t("已选 {e} 篇日记、{s} 段声音", { e: selectedEvents.length, s: selectedSounds.length })}</Text>
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        <Button label={t("全选本期")} tone="plain" onPress={() => { setEventIds(new Set([...eventIds, ...events.map((e) => e.id)])); setSoundIds(new Set([...soundIds, ...sounds.map((s) => s.id)])); }} />
        <Button label={t("清除本期选择")} tone="plain" onPress={() => { setEventIds(new Set([...eventIds].filter((id) => !events.some((e) => e.id === id)))); setSoundIds(new Set([...soundIds].filter((id) => !sounds.some((s) => s.id === id)))); }} />
      </View>
      <Button label={busy ? t("正在导出…") : t("导出完整纪念册")} icon="download" disabled={busy || !selectedCount || !title.trim()} onPress={() => void share()} />
      <Button label={preview ? t("返回挑选内容") : t("预览选中的内容")} tone="soft" disabled={!selectedCount} onPress={() => { setPlaying(undefined); setPreview(!preview); }} />
    </Card>
    {preview ? <>
      <Card style={{ backgroundColor: colors.orange, gap: 10 }}><Text style={styles.h1}>{title}</Text><Text style={styles.h2}>{state.pet.name}</Text></Card>
      {[...selectedEvents].reverse().slice(0, limit).map((e) => <Card key={e.id} style={{ gap: 12 }}>
        <Text style={styles.small}>{eventDay(e)}</Text>
        {e.photo && <Image source={{ uri: e.photo }} style={{ height: 200, width: "100%", borderRadius: 10 }} />}
        <Text style={styles.h2}>{e.stories[e.selectedStyle].title}</Text><Text style={styles.body}>{e.stories[e.selectedStyle].text}</Text>
      </Card>)}
      {selectedSounds.map((s) => <Card key={s.id} style={{ backgroundColor: colors.lavender, gap: 12 }}>
        <Text style={styles.small}>{s.recordedOn}</Text><Text style={styles.h2}>{s.title}</Text><Text style={styles.body}>{s.note}</Text>
        {playing === s.id ? <SoundPlayer audio={s.audio} duration={s.duration} onClose={() => setPlaying(undefined)} /> : <Button label={t("播放声音")} icon="play" tone="soft" onPress={() => setPlaying(s.id)} />}
      </Card>)}
    </> : <>
      <Text style={styles.h2}>{t("挑选日记")}</Text>
      {events.slice(0, limit).map((e) => pick(e.id, `${eventDay(e)} · ${e.stories[e.selectedStyle].title}`, eventIds.has(e.id), () => toggle(e.id, eventIds, setEventIds), e.photo))}
      <Text style={styles.h2}>{t("挑选声音")}</Text>
      {sounds.map((s) => pick(s.id, `${s.recordedOn} · ${s.title}`, soundIds.has(s.id), () => toggle(s.id, soundIds, setSoundIds)))}
    </>}
    {(preview ? selectedEvents.length : events.length) > limit && <Button label={t("显示更多内容")} tone="soft" onPress={() => setLimit(limit + 30)} />}
    {!events.length && !sounds.length && <Empty title={t("这一年还没有日记或声音")} action={<Button label={t("记录今天")} onPress={() => router.push("/record")} />} />}
  </View>;
}
