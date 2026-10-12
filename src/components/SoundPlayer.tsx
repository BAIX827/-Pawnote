import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Button, colors, styles } from "./ui";
import { playbackSource } from "../platform/sounds";
import { soundTime } from "../domain/sounds";
import { t } from "../i18n";

/** Players exist only for the selected clip, keeping the album cheap to scroll. */
export default function SoundPlayer({ audio, duration, onClose }: { audio: string; duration: number; onClose?: () => void }) {
  const player = useAudioPlayer(null, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);
  const [ready, setReady] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    let source: ReturnType<typeof playbackSource> | undefined;
    let alive = true;
    Promise.resolve().then(() => {
      if (!alive) return;
      try { source = playbackSource(audio); player.replace(source.uri); setReady(true); }
      catch { setError(t("声音读取失败，请重试。")); }
    });
    return () => {
      alive = false;
      try { player.pause(); player.replace(null); } catch { /* The audio hook may have released it already. */ }
      source?.dispose();
    };
  }, [audio, player]);
  const toggle = async () => {
    try {
      if (status.playing) { player.pause(); return; }
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (status.didJustFinish || status.currentTime >= duration - 0.1) await player.seekTo(0);
      player.play();
    } catch { setError(t("播放失败，请重新打开片段。")); }
  };
  return (
    <View style={{ gap: 10 }}>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.lilac, overflow: "hidden" }}>
        <View style={{ height: 8, backgroundColor: colors.ink, width: `${Math.min(100, status.currentTime / duration * 100)}%` }} />
      </View>
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        <Button icon={status.playing ? "pause" : "play"} label={status.playing ? t("暂停") : t("播放声音")} tone="soft" disabled={!ready} onPress={() => void toggle()} />
        <Text style={styles.small}>{soundTime(status.currentTime)} / {soundTime(duration)}</Text>
        {onClose && <Button label={t("收起")} tone="plain" onPress={onClose} />}
      </View>
      {(error || status.error) && <Text accessibilityRole="alert" style={styles.small}>{error || t("播放失败，请重新打开片段。")}</Text>}
    </View>
  );
}
