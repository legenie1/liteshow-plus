import { describe, expect, it } from "vitest";
import {
  imagesFromPaths,
  mergeDropped,
  mergeVideos,
  videoPathsFrom,
} from "./dropped-images";

describe("imagesFromPaths", () => {
  it("keeps supported images and ignores the rest", () => {
    const found = imagesFromPaths([
      "C:\\Users\\me\\Downloads\\flyer.PNG",
      "C:\\Users\\me\\Downloads\\notes.txt",
      "/home/me/photo.jpeg",
      "C:\\Users\\me\\Downloads\\folder",
    ]);
    expect(found).toEqual([
      { name: "flyer.PNG", path: "C:\\Users\\me\\Downloads\\flyer.PNG" },
      { name: "photo.jpeg", path: "/home/me/photo.jpeg" },
    ]);
  });

  it("drops duplicates", () => {
    expect(imagesFromPaths(["/a/x.png", "/a/x.png"])).toHaveLength(1);
  });
});

describe("mergeDropped", () => {
  it("appends only the images not already in the list", () => {
    const current = [{ name: "a.png", path: "/f/a.png" }];
    const merged = mergeDropped(current, [
      { name: "a.png", path: "/f/a.png" },
      { name: "b.png", path: "/g/b.png" },
    ]);
    expect(merged.map((i) => i.path)).toEqual(["/f/a.png", "/g/b.png"]);
  });
});

describe("videoPathsFrom", () => {
  it("keeps supported videos, once each", () => {
    expect(
      videoPathsFrom([
        "/a/x.MP4",
        "/a/x.MP4",
        "/a/y.webm",
        "/a/z.avi",
        "/a/i.png",
      ]),
    ).toEqual(["/a/x.MP4", "/a/y.webm"]);
  });
});

describe("mergeVideos", () => {
  it("appends only names not already listed", () => {
    expect(
      mergeVideos([{ name: "a.mp4" }], [{ name: "a.mp4" }, { name: "b.mp4" }]),
    ).toEqual([{ name: "a.mp4" }, { name: "b.mp4" }]);
  });
});
