import { derived, writable } from "svelte/store";

// Two languages and a few dozen strings: a dictionary is enough, no i18n library.

const STORAGE_KEY = "liteshow.language";

const en = {
  tabSlides: "Slides",
  tabVideos: "Videos",
  chooseFolder: "Choose a folder",
  imagesOne: "{n} image",
  imagesMany: "{n} images",
  videosOne: "{n} video",
  videosMany: "{n} videos",
  display: "Display",
  primary: "primary",
  projectionDisplay: "Projection display",
  projectionDisplayPlaceholder: "Projection display…",
  language: "Language",
  theme: "Theme",
  themeBack: "Back",
  themeShow: "Show the theme slide",
  themeHint: "Mark a slide with its star to make it the theme",
  themeRemove: "Remove the theme",
  themeSet: "Set as theme",
  blackout: "Blackout",
  noImages: "No images. Choose a folder to get started.",
  noVideos: "No videos. Choose a folder to get started.",
  loop: "Loop",
  loopTitle: "Replay on a loop (L)",
  mute: "Mute",
  muteTitle: "Mute the sound (M)",
  videoError: "Video unreadable or format not supported.",
};

export type MessageKey = keyof typeof en;

const fr: Record<MessageKey, string> = {
  tabSlides: "Diapos",
  tabVideos: "Vidéos",
  chooseFolder: "Choisir un dossier",
  imagesOne: "{n} image",
  imagesMany: "{n} images",
  videosOne: "{n} vidéo",
  videosMany: "{n} vidéos",
  display: "Écran",
  primary: "principal",
  projectionDisplay: "Écran de projection",
  projectionDisplayPlaceholder: "Écran de projection…",
  language: "Langue",
  theme: "Thème",
  themeBack: "Revenir",
  themeShow: "Afficher la diapo du thème",
  themeHint: "Marque une diapo avec son étoile pour la définir comme thème",
  themeRemove: "Retirer le thème",
  themeSet: "Définir comme thème",
  blackout: "Écran noir",
  noImages: "Aucune image. Choisis un dossier pour commencer.",
  noVideos: "Aucune vidéo. Choisis un dossier pour commencer.",
  loop: "Boucle",
  loopTitle: "Rejouer en boucle (L)",
  mute: "Muet",
  muteTitle: "Couper le son (M)",
  videoError: "Vidéo illisible ou format non pris en charge.",
};

const messages = { en, fr };

export type Language = keyof typeof messages;
export const languages: Language[] = ["en", "fr"];

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
  return "en";
}

function applyToDocument(language: Language) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
}

export const language = writable<Language>(readStoredLanguage());

language.subscribe(applyToDocument);

export function setLanguage(next: Language): void {
  language.set(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
}

/** Translates a key; `{name}` placeholders are filled from `params`. */
export const t = derived(language, ($language) => {
  return (key: MessageKey, params?: Record<string, string | number>) =>
    messages[$language][key].replace(/\{(\w+)\}/g, (match, name: string) =>
      name in (params ?? {}) ? String(params?.[name]) : match,
    );
});
