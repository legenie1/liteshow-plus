import { describe, expect, it } from "vitest";
import { displayNumber, monitorMap } from "./monitor-map";
import type { MonitorInfo } from "./types";

const screen = (
  id: string,
  x: number,
  y: number,
  width = 1920,
  height = 1080,
): MonitorInfo => ({
  id,
  name: id,
  x,
  y,
  width,
  height,
  isPrimary: false,
});

describe("displayNumber", () => {
  it("reads the number of a Windows display name", () => {
    expect(displayNumber("\\\\.\\DISPLAY2", 0)).toBe("2");
  });

  it("falls back on the place in the list", () => {
    expect(displayNumber("Built-in Retina Display", 1)).toBe("2");
    expect(displayNumber("monitor-0", 0)).toBe("1");
  });
});

describe("monitorMap", () => {
  it("is null with no screen", () => {
    expect(monitorMap([])).toBeNull();
  });

  it("fills the box with a single screen", () => {
    const map = monitorMap([screen("a", 0, 0)]);
    expect(map?.aspect).toBeCloseTo(16 / 9);
    expect(map?.rects[0]).toMatchObject({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    });
  });

  it("puts two screens side by side, each half of the width", () => {
    const map = monitorMap([screen("a", 0, 0), screen("b", 1920, 0)]);
    expect(map?.aspect).toBeCloseTo(32 / 9);
    expect(map?.rects.map((r) => [r.left, r.width])).toEqual([
      [0, 50],
      [50, 50],
    ]);
  });

  it("keeps a screen to the left of the main one at a negative position", () => {
    const map = monitorMap([screen("main", 0, 0), screen("left", -1920, 0)]);
    expect(map?.rects.find((r) => r.id === "left")?.left).toBe(0);
    expect(map?.rects.find((r) => r.id === "main")?.left).toBe(50);
  });

  it("draws a smaller or offset screen to scale", () => {
    const map = monitorMap([
      screen("big", 0, 0, 2000, 1000),
      screen("small", 2000, 500, 1000, 500),
    ]);
    const small = map?.rects.find((r) => r.id === "small");
    expect(small?.top).toBe(50);
    expect(small?.height).toBe(50);
    expect(small?.left).toBeCloseTo((2000 / 3000) * 100);
  });
});
