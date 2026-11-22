import { writable } from "svelte/store";
import {
  addItem,
  moveItem,
  parseQueue,
  removeItem,
  updateItem,
  type QueueItem,
} from "$lib/queue";
import type { PrayerPoint } from "$lib/types";

let counter = 0;
const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

/**
 * A queue of slides kept in `localStorage`, so it survives restarts and can be
 * prepared the day before. It is a store (`$queue` works) with its operations.
 */
function createQueue(key: string) {
  let initial: QueueItem[] = [];
  try {
    initial = parseQueue(localStorage.getItem(key));
  } catch {
    // No storage: start empty.
  }
  const { subscribe, update, set } = writable<QueueItem[]>(initial);

  subscribe((queue) => {
    try {
      localStorage.setItem(key, JSON.stringify(queue));
    } catch {
      // Same acceptable degradation as the remembered monitor.
    }
  });

  return {
    subscribe,
    add: (passage: PrayerPoint, id: string = newId()) =>
      update((queue) => addItem(queue, passage, id)),
    /** Swaps the slide of an item, e.g. after highlighting words in it. */
    replace: (id: string, passage: PrayerPoint) =>
      update((queue) => updateItem(queue, id, passage)),
    remove: (id: string) => update((queue) => removeItem(queue, id)),
    move: (id: string, delta: -1 | 1) =>
      update((queue) => moveItem(queue, id, delta)),
    clear: () => set([]),
  };
}

/** The verses lined up for the service (Bible tab). */
export const bibleQueue = createQueue("liteshow.bibleQueue");

/** The prayer points lined up for the service (Prayer tab). */
export const prayerQueue = createQueue("liteshow.prayerQueue");

/**
 * The songs lined up for the service (Lyrics tab). Each entry is keyed by its song's
 * id, and its slide only carries the title and the first slide, for the list.
 */
export const songQueue = createQueue("liteshow.songQueue");
