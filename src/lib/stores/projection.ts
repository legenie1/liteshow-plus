import { get, writable } from "svelte/store";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import type { PrayerPoint } from "$lib/types";
import {
  markEnd,
  markStart,
  type VideoProgress,
  type VideoSection,
} from "$lib/video";

export const currentImage = writable<string | null>(null);
// File name of the projected video: images and videos never show together.
export const currentVideo = writable<string | null>(null);
export const currentPrayer = writable<PrayerPoint | null>(null);
export const isBlackout = writable<boolean>(false);
export const videoLoop = writable<boolean>(false);
export const videoMuted = writable<boolean>(false);
/** Position of the projected video, reported by the projection window. */
export const videoProgress = writable<VideoProgress | null>(null);
/** The part of the projected video that loops, if any. */
export const videoSection = writable<VideoSection | null>(null);
/** What was on the screen, remembered while the output is switched off. */
export interface Output {
  image: string | null;
  video: string | null;
  prayer: PrayerPoint | null;
}
export const heldOutput = writable<Output | null>(null);

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
  heldOutput.set(null);
  await invoke("set_current_image", { path });
}

const isEmpty = (o: Output) => !o.image && !o.video && !o.prayer;

/**
 * Takes everything off the screen: no image, video or slide, and the blackout
 * lifted, so the output is simply empty. What was there is kept, so
 * `restoreOutput` can put it back. The image command already empties everything
 * when it is given nothing.
 */
export async function clearOutput(): Promise<void> {
  const output: Output = {
    image: get(currentImage),
    video: get(currentVideo),
    prayer: get(currentPrayer),
  };
  if (isEmpty(output)) return;
  await selectImage(null);
  heldOutput.set(output); // after selectImage, which drops what was held
}

/** Shows again what `clearOutput` took off the screen. */
export async function restoreOutput(): Promise<void> {
  const output = get(heldOutput);
  if (!output) return;
  if (output.prayer) await selectPrayer(output.prayer);
  else if (output.video) await selectVideo(output.video);
  else await selectImage(output.image);
}

/** The on-air switch: off when something is showing, on again when it isn't. */
export function toggleOutput(): Promise<void> {
  const showing = !isEmpty({
    image: get(currentImage),
    video: get(currentVideo),
    prayer: get(currentPrayer),
  });
  return showing ? clearOutput() : restoreOutput();
}

export async function selectVideo(name: string | null): Promise<void> {
  currentVideo.set(name);
  // The projection window drops its loop on its own when the serial changes.
  videoSection.set(null);
  currentImage.set(null);
  currentPrayer.set(null);
  isBlackout.set(false);
  resumeImage.set(null);
  heldOutput.set(null);
  await invoke("set_current_video", { name });
}

export async function selectPrayer(prayer: PrayerPoint | null): Promise<void> {
  currentPrayer.set(prayer);
  currentImage.set(null);
  currentVideo.set(null);
  isBlackout.set(false);
  resumeImage.set(null);
  heldOutput.set(null);
  await invoke("set_current_prayer", { prayer });
}

export async function toggleVideoPlayback(): Promise<void> {
  await invoke("toggle_video_playback");
}

export async function seekVideo(position: number): Promise<void> {
  await invoke("seek_video", { position });
}

async function setSection(section: VideoSection | null): Promise<void> {
  videoSection.set(section);
  // The projection window enforces it: it is the one that knows where the video is.
  await emit("video-section", section);
}

function projectedProgress(): VideoProgress | null {
  const progress = get(videoProgress);
  return progress && progress.name === get(currentVideo) ? progress : null;
}

/** The loop starts where the projected video is now. */
export async function markSectionStart(): Promise<void> {
  const progress = projectedProgress();
  if (!progress) return;
  const next = markStart(get(videoSection), progress.time, progress.duration);
  if (next !== get(videoSection)) await setSection(next);
}

/** The loop ends where the projected video is now. */
export async function markSectionEnd(): Promise<void> {
  const progress = projectedProgress();
  if (!progress) return;
  const next = markEnd(get(videoSection), progress.time);
  if (next !== get(videoSection)) await setSection(next);
}

export async function clearSection(): Promise<void> {
  if (get(videoSection)) await setSection(null);
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
