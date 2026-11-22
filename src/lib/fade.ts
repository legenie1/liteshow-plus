import type { PrayerPoint } from "$lib/types";

/** How long a slide takes to fade in or out, in milliseconds. */
export const FADE_MS = 300;

/** The fade's length: none for someone who asked their system for less motion. */
export function fadeMs(): number {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : FADE_MS;
  } catch {
    return FADE_MS;
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
