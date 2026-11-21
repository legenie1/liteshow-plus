import { derived, writable } from "svelte/store";
import {
  BIBLE_LAYOUTS,
  type BibleLanguage,
  type BibleLayout,
  type BibleText,
  type BibleTexts,
  type Translation,
} from "$lib/bible";
import {
  activeFor,
  BIBLE_MODES,
  resolveChoice,
  sortTranslations,
  translationFromFile,
  type BibleMode,
  type Choice,
} from "$lib/translations";

// Every `<Label>.<en|fr>.json` dropped in src/assets/bible/ is a translation (see
// scripts/ewb-to-json.py to make one from an EasyWorship Bible). Nothing is read
// until it is chosen, so a translation costs nothing at startup.
const files = import.meta.glob("../../assets/bible/*.json", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

const urls = new Map<string, string>();
const found: Translation[] = [];
for (const [path, url] of Object.entries(files)) {
  const translation = translationFromFile(path);
  if (!translation) continue;
  found.push(translation);
  urls.set(translation.id, url);
}

/** Every translation the app ships with. */
export const translations: Translation[] = sortTranslations(found);

const MODE_KEY = "liteshow.bibleMode";

function readMode(): BibleMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (BIBLE_MODES.includes(stored as BibleMode)) return stored as BibleMode;
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
  return "both";
}

/** English, French, or both on the slide. */
export const bibleMode = writable<BibleMode>(readMode());
bibleMode.subscribe((mode) => {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
});

const CHOICE_KEY = "liteshow.bibleChoice";

function readChoice(): Choice {
  try {
    const stored = localStorage.getItem(CHOICE_KEY);
    return resolveChoice(translations, stored ? JSON.parse(stored) : null);
  } catch {
    return resolveChoice(translations, null);
  }
}

/** Which translation each language uses; set in the settings. */
export const translationChoice = writable<Choice>(readChoice());
translationChoice.subscribe((choice) => {
  try {
    localStorage.setItem(CHOICE_KEY, JSON.stringify(choice));
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
});

export function chooseTranslation(language: BibleLanguage, id: string): void {
  translationChoice.update((choice) => ({ ...choice, [language]: id }));
}

/** The translations on the slide: what the mode asks for, as the settings chose. */
export const activeTranslations = derived(
  [bibleMode, translationChoice],
  ([mode, choice]) => activeFor(mode, choice, translations),
);

/** Their ids, in the order they appear. */
export const selectedTranslations = derived(activeTranslations, (list) =>
  list.map((translation) => translation.id),
);

const LAYOUT_KEY = "liteshow.bibleLayout";

function readLayout(): BibleLayout {
  try {
    const stored = localStorage.getItem(LAYOUT_KEY);
    if (BIBLE_LAYOUTS.includes(stored as BibleLayout))
      return stored as BibleLayout;
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
  return "stacked";
}

export const bibleLayout = writable<BibleLayout>(readLayout());
bibleLayout.subscribe((layout) => {
  try {
    localStorage.setItem(LAYOUT_KEY, layout);
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
});

// Kept across tab switches, like the prayer draft.
export const bibleQuery = writable("");

const loading = new Map<string, Promise<BibleText>>();

function loadTranslation(id: string): Promise<BibleText> {
  let promise = loading.get(id);
  if (!promise) {
    const url = urls.get(id);
    promise = (async () => {
      if (!url) throw new Error(`No file for the translation ${id}`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${id} answered ${response.status}`);
      return (await response.json()) as BibleText;
    })().catch((error: unknown) => {
      loading.delete(id); // let the next try read it again
      throw error;
    });
    loading.set(id, promise);
  }
  return promise;
}

/**
 * Reads the given translations (about 4 MB each, 1.3 MB compressed) the first
 * time they are needed; later calls answer from memory.
 */
export async function loadBible(ids: readonly string[]): Promise<BibleTexts> {
  const entries = await Promise.all(
    ids.map(async (id) => [id, await loadTranslation(id)] as const),
  );
  return Object.fromEntries(entries);
}
