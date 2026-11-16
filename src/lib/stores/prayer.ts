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

// Points already projected, so the operator can go back to one after "Next point".
// Session only: a service's points mean nothing the week after.
export const prayerHistory = writable<PrayerPoint[]>([]);

// The footer rarely changes: remember it across sessions.
prayerDraft.subscribe(({ footer }) => {
  try {
    localStorage.setItem(FOOTER_KEY, footer);
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
});
