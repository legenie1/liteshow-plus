import type { ImageFile } from "$lib/types";

// Same list as the Rust scan (`SUPPORTED_EXTENSIONS` in commands/images.rs).
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
// Same for videos (`SUPPORTED_EXTENSIONS` in commands/videos.rs).
const VIDEO_EXTENSIONS = ["mp4", "m4v", "mov", "webm"];

function baseName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

function hasExtension(path: string, extensions: string[]): boolean {
  const name = baseName(path);
  const dot = name.lastIndexOf(".");
  return dot >= 0 && extensions.includes(name.slice(dot + 1).toLowerCase());
}

function isImagePath(path: string): boolean {
  return hasExtension(path, IMAGE_EXTENSIONS);
}

/** The video paths among dropped paths, without duplicates. */
export function videoPathsFrom(paths: string[]): string[] {
  return [...new Set(paths)].filter((path) =>
    hasExtension(path, VIDEO_EXTENSIONS),
  );
}

/** `current` followed by the videos (by name) it does not already hold. */
export function mergeVideos<T extends { name: string }>(
  current: T[],
  added: T[],
): T[] {
  const known = new Set(current.map((video) => video.name));
  return [...current, ...added.filter((video) => !known.has(video.name))];
}

/** The images among dropped paths, in drop order, without duplicates. */
export function imagesFromPaths(paths: string[]): ImageFile[] {
  const seen = new Set<string>();
  const found: ImageFile[] = [];
  for (const path of paths) {
    if (seen.has(path) || !isImagePath(path)) continue;
    seen.add(path);
    found.push({ name: baseName(path), path });
  }
  return found;
}

/** `current` followed by the dropped images it does not already hold. */
export function mergeDropped(
  current: ImageFile[],
  dropped: ImageFile[],
): ImageFile[] {
  const known = new Set(current.map((image) => image.path));
  return [...current, ...dropped.filter((image) => !known.has(image.path))];
}
