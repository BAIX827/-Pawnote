import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform, Text, View } from "react-native";
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { Button, Icon, colors, numeric } from "./ui";
import { MAX_SOUND_SECONDS, soundTime } from "../domain/sounds";
import { discardRecording, readRecording } from "../platform/sounds";
import type { SoundClip } from "../platform/sounds.types";
import { t } from "../i18n";

const webMime = () => typeof MediaRecorder === "undefined" ? undefined :
  ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((mime) => MediaRecorder.isTypeSupported(mime));
export default function SoundRecorder({ onClip, onError, onBusy }: {
  onClip: (clip: SoundClip) => void; onError: (message: string) => void; onBusy: (busy: boolean) => void;
}) {
  const mounted = useRef(true), active = useRef(false), saving = useRef(false), started = useRef(0);
  const callbacks = useRef({ onClip, onError, onBusy }); callbacks.current = { onClip, onError, onBusy };
  const [busy, setBusy] = useState(false);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, numberOfChannels: 1, bitRate: 64000,
    web: { mimeType: webMime(), bitsPerSecond: 64000 } }, (event) => {
    if (event.hasError) { active.current = false; finishBusy(); if (mounted.current) callbacks.current.onError(t("录音中断，请重新录制。")); }
    else if (event.isFinished && active.current) void collect();
  });
  const status = useAudioRecorderState(recorder, 200);
  function finishBusy() { if (mounted.current) { setBusy(false); callbacks.current.onBusy(false); } }
  async function collect() {
    if (saving.current || !active.current) return;
    saving.current = true; active.current = false;
    try {
      const duration = Math.min(MAX_SOUND_SECONDS, Math.max(0.1, recorder.getStatus().durationMillis / 1000 || (Date.now() - started.current) / 1000));
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!recorder.uri) throw new Error(t("声音读取失败，请重试。"));
      const clip = await readRecording(recorder.uri, duration);
      if (mounted.current) callbacks.current.onClip(clip);
    } catch (error) { if (mounted.current) callbacks.current.onError(error instanceof Error ? error.message : t("录音中断，请重新录制。")); }
    finally { saving.current = false; finishBusy(); }
  }
  const stopRef = useRef<() => Promise<void>>(async () => {});
  stopRef.current = async () => {
    if (!active.current || saving.current) return;
    try { await recorder.stop(); await collect(); }
    catch { active.current = false; finishBusy(); if (mounted.current) callbacks.current.onError(t("录音中断，请重新录制。")); }
  };
  const start = async () => {
    if (busy || active.current) return;
    setBusy(true); callbacks.current.onBusy(true);
    try {
      if (Platform.OS === "web" && (!navigator.mediaDevices?.getUserMedia || !webMime()))
        throw new Error(t("录音需要支持麦克风的浏览器，请使用 HTTPS 或本机地址打开。"));
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error(t("请允许麦克风访问，或在系统设置中开启麦克风权限。"));
      if (!mounted.current) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (!mounted.current) { recorder.record(); await recorder.stop(); if (recorder.uri) discardRecording(recorder.uri); return; }
      active.current = true; started.current = Date.now(); recorder.record({ forDuration: MAX_SOUND_SECONDS });
    } catch (error) { active.current = false; finishBusy(); if (mounted.current) callbacks.current.onError(error instanceof Error ? error.message : t("录音中断，请重新录制。")); }
  };
  useEffect(() => {
    mounted.current = true;
    const sub = AppState.addEventListener("change", (state) => { if (state !== "active") void stopRef.current(); });
    return () => {
      mounted.current = false; sub.remove();
      if (active.current) {
        active.current = false;
        try { void recorder.stop().then(() => { if (recorder.uri) discardRecording(recorder.uri); }).catch(() => {}); }
        catch { /* Native recording is stopped when the audio hook releases it. */ }
      }
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
  }, [recorder]);
  return (
    <View style={{ gap: 16, alignItems: "center", paddingVertical: 14 }}>
      <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: colors.ink, backgroundColor: status.isRecording ? colors.orange : colors.pink, alignItems: "center", justifyContent: "center" }}>
        <Icon name="mic" size={36} />
      </View>
      <Text style={{ fontFamily: numeric, fontSize: 34, color: colors.ink }}>{soundTime(status.durationMillis / 1000)} / {soundTime(MAX_SOUND_SECONDS)}</Text>
      <Button icon={status.isRecording ? "square" : "mic"} label={status.isRecording ? t("停止录音") : busy ? t("正在准备…") : t("开始录音")} disabled={busy && !status.isRecording} onPress={() => { if (status.isRecording) void stopRef.current(); else void start(); }} />
    </View>
  );
}
