import { DEFAULT_FOOTER } from "$lib/prayer";
import type { SlideKind } from "$lib/types";

export const KINDS: SlideKind[] = ["prayer", "bible", "dictionary", "lyrics"];

export const BACKGROUNDS = ["green", "chalkboard", "black"] as const;
export type BackgroundId = (typeof BACKGROUNDS)[number];

export const TEXT_SIZES = ["small", "normal", "large", "huge"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

/** Multiplies the text sizes; a long text still shrinks to fit on top of it. */
export const TEXT_SCALE: Record<TextSize, number> = {
  small: 0.85,
  normal: 1,
  large: 1.2,
  huge: 1.4,
};

export interface SlideSettings {
  backgrounds: Record<SlideKind, BackgroundId>;
  /** Whether the footer line is drawn under each kind of slide. */
  footers: Record<SlideKind, boolean>;
  /** Text between stars is drawn small and yellow. Empty = no footer at all. */
  footerText: string;
  bibleTextSize: TextSize;
}

export const DEFAULT_SETTINGS: SlideSettings = {
  backgrounds: {
    prayer: "green",
    bible: "chalkboard",
    dictionary: "green",
    lyrics: "green",
  },
  footers: { prayer: true, bible: false, dictionary: true, lyrics: true },
  footerText: DEFAULT_FOOTER,
  bibleTextSize: "normal",
};

function pick<T extends string>(
  allowed: readonly T[],
  value: unknown,
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/**
 * Reads the stored settings. Anything missing or unknown (an older version, a
 * hand-edited value) falls back to the default instead of breaking the slides.
 */
export function parseSettings(raw: string | null): SlideSettings {
  let data: Record<string, Record<string, unknown>> & {
    bibleTextSize?: unknown;
    footerText?: unknown;
  } = {};
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") data = parsed as typeof data;
  } catch {
    // Corrupt value: start again from the defaults.
  }
  const settings = structuredClone(DEFAULT_SETTINGS);
  for (const kind of KINDS) {
    settings.backgrounds[kind] = pick(
      BACKGROUNDS,
      data.backgrounds?.[kind],
      settings.backgrounds[kind],
    );
    const footer = data.footers?.[kind];
    if (typeof footer === "boolean") settings.footers[kind] = footer;
  }
  // An empty text is a valid choice.
  if (typeof data.footerText === "string") {
    settings.footerText = data.footerText;
  }
  settings.bibleTextSize = pick(
    TEXT_SIZES,
    data.bibleTextSize,
    settings.bibleTextSize,
  );
  return settings;
}
