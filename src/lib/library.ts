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

function cleanLine(line: string): string {
  // The lines come from a web page: non-breaking and doubled spaces become one
  // plain space (the regex class for whitespace covers the non-breaking one).
  return line.replace(/\s+/g, " ").trim();
}

/**
 * Turns a library file, `{ "song-slug": ["line", "line", ...] }`, into songs.
 * The lines carry no verse structure, so they are cut into slides of
 * `perSlide` lines; each song can be copied and regrouped by hand afterwards.
 * Entries that aren't a list of text lines are skipped.
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
