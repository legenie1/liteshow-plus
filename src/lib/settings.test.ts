import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseSettings, SETTINGS_VERSION } from "./settings";
import { DEFAULT_FOOTER } from "./prayer";

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

  it("keeps a custom footer text, even an empty one", () => {
    expect(
      parseSettings(JSON.stringify({ footerText: "Welcome" })).footerText,
    ).toBe("Welcome");
    expect(parseSettings(JSON.stringify({ footerText: "" })).footerText).toBe(
      "",
    );
    expect(parseSettings(JSON.stringify({ footerText: 3 })).footerText).toBe(
      DEFAULT_FOOTER,
    );
  });

  it("gives the new lyrics background to settings saved before it existed", () => {
    const old = JSON.stringify({
      backgrounds: { lyrics: "green", bible: "black" },
    });
    const settings = parseSettings(old);
    expect(settings.backgrounds.lyrics).toBe("lyrics");
    expect(settings.backgrounds.bible).toBe("black");
  });

  it("keeps a lyrics background chosen since", () => {
    const saved = JSON.stringify({
      version: SETTINGS_VERSION,
      backgrounds: { lyrics: "green" },
    });
    expect(parseSettings(saved).backgrounds.lyrics).toBe("green");
  });

  it("reads the lyrics position and falls back to centred", () => {
    const saved = JSON.stringify({
      version: SETTINGS_VERSION,
      lyricsAlign: "top",
    });
    expect(parseSettings(saved).lyricsAlign).toBe("top");
    expect(
      parseSettings(JSON.stringify({ lyricsAlign: "left" })).lyricsAlign,
    ).toBe("center");
  });
});
