import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";

const invokeMock = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

import {
  currentImage,
  currentPrayer,
  currentVideo,
  isBlackout,
  selectImage,
  selectPrayer,
  selectVideo,
  toggleBlackout,
  toggleVideoLoop,
  toggleVideoMute,
  toggleVideoPlayback,
  videoLoop,
  videoMuted,
} from "./projection";

beforeEach(() => {
  invokeMock.mockReset();
  currentImage.set(null);
  currentVideo.set(null);
  currentPrayer.set(null);
  isBlackout.set(false);
  videoLoop.set(false);
  videoMuted.set(false);
});

describe("selectImage", () => {
  it("invokes set_current_image and updates the stores", async () => {
    invokeMock.mockResolvedValue(undefined);
    isBlackout.set(true);

    await selectImage("/a.jpg");

    expect(invokeMock).toHaveBeenCalledWith("set_current_image", {
      path: "/a.jpg",
    });
    expect(get(currentImage)).toBe("/a.jpg");
    expect(get(isBlackout)).toBe(false);
  });
});

describe("toggleBlackout", () => {
  it("invokes toggle_blackout and stores the returned state", async () => {
    invokeMock.mockResolvedValue(true);

    await toggleBlackout();

    expect(invokeMock).toHaveBeenCalledWith("toggle_blackout");
    expect(get(isBlackout)).toBe(true);
  });
});

describe("selectVideo", () => {
  it("invokes set_current_video and replaces the projected image", async () => {
    invokeMock.mockResolvedValue(undefined);
    currentImage.set("/a.jpg");
    isBlackout.set(true);

    await selectVideo("intro.mp4");

    expect(invokeMock).toHaveBeenCalledWith("set_current_video", {
      name: "intro.mp4",
    });
    expect(get(currentVideo)).toBe("intro.mp4");
    expect(get(currentImage)).toBeNull();
    expect(get(isBlackout)).toBe(false);
  });

  it("is replaced by an image selection", async () => {
    invokeMock.mockResolvedValue(undefined);
    currentVideo.set("intro.mp4");

    await selectImage("/a.jpg");

    expect(get(currentVideo)).toBeNull();
  });
});

describe("toggleVideoPlayback", () => {
  it("invokes toggle_video_playback", async () => {
    invokeMock.mockResolvedValue(undefined);

    await toggleVideoPlayback();

    expect(invokeMock).toHaveBeenCalledWith("toggle_video_playback");
  });
});

describe("toggleVideoLoop", () => {
  it("invokes toggle_video_loop and stores the returned state", async () => {
    invokeMock.mockResolvedValue(true);

    await toggleVideoLoop();

    expect(invokeMock).toHaveBeenCalledWith("toggle_video_loop");
    expect(get(videoLoop)).toBe(true);
  });

  it("is kept when another video is selected", async () => {
    invokeMock.mockResolvedValue(undefined);
    videoLoop.set(true);

    await selectVideo("next.mp4");

    expect(get(videoLoop)).toBe(true);
  });
});

describe("toggleVideoMute", () => {
  it("invokes toggle_video_mute and stores the returned state", async () => {
    invokeMock.mockResolvedValue(true);

    await toggleVideoMute();

    expect(invokeMock).toHaveBeenCalledWith("toggle_video_mute");
    expect(get(videoMuted)).toBe(true);
  });

  it("is kept when another video is selected", async () => {
    invokeMock.mockResolvedValue(undefined);
    videoMuted.set(true);

    await selectVideo("next.mp4");

    expect(get(videoMuted)).toBe(true);
  });
});

describe("selectPrayer", () => {
  const prayer = {
    number: "3",
    text: "Father, help us",
    reference: "",
    verse: "",
  };

  it("invokes set_current_prayer and replaces image and video", async () => {
    invokeMock.mockResolvedValue(undefined);
    currentImage.set("/a.jpg");
    currentVideo.set("intro.mp4");
    isBlackout.set(true);

    await selectPrayer(prayer);

    expect(invokeMock).toHaveBeenCalledWith("set_current_prayer", { prayer });
    expect(get(currentPrayer)).toEqual(prayer);
    expect(get(currentImage)).toBeNull();
    expect(get(currentVideo)).toBeNull();
    expect(get(isBlackout)).toBe(false);
  });

  it("is replaced by an image or a video selection", async () => {
    invokeMock.mockResolvedValue(undefined);

    currentPrayer.set(prayer);
    await selectImage("/a.jpg");
    expect(get(currentPrayer)).toBeNull();

    currentPrayer.set(prayer);
    await selectVideo("intro.mp4");
    expect(get(currentPrayer)).toBeNull();
  });
});
