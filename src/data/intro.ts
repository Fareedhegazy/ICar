// Intro/marketing videos shown on first launch, one per app language.
// Put each file in assets/ and set it here, e.g. ar: require("../../assets/intro-ar.mp4").
// The walkthrough plays the video for the user's language, falls back to English, and shows
// only the slides when neither exists.
import { Lang } from "../i18n";

export const INTRO_VIDEOS: Partial<Record<Lang, number>> = {};

export const introVideoFor = (lang: Lang): number | null => INTRO_VIDEOS[lang] ?? INTRO_VIDEOS.en ?? null;
