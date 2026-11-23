import { describe, expect, it } from "vitest";
import { formatTime, jumpTarget, needsResync } from "./video";

describe("formatTime", () => {
  it("formats minutes and seconds", () => {
    expect(formatTime(83.4)).toBe("1:23");
    expect(formatTime(5)).toBe("0:05");
  });
  it("adds hours when needed", () => {
    expect(formatTime(3725)).toBe("1:02:05");
  });
  it("reads unknown values as zero", () => {
    expect(formatTime(NaN)).toBe("0:00");
    expect(formatTime(-3)).toBe("0:00");
    expect(formatTime(Infinity)).toBe("0:00");
  });
});

describe("jumpTarget", () => {
  it("stays inside the video", () => {
    expect(jumpTarget(3, -5, 100)).toBe(0);
    expect(jumpTarget(98, 5, 100)).toBe(100);
    expect(jumpTarget(10, 5, 100)).toBe(15);
  });
  it("does not clamp the end while the duration is unknown", () => {
    expect(jumpTarget(10, 5, NaN)).toBe(15);
  });
});

describe("needsResync", () => {
  it("tolerates a small drift while playing", () => {
    expect(needsResync(10, 10.5, true)).toBe(false);
    expect(needsResync(10, 11.2, true)).toBe(true);
  });
  it("is stricter when paused", () => {
    expect(needsResync(10, 10.3, false)).toBe(true);
  });
});
