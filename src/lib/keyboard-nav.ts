import type { ImageFile, VideoFile } from "$lib/types";

/**
 * Resolves the path to select after a `delta` step (±1) from the currently
 * projected image. Clamps at the list bounds instead of wrapping, and starts
 * from the first image when nothing is selected yet.
 */
export function stepImagePath(
  images: ImageFile[],
  currentPath: string | null,
  delta: number,
): string | null {
  return step(images, (image) => image.path, currentPath, delta);
}

/** Same as `stepImagePath`, for the "Vidéos" tab (videos are identified by name). */
export function stepVideoName(
  videos: VideoFile[],
  currentName: string | null,
  delta: number,
): string | null {
  return step(videos, (video) => video.name, currentName, delta);
}

function step<T>(
  items: T[],
  key: (item: T) => string,
  current: string | null,
  delta: number,
): string | null {
  if (items.length === 0) return null;

  const currentIndex = items.findIndex((item) => key(item) === current);
  const nextIndex =
    currentIndex === -1
      ? 0
      : Math.min(Math.max(currentIndex + delta, 0), items.length - 1);

  return key(items[nextIndex]);
}
