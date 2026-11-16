import { writable } from "svelte/store";
import type { BibleMode, BibleText } from "$lib/bible";
import enUrl from "../../assets/bible/kjv.json?url";
import frUrl from "../../assets/bible/jnd.json?url";

const MODE_KEY = "liteshow.bibleMode";
const MODES: BibleMode[] = ["en", "fr", "both"];

function readMode(): BibleMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (MODES.includes(stored as BibleMode)) return stored as BibleMode;
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
  return "both";
}

export const bibleMode = writable<BibleMode>(readMode());
bibleMode.subscribe((mode) => {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
});

// Kept across tab switches, like the prayer draft.
export const bibleQuery = writable("");

export interface BibleTexts {
  en: BibleText;
  fr: BibleText;
}

let loading: Promise<BibleTexts> | null = null;

async function fetchText(url: string): Promise<BibleText> {
  const response = await fetch(url);
  return (await response.json()) as BibleText;
}

/**
 * The two translations ship as static assets (about 4 MB each) and are only
 * fetched the first time the Bible tab opens, so they cost nothing at startup.
 */
export function loadBible(): Promise<BibleTexts> {
  loading ??= Promise.all([fetchText(enUrl), fetchText(frUrl)])
    .then(([en, fr]) => ({ en, fr }))
    .catch((error: unknown) => {
      loading = null; // let the next visit retry
      throw error;
    });
  return loading;
}
