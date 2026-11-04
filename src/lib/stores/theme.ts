import { get, writable } from "svelte/store";
import { folderPath } from "$lib/stores/images";
import {
  currentImage,
  isBlackout,
  resumeImage,
  selectImage,
} from "$lib/stores/projection";
import type { ImageFile } from "$lib/types";

const STORAGE_PREFIX = "liteshow.theme:";

export const themeImage = writable<string | null>(null);

export function loadTheme(folder: string, found: ImageFile[]): void {
  let remembered: string | null = null;
  try {
    remembered = localStorage.getItem(STORAGE_PREFIX + folder);
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
  themeImage.set(found.some((i) => i.path === remembered) ? remembered : null);
  resumeImage.set(null);
}

/** Marks `path` as the folder's theme slide, or unmarks it if it already is. */
export function toggleTheme(path: string): void {
  const next = get(themeImage) === path ? null : path;
  themeImage.set(next);

  const folder = get(folderPath);
  if (!folder) return;
  try {
    if (next) localStorage.setItem(STORAGE_PREFIX + folder, next);
    else localStorage.removeItem(STORAGE_PREFIX + folder);
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
}

/**
 * Projects the theme slide and remembers the slide it interrupted. Called again
 * while the theme is on screen, goes back to that slide.
 */
export async function showTheme(): Promise<void> {
  const theme = get(themeImage);
  if (!theme) return;

  const current = get(currentImage);
  const resume = get(resumeImage);

  if (current === theme && !get(isBlackout)) {
    if (resume) await selectImage(resume);
    return;
  }

  const shown = selectImage(theme);
  resumeImage.set(current === theme ? resume : current);
  await shown;
}
