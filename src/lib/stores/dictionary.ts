import { writable } from "svelte/store";
import type { Lookup } from "$lib/dictionary";

export type DictionaryStatus =
  "idle" | "loading" | "found" | "notfound" | "error";

// All of this survives a tab switch, so the pastor's word is still there on return.
export const dictionaryQuery = writable("");
export const dictionaryStatus = writable<DictionaryStatus>("idle");
export const dictionaryLookup = writable<Lookup | null>(null);
/** The normalized word the current result answers, to tell a new word from a repeat. */
export const dictionaryWord = writable("");
/** Ids of the definitions chosen for the slide. */
export const dictionaryPicked = writable<string[]>([]);
