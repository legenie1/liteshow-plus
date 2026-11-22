import { derived, writable } from "svelte/store";
import { BACKGROUND_INFO } from "$lib/backgrounds";
import { parseBoardKind } from "$lib/board";
import { slideSettings } from "$lib/stores/settings";
import type { SlideKind } from "$lib/types";

const KEY = "liteshow.boardKind";

function read(): SlideKind | null {
  try {
    return parseBoardKind(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

/**
 * The section whose background the blackout shows. Only the control window sets
 * it (from the tab it is on); the projection window reads it, through the same
 * `localStorage` and `storage` event as the slide settings.
 */
export const boardKind = writable<SlideKind | null>(read());

export function setBoardKind(kind: SlideKind | null): void {
  boardKind.set(kind);
  try {
    localStorage.setItem(KEY, kind ?? "");
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === KEY) boardKind.set(parseBoardKind(event.newValue));
  });
}

/** The picture of the blackout: that section's background, or plain black. */
export const board = derived([boardKind, slideSettings], ([kind, settings]) =>
  kind
    ? BACKGROUND_INFO[settings.backgrounds[kind]]
    : { url: null, veil: "transparent" },
);
