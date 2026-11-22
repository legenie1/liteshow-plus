import type { MonitorInfo } from "$lib/types";

export interface MapRect {
  id: string;
  /** The number the screen is known by ("2" for Windows' DISPLAY2). */
  number: string;
  /** Position and size as percentages of the whole map. */
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface MonitorMap {
  /** Width over height of the whole map, for the box that holds it. */
  aspect: number;
  rects: MapRect[];
}

/** "\\.\DISPLAY2" is screen 2; any other name falls back on its place in the list. */
export function displayNumber(name: string, index: number): string {
  return /DISPLAY(\d+)$/i.exec(name)?.[1] ?? String(index + 1);
}

/**
 * The screens as they sit on the desk, drawn to scale: each one's position and size
 * relative to the box that holds them all. Null when there is no screen to draw.
 */
export function monitorMap(monitors: MonitorInfo[]): MonitorMap | null {
  if (monitors.length === 0) return null;
  const minX = Math.min(...monitors.map((m) => m.x));
  const minY = Math.min(...monitors.map((m) => m.y));
  const maxX = Math.max(...monitors.map((m) => m.x + m.width));
  const maxY = Math.max(...monitors.map((m) => m.y + m.height));
  const width = maxX - minX;
  const height = maxY - minY;
  if (width <= 0 || height <= 0) return null;
  return {
    aspect: width / height,
    rects: monitors.map((m, index) => ({
      id: m.id,
      number: displayNumber(m.name, index),
      left: ((m.x - minX) / width) * 100,
      top: ((m.y - minY) / height) * 100,
      width: (m.width / width) * 100,
      height: (m.height / height) * 100,
    })),
  };
}
