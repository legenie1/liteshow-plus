import { describe, expect, it } from "vitest";
import { slideKey } from "./fade";
import type { PrayerPoint } from "./types";

const slide = (verse: string): PrayerPoint => ({
  number: "",
  text: "John 3:16",
  reference: "KJV",
  verse,
  kind: "bible",
});

describe("slideKey", () => {
  it("is empty with no slide", () => {
    expect(slideKey(null)).toBe("");
  });

  it("changes when another slide is shown", () => {
    expect(slideKey(slide("a"))).not.toBe(slideKey(slide("b")));
  });

  it("stays the same when only a highlight is added or removed", () => {
    expect(slideKey(slide("for ⟦God⟧ so loved"))).toBe(
      slideKey(slide("for God so loved")),
    );
  });

  it("is the same for the same slide", () => {
    expect(slideKey(slide("x"))).toBe(slideKey(slide("x")));
  });
});
