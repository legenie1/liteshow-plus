import type { PrayerPoint } from "$lib/types";

/** Verses of one translation: books (canonical order) > chapters > verses. */
export type BibleText = string[][][];

export type BibleMode = "en" | "fr" | "both";

/**
 * How a two-language passage is laid out: "stacked" keeps one heading and the
 * verses one after the other, "split" gives each translation its own labelled block.
 */
export type BibleLayout = "stacked" | "split";
export const BIBLE_LAYOUTS: BibleLayout[] = ["stacked", "split"];

export interface Reference {
  book: number;
  chapter: number;
  from: number;
  to: number;
}

interface Book {
  en: string;
  fr: string;
  /** Extra short names, already normalized (see `normalize`). */
  abbr?: string[];
}

export const EN_VERSION = "KJV";
export const FR_VERSION = "Darby";

// Canonical Protestant order, the same as the bundled JSON files.
export const BOOKS: Book[] = [
  { en: "Genesis", fr: "Genèse", abbr: ["gn", "ge"] },
  { en: "Exodus", fr: "Exode", abbr: ["ex"] },
  { en: "Leviticus", fr: "Lévitique", abbr: ["lv", "lev"] },
  { en: "Numbers", fr: "Nombres", abbr: ["nb", "nm"] },
  { en: "Deuteronomy", fr: "Deutéronome", abbr: ["dt", "deut"] },
  { en: "Joshua", fr: "Josué", abbr: ["jos", "josh"] },
  { en: "Judges", fr: "Juges", abbr: ["jg", "jdg"] },
  { en: "Ruth", fr: "Ruth", abbr: ["rt"] },
  { en: "1 Samuel", fr: "1 Samuel", abbr: ["1sa", "1sm"] },
  { en: "2 Samuel", fr: "2 Samuel", abbr: ["2sa", "2sm"] },
  { en: "1 Kings", fr: "1 Rois", abbr: ["1r", "1ki", "1kgs"] },
  { en: "2 Kings", fr: "2 Rois", abbr: ["2r", "2ki", "2kgs"] },
  { en: "1 Chronicles", fr: "1 Chroniques", abbr: ["1ch", "1chr"] },
  { en: "2 Chronicles", fr: "2 Chroniques", abbr: ["2ch", "2chr"] },
  { en: "Ezra", fr: "Esdras", abbr: ["esd"] },
  { en: "Nehemiah", fr: "Néhémie", abbr: ["ne", "neh"] },
  { en: "Esther", fr: "Esther", abbr: ["est"] },
  { en: "Job", fr: "Job", abbr: ["jb"] },
  { en: "Psalms", fr: "Psaumes", abbr: ["ps", "psa", "psalm"] },
  { en: "Proverbs", fr: "Proverbes", abbr: ["pr", "prov"] },
  { en: "Ecclesiastes", fr: "Ecclésiaste", abbr: ["ec", "ecc", "qo"] },
  { en: "Song of Solomon", fr: "Cantique des cantiques", abbr: ["ct", "song"] },
  { en: "Isaiah", fr: "Ésaïe", abbr: ["is", "es", "esa"] },
  { en: "Jeremiah", fr: "Jérémie", abbr: ["jer", "jr"] },
  { en: "Lamentations", fr: "Lamentations", abbr: ["lam", "lm"] },
  { en: "Ezekiel", fr: "Ézéchiel", abbr: ["ez", "eze"] },
  { en: "Daniel", fr: "Daniel", abbr: ["dn", "dan"] },
  { en: "Hosea", fr: "Osée", abbr: ["os", "hos"] },
  { en: "Joel", fr: "Joël", abbr: ["jl"] },
  { en: "Amos", fr: "Amos", abbr: ["am"] },
  { en: "Obadiah", fr: "Abdias", abbr: ["ab", "abd", "ob"] },
  { en: "Jonah", fr: "Jonas", abbr: ["jon"] },
  { en: "Micah", fr: "Michée", abbr: ["mi", "mic"] },
  { en: "Nahum", fr: "Nahum", abbr: ["na", "nah"] },
  { en: "Habakkuk", fr: "Habakuk", abbr: ["hab", "ha"] },
  { en: "Zephaniah", fr: "Sophonie", abbr: ["so", "zep", "zeph"] },
  { en: "Haggai", fr: "Aggée", abbr: ["ag", "hag"] },
  { en: "Zechariah", fr: "Zacharie", abbr: ["za", "zec", "zech"] },
  { en: "Malachi", fr: "Malachie", abbr: ["ml", "mal"] },
  { en: "Matthew", fr: "Matthieu", abbr: ["mt", "mat", "matt"] },
  { en: "Mark", fr: "Marc", abbr: ["mc", "mk", "mr"] },
  { en: "Luke", fr: "Luc", abbr: ["lc", "lk", "lu"] },
  { en: "John", fr: "Jean", abbr: ["jn", "jhn"] },
  { en: "Acts", fr: "Actes", abbr: ["ac", "act"] },
  { en: "Romans", fr: "Romains", abbr: ["rm", "rom", "ro"] },
  { en: "1 Corinthians", fr: "1 Corinthiens", abbr: ["1co", "1cor"] },
  { en: "2 Corinthians", fr: "2 Corinthiens", abbr: ["2co", "2cor"] },
  { en: "Galatians", fr: "Galates", abbr: ["ga", "gal"] },
  { en: "Ephesians", fr: "Éphésiens", abbr: ["ep", "eph"] },
  { en: "Philippians", fr: "Philippiens", abbr: ["php", "phil", "ph"] },
  { en: "Colossians", fr: "Colossiens", abbr: ["col"] },
  { en: "1 Thessalonians", fr: "1 Thessaloniciens", abbr: ["1th", "1thess"] },
  { en: "2 Thessalonians", fr: "2 Thessaloniciens", abbr: ["2th", "2thess"] },
  { en: "1 Timothy", fr: "1 Timothée", abbr: ["1ti", "1tim"] },
  { en: "2 Timothy", fr: "2 Timothée", abbr: ["2ti", "2tim"] },
  { en: "Titus", fr: "Tite", abbr: ["tt", "tit"] },
  { en: "Philemon", fr: "Philémon", abbr: ["phm", "phlm"] },
  { en: "Hebrews", fr: "Hébreux", abbr: ["he", "heb"] },
  { en: "James", fr: "Jacques", abbr: ["jc", "jas", "jm"] },
  { en: "1 Peter", fr: "1 Pierre", abbr: ["1p", "1pe", "1pet"] },
  { en: "2 Peter", fr: "2 Pierre", abbr: ["2p", "2pe", "2pet"] },
  { en: "1 John", fr: "1 Jean", abbr: ["1jn", "1jhn"] },
  { en: "2 John", fr: "2 Jean", abbr: ["2jn", "2jhn"] },
  { en: "3 John", fr: "3 Jean", abbr: ["3jn", "3jhn"] },
  { en: "Jude", fr: "Jude", abbr: ["jd", "jud"] },
  {
    en: "Revelation",
    fr: "Apocalypse",
    abbr: ["ap", "apo", "rev", "re", "rv"],
  },
];

