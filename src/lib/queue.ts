import { applyMarks } from "$lib/highlight";
import type { PrayerPoint } from "$lib/types";

/**
 * A passage waiting its turn. It keeps the finished slide (language, template and
 * highlights as they were when it was queued), so projecting it again shows the
 * very same thing.
 */
export interface QueueItem {
  id: string;
  passage: PrayerPoint;
}

/** Appends a passage, unless the very same slide is already in the queue. */
export function addItem(
  queue: QueueItem[],
  passage: PrayerPoint,
  id: string,
): QueueItem[] {
  const same = JSON.stringify(passage);
  if (queue.some((item) => JSON.stringify(item.passage) === same)) {
    return queue;
  }
  return [...queue, { id, passage }];
}

/** Swaps the slide of an item, e.g. after highlighting words in it. */
export function updateItem(
  queue: QueueItem[],
  id: string,
  passage: PrayerPoint,
): QueueItem[] {
  return queue.map((item) => (item.id === id ? { ...item, passage } : item));
}

export function removeItem(queue: QueueItem[], id: string): QueueItem[] {
  return queue.filter((item) => item.id !== id);
}

/** Moves an item one place up (`-1`) or down (`1`); the ends stay put. */
export function moveItem(
  queue: QueueItem[],
  id: string,
  delta: -1 | 1,
): QueueItem[] {
  const from = queue.findIndex((item) => item.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= queue.length) return queue;
  const next = [...queue];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** The verse text of a queued slide, without highlight marks, for the list. */
export function snippet(passage: PrayerPoint): string {
  const texts = passage.passages?.length
    ? passage.passages.map((p) => p.verse)
    : [passage.verse];
  return texts
    .map((text) => applyMarks(text, new Set()))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Reads the stored queue, dropping anything that is not a usable item. */
export function parseQueue(raw: string | null): QueueItem[] {
  try {
    const data: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item): item is QueueItem =>
        typeof item?.id === "string" &&
        typeof item?.passage?.text === "string" &&
        typeof item?.passage?.verse === "string",
    );
  } catch {
    return [];
  }
}
