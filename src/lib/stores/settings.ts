import { writable } from "svelte/store";
import {
  parseSettings,
  type BackgroundId,
  type SlideSettings,
  type TextSize,
} from "$lib/settings";
import type { SlideKind } from "$lib/types";

const KEY = "liteshow.slideSettings";

// Where the Prayer tab used to keep the footer text.
const LEGACY_FOOTER_KEY = "liteshow.prayerFooter";

function read(): SlideSettings {
  try {
    const raw = localStorage.getItem(KEY);
    const settings = parseSettings(raw);
    if (raw === null) {
      const legacy = localStorage.getItem(LEGACY_FOOTER_KEY);
      if (legacy !== null) settings.footerText = legacy;
    }
    return settings;
  } catch {
    return parseSettings(null);
  }
}

/**
 * Shared by the control and the projection windows: both draw slides, and both
 * read the same `localStorage`, so a change shows on the projector at once.
 */
export const slideSettings = writable<SlideSettings>(read());

slideSettings.subscribe((settings) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
});

// The other window wrote a change: adopt it. Writing the same text back is not
// announced a second time by the browser, so there is no loop.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === KEY) slideSettings.set(parseSettings(event.newValue));
  });
}

export function setBackground(kind: SlideKind, id: BackgroundId): void {
  slideSettings.update((s) => ({
    ...s,
    backgrounds: { ...s.backgrounds, [kind]: id },
  }));
}

export function setFooter(kind: SlideKind, shown: boolean): void {
  slideSettings.update((s) => ({
    ...s,
    footers: { ...s.footers, [kind]: shown },
  }));
}

export function setFooterText(text: string): void {
  slideSettings.update((s) => ({ ...s, footerText: text }));
}

export function setBibleTextSize(size: TextSize): void {
  slideSettings.update((s) => ({ ...s, bibleTextSize: size }));
}
