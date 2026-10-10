import { en } from "./en";

// The pure half of i18n: no storage, no React, so domain rules and their tests can use it.
export type Lang = "zh" | "en";
const listeners = new Set<() => void>();

function deviceLang(): Lang {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith("zh")
      ? "zh"
      : "en";
  } catch {
    return "zh";
  }
}
let current: Lang = deviceLang();

export const getLang = () => current;
export const locale = () => (current === "zh" ? "zh-CN" : "en-US");
export function applyLang(lang: Lang) {
  current = lang;
  listeners.forEach((l) => l());
}
export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Chinese is the source text and doubles as the key. Text with no English entry,
 * such as something the owner typed, is shown as written.
 */
export function t(zh: string, vars?: Record<string, string | number>): string {
  const text = current === "en" && Object.hasOwn(en, zh) ? en[zh] : zh;
  return vars
    ? text.replace(/\{(\w+)\}/g, (whole, name: string) =>
        Object.hasOwn(vars, name) ? String(vars[name]) : whole,
      )
    : text;
}
/** Translates a " · "-joined list of built-in words, such as questionnaire traits. */
export const tList = (zh: string) => zh.split(" · ").map((part) => t(part)).join(" · ");
