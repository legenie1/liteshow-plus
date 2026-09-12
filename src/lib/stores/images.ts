import { writable } from "svelte/store";
import type { ImageFile } from "$lib/types";

export const folderPath = writable<string | null>(null);
export const images = writable<ImageFile[]>([]);
