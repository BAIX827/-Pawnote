import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { AppState, id } from "../domain/types";
import { validSoundAudio } from "../domain/sounds";
import { mapSounds, soundLists } from "../domain/household";
import { IMAGE_NAME, IMAGE_PREFIX, imageName, imageRefs, isEmbeddedImage, mapImages } from "../domain/media";

// Keep large audio outside Android's AsyncStorage CursorWindow. Backups and in-memory state
// still contain complete audio. Files are written before the metadata is committed.
const directory = () => {
  const dir = new Directory(Paths.document, "paw-sounds");
  dir.create({ idempotent: true, intermediates: true });
  return dir;
};
const cache = new Map<string, { audio: string; name: string }>();
const prefix = "pawnote-audio:";
// Photos follow the same path (docs/01 8.27), one file per distinct picture, named by its content.
const pictureDirectory = () => {
  const dir = new Directory(Paths.document, "paw-images");
  dir.create({ idempotent: true, intermediates: true });
  return dir;
};
let images = new Map<string, string>();
export async function getStoredState(key: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return raw;
  let state;
  try { state = JSON.parse(raw); } catch { return raw; }
  if (!state || typeof state !== "object") return raw;
  const lists = soundLists(state);
  if (lists.some((l) => l.length > 100)) return raw;
  const pictures = imageRefs(state);
  if (!pictures.length && !lists.flat().some((sound) => typeof sound?.audio === "string" && sound.audio.startsWith(prefix))) return raw;
  try {
    for (const sound of lists.flat()) {
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
    const found = new Map<string, string>();
    if (pictures.length) {
      const dir = pictureDirectory();
      for (const name of pictures) {
        if (!IMAGE_NAME.test(name)) continue;
        const file = new File(dir, `${name}.txt`);
        if (!file.exists || file.size > 1024 * 1024) continue;
        const data = await file.text();
        if (isEmbeddedImage(data)) found.set(name, data);
      }
    }
    images = new Map([...found].map(([name, data]) => [data, name]));
    // A missing picture costs that one picture, never the whole diary.
    return JSON.stringify(mapImages(state, (uri) =>
      uri.startsWith(IMAGE_PREFIX) ? found.get(uri.slice(IMAGE_PREFIX.length)) : uri));
  } catch { return raw; } // Preserve the original metadata for the existing recovery screen.
}
export async function setStoredState(key: string, serialized: string): Promise<void> {
  const state: AppState = JSON.parse(serialized);
  const dir = directory(), keep = new Set<string>();
  const stored = mapSounds(state, (sound) => {
    let cached = cache.get(sound.id);
    if (!cached || cached.audio !== sound.audio || !new File(dir, cached.name).exists) {
      const name = `sound-${id()}.txt`;
      new File(dir, name).write(sound.audio);
      cached = { name, audio: sound.audio }; cache.set(sound.id, cached);
    }
    keep.add(cached.name);
    return { ...sound, audio: `${prefix}${cached.name}` };
  });
  const pictureDir = pictureDirectory(), keepPictures = new Map<string, string>();
  const withPictures = mapImages(stored, (uri) => {
    if (!isEmbeddedImage(uri)) return uri;
    let name = images.get(uri) ?? keepPictures.get(uri);
    if (!name || !new File(pictureDir, `${name}.txt`).exists) {
      name = imageName(uri);
      const file = new File(pictureDir, `${name}.txt`);
      if (!file.exists) file.write(uri);
    }
    keepPictures.set(uri, name);
    return `${IMAGE_PREFIX}${name}`;
  });
  await AsyncStorage.setItem(key, JSON.stringify(withPictures));
  images = keepPictures;
  // A failed metadata write preserves old files. Orphans are cleaned only after success.
  try {
    for (const item of dir.list()) if (item instanceof File && /^sound-[a-z0-9-]+\.txt$/.test(item.name) && !keep.has(item.name)) item.delete();
    for (const [key, item] of cache) if (!keep.has(item.name)) cache.delete(key);
    const keepNames = new Set([...keepPictures.values()].map((name) => `${name}.txt`));
    for (const item of pictureDir.list()) if (item instanceof File && IMAGE_NAME.test(item.name.replace(/\.txt$/, "")) && !keepNames.has(item.name)) item.delete();
  } catch { /* Cleanup can retry on the next successful save. */ }
}
