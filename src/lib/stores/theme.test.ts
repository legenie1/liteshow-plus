import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";

const invokeMock = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

const storage = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
});

import { folderPath } from "./images";
import {
  currentImage,
  isBlackout,
  resumeImage,
  selectImage,
} from "./projection";
import { loadTheme, showTheme, themeImage, toggleTheme } from "./theme";

const THEME = "/theme.png";
const SLIDE = "/slide.png";

beforeEach(() => {
  invokeMock.mockReset();
  invokeMock.mockResolvedValue(undefined);
  storage.clear();
  folderPath.set("/deck");
  currentImage.set(null);
  isBlackout.set(false);
  resumeImage.set(null);
  themeImage.set(null);
});

describe("toggleTheme", () => {
  it("marks and unmarks a slide", () => {
    toggleTheme(THEME);
    expect(get(themeImage)).toBe(THEME);

    toggleTheme(THEME);
    expect(get(themeImage)).toBeNull();
  });

  it("keeps a single theme slide", () => {
    toggleTheme(THEME);
    toggleTheme(SLIDE);
    expect(get(themeImage)).toBe(SLIDE);
  });
});

describe("loadTheme", () => {
  const found = [
    { name: "theme.png", path: THEME },
    { name: "slide.png", path: SLIDE },
  ];

  it("restores the theme remembered for the folder", () => {
    toggleTheme(THEME);
    themeImage.set(null);

    loadTheme("/deck", found);

    expect(get(themeImage)).toBe(THEME);
  });

  it("does not leak the theme into another folder", () => {
    toggleTheme(THEME);

    loadTheme("/other", found);

    expect(get(themeImage)).toBeNull();
  });

  it("drops a remembered slide that no longer exists", () => {
    toggleTheme(THEME);

    loadTheme("/deck", [{ name: "slide.png", path: SLIDE }]);

    expect(get(themeImage)).toBeNull();
  });
});

describe("showTheme", () => {
  it("does nothing without a theme", async () => {
    await showTheme();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("projects the theme and remembers the interrupted slide", async () => {
    themeImage.set(THEME);
    await selectImage(SLIDE);

    await showTheme();

    expect(get(currentImage)).toBe(THEME);
    expect(get(resumeImage)).toBe(SLIDE);
    expect(invokeMock).toHaveBeenLastCalledWith("set_current_image", {
      path: THEME,
    });
  });

  it("goes back to the interrupted slide on the second call", async () => {
    themeImage.set(THEME);
    await selectImage(SLIDE);

    await showTheme();
    await showTheme();

    expect(get(currentImage)).toBe(SLIDE);
    expect(get(resumeImage)).toBeNull();
  });

  it("stays on the theme when there is nothing to go back to", async () => {
    themeImage.set(THEME);

    await showTheme();
    await showTheme();

    expect(get(currentImage)).toBe(THEME);
  });

  it("cancels blackout instead of leaving the theme", async () => {
    themeImage.set(THEME);
    await selectImage(SLIDE);
    await showTheme();
    isBlackout.set(true);

    await showTheme();

    expect(get(currentImage)).toBe(THEME);
    expect(get(isBlackout)).toBe(false);
    expect(get(resumeImage)).toBe(SLIDE);
  });

  it("forgets the interrupted slide when another slide is selected", async () => {
    themeImage.set(THEME);
    await selectImage(SLIDE);
    await showTheme();

    await selectImage("/other.png");

    expect(get(resumeImage)).toBeNull();
  });
});
