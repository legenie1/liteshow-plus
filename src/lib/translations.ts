import type { BibleLanguage, Translation } from "$lib/bible";

/** What the Bible slide shows: English, French, or both one above the other. */
export type BibleMode = "en" | "fr" | "both";
export const BIBLE_MODES: BibleMode[] = ["en", "fr", "both"];

/** The translation used for each language (null when there is none for it). */
export type Choice = Record<BibleLanguage, string | null>;

/** Used when nothing is chosen yet; otherwise the first of the language. */
const PREFERRED: Record<BibleLanguage, string> = { en: "KJV", fr: "Darby" };

const FILE = /([^/\\]+)\.(en|fr)\.json$/;

/**
 * Reads a translation from its file name: `MSG.en.json` is "MSG", in English. The
 * label is shown as written, so name the file the way it should read on screen.
 */
export function translationFromFile(path: string): Translation | null {
  const match = FILE.exec(path);
  if (!match) return null;
  return {
    id: match[1],
    label: match[1],
    language: match[2] as BibleLanguage,
  };
}

/** English first, then French; alphabetical inside each language. */
export function sortTranslations(list: Translation[]): Translation[] {
  return [...list].sort(
    (a, b) =>
      a.language.localeCompare(b.language) ||
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

/**
 * The translation to use for each language: the stored one if it still exists,
 * else the preferred one, else the first of that language.
 */
export function resolveChoice(
  all: Translation[],
  stored: Partial<Record<BibleLanguage, unknown>> | null,
): Choice {
  const pick = (language: BibleLanguage): string | null => {
    const ofLanguage = all.filter((t) => t.language === language);
    const wanted = [stored?.[language], PREFERRED[language]];
    for (const id of wanted) {
      if (ofLanguage.some((t) => t.id === id)) return id as string;
    }
    return ofLanguage[0]?.id ?? null;
  };
  return { en: pick("en"), fr: pick("fr") };
}

/** The translations on the slide, English first. */
export function activeFor(
  mode: BibleMode,
  choice: Choice,
  all: Translation[],
): Translation[] {
  const languages: BibleLanguage[] = mode === "both" ? ["en", "fr"] : [mode];
  return languages
    .map((language) => all.find((t) => t.id === choice[language]))
    .filter((t): t is Translation => t !== undefined);
}
