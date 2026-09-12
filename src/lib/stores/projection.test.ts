import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";

const invokeMock = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

import {
  currentImage,
  isBlackout,
  selectImage,
  toggleBlackout,
} from "./projection";

beforeEach(() => {
  invokeMock.mockReset();
  currentImage.set(null);
  isBlackout.set(false);
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
