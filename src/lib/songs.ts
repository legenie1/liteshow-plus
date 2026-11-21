import type { PrayerPoint } from "$lib/types";

export interface Song {
  id: string;
  title: string;
  /** Slides separated by a blank line; a slide may start with a "[Label]" line. */
  lyrics: string;
  /** Shipped with the app: can be copied but not changed or deleted. */
  builtIn: boolean;
}

/** What a slide is, which decides the colour of its label in the list. */
export type SectionKind = "verse" | "chorus" | "bridge" | "other";

export interface SongSection {
  label: string;
  text: string;
  kind: SectionKind;
}

/** Reads the kind from a label, in English or French: "Chorus 2", "Refrain", "Pont". */
export function sectionKind(label: string): SectionKind {
  const name = label.toLowerCase();
  if (/chorus|refrain/.test(name)) return "chorus";
  if (/bridge|pont/.test(name)) return "bridge";
  if (/verse|couplet|strophe/.test(name)) return "verse";
  return "other";
}

/**
 * Splits lyrics into slides on blank lines. A slide can name itself with a first
 * line like "[Chorus]"; a slide without one has an empty label.
 */
export function parseLyrics(lyrics: string): SongSection[] {
  return splitBlocks(lyrics).map(({ name, text }) => ({
    label: name ?? "",
    text,
    kind: name === null ? "other" : sectionKind(name),
  }));
}

// The stored text: slides apart on blank lines, each optionally named "[Label]".
function splitBlocks(lyrics: string): { name: string | null; text: string }[] {
  const blocks: { name: string | null; text: string }[] = [];
  for (const block of lyrics.trim().split(/\r?\n[ \t]*\r?\n/)) {
    const lines = block.split(/\r?\n/).map((line) => line.trim());
    const named = /^\[(.+)\]$/.exec(lines[0] ?? "");
    const text = (named ? lines.slice(1) : lines).join("\n").trim();
    if (text !== "")
      blocks.push({ name: named ? named[1].trim() : null, text });
  }
  return blocks;
}

/** One line of the song editor: an optional label and the lyrics of the slide. */
export interface LyricRow {
  label: string;
  text: string;
}

/** Lyrics as editor rows. An unnamed slide has an empty label, so it stays auto-numbered. */
export function lyricsToRows(lyrics: string): LyricRow[] {
  return splitBlocks(lyrics).map(({ name, text }) => ({
    label: name ?? "",
    text,
  }));
}

/**
 * Editor rows back to the stored text. Rows without lyrics are dropped, and a
 * blank line inside a row's lyrics is closed up: it would otherwise cut the slide
 * in two.
 */
export function rowsToLyrics(rows: LyricRow[]): string {
  return rows
    .map(({ label, text }) => {
      const body = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line !== "")
        .join("\n");
      const name = label.replace(/[[\]]/g, "").trim();
      return body === "" ? "" : name ? `[${name}]\n${body}` : body;
    })
    .filter((block) => block !== "")
    .join("\n\n");
}

/**
 * The slide for one section, as a prayer point so the existing projection
 * pipeline carries it unchanged: the lyrics take the big title slot, the song's
 * name and the section label the small yellow line.
 */
export function sectionPassage(
  song: Song,
  section: SongSection,
  footer: string,
): PrayerPoint {
  return {
    number: "",
    text: section.text,
    reference: section.label ? `${song.title} · ${section.label}` : song.title,
    verse: "",
    footer,
    kind: "lyrics",
  };
}

const fold = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Title filter: every typed word must appear, ignoring case and accents. */
export function matchesTitle(song: Song, filter: string): boolean {
  const title = fold(song.title);
  return fold(filter)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => title.includes(word));
}

// Folding every song on each keystroke would be wasteful: do it once per song.
const foldedLyrics = new WeakMap<Song, string>();

/** Lyrics filter: every typed word must appear somewhere in the words of the song. */
export function matchesLyrics(song: Song, filter: string): boolean {
  let lyrics = foldedLyrics.get(song);
  if (lyrics === undefined) {
    lyrics = fold(song.lyrics);
    foldedLyrics.set(song, lyrics);
  }
  return fold(filter)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => lyrics.includes(word));
}

/** Alphabetical, ignoring case and accents. */
export function sortSongs(songs: Song[]): Song[] {
  return [...songs].sort((a, b) => fold(a.title).localeCompare(fold(b.title)));
}

/** A song worth saving has a title and at least one slide of lyrics. */
export function isValidSong(title: string, lyrics: string): boolean {
  return title.trim() !== "" && parseLyrics(lyrics).length > 0;
}

export function newSongId(): string {
  return `song-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
