import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, id } from "../domain/types";
import { validSoundAudio } from "../domain/sounds";
import { mapSounds, soundLists } from "../domain/household";

// IndexedDB keeps clips outside the small localStorage quota. Metadata remains compatible
// with the existing app; exported backups always contain the complete audio data.
const prefix = "pawnote-audio:";
const cache = new Map<string, { audio: string; name: string }>();
function mediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("pawnote-media", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("sounds");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Media storage is blocked"));
  });
}
const result = <T,>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
const complete = (transaction: IDBTransaction) => new Promise<void>((resolve, reject) => {
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error);
  transaction.onabort = () => reject(transaction.error ?? new Error("Media write aborted"));
});
export async function getStoredState(key: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return raw;
  let state;
  try { state = JSON.parse(raw); } catch { return raw; }
  if (!state || typeof state !== "object") return raw;
  const lists = soundLists(state);
  if (lists.some((l) => l.length > 100)) return raw;
  const refs = lists.flat().filter((sound: { audio?: string }) => typeof sound?.audio === "string" && sound.audio.startsWith(prefix));
  if (!refs.length) return raw;
  let db: IDBDatabase | undefined;
  try {
    db = await mediaDB();
    const store = db.transaction("sounds", "readonly").objectStore("sounds");
    await Promise.all(refs.map(async (sound: { id: string; audio: string }) => {
      const name = sound.audio.slice(prefix.length);
      if (!/^sound-[a-z0-9-]+$/.test(name)) throw new Error("Invalid audio reference");
      const audio = await result(store.get(name));
      if (!validSoundAudio(audio)) throw new Error("Missing audio clip");
      sound.audio = audio; cache.set(sound.id, { audio, name });
    }));
    return JSON.stringify(state);
  } catch { return raw; } // The existing recovery screen preserves the original metadata.
  finally { db?.close(); }
}
export async function setStoredState(key: string, serialized: string): Promise<void> {
  const state: AppState = JSON.parse(serialized);
  // Preserve storage support on browsers without IndexedDB until the first sound is added.
  if (!soundLists(state).some((l) => l.length) && !cache.size) { await AsyncStorage.setItem(key, serialized); return; }
  const db = await mediaDB();
  try {
    const transaction = db.transaction("sounds", "readwrite"), done = complete(transaction);
    const store = transaction.objectStore("sounds"), keep = new Set<string>();
    const stored = mapSounds(state, (sound) => {
      const previous = cache.get(sound.id);
      const saved = previous?.audio === sound.audio ? previous : { audio: sound.audio, name: `sound-${id()}` };
      if (saved !== previous) store.put(saved.audio, saved.name);
      cache.set(sound.id, saved); keep.add(saved.name);
      return { ...sound, audio: `${prefix}${saved.name}` };
    });
    await done;
    await AsyncStorage.setItem(key, JSON.stringify(stored));
    try {
      const cleanup = db.transaction("sounds", "readwrite"), finished = complete(cleanup);
      const files = cleanup.objectStore("sounds"), request = files.getAllKeys();
      request.onsuccess = () => { for (const key of request.result) if (!keep.has(String(key))) files.delete(key); };
      await finished;
      for (const [key, value] of cache) if (!keep.has(value.name)) cache.delete(key);
    } catch { /* Retry cleanup after the next successful save. */ }
  } finally { db.close(); }
}
