import { writable } from "svelte/store";
import type { VideoFile } from "$lib/types";

export type Tab =
  "slides" | "videos" | "prayer" | "bible" | "dictionary" | "lyrics";

export const activeTab = writable<Tab>("slides");
export const videoFolderPath = writable<string | null>(null);
export const videos = writable<VideoFile[]>([]);
/** The video looked at in the preview: nothing reaches the projector until it is projected. */
export const previewVideo = writable<string | null>(null);
