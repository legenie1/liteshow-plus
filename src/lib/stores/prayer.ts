import { writable } from "svelte/store";
import { EMPTY_PRAYER } from "$lib/prayer";
import type { PrayerPoint } from "$lib/types";

// Lives in a store so the draft survives switching tabs mid-service.
export const prayerDraft = writable<PrayerPoint>({ ...EMPTY_PRAYER });

// Points already projected, so the operator can go back to one after "Next point".
// Session only: a service's points mean nothing the week after.
export const prayerHistory = writable<PrayerPoint[]>([]);
