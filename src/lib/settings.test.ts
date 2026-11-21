import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseSettings } from "./settings";

describe("parseSettings", () => {
  it("gives the defaults when nothing is stored", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("gives the defaults for a corrupt value", () => {
    expect(parseSettings("{not json")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("42")).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid values and falls back on the others", () => {
    const stored = JSON.stringify({
      backgrounds: { bible: "black", prayer: "nope" },
      footers: { bible: true, lyrics: "yes" },
      bibleTextSize: "huge",
    });
    const settings = parseSettings(stored);
    expect(settings.backgrounds.bible).toBe("black");
    expect(settings.backgrounds.prayer).toBe("green");
    expect(settings.footers.bible).toBe(true);
    expect(settings.footers.lyrics).toBe(true);
    expect(settings.bibleTextSize).toBe("huge");
  });
});
