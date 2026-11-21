import type { PrayerPoint } from "$lib/types";

/**
 * A highlighted stretch of a verse travels inside the verse text itself, between
 * these two brackets, so the projection window needs nothing but the text. They
 * are not `*`: the French Bible already uses stars.
 */
const OPEN = "⟦";
const CLOSE = "⟧";
const BRACKETS = /[⟦⟧]/g;

export interface Token {
  text: string;
  /** Position among the words of the block (spaces have none). */
  word: number | null;
  marked: boolean;
}

/** Words and spaces of a verse, each saying whether it is highlighted. */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let word = 0;
  text.split(/[⟦⟧]/).forEach((part, index) => {
    for (const piece of part.split(/(\s+)/)) {
      if (piece === "") continue;
      const isSpace = /^\s+$/.test(piece);
      tokens.push({
        text: piece,
        word: isSpace ? null : word++,
        marked: index % 2 === 1,
      });
    }
  });
  return tokens;
}

/** Wraps the chosen words in brackets; a run never crosses a line break. */
export function applyMarks(text: string, marked: ReadonlySet<number>): string {
  const plain = text.replace(BRACKETS, "");
  if (marked.size === 0) return plain;
  let word = 0;
  let out = "";
  let open = false;
  const pieces = plain.split(/(\s+)/).filter((piece) => piece !== "");
  pieces.forEach((piece, index) => {
    if (/^\s+$/.test(piece)) {
      // A space stays inside a run only if the next word is marked too.
      const next = pieces[index + 1];
      const keep = open && !piece.includes("\n") && next !== undefined;
      if (open && !(keep && marked.has(word))) {
        out += CLOSE;
        open = false;
      }
      out += piece;
      return;
    }
    if (marked.has(word) && !open) {
      out += OPEN;
      open = true;
    } else if (!marked.has(word) && open) {
      out += CLOSE;
      open = false;
    }
    out += piece;
    word++;
  });
  if (open) out += CLOSE;
  return out;
}

export function toggleWord(marked: readonly number[], word: number): number[] {
  return marked.includes(word)
    ? marked.filter((w) => w !== word)
    : [...marked, word].sort((a, b) => a - b);
}

/** Adds every word between the two positions (either order). */
export function markRange(
  marked: readonly number[],
  a: number,
  b: number,
): number[] {
  const set = new Set(marked);
  for (let w = Math.min(a, b); w <= Math.max(a, b); w++) set.add(w);
  return [...set].sort((x, y) => x - y);
}

/** The passage with the highlights of each block written into its text. */
export function markPassage(
  passage: PrayerPoint | null,
  marks: readonly (readonly number[] | undefined)[],
): PrayerPoint | null {
  if (!passage) return passage;
  const set = (block: number) => new Set(marks[block] ?? []);
  if (passage.passages?.length) {
    return {
      ...passage,
      passages: passage.passages.map((p, i) => ({
        ...p,
        verse: applyMarks(p.verse, set(i)),
      })),
    };
  }
  return { ...passage, verse: applyMarks(passage.verse, set(0)) };
}
