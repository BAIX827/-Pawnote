import { MAX_SOUND_BYTES } from "../domain/sounds";
import { t } from "../i18n/core";
import type { PickedVideo, SoundClip } from "./sounds.types";

export const canExtractVideo = () => typeof window !== "undefined" && !!window.AudioContext && !!window.OfflineAudioContext;
async function blobAudio(blob: Blob): Promise<string> {
  if (!blob.size || blob.size > MAX_SOUND_BYTES) throw new Error(t("声音片段过大，请缩短后重试。"));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(t("声音读取失败，请重试。")));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}
export async function readRecording(uri: string, duration: number): Promise<SoundClip> {
  const context = new AudioContext();
  try {
    const response = await fetch(uri);
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    return await encodeWave(buffer, 0, duration, "recording");
  } catch { throw new Error(t("声音读取失败，请重试。")); }
  finally { URL.revokeObjectURL(uri); await context.close(); }
}
export async function chooseSoundVideo(): Promise<PickedVideo | undefined> {
  const file = await new Promise<File | undefined>((resolve) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "video/*"; input.style.display = "none";
    document.body.appendChild(input);
    const done = (value?: File) => { input.remove(); resolve(value); };
    input.onchange = () => done(input.files?.[0]);
    input.oncancel = () => done();
    input.click();
  });
  if (!file) return;
  if (file.size > 100 * 1024 * 1024) throw new Error(t("请选择 100 MB 以内、5 分钟以内且有声音的视频。"));
  const uri = URL.createObjectURL(file);
  const video = document.createElement("video");
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(t("视频读取失败，请选择 MP4 或 MOV 视频。"))), 15000);
      video.onloadedmetadata = () => { clearTimeout(timeout); resolve(video.duration); };
      video.onerror = () => { clearTimeout(timeout); reject(new Error(t("视频读取失败，请选择 MP4 或 MOV 视频。"))); };
      video.preload = "metadata"; video.src = uri;
    });
    if (!Number.isFinite(duration) || duration <= 0 || duration > 300) throw new Error(t("请选择 100 MB 以内、5 分钟以内且有声音的视频。"));
    return { uri, duration, name: file.name };
  } catch (error) { URL.revokeObjectURL(uri); throw error; }
  finally { video.removeAttribute("src"); video.load(); }
}
/** Portable PCM keeps browser recordings playable after a backup is restored on a phone. */
async function encodeWave(buffer: AudioBuffer, start: number, duration: number, origin: SoundClip["source"], signal?: AbortSignal): Promise<SoundClip> {
    if (start >= buffer.duration) throw new Error(t("视频声音较短，请调整片段范围。"));
    const length = Math.min(duration, buffer.duration - start);
    const rate = 16000;
    const offline = new OfflineAudioContext(1, Math.ceil(length * rate), rate);
    const source = offline.createBufferSource();
    source.buffer = buffer; source.connect(offline.destination); source.start(0, start, length);
    const rendered = await offline.startRendering();
    if (signal?.aborted) throw new Error(t("已取消提取。"));
    const samples = rendered.getChannelData(0);
    const wav = new ArrayBuffer(44 + samples.length * 2), view = new DataView(wav);
    const text = (at: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i)); };
    text(0, "RIFF"); view.setUint32(4, wav.byteLength - 8, true); text(8, "WAVE"); text(12, "fmt ");
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    text(36, "data"); view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, sample * (sample < 0 ? 32768 : 32767), true);
    }
    return { audio: await blobAudio(new Blob([wav], { type: "audio/wav" })), duration: length, source: origin };
}
/** Decode locally, render only the selected mono segment and save an audio-only WAV. */
export async function extractSound(video: PickedVideo, start: number, duration: number, signal?: AbortSignal): Promise<SoundClip> {
  const context = new AudioContext();
  try {
    const response = await fetch(video.uri, { signal });
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    if (signal?.aborted) throw new Error(t("已取消提取。"));
    return await encodeWave(buffer, start, duration, "video", signal);
  } catch (error) {
    if (signal?.aborted) throw new Error(t("已取消提取。"));
    if (error instanceof DOMException && error.name === "EncodingError")
      throw new Error(t("视频声音解码失败，请选择带 AAC 声音的 MP4/MOV 视频，或使用直接录音。"));
    throw error;
  } finally { await context.close(); }
}
export function releaseVideo(video: PickedVideo) { URL.revokeObjectURL(video.uri); }
export function discardRecording(uri: string) { URL.revokeObjectURL(uri); }
export function playbackSource(audio: string) {
  return { uri: audio, dispose: () => {} };
}
