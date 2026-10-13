import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { t } from "../i18n";
import { SoundMemory, SoundStage, SOUND_STAGES } from "../domain/types";
import { addSound, isSoundDay, localDay, soundAge, soundRange, soundTime, stageForAge, SOUND_STAGE_LABELS } from "../domain/sounds";
import { ageLabel } from "../domain/pet-profile";
import { soundCopy } from "../domain/sound-copy";
import { canExtractVideo, chooseSoundVideo, extractSound, releaseVideo } from "../platform/sounds";
import type { PickedVideo, SoundClip } from "../platform/sounds.types";
import { Button, Card, Chip, Empty, Field, Heading, Icon, Label, Sticker, Tag, Tape, colors, styles } from "../components/ui";
import SoundRecorder from "../components/SoundRecorder";
import SoundPlayer from "../components/SoundPlayer";
import Onboarding from "./Onboarding";

function Memory({ sound, selected, onSelect, onDelete }: { sound: SoundMemory; selected: boolean; onSelect: () => void; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Card style={{ gap: 12, backgroundColor: selected ? colors.lilac : colors.paper }}>
      <Tape color={sound.source === "video" ? colors.pink : colors.green} rotate={-3} style={{ left: "auto", right: 32, marginLeft: 0 }} />
      <View style={[styles.between, { flexWrap: "wrap", marginTop: 4 }]}>
        <Tag bg={colors.green}>{t(SOUND_STAGE_LABELS[sound.stage])} · {ageLabel(sound.ageMonths)}</Tag>
        <Text style={styles.small}>{sound.recordedOn}</Text>
      </View>
      <View style={[styles.row, { alignItems: "flex-start" }]}>
        <Icon name="volume-2" size={28} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.h2}>{sound.title}</Text>
          {!!sound.note && <Text style={styles.body}>{sound.note}</Text>}
          <Text style={styles.small}>{t(sound.source === "video" ? "视频提取" : "直接录音")} · {soundTime(sound.duration)}</Text>
        </View>
      </View>
      {selected ? <SoundPlayer audio={sound.audio} duration={sound.duration} onClose={onSelect} /> :
        <Button label={t("听听这一声")} icon="play" tone="soft" onPress={onSelect} style={{ alignSelf: "flex-start" }} />}
      {confirm ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.small}>{t("删除后，这段声音会从本机相册移除。")}</Text>
          <View style={[styles.row, { flexWrap: "wrap" }]}>
            <Button label={t("确认删除")} tone="danger" onPress={onDelete} />
            <Button label={t("取消")} tone="plain" onPress={() => setConfirm(false)} />
          </View>
        </View>
      ) : <Button label={t("删除")} icon="trash-2" tone="plain" onPress={() => setConfirm(true)} style={{ alignSelf: "flex-start" }} />}
    </Card>
  );
}

