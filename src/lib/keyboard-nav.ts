import type { ImageFile } from "$lib/types";

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
  if (images.length === 0) return null;

  const currentIndex = images.findIndex((image) => image.path === currentPath);
  const nextIndex =
    currentIndex === -1
      ? 0
      : Math.min(Math.max(currentIndex + delta, 0), images.length - 1);

  return images[nextIndex].path;
}
