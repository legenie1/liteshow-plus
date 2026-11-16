import { writable } from "svelte/store";
import { DEFAULT_FOOTER, EMPTY_PRAYER } from "$lib/prayer";
import type { PrayerPoint } from "$lib/types";

const FOOTER_KEY = "liteshow.prayerFooter";

function readFooter(): string {
  try {
    // An empty string is a valid choice: it hides the footer.
    return localStorage.getItem(FOOTER_KEY) ?? DEFAULT_FOOTER;
  } catch {
    return DEFAULT_FOOTER;
  }
}

// Lives in a store so the draft survives switching tabs mid-service.
export const prayerDraft = writable<PrayerPoint>({
  ...EMPTY_PRAYER,
  footer: readFooter(),
});

// The footer rarely changes: remember it across sessions.
prayerDraft.subscribe(({ footer }) => {
  try {
    localStorage.setItem(FOOTER_KEY, footer);
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
});