/** Lowercase, no accents, no spaces or punctuation: "1 Jean" and "1jean" match. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Every accepted spelling of a book, normalized, to its index.
const EXACT = new Map<string, number>();
BOOKS.forEach((book, index) => {
  for (const name of [book.en, book.fr, ...(book.abbr ?? [])]) {
    EXACT.set(normalize(name), index);
  }
});

/** An exact name or abbreviation, else an unambiguous prefix of at least 3 letters. */
export function findBook(input: string): number | null {
  const key = normalize(input);
  if (key === "") return null;
  const exact = EXACT.get(key);
  if (exact !== undefined) return exact;
  if (key.length < 3) return null;
  const matches = new Set<number>();
  for (const [name, index] of EXACT) {
    if (name.startsWith(key)) matches.add(index);
  }
  return matches.size === 1 ? [...matches][0] : null;
}

const ROMAN: Record<string, string> = { i: "1", ii: "2", iii: "3" };

/** "I John" becomes "1 John". */
function arabicNumeral(text: string): string {
  return text.replace(/^(iii|ii|i)\s+(?=[a-zé])/i, (_, roman: string) => {
    return `${ROMAN[roman.toLowerCase()]} `;
  });
}

/** What has been typed so far: each part is null until it is readable. */
export interface PartialReference {
  book: number | null;
  chapter: number | null;
  from: number | null;
  to: number | null;
}

/**
 * Reads a reference while it is being typed or built by clicking ("Jean",
 * "Jean 3", "Jean 3:", "Jean 3:16-"). Drives which book, chapter and verses
 * are highlighted in the browser.
 */
export function parsePartial(input: string): PartialReference {
  const match =
    /^(.*?)\s*(?:(\d+)(?:\s*[:.,]\s*(\d*)(?:\s*[-–]\s*(\d*))?)?)?$/.exec(
      arabicNumeral(input.trim()),
    );
  const number = (digits: string | undefined) =>
    digits ? Number(digits) : null;
  if (!match) return { book: null, chapter: null, from: null, to: null };
  return {
    book: findBook(match[1]),
    chapter: number(match[2]),
    from: number(match[3]),
    to: number(match[4]),
  };
}

