import type { ImageFile } from "$lib/types";

// Same list as the Rust scan (`SUPPORTED_EXTENSIONS` in commands/images.rs).
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function baseName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

function isImagePath(path: string): boolean {
  const dot = baseName(path).lastIndexOf(".");
  if (dot < 0) return false;
  return IMAGE_EXTENSIONS.includes(
    baseName(path)
      .slice(dot + 1)
      .toLowerCase(),
  );
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
