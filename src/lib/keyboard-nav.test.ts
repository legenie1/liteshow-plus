import { describe, expect, it } from "vitest";
import { stepImagePath, stepVideoName } from "./keyboard-nav";
import type { ImageFile, VideoFile } from "$lib/types";

const images: ImageFile[] = [
  { name: "a.jpg", path: "/a.jpg" },
  { name: "b.jpg", path: "/b.jpg" },
  { name: "c.jpg", path: "/c.jpg" },
];

describe("stepImagePath", () => {
  it("returns null when the list is empty", () => {
    expect(stepImagePath([], null, 1)).toBeNull();
  });

  it("starts at the first image when nothing is selected", () => {
    expect(stepImagePath(images, null, 1)).toBe("/a.jpg");
    expect(stepImagePath(images, null, -1)).toBe("/a.jpg");
  });

  it("moves forward and backward from the current selection", () => {
    expect(stepImagePath(images, "/b.jpg", 1)).toBe("/c.jpg");
    expect(stepImagePath(images, "/b.jpg", -1)).toBe("/a.jpg");
  });

  it("clamps at the last image instead of wrapping", () => {
    expect(stepImagePath(images, "/c.jpg", 1)).toBe("/c.jpg");
  });

  it("clamps at the first image instead of wrapping", () => {
    expect(stepImagePath(images, "/a.jpg", -1)).toBe("/a.jpg");
  });
});

describe("stepVideoName", () => {
  const videos: VideoFile[] = [
    { name: "a.mp4" },
    { name: "b.mp4" },
    { name: "c.mp4" },
  ];

  it("returns null when the list is empty", () => {
    expect(stepVideoName([], null, 1)).toBeNull();
  });

  it("starts at the first video when nothing is selected", () => {
    expect(stepVideoName(videos, null, 1)).toBe("a.mp4");
  });

  it("moves and clamps at the bounds", () => {
    expect(stepVideoName(videos, "b.mp4", 1)).toBe("c.mp4");
    expect(stepVideoName(videos, "c.mp4", 1)).toBe("c.mp4");
    expect(stepVideoName(videos, "a.mp4", -1)).toBe("a.mp4");
  });
});
