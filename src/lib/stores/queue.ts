import { writable } from "svelte/store";
import {
  addItem,
  moveItem,
  parseQueue,
  removeItem,
  type QueueItem,
} from "$lib/queue";
import type { PrayerPoint } from "$lib/types";

const KEY = "liteshow.bibleQueue";

function read(): QueueItem[] {
  try {
    return parseQueue(localStorage.getItem(KEY));
  } catch {
    return [];
  }
}

/** The verses lined up for the service; kept across restarts, so they can be prepared the day before. */
export const bibleQueue = writable<QueueItem[]>(read());

bibleQueue.subscribe((queue) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(queue));
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
});

let counter = 0;
const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const queueAdd = (passage: PrayerPoint) =>
  bibleQueue.update((queue) => addItem(queue, passage, newId()));

export const queueRemove = (id: string) =>
  bibleQueue.update((queue) => removeItem(queue, id));

export const queueMove = (id: string, delta: -1 | 1) =>
  bibleQueue.update((queue) => moveItem(queue, id, delta));

export const queueClear = () => bibleQueue.set([]);
