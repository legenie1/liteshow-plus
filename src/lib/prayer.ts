import type { PrayerPoint } from "$lib/types";

/** Text between stars is drawn small and yellow, as in the original design. */
export const DEFAULT_FOOTER = "My house *shall be called a* house of prayer";

export const EMPTY_PRAYER: PrayerPoint = {
  number: "1",
  text: "",
  reference: "",
  verse: "",
  footer: DEFAULT_FOOTER,
};

/** Splits a footer on its stars: odd pieces are the accented ones. */
export function splitFooter(
  footer: string,
): { text: string; accent: boolean }[] {
  return footer
    .split("*")
    .map((text, index) => ({ text, accent: index % 2 === 1 }))
    .filter((piece) => piece.text !== "");
}

/**
 * Moves a prayer point number by `delta`. The number is free text (the pastor may
 * say "3b"), so anything that isn't a plain integer restarts at 1. Never below 1.
 */
export function stepNumber(value: string, delta: number): string {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return "1";
  return String(Math.max(1, Number(trimmed) + delta));
}

/** The next point: next number, empty texts, same footer. */
export function nextPrayer(prayer: PrayerPoint): PrayerPoint {
  return {
    number: stepNumber(prayer.number, 1),
    text: "",
    reference: "",
    verse: "",
    footer: prayer.footer,
  };
}

export const HISTORY_LIMIT = 12;

/**
 * Most recent first, one entry per number: a number identifies a point during a
 * service, so projecting it again (even reworded) replaces the old entry.
 */
export function addToHistory(
  history: PrayerPoint[],
  prayer: PrayerPoint,
): PrayerPoint[] {
  const number = prayer.number.trim();
  return [prayer, ...history.filter((p) => p.number.trim() !== number)].slice(
    0,
    HISTORY_LIMIT,
  );
}

/** A point worth projecting has at least a text or a verse. */
export function canProject(prayer: PrayerPoint): boolean {
  return prayer.text.trim() !== "" || prayer.verse.trim() !== "";
}
