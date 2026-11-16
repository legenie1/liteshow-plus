import { derived, writable } from "svelte/store";

// Two languages and a few dozen strings: a dictionary is enough, no i18n library.

const STORAGE_KEY = "liteshow.language";

const en = {
  tabSlides: "Slides",
  tabVideos: "Videos",
  tabPrayer: "Prayer",
  tabBible: "Bible",
  tabDictionary: "Dictionary",
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
  prayerNumber: "Number",
  prayerNumberLess: "Previous number",
  prayerNumberMore: "Next number",
  prayerText: "Prayer point",
  prayerReference: "Scripture reference (e.g. Isaiah 2:2 (KJV))",
  prayerVerse: "Verse text",
  prayerFooter: "Footer (text between *stars* is shown small and yellow)",
  prayerProject: "Project",
  prayerNext: "Next point",
  prayerClear: "Clear",
  prayerHint: "Ctrl+Enter to project",
  prayerPreview: "Preview",
  prayerHistory: "Already projected (click to project again)",
  prayerHistoryClear: "clear list",
  bibleReference: "Reference",
  bibleReferencePlaceholder: "John 3:16 or Jean 3:16-18",
  bibleLanguages: "Languages",
  bibleEn: "English",
  bibleFr: "French",
  bibleBoth: "EN + FR",
  bibleBooks: "Books",
  bibleSearchToggle: "Search words in the Bible",
  bibleSearchLabel: "Search the text",
  bibleSearchPlaceholder: "e.g. love one another",
  bibleSearchHint:
    "Type at least 3 letters. Enter picks the first result, Esc goes back to the reference.",
  bibleSearchNone: "No verse contains these words.",
  bibleSearchCount:
    "{n} verses found. Click to preview, double-click to project.",
  bibleSearchMany:
    "{n} verses found, showing the first {max}. Add a word to narrow it down.",
  dictionaryWord: "Word",
  dictionaryPlaceholder: "e.g. grace",
  dictionarySearch: "Look up this word",
  dictionaryHint:
    "Type a word and press Enter. Press Enter again to project it. Needs an internet connection.",
  dictionaryLoading: "Looking it up…",
  dictionaryNotFound: 'No definition found for "{word}".',
  dictionaryError:
    "Can't reach the dictionary. Check the internet connection and try again.",
  dictionaryPickHint:
    "Click definitions to choose which ones go on the slide. Enter or Project to show it.",
  bibleChapters: "Chapters",
  bibleVerses: "Verses",
  bibleOldTestament: "Old Testament",
  bibleNewTestament: "New Testament",
  bibleLoading: "Loading the Bible…",
  bibleLoadError: "Couldn't load the Bible files.",
  bibleInvalid: 'Reference not recognized. Try "John 3:16" or "1 Cor 13:4-7".',
  bibleMissing: "This verse doesn't exist in the selected translation.",
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
  tabPrayer: "Prière",
  tabBible: "Bible",
  tabDictionary: "Dictionnaire",
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
  prayerNumber: "Numéro",
  prayerNumberLess: "Numéro précédent",
  prayerNumberMore: "Numéro suivant",
  prayerText: "Point de prière",
  prayerReference: "Référence (ex. Ésaïe 2:2 (LSG))",
  prayerVerse: "Texte du verset",
  prayerFooter: "Bas de diapo (le texte entre *étoiles* est petit et jaune)",
  prayerProject: "Projeter",
  prayerNext: "Point suivant",
  prayerClear: "Effacer",
  prayerHint: "Ctrl+Entrée pour projeter",
  prayerPreview: "Aperçu",
  prayerHistory: "Déjà projetés (clic pour reprojeter)",
  prayerHistoryClear: "vider la liste",
  bibleReference: "Référence",
  bibleReferencePlaceholder: "Jean 3:16 ou John 3:16-18",
  bibleLanguages: "Langues",
  bibleEn: "Anglais",
  bibleFr: "Français",
  bibleBoth: "EN + FR",
  bibleBooks: "Livres",
  bibleSearchToggle: "Chercher des mots dans la Bible",
  bibleSearchLabel: "Chercher dans le texte",
  bibleSearchPlaceholder: "ex. aimez-vous les uns les autres",
  bibleSearchHint:
    "Tape au moins 3 lettres. Entrée choisit le premier résultat, Échap revient à la référence.",
  bibleSearchNone: "Aucun verset ne contient ces mots.",
  bibleSearchCount:
    "{n} versets trouvés. Clic pour l'aperçu, double-clic pour projeter.",
  bibleSearchMany:
    "{n} versets trouvés, les {max} premiers sont affichés. Ajoute un mot pour affiner.",
  dictionaryWord: "Mot (en anglais)",
  dictionaryPlaceholder: "ex. grace",
  dictionarySearch: "Chercher ce mot",
  dictionaryHint:
    "Tape un mot anglais et appuie sur Entrée. Entrée une seconde fois le projette. Demande une connexion internet.",
  dictionaryLoading: "Recherche en cours…",
  dictionaryNotFound: "Aucune définition trouvée pour « {word} ».",
  dictionaryError:
    "Impossible de joindre le dictionnaire. Vérifie la connexion internet et réessaie.",
  dictionaryPickHint:
    "Clique sur les définitions à mettre sur la diapo. Entrée ou Projeter pour l'afficher.",
  bibleChapters: "Chapitres",
  bibleVerses: "Versets",
  bibleOldTestament: "Ancien Testament",
  bibleNewTestament: "Nouveau Testament",
  bibleLoading: "Chargement de la Bible…",
  bibleLoadError: "Impossible de charger les fichiers de la Bible.",
  bibleInvalid:
    "Référence non reconnue. Essaie « Jean 3:16 » ou « 1 Cor 13:4-7 ».",
  bibleMissing: "Ce verset n'existe pas dans la traduction choisie.",
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
