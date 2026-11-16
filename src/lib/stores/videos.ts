import { writable } from "svelte/store";
import type { VideoFile } from "$lib/types";

export type Tab = "slides" | "videos" | "prayer";

export const activeTab = writable<Tab>("slides");
export const videoFolderPath = writable<string | null>(null);
export const videos = writable<VideoFile[]>([]);
