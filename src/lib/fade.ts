import type { PrayerPoint } from "$lib/types";

/**
 * The fade's length in milliseconds: the operator's setting, except none for
 * someone who asked their system for less motion.
 */
export function fadeMs(configured: number): number {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : configured;
  } catch {
    return configured;
  }
}

/**
 * Which slide this is, for the fade: a new key means a new slide, which fades in
 * over the old one. Highlighting a word changes the text but not the slide, so the
 * highlight marks are left out and the slide stays put.
 */
export function slideKey(prayer: PrayerPoint | null): string {
  if (!prayer) return "";
  return JSON.stringify(prayer).replace(/[⟦⟧]/g, "");
}
