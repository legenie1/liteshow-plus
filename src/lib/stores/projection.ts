import { writable } from "svelte/store";
import { invoke } from "@tauri-apps/api/core";
import type { PrayerPoint } from "$lib/types";

export const currentImage = writable<string | null>(null);
// File name of the projected video: images and videos never show together.
export const currentVideo = writable<string | null>(null);
export const currentPrayer = writable<PrayerPoint | null>(null);
export const isBlackout = writable<boolean>(false);
export const videoLoop = writable<boolean>(false);
export const videoMuted = writable<boolean>(false);
// The slide the theme interrupted: navigation carries on from here, not from the
// theme's own position in the list.
export const resumeImage = writable<string | null>(null);

export async function selectImage(path: string | null): Promise<void> {
  // Updated before the backend replies: key repeat reads the current image to
  // compute the next one, and would otherwise step from a stale position.
  currentImage.set(path);
  currentVideo.set(null);
  currentPrayer.set(null);
  isBlackout.set(false);
  resumeImage.set(null);
  await invoke("set_current_image", { path });
}

export async function selectVideo(name: string | null): Promise<void> {
  currentVideo.set(name);
  currentImage.set(null);
  currentPrayer.set(null);
  isBlackout.set(false);
  resumeImage.set(null);
  await invoke("set_current_video", { name });
}

export async function selectPrayer(prayer: PrayerPoint | null): Promise<void> {
  currentPrayer.set(prayer);
  currentImage.set(null);
  currentVideo.set(null);
  isBlackout.set(false);
  resumeImage.set(null);
  await invoke("set_current_prayer", { prayer });
}

export async function toggleVideoPlayback(): Promise<void> {
  await invoke("toggle_video_playback");
}

export async function toggleVideoLoop(): Promise<void> {
  const active = await invoke<boolean>("toggle_video_loop");
  videoLoop.set(active);
}

export async function toggleVideoMute(): Promise<void> {
  const active = await invoke<boolean>("toggle_video_mute");
  videoMuted.set(active);
}

export async function toggleBlackout(): Promise<void> {
  const active = await invoke<boolean>("toggle_blackout");
  isBlackout.set(active);
}
