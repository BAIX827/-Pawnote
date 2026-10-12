import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { AppState, id } from "../domain/types";
import { validSoundAudio } from "../domain/sounds";

// Keep large audio outside Android's AsyncStorage CursorWindow. Backups and in-memory state
// still contain complete audio. Files are written before the metadata is committed.
const directory = () => {
  const dir = new Directory(Paths.document, "paw-sounds");
  dir.create({ idempotent: true, intermediates: true });
  return dir;
};
const cache = new Map<string, { audio: string; name: string }>();
const prefix = "pawnote-audio:";
export async function getStoredState(key: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return raw;
  let state;
  try { state = JSON.parse(raw); } catch { return raw; }
  if (!state || !Array.isArray(state.sounds) || state.sounds.length > 100) return raw;
  try {
    for (const sound of state.sounds) {
      if (typeof sound.audio === "string" && sound.audio.startsWith(prefix)) {
        const name = sound.audio.slice(prefix.length);
        if (!/^sound-[a-z0-9-]+\.txt$/.test(name)) throw new Error("Invalid audio reference");
        const file = new File(directory(), name);
        if (!file.exists || file.size > 3 * 1024 * 1024) throw new Error("Missing audio file");
        const audio = await file.text();
        if (!validSoundAudio(audio)) throw new Error("Invalid audio file");
        sound.audio = audio;
        cache.set(sound.id, { audio, name });
      }
    }
    return JSON.stringify(state);
  } catch { return raw; } // Preserve the original metadata for the existing recovery screen.
}
export async function setStoredState(key: string, serialized: string): Promise<void> {
  const state: AppState = JSON.parse(serialized);
  const dir = directory(), keep = new Set<string>();
  const sounds = (state.sounds ?? []).map((sound) => {
    let cached = cache.get(sound.id);
    if (!cached || cached.audio !== sound.audio || !new File(dir, cached.name).exists) {
      const name = `sound-${id()}.txt`;
      new File(dir, name).write(sound.audio);
      cached = { name, audio: sound.audio }; cache.set(sound.id, cached);
    }
    keep.add(cached.name);
    return { ...sound, audio: `${prefix}${cached.name}` };
  });
  await AsyncStorage.setItem(key, JSON.stringify({ ...state, ...(state.sounds ? { sounds } : {}) }));
  // A failed metadata write preserves old files. Orphans are cleaned only after success.
  try {
    for (const item of dir.list()) if (item instanceof File && /^sound-[a-z0-9-]+\.txt$/.test(item.name) && !keep.has(item.name)) item.delete();
    for (const [key, item] of cache) if (!keep.has(item.name)) cache.delete(key);
  } catch { /* Cleanup can retry on the next successful save. */ }
}
