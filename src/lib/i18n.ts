import { derived, writable } from "svelte/store";

// Two languages and a few dozen strings: a dictionary is enough, no i18n library.

const STORAGE_KEY = "liteshow.language";

const en = {
  tabSlides: "Slides",
  tabVideos: "Videos",
  tabPrayer: "Prayer",
  tabBible: "Bible",
  tabDictionary: "Dictionary",
  tabLyrics: "Lyrics",
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
  prayerReference: "Scripture reference",
  prayerReferencePlaceholder: "John 3:16",
  prayerReferenceMissing:
    "This verse isn't in the selected translation. Type it yourself.",
  prayerFillVerse: "Fill from the Bible",
  prayerVerse: "Verse text",
  prayerProject: "Project",
  prayerNext: "Next point",
  prayerClear: "Clear",
  prayerHint: "Ctrl+Enter to project",
  prayerPreview: "Preview",
  live: "Live",
  liveNone: "Nothing on screen",
  liveClear: "Click to clear the screen",
  liveRestore: "Click to show it again",
  liveOther: "Image or video on screen",
  prayerHistory: "Already projected (click to project again)",
  prayerHistoryClear: "clear list",
  bibleReference: "Reference",
  bibleReferencePlaceholder: "John 3:16 or Jean 3:16-18",
  settings: "Settings",
  settingsBible: "Bible slides",
  bibleHighlightHint:
    "Click words to highlight them, Shift+click for a stretch",
  bibleHighlightClear: "Clear highlights",
  bibleQueueAddHint: "Add to queue (Ctrl+Enter)",
  prayerQueueAddHint: "Add to queue (Ctrl+Shift+Enter)",
  queueEmpty: "Nothing queued. Add verses to come back to them later.",
  queueClear: "Clear queue",
  queueUp: "Move up",
  queueDown: "Move down",
  queueRemove: "Remove from queue",
  settingsBackgrounds: "Backgrounds",
  settingsFooter: "Footer line",
  settingsFooterText: "Footer text",
  settingsFooterHint: "Text between *stars* is shown small and yellow.",
  settingsBibleTextSize: "Verse text size",
  settingsTranslations: "Translations",
  settingsEnglishTranslation: "English translation",
  settingsFrenchTranslation: "French translation",
  bgGreen: "Green rays",
  bgChalkboard: "Chalkboard",
  bgBlack: "Black",
  sizeSmall: "Small",
  sizeNormal: "Normal",
  sizeLarge: "Large",
  sizeHuge: "Huge",
  bibleTemplate: "Slide template",
  bibleTemplateStacked: "Stacked",
  bibleTemplateSplit: "One block per language",
  bibleLanguages: "Languages",
  bibleVersions: "{language} version",
  bibleEn: "English",
  bibleFr: "French",
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
  dictionaryLoading: "Looking it up…",
  dictionaryNotFound: 'No definition found for "{word}".',
  dictionaryError:
    "Can't reach the dictionary. Check the internet connection and try again.",
  lyricsSearch: "Find a song (title or words)",
  lyricsSearchPlaceholder: "Title",
  lyricsAdd: "Add a song",
  lyricsMine: "mine",
  lyricsEmpty: 'No song yet. Use "Add a song" and paste the lyrics.',
  lyricsNoMatch: "No song matches.",
  lyricsPick: "Pick a song on the left, then click a slide to project it.",
  lyricsPickHint:
    "A click projects the slide. Arrow keys move to the next or previous one.",
  lyricsEdit: "Edit",
  lyricsEditCopy: "Edit a copy",
  lyricsDelete: "Delete",
  lyricsDeleteConfirm: "Click again to delete",
  lyricsTitle: "Title",
  lyricsText: "Lyrics",
  lyricsFormatHint:
    "Ctrl+Enter adds a slide below. The label is optional: write Chorus, Bridge, Verse 1… to colour the slide.",
  lyricsInvalid: "A title and at least one slide of lyrics are needed.",
  lyricsSave: "Save",
  lyricsCancel: "Cancel",
  lyricsLabel: "label",
  lyricsLibraryError: "The song library could not be loaded.",
  lyricsAddSlide: "Add a slide",
  lyricsDuplicate: "Duplicate this slide",
  lyricsRemove: "Remove this slide",
  lyricsLive: "On screen",
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
  tabLyrics: "Paroles",
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
  prayerReference: "Référence",
  prayerReferencePlaceholder: "Jean 3:16",
  prayerReferenceMissing:
    "Ce verset n'existe pas dans la traduction choisie. Écris-le toi-même.",
  prayerFillVerse: "Remplir depuis la Bible",
  prayerVerse: "Texte du verset",
  prayerProject: "Projeter",
  prayerNext: "Point suivant",
  prayerClear: "Effacer",
  prayerHint: "Ctrl+Entrée pour projeter",
  prayerPreview: "Aperçu",
  live: "En direct",
  liveNone: "Rien à l'écran",
  liveClear: "Cliquer pour vider l'écran",
  liveRestore: "Cliquer pour le réafficher",
  liveOther: "Image ou vidéo à l'écran",
  prayerHistory: "Déjà projetés (clic pour reprojeter)",
  prayerHistoryClear: "vider la liste",
  bibleReference: "Référence",
  bibleReferencePlaceholder: "Jean 3:16 ou John 3:16-18",
  settings: "Réglages",
  settingsBible: "Diapos de la Bible",
  bibleHighlightHint:
    "Clique sur des mots pour les surligner, Maj+clic pour un passage",
  bibleHighlightClear: "Effacer le surlignage",
  bibleQueueAddHint: "Mettre en file d'attente (Ctrl+Entrée)",
  prayerQueueAddHint: "Mettre en file d'attente (Ctrl+Maj+Entrée)",
  queueEmpty: "Rien en attente. Ajoute des versets pour y revenir plus tard.",
  queueClear: "Vider la file",
  queueUp: "Monter",
  queueDown: "Descendre",
  queueRemove: "Retirer de la file",
  settingsBackgrounds: "Fonds",
  settingsFooter: "Devise du bas",
  settingsFooterText: "Texte de la devise",
  settingsFooterHint: "Le texte entre *étoiles* est petit et jaune.",
  settingsBibleTextSize: "Taille du texte biblique",
  settingsTranslations: "Traductions",
  settingsEnglishTranslation: "Traduction anglaise",
  settingsFrenchTranslation: "Traduction française",
  bgGreen: "Rayons verts",
  bgChalkboard: "Tableau noir",
  bgBlack: "Noir",
  sizeSmall: "Petit",
  sizeNormal: "Normal",
  sizeLarge: "Grand",
  sizeHuge: "Très grand",
  bibleTemplate: "Modèle de diapo",
  bibleTemplateStacked: "Empilé",
  bibleTemplateSplit: "Un bloc par langue",
  bibleLanguages: "Langues",
  bibleVersions: "Version {language}",
  bibleEn: "Anglais",
  bibleFr: "Français",
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
  dictionaryLoading: "Recherche en cours…",
  dictionaryNotFound: "Aucune définition trouvée pour « {word} ».",
  dictionaryError:
    "Impossible de joindre le dictionnaire. Vérifie la connexion internet et réessaie.",
  lyricsSearch: "Chercher un chant (titre ou paroles)",
  lyricsSearchPlaceholder: "Titre",
  lyricsAdd: "Ajouter un chant",
  lyricsMine: "à moi",
  lyricsEmpty:
    "Aucun chant pour l'instant. Utilise « Ajouter un chant » et colle les paroles.",
  lyricsNoMatch: "Aucun chant ne correspond.",
  lyricsPick:
    "Choisis un chant à gauche, puis clique une diapo pour la projeter.",
  lyricsPickHint:
    "Un clic projette la diapo. Les flèches passent à la suivante ou à la précédente.",
  lyricsEdit: "Modifier",
  lyricsEditCopy: "Modifier une copie",
  lyricsDelete: "Supprimer",
  lyricsDeleteConfirm: "Clique encore pour supprimer",
  lyricsTitle: "Titre",
  lyricsText: "Paroles",
  lyricsFormatHint:
    "Ctrl+Entrée ajoute une diapo dessous. Le nom est facultatif : écris Refrain, Pont, Couplet 1… pour colorer la diapo.",
  lyricsInvalid: "Il faut un titre et au moins une diapo de paroles.",
  lyricsSave: "Enregistrer",
  lyricsCancel: "Annuler",
  lyricsLabel: "nom",
  lyricsLibraryError: "La bibliothèque de chants n'a pas pu être chargée.",
  lyricsAddSlide: "Ajouter une diapo",
  lyricsDuplicate: "Dupliquer cette diapo",
  lyricsRemove: "Supprimer cette diapo",
  lyricsLive: "À l'écran",
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
