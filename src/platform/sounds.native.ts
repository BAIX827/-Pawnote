import { requireOptionalNativeModule } from "expo";
import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { MAX_SOUND_BYTES } from "../domain/sounds";
import { t } from "../i18n/core";
import type { PickedVideo, SoundClip } from "./sounds.types";

const extractor = requireOptionalNativeModule<{ extract: (uri: string, start: number, duration: number) => Promise<string> }>("PawAudio");
export const canExtractVideo = () => !!extractor;
export async function readRecording(uri: string, duration: number): Promise<SoundClip> {
  const file = new File(uri);
  try {
    if (!file.exists || file.size > MAX_SOUND_BYTES) throw new Error(t("声音片段过大，请缩短后重试。"));
    return { audio: `data:audio/mp4;base64,${await file.base64()}`, duration, source: "recording" };
  } finally {
    if (file.exists) file.delete();
  }
}
export async function chooseSoundVideo(): Promise<PickedVideo | undefined> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error(t("请在系统设置中允许照片访问，再选择视频。"));
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], allowsEditing: false, shouldDownloadFromNetwork: true });
  if (result.canceled) return;
  const asset = result.assets[0];
  if ((asset.fileSize ?? new File(asset.uri).size) > 100 * 1024 * 1024 || !asset.duration || asset.duration > 300000)
    throw new Error(t("请选择 100 MB 以内、5 分钟以内且有声音的视频。"));
  return { uri: asset.uri, duration: asset.duration / 1000, name: asset.fileName ?? t("已选视频") };
}
export async function extractSound(video: PickedVideo, start: number, duration: number, signal?: AbortSignal): Promise<SoundClip> {
  if (!extractor) throw new Error(t("视频提取需要新版开发安装包。"));
  let uri: string;
  try { uri = await extractor.extract(video.uri, start, duration); }
  catch { throw new Error(t("视频提取失败，请选择带声音的 MP4/MOV 视频后重试。")); }
  const result = await readRecording(uri, duration);
  if (signal?.aborted) throw new Error(t("已取消提取。"));
  return { ...result, source: "video" };
}
export function releaseVideo(video: PickedVideo) {
  const file = new File(video.uri);
  if (file.uri.startsWith(Paths.cache.uri) && file.exists) file.delete();
}
export function discardRecording(uri: string) { const file = new File(uri); if (file.exists) file.delete(); }
export function playbackSource(audio: string): { uri: string; dispose: () => void } {
  const mime = audio.slice(0, audio.indexOf(";"));
  const extension = mime.includes("wav") ? "wav" : mime.includes("webm") ? "webm" : mime.includes("ogg") ? "ogg" : "m4a";
  const file = new File(Paths.cache, `paw-play-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`);
  file.write(audio.slice(audio.indexOf(",") + 1), { encoding: "base64" });
  return { uri: file.uri, dispose: () => { if (file.exists) file.delete(); } };
}
