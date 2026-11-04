import { writable } from "svelte/store";
import { invoke } from "@tauri-apps/api/core";

export const currentImage = writable<string | null>(null);
export const isBlackout = writable<boolean>(false);
// The slide the theme interrupted: navigation carries on from here, not from the
// theme's own position in the list.
export const resumeImage = writable<string | null>(null);

export async function selectImage(path: string | null): Promise<void> {
  // Updated before the backend replies: key repeat reads the current image to
  // compute the next one, and would otherwise step from a stale position.
  currentImage.set(path);
  isBlackout.set(false);
  resumeImage.set(null);
  await invoke("set_current_image", { path });
}

export async function toggleBlackout(): Promise<void> {
  const active = await invoke<boolean>("toggle_blackout");
  isBlackout.set(active);
}
