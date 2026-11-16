import type { PrayerPoint } from "$lib/types";

export const DICTIONARY_URL =
  "https://api.dictionaryapi.dev/api/v2/entries/en/";

export interface Definition {
  id: string;
  partOfSpeech: string;
  text: string;
}

export interface Lookup {
  word: string;
  phonetic: string;
  definitions: Definition[];
}

export type LookupResult =
  { status: "found"; lookup: Lookup } | { status: "notfound" };

interface ApiEntry {
  word?: string;
  phonetic?: string;
  phonetics?: { text?: string }[];
  meanings?: {
    partOfSpeech?: string;
    definitions?: { definition?: string }[];
  }[];
}

/** What gets sent to the dictionary: trimmed, lowercase, single spaces. */
export function normalizeWord(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Flattens the API answer (one entry per homograph, each with meanings grouped by
 * part of speech) into one list of definitions, in the order the API gives them.
 * Returns null when there is nothing to show.
 */
export function parseLookup(json: unknown): Lookup | null {
  if (!Array.isArray(json) || json.length === 0) return null;
  const entries = json as ApiEntry[];
  const definitions: Definition[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    for (const meaning of entry.meanings ?? []) {
      for (const definition of meaning.definitions ?? []) {
        const text = definition.definition?.trim();
        if (!text || seen.has(text)) continue;
        seen.add(text);
        definitions.push({
          id: String(definitions.length),
          partOfSpeech: meaning.partOfSpeech?.trim() ?? "",
          text,
        });
      }
    }
  }
  if (definitions.length === 0) return null;
  const phonetic =
    entries.find((entry) => entry.phonetic)?.phonetic ??
    entries.flatMap((entry) => entry.phonetics ?? []).find((p) => p.text)
      ?.text ??
    "";
  return { word: entries[0].word ?? "", phonetic, definitions };
}

/**
 * Looks a word up. A word the dictionary doesn't know is a normal answer
 * ("notfound"); a network failure or a server error throws.
 */
export async function lookupWord(
  word: string,
  signal?: AbortSignal,
  fetchFn: typeof fetch = fetch,
): Promise<LookupResult> {
  const response = await fetchFn(DICTIONARY_URL + encodeURIComponent(word), {
    signal,
  });
  if (response.status === 404) return { status: "notfound" };
  if (!response.ok) throw new Error(`Dictionary answered ${response.status}`);
  const lookup = parseLookup(await response.json());
  return lookup ? { status: "found", lookup } : { status: "notfound" };
}

/**
 * The slide for a word, as a prayer point so the existing projection pipeline
 * carries it unchanged: the word takes the big title slot, its pronunciation the
 * small yellow line, the chosen definitions the body.
 */
export function buildDefinitionPassage(
  lookup: Lookup,
  picked: Definition[],
  footer: string,
): PrayerPoint | null {
  if (picked.length === 0) return null;
  return {
    number: "",
    text: lookup.word.charAt(0).toUpperCase() + lookup.word.slice(1),
    reference: lookup.phonetic,
    verse: picked
      .map((d) => (d.partOfSpeech ? `(${d.partOfSpeech}) ${d.text}` : d.text))
      .join("\n\n"),
    footer,
  };
}
