import { describe, expect, it } from "vitest";
import {
  formatTime,
  jumpTarget,
  needsResync,
  markEnd,
  markStart,
} from "./video";

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

describe("loop section", () => {
  it("starts at the playhead and runs to the end of the video", () => {
    expect(markStart(null, 12, 100)).toEqual({ start: 12, end: 100 });
  });

  it("keeps an end that is still ahead of the new start", () => {
    expect(markStart({ start: 5, end: 40 }, 12, 100)).toEqual({
      start: 12,
      end: 40,
    });
  });

  it("pushes the end to the video's end when the start passes it", () => {
    expect(markStart({ start: 5, end: 40 }, 60, 100)).toEqual({
      start: 60,
      end: 100,
    });
  });

  it("ignores a start too close to the end of the video", () => {
    expect(markStart(null, 99.9, 100)).toBeNull();
  });

  it("ends at the playhead, from the beginning if no start was set", () => {
    expect(markEnd(null, 30)).toEqual({ start: 0, end: 30 });
    expect(markEnd({ start: 12, end: 100 }, 30)).toEqual({
      start: 12,
      end: 30,
    });
  });

  it("ignores an end at or before the start", () => {
    const section = { start: 12, end: 100 };
    expect(markEnd(section, 12.2)).toBe(section);
    expect(markEnd(section, 3)).toBe(section);
  });
});
