// Intro videos shown on first launch, one per app language (720x1280, ~40 s, music + on-screen text).
// The walkthrough plays the video for the user's language and falls back to English.
import { Lang } from "../i18n";

export const INTRO_VIDEOS: Partial<Record<Lang, number>> = {
  ar: require("../../assets/intro/intro-ar.mp4"),
  en: require("../../assets/intro/intro-en.mp4"),
  fr: require("../../assets/intro/intro-fr.mp4"),
  de: require("../../assets/intro/intro-de.mp4"),
  it: require("../../assets/intro/intro-it.mp4"),
};

export const introVideoFor = (lang: Lang): number | null => INTRO_VIDEOS[lang] ?? INTRO_VIDEOS.en ?? null;
