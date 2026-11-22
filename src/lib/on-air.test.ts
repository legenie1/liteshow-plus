import { describe, expect, it } from "vitest";
import { onAir } from "./on-air";

describe("onAir", () => {
  it("is live only with a screen, some content and no blackout", () => {
    expect(onAir({ hasScreen: true, blackout: false, hasContent: true })).toBe(
      "live",
    );
  });

  it("says nothing is on screen when nothing is selected", () => {
    expect(onAir({ hasScreen: true, blackout: false, hasContent: false })).toBe(
      "empty",
    );
  });

  it("says blackout even when something is selected", () => {
    expect(onAir({ hasScreen: true, blackout: true, hasContent: true })).toBe(
      "blackout",
    );
  });

  it("needs a screen before anything else", () => {
    expect(onAir({ hasScreen: false, blackout: false, hasContent: true })).toBe(
      "noscreen",
    );
  });
});
