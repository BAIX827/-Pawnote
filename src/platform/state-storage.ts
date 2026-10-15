import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, id } from "../domain/types";
import { validSoundAudio } from "../domain/sounds";
import { mapSounds, soundLists } from "../domain/household";
import { IMAGE_NAME, IMAGE_PREFIX, hasImages, imageName, imageRefs, isEmbeddedImage, mapImages } from "../domain/media";

// IndexedDB keeps clips and photos outside the small localStorage quota (docs/01 8.27). Metadata
// remains compatible with the existing app; exported backups always contain the complete media.
const prefix = "pawnote-audio:";
const cache = new Map<string, { audio: string; name: string }>();
// Pictures already in IndexedDB, by content, so unchanged photos are neither hashed nor written again.
let images = new Map<string, string>();
function mediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("pawnote-media", 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("sounds")) db.createObjectStore("sounds");
      if (!db.objectStoreNames.contains("images")) db.createObjectStore("images");
    };
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
  const pictures = imageRefs(state);
  if (!refs.length && !pictures.length) return raw;
  let db: IDBDatabase | undefined;
  try {
    db = await mediaDB();
    const transaction = db.transaction(["sounds", "images"], "readonly");
    const store = transaction.objectStore("sounds"), pictureStore = transaction.objectStore("images");
    await Promise.all(refs.map(async (sound: { id: string; audio: string }) => {
      const name = sound.audio.slice(prefix.length);
      if (!/^sound-[a-z0-9-]+$/.test(name)) throw new Error("Invalid audio reference");
      const audio = await result(store.get(name));
      if (!validSoundAudio(audio)) throw new Error("Missing audio clip");
      sound.audio = audio; cache.set(sound.id, { audio, name });
    }));
    const found = new Map<string, string>();
    await Promise.all(pictures.filter((name) => IMAGE_NAME.test(name)).map(async (name) => {
      const data = await result(pictureStore.get(name));
      if (isEmbeddedImage(data)) found.set(name, data);
    }));
    images = new Map([...found].map(([name, data]) => [data, name]));
    // A missing picture costs that one picture, never the whole diary.
    return JSON.stringify(mapImages(state, (uri) =>
      uri.startsWith(IMAGE_PREFIX) ? found.get(uri.slice(IMAGE_PREFIX.length)) : uri));
  } catch { return raw; } // The existing recovery screen preserves the original metadata.
  finally { db?.close(); }
}
export async function setStoredState(key: string, serialized: string): Promise<void> {
  const state: AppState = JSON.parse(serialized);
  // Preserve storage support on browsers without IndexedDB until the first sound or photo is added.
  if (!soundLists(state).some((l) => l.length) && !hasImages(state) && !cache.size && !images.size) {
    await AsyncStorage.setItem(key, serialized); return;
  }
  const db = await mediaDB();
  try {
    const transaction = db.transaction(["sounds", "images"], "readwrite"), done = complete(transaction);
    const store = transaction.objectStore("sounds"), keep = new Set<string>();
    const pictureStore = transaction.objectStore("images"), keepPictures = new Map<string, string>();
    const withSounds = mapSounds(state, (sound) => {
      const previous = cache.get(sound.id);
      const saved = previous?.audio === sound.audio ? previous : { audio: sound.audio, name: `sound-${id()}` };
      if (saved !== previous) store.put(saved.audio, saved.name);
      cache.set(sound.id, saved); keep.add(saved.name);
      return { ...sound, audio: `${prefix}${saved.name}` };
    });
    const stored = mapImages(withSounds, (uri) => {
      if (!isEmbeddedImage(uri)) return uri;
      let name = images.get(uri) ?? keepPictures.get(uri);
      if (!name) { name = imageName(uri); pictureStore.put(uri, name); }
      keepPictures.set(uri, name);
      return `${IMAGE_PREFIX}${name}`;
    });
    await done;
    await AsyncStorage.setItem(key, JSON.stringify(stored));
    images = keepPictures;
    const keepNames = new Set(keepPictures.values());
    try {
      const cleanup = db.transaction(["sounds", "images"], "readwrite"), finished = complete(cleanup);
      const files = cleanup.objectStore("sounds"), request = files.getAllKeys();
      request.onsuccess = () => { for (const key of request.result) if (!keep.has(String(key))) files.delete(key); };
      const pictureFiles = cleanup.objectStore("images"), pictureKeys = pictureFiles.getAllKeys();
      pictureKeys.onsuccess = () => { for (const key of pictureKeys.result) if (!keepNames.has(String(key))) pictureFiles.delete(key); };
      await finished;
      for (const [key, value] of cache) if (!keep.has(value.name)) cache.delete(key);
    } catch { /* Retry cleanup after the next successful save. */ }
  } finally { db.close(); }
}