export default function Sounds() {
  const { state, update, notify } = useStore();
  const [mode, setMode] = useState<"recording" | "video" | null>(null);
  const [clip, setClip] = useState<SoundClip | null>(null), [video, setVideo] = useState<PickedVideo | null>(null);
  const [recordingBusy, setRecordingBusy] = useState(false), [working, setWorking] = useState(false);
  const [title, setTitle] = useState(""), [note, setNote] = useState("");
  const [day, setDay] = useState(localDay), [months, setMonths] = useState("");
  const [stage, setStage] = useState<SoundStage>("unknown"), [filter, setFilter] = useState<SoundStage | "all">("all");
  const [start, setStart] = useState("0"), [length, setLength] = useState("10");
  const [error, setError] = useState(""), [selected, setSelected] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null), mounted = useRef(true), videoRef = useRef(video);
  useEffect(() => { videoRef.current = video; }, [video]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; abort.current?.abort(); if (videoRef.current) releaseVideo(videoRef.current); };
  }, []);
  if (!state.pet) return <Onboarding />;
  const pet = state.pet, busy = working || recordingBusy;
  const copy = soundCopy(pet);
  const sounds = [...(state.sounds ?? [])].sort((a, b) => b.recordedOn.localeCompare(a.recordedOn) || b.createdAt.localeCompare(a.createdAt));
  const filtered = sounds.filter((s) => filter === "all" || s.stage === filter);
  const setAge = (value: string) => {
    setMonths(value);
    setStage(stageForAge(value.trim() && /^\d+$/.test(value) ? Number(value) : undefined));
  };
  const setDate = (value: string) => {
    setDay(value);
    if (isSoundDay(value)) {
      const age = soundAge(pet, value);
      setMonths(age === undefined ? "" : String(age)); setStage(stageForAge(age));
    }
  };
  const open = (next: "recording" | "video") => {
    setSelected(null); setError(""); setMode(next); setClip(null); setTitle(""); setNote("");
    const today = localDay(), age = soundAge(pet, today);
    setDay(today); setMonths(age === undefined ? "" : String(age)); setStage(stageForAge(age));
  };
  const received = (next: SoundClip) => {
    setClip(next); setError("");
    if (!title) setTitle(t("{name}的这一声", { name: pet.name }).slice(0, 40));
  };
  const pick = async () => {
    if (busy) return;
    setWorking(true); setError("");
    try {
      const next = await chooseSoundVideo();
      if (next && mounted.current) {
        if (videoRef.current) releaseVideo(videoRef.current);
        setVideo(next); setClip(null); setStart("0"); setLength(String(Math.min(10, Math.floor(next.duration * 10) / 10)));
      } else if (next) releaseVideo(next);
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : t("视频读取失败，请选择 MP4 或 MOV 视频。")); }
    finally { if (mounted.current) setWorking(false); }
  };
  const extract = async () => {
    if (!video || busy) return;
    setError("");
    try {
      const range = soundRange(start, length, video.duration);
      setSelected(null); setClip(null); setWorking(true);
      const controller = new AbortController(); abort.current = controller;
      const next = await extractSound(video, range.start, range.duration, controller.signal);
      if (mounted.current) received(next);
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : t("视频提取失败，请选择带声音的 MP4/MOV 视频后重试。")); }
    finally { if (mounted.current) setWorking(false); abort.current = null; }
  };
  const close = () => {
    if (video) releaseVideo(video);
    setVideo(null); setClip(null); setMode(null); setError("");
  };
  const save = () => {
    if (!clip || busy) return;
    try {
      if (months.trim() && !/^\d+$/.test(months.trim())) throw new Error(t("月龄请填写 0–1200 的整数，或留空。"));
      const next = addSound(state, { ...clip, title, note, recordedOn: day, ageMonths: months.trim() ? Number(months) : undefined, stage });
      update(next); close(); setFilter("all"); notify(t("这一声，已经留在声音相册里了。"));
    } catch (e) { setError(e instanceof Error ? e.message : t("请检查标题、日期、月龄和声音片段。")); }
  };
  return (
    <View style={[styles.stack, { maxWidth: 760, width: "100%", alignSelf: "center" }]}>
      <Heading title={t("声音相册")} eyebrow="VOICE MEMORIES" accent={colors.pink}
        action={<Button label={t("返回")} tone="plain" disabled={busy} onPress={() => router.canGoBack() ? router.back() : router.replace("/profile")} />} />
      <Card style={{ backgroundColor: colors.green, gap: 12 }}>
        <Sticker bg={colors.paper} rotate={-2}>{t("长大了，声音也值得被记住")}</Sticker>
        <Text style={[styles.h2, { fontSize: 28, lineHeight: 36 }]}>{t("把 {name} 的这一声，留给以后的你。", { name: pet.name })}</Text>
        <Text style={styles.body}>{copy.description}</Text>
        <Text style={styles.small}>{t("{n} 段声音 · 私密保存在本机 · 随备份一起带走", { n: sounds.length })}</Text>
      </Card>
      {!mode && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <Button label={t("直接录音")} icon="mic" onPress={() => open("recording")} style={{ flex: 1, minWidth: 140 }} />
          <Button label={t("从视频提取")} icon="film" tone="soft" onPress={() => open("video")} style={{ flex: 1, minWidth: 140 }} />
        </View>
      )}
      {mode && (
        <Card style={{ gap: 18, backgroundColor: colors.pale }}>
          <View style={[styles.between, { flexWrap: "wrap" }]}>
            <Text style={styles.h2}>{t(mode === "recording" ? "录下这一声" : "从视频里，留下一段声音")}</Text>
            <Button label={clip ? t("放弃片段") : t("取消")} tone="plain" disabled={busy} onPress={close} />
          </View>
          {mode === "recording" && !clip && <SoundRecorder onClip={received} onError={setError} onBusy={setRecordingBusy} />}
          {mode === "video" && !clip && (
            <View style={{ gap: 14 }}>
              {canExtractVideo() ? (
                <>
                  <Text style={styles.muted}>{t("选择 5 分钟 / 100 MB 以内的视频，提取其中 0.5–60 秒。整个过程在本机完成。")}</Text>
                  <Button label={video ? t("换一个视频") : t("选择视频")} icon="film" disabled={busy} tone="soft" onPress={() => void pick()} />
                  {video && (
                    <>
                      <Text numberOfLines={2} style={styles.body}>{video.name} · {soundTime(video.duration)}</Text>
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <View style={{ flex: 1 }}><Label>{t("开始秒数")}</Label><Field accessibilityLabel={t("开始秒数")} keyboardType="decimal-pad" value={start} onChangeText={setStart} editable={!busy} /></View>
                        <View style={{ flex: 1 }}><Label>{t("片段时长（秒）")}</Label><Field accessibilityLabel={t("片段时长（秒）")} keyboardType="decimal-pad" value={length} onChangeText={setLength} editable={!busy} /></View>
                      </View>
                      <Button label={working ? t("正在提取声音…") : t("提取这段声音")} icon="scissors" disabled={busy} onPress={() => void extract()} />
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.body}>{t("视频提取需要新版开发安装包。")}</Text>
                  <Button label={t("直接录音")} icon="mic" onPress={() => open("recording")} />
                </>
              )}
            </View>
          )}
          {clip && (
            <>
              <SoundPlayer audio={clip.audio} duration={clip.duration} />
              <View><Label>{t("给这一声起个名字")}</Label><Field accessibilityLabel={t("给这一声起个名字")} value={title} onChangeText={setTitle} maxLength={40} placeholder={copy.example} /></View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                <View style={{ flex: 2, minWidth: 160 }}><Label>{t("声音日期")}</Label><Field accessibilityLabel={t("声音日期")} value={day} onChangeText={setDate} maxLength={10} placeholder="YYYY-MM-DD" /><Text style={styles.small}>{t("旧视频可以填拍摄当天的日期。")}</Text></View>
                <View style={{ flex: 1, minWidth: 100 }}><Label>{t("当时月龄")}</Label><Field accessibilityLabel={t("当时月龄")} value={months} onChangeText={setAge} keyboardType="number-pad" maxLength={4} placeholder={t("可留空")} /></View>
              </View>
              <View style={{ gap: 10 }}>
                <Label>{t("成长阶段")}</Label>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{SOUND_STAGES.map((s) => <Chip key={s} label={t(SOUND_STAGE_LABELS[s])} active={stage === s} color={colors.green} onPress={() => setStage(s)} />)}</View>
                <Text style={styles.small}>{t("阶段按月龄预填，你可以按它的成长情况调整。")}</Text>
              </View>
              <View><Label>{t("这一声发生了什么？")}</Label><Field accessibilityLabel={t("这一声发生了什么？")} value={note} onChangeText={setNote} maxLength={300} multiline placeholder={t("当时在做什么，声音听起来怎样…")} /></View>
              <Button label={t("保存这一声")} icon="check" disabled={!title.trim() || busy} onPress={save} />
              <Button label={t(mode === "video" ? "重新选取片段" : "重新录音")} tone="plain" onPress={() => { setClip(null); setError(""); }} />
            </>
          )}
          {!!error && <Text accessibilityRole="alert" style={[styles.body, { fontWeight: "700" }]}>{error}</Text>}
        </Card>
      )}
      <View style={{ gap: 12 }}>
        <Text style={styles.h2}>{t("听它慢慢长大")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Chip label={t("全部声音")} active={filter === "all"} color={colors.ink} onPress={() => { setFilter("all"); setSelected(null); }} />
          {SOUND_STAGES.filter((s) => sounds.some((sound) => sound.stage === s)).map((s) => <Chip key={s} label={t(SOUND_STAGE_LABELS[s])} active={filter === s} color={colors.ink} onPress={() => { setFilter(s); setSelected(null); }} />)}
        </View>
      </View>
      {filtered.length ? filtered.map((sound) => <Memory key={sound.id} sound={sound} selected={selected === sound.id && !mode} onSelect={() => setSelected(selected === sound.id ? null : sound.id)} onDelete={() => { update((s) => ({ ...s, sounds: (s.sounds ?? []).filter((item) => item.id !== sound.id) })); if (selected === sound.id) setSelected(null); notify(t("声音片段已删除。")); }} />) :
        <Empty title={t("第一声，等你来收藏")} subtitle={copy.empty} />}
    </View>
  );
}
