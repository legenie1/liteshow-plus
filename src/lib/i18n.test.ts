import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";

const storage = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
});

import { language, setLanguage, t } from "./i18n";

beforeEach(() => {
  storage.clear();
  language.set("en");
});

describe("t", () => {
  it("is English by default", () => {
    expect(get(t)("tabVideos")).toBe("Videos");
  });

  it("fills placeholders", () => {
    expect(get(t)("imagesMany", { n: 12 })).toBe("12 images");
  });

  it("leaves an unknown placeholder untouched", () => {
    expect(get(t)("imagesMany")).toBe("{n} images");
  });
});

describe("setLanguage", () => {
  it("switches the strings and remembers the choice", () => {
    setLanguage("fr");

    expect(get(t)("tabVideos")).toBe("Vidéos");
    expect(storage.get("liteshow.language")).toBe("fr");
  });
});