/**
 * Reads "John 3:16", "jean 3.16-18", "1 Cor 13:4" or "I John 4:8". A verse is
 * required: a whole chapter doesn't fit on a slide.
 */
export function parseReference(input: string): Reference | null {
  const text = arabicNumeral(input.trim());
  const match = /^(.*?)\s*(\d+)\s*[:.,]\s*(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(
    text,
  );
  if (!match) return null;
  const book = findBook(match[1]);
  if (book === null) return null;
  const from = Number(match[3]);
  const to = match[4] ? Number(match[4]) : from;
  if (from < 1 || to < from) return null;
  return { book, chapter: Number(match[2]), from, to };
}

/**
 * What the space bar does while typing a reference, so it can be typed without
 * reaching for ":": "jea" + space completes to "Jean ", "Jean 3" + space becomes
 * "Jean 3:". Returns the new text, or null to let the space be typed normally.
 */
export function completeOnSpace(
  input: string,
  language: "en" | "fr",
): string | null {
  const partial = parsePartial(input);
  if (partial.book === null) return null;
  if (partial.chapter === null) return `${BOOKS[partial.book][language]} `;
  const text = input.trim();
  // Already past the chapter: a second space adds nothing.
  if (/[:.,]$/.test(text)) return text;
  if (partial.from === null && /\d$/.test(text) && !/[:.,]/.test(text)) {
    return `${text}:`;
  }
  return null;
}

/**
 * Space and Tab both move on to the next part of a reference. A Tab that would
 * change nothing (nothing left to complete) returns null, so it keeps its usual
 * job of moving the focus to the next field.
 */
export function completeOnKey(
  input: string,
  key: string,
  language: "en" | "fr",
): string | null {
  if (key !== " " && key !== "Tab") return null;
  const completed = completeOnSpace(input, language);
  return key === "Tab" && completed === input ? null : completed;
}

/** The verses of a reference, or null when this translation doesn't have them. */
export function getVerses(text: BibleText, ref: Reference): string[] | null {
  const chapter = text[ref.book]?.[ref.chapter - 1];
  if (!chapter || ref.from > chapter.length) return null;
  return chapter.slice(ref.from - 1, Math.min(ref.to, chapter.length));
}

export function formatReference(ref: Reference, language: "en" | "fr"): string {
  const name = BOOKS[ref.book][language];
  const verses = ref.to > ref.from ? `${ref.from}-${ref.to}` : `${ref.from}`;
  return `${name} ${ref.chapter}:${verses}`;
}

// A range is read as running text; the numbers keep the reader oriented.
function joinVerses(verses: string[], from: number): string {
  if (verses.length === 1) return verses[0];
  return verses.map((verse, i) => `${from + i} ${verse}`).join(" ");
}

export const SEARCH_LIMIT = 100;
export const SEARCH_MIN_LETTERS = 3;

export interface SearchHit {
  ref: Reference;
  language: "en" | "fr";
  text: string;
}

function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function searchTerms(query: string): string[] {
  return fold(query)
    .split(/\s+/)
    .map((term) => term.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((term) => term !== "");
}

// Folding 31,000 verses takes a moment: do it once per translation, on first use.
const foldedCache = new WeakMap<BibleText, BibleText>();

function folded(text: BibleText): BibleText {
  let index = foldedCache.get(text);
  if (!index) {
    index = text.map((book) => book.map((chapter) => chapter.map(fold)));
    foldedCache.set(text, index);
  }
  return index;
}

/**
 * Finds the verses containing every word typed, ignoring case and accents.
 * Verses with the words in the exact order come first, then the others, each
 * group in Bible order. `total` counts all matches, `hits` keeps the first
 * SEARCH_LIMIT.
 */
export function searchVerses(
  texts: { en: BibleText; fr: BibleText },
  query: string,
  mode: BibleMode,
): { hits: SearchHit[]; total: number } {
  const terms = searchTerms(query);
  if (terms.join("").length < SEARCH_MIN_LETTERS) return { hits: [], total: 0 };
  const phrase = terms.join(" ");
  const languages: ("en" | "fr")[] = mode === "both" ? ["en", "fr"] : [mode];

  const exact: SearchHit[] = [];
  const loose: SearchHit[] = [];
  for (const language of languages) {
    const index = folded(texts[language]);
    index.forEach((book, b) =>
      book.forEach((chapter, c) =>
        chapter.forEach((verse, v) => {
          if (!terms.every((term) => verse.includes(term))) return;
          const hit: SearchHit = {
            ref: { book: b, chapter: c + 1, from: v + 1, to: v + 1 },
            language,
            text: texts[language][b][c][v],
          };
          (verse.includes(phrase) ? exact : loose).push(hit);
        }),
      ),
    );
  }
  const position = (a: SearchHit, b: SearchHit) =>
    a.ref.book - b.ref.book ||
    a.ref.chapter - b.ref.chapter ||
    a.ref.from - b.ref.from ||
    (a.language === b.language ? 0 : a.language === "en" ? -1 : 1);
  exact.sort(position);
  loose.sort(position);
  return {
    hits: [...exact, ...loose].slice(0, SEARCH_LIMIT),
    total: exact.length + loose.length,
  };
}

/** Cuts a verse into runs, marking the ones that match a searched word. */
export function highlightParts(
  text: string,
  query: string,
): { text: string; match: boolean }[] {
  // Folding character by character keeps the positions aligned with the text.
  const foldedText = Array.from(text, (char) => {
    const f = fold(char);
    return f.length === 1 ? f : char;
  }).join("");
  const marked = new Array<boolean>(text.length).fill(false);
  for (const term of searchTerms(query)) {
    for (
      let at = foldedText.indexOf(term);
      at !== -1;
      at = foldedText.indexOf(term, at + 1)
    ) {
      marked.fill(true, at, at + term.length);
    }
  }
  const parts: { text: string; match: boolean }[] = [];
  [...text].forEach((char, i) => {
    const last = parts[parts.length - 1];
    if (last && last.match === marked[i]) last.text += char;
    else parts.push({ text: char, match: marked[i] });
  });
  return parts;
}

/**
 * Reads a reference as it may sit in a prayer slide's reference field, where it
 * carries the translations' names: "John 3:16 (KJV) · Jean 3:16 (Darby)" reads as
 * John 3:16.
 */
export function parseLooseReference(input: string): Reference | null {
  const first = input.split("·")[0].replace(/\([^)]*\)\s*$/, "");
  return parseReference(first);
}

/**
 * The reference line and the verse text of a passage, to fill in a prayer point
 * from the Bible: "John 3:16 (KJV)" and its text, in the language(s) of `mode`.
 * Null when neither translation has the verse.
 */
export function scriptureFor(
  ref: Reference,
  mode: BibleMode,
  texts: { en: BibleText; fr: BibleText },
): { reference: string; verse: string } | null {
  const parts: { reference: string; verse: string }[] = [];
  const en = mode !== "fr" ? getVerses(texts.en, ref) : null;
  const fr = mode !== "en" ? getVerses(texts.fr, ref) : null;
  if (en) {
    parts.push({
      reference: `${formatReference(ref, "en")} (${EN_VERSION})`,
      verse: joinVerses(en, ref.from),
    });
  }
  if (fr) {
    parts.push({
      reference: `${formatReference(ref, "fr")} (${FR_VERSION})`,
      verse: joinVerses(fr, ref.from),
    });
  }
  if (parts.length === 0) return null;
  return {
    reference: parts.map((p) => p.reference).join(" · "),
    verse: parts.map((p) => p.verse).join("\n\n"),
  };
}

/**
 * The slide for a passage, as a prayer point so the existing projection
 * pipeline (state, event, slide) carries it unchanged: the heading takes the
 * big title slot, the translations' names the small yellow line.
 */
export function buildPassage(
  ref: Reference,
  mode: BibleMode,
  texts: { en: BibleText; fr: BibleText },
  layout: BibleLayout = "stacked",
): PrayerPoint | null {
  const en = getVerses(texts.en, ref);
  const fr = getVerses(texts.fr, ref);
  const parts: { heading: string; version: string; verse: string }[] = [];
  if (mode !== "fr" && en) {
    parts.push({
      heading: formatReference(ref, "en"),
      version: EN_VERSION,
      verse: joinVerses(en, ref.from),
    });
  }
  if (mode !== "en" && fr) {
    parts.push({
      heading: formatReference(ref, "fr"),
      version: FR_VERSION,
      verse: joinVerses(fr, ref.from),
    });
  }
  if (parts.length === 0) return null;
  return {
    number: "",
    text: [...new Set(parts.map((p) => p.heading))].join(" · "),
    reference: parts.map((p) => p.version).join(" · "),
    verse: parts.map((p) => p.verse).join("\n\n"),
    // No service footer under scripture: the verse gets the whole slide.
    footer: "",
    scripture: true,
    // The split template covers one translation as well as two.
    passages:
      layout === "split"
        ? parts.map((p) => ({
            label: `${p.heading} (${p.version})`,
            verse: p.verse,
          }))
        : [],
  };
}
