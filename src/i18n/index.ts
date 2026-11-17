import { useSyncExternalStore } from "react";
import { Lang, applyLang, getLang, subscribe } from "./core";
export { getLang, locale, t, tList } from "./core";

applyLang("en");
export const useLang = (): Lang => useSyncExternalStore(subscribe, getLang, getLang);
