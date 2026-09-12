import { writable } from "svelte/store";
import { invoke } from "@tauri-apps/api/core";

export const currentImage = writable<string | null>(null);
export const isBlackout = writable<boolean>(false);

export async function selectImage(path: string | null): Promise<void> {
  await invoke("set_current_image", { path });
  currentImage.set(path);
  isBlackout.set(false);
}

export async function toggleBlackout(): Promise<void> {
  const active = await invoke<boolean>("toggle_blackout");
  isBlackout.set(active);
}
