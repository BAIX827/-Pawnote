import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Lang, applyLang, getLang, subscribe } from "./core";
export { getLang, locale, t, tList } from "./core";
export type { Lang } from "./core";

const KEY = "pawlife.lang";

/** Switches the interface language and remembers the choice on this device. */
export function setLang(lang: Lang) {
  applyLang(lang);
  AsyncStorage.setItem(KEY, lang).catch(() => {});
}
/** Restores a language the owner picked earlier; without one, the device language stands. */
export async function loadLang() {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (saved === "zh" || saved === "en") applyLang(saved);
  } catch {
    // Storage is unavailable: keep the device language.
  }
}
export const useLang = (): Lang => useSyncExternalStore(subscribe, getLang, getLang);
