import { writable } from "svelte/store";

/** Whether the list of keyboard shortcuts is on screen. */
export const shortcutsOpen = writable<boolean>(false);
