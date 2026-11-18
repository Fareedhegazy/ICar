// Tiny i18n layer. Arabic is the source language: every UI string is written in Arabic
// and wrapped in t(), and the other dictionaries map that Arabic text to a translation.
// Missing translations fall back to English, then to the Arabic source.
import { getLocales } from "expo-localization";
import de from "./de";
import en from "./en";
import fr from "./fr";
import it from "./it";

export type Lang = "ar" | "en" | "fr" | "de" | "it";
export const LANGS: { k: Lang; n: string }[] = [
  { k: "ar", n: "العربية" },
  { k: "en", n: "English" },
  { k: "fr", n: "Français" },
  { k: "de", n: "Deutsch" },
  { k: "it", n: "Italiano" },
];
const DICTS: Record<Exclude<Lang, "ar">, Record<string, string>> = { en, fr, de, it };
const LOCALE: Record<Lang, string> = { ar: "ar-EG-u-nu-latn", en: "en-GB", fr: "fr-FR", de: "de-DE", it: "it-IT" };

/** Device language if we support it, otherwise English. */
export function deviceLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode || "";
    if (LANGS.some((l) => l.k === code)) return code as Lang;
  } catch {}
  return "en";
}

let cur: Lang = deviceLang();
export const setLang = (l: Lang) => { cur = l; };
export const getLang = () => cur;
export const isRTL = (l: Lang = cur) => l === "ar";
export const locale = (l: Lang = cur) => LOCALE[l];

export function t(ar: string, p?: Record<string, string | number>): string {
  let s = ar;
  if (cur !== "ar") s = DICTS[cur][ar] ?? DICTS.en[ar] ?? ar;
  if (p) for (const k in p) s = s.split(`{${k}}`).join(String(p[k]));
  return s;
}
