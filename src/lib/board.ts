import { KINDS } from "$lib/settings";
import type { SlideKind } from "$lib/types";
import type { Tab } from "$lib/stores/videos";

/**
 * The section the blackout takes its picture from: the tab the operator is on, as
 * far as it has a background of its own. Slides and videos have none, so the
 * blackout is plain black there.
 */
export function boardKindForTab(tab: Tab): SlideKind | null {
  switch (tab) {
    case "prayer":
    case "bible":
    case "dictionary":
    case "lyrics":
      return tab;
    default:
      return null;
  }
}

/** Reads the stored section; anything unknown is no section (plain black). */
export function parseBoardKind(raw: string | null): SlideKind | null {
  return KINDS.find((kind) => kind === raw) ?? null;
}
