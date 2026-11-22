import type { Song } from "$lib/songs";

/** A slide of four lines reads well on a projector and is easy to regroup. */
export const LINES_PER_SLIDE = 4;

// Words a title keeps in lowercase, unless they start or end it.
const SMALL_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
]);

/** "give-your-life-to-the-lord" becomes "Give Your Life to the Lord". */
export function titleFromSlug(slug: string): string {
  const words = slug.split("-").filter((word) => word !== "");
  return words
    .map((word, index) =>
      SMALL_WORDS.has(word) && index > 0 && index < words.length - 1
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function isStructured(
  value: unknown,
): value is { title: string; lyrics: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { title?: unknown }).title === "string" &&
    typeof (value as { lyrics?: unknown }).lyrics === "string"
  );
}

function cleanLine(line: string): string {
  // The lines come from a web page: non-breaking and doubled spaces become one
  // plain space (the regex class for whitespace covers the non-breaking one).
  return line.replace(/\s+/g, " ").trim();
}

/** Lyrics as stored: lines trimmed, slides apart on one blank line, nothing else. */
function cleanLyrics(lyrics: string): string {
  return lyrics
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Turns a library file into songs. An entry is either
 * - `"song-slug": ["line", "line", ...]`: loose lines with no verse structure, cut
 *   into slides of `perSlide` lines (each song can be copied and regrouped by
 *   hand afterwards), the title read from the slug; or
 * - `"song-slug": { "title": "...", "lyrics": "..." }`: a song with its own title
 *   and slides, as the EasyWorship converter writes them, kept as they are.
 * Anything else is skipped.
 */
export function librarySongs(
  data: unknown,
  perSlide = LINES_PER_SLIDE,
): Song[] {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return [];
  }
  const songs: Song[] = [];
  for (const [slug, value] of Object.entries(data)) {
    if (isStructured(value)) {
      const title = cleanLine(value.title);
      const lyrics = cleanLyrics(value.lyrics);
      if (title === "" || lyrics === "") continue;
      songs.push({
        id: `library-song-${slug}`,
        title,
        lyrics,
        builtIn: true,
        structured: true,
      });
      continue;
    }
    if (!Array.isArray(value)) continue;
    const lines = value
      .filter((line): line is string => typeof line === "string")
      .map(cleanLine)
      .filter((line) => line !== "");
    if (lines.length === 0) continue;
    const slides: string[] = [];
    for (let i = 0; i < lines.length; i += perSlide) {
      slides.push(lines.slice(i, i + perSlide).join("\n"));
    }
    songs.push({
      id: `library-${slug}`,
      title: titleFromSlug(slug),
      lyrics: slides.join("\n\n"),
      builtIn: true,
    });
  }
  return songs;
}

/** A title as a key: no accents, case or punctuation, so "Amazing Grace!" matches. */
function titleKey(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Songs from several library files, without the same song twice: a loose list of
 * lines gives way to an EasyWorship song of the same title, which has the real
 * slides. Several EasyWorship songs with one title are all kept.
 */
export function dedupeLibrary(songs: Song[]): Song[] {
  const structured = new Set(
    songs.filter((song) => song.structured).map((song) => titleKey(song.title)),
  );
  return songs.filter(
    (song) => song.structured || !structured.has(titleKey(song.title)),
  );
}
