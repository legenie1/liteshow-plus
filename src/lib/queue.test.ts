import { describe, expect, it } from "vitest";
import {
  addItem,
  moveItem,
  parseQueue,
  removeItem,
  snippet,
  type QueueItem,
} from "./queue";
import type { PrayerPoint } from "./types";

const point = (text: string, verse = "v"): PrayerPoint => ({
  number: "",
  text,
  reference: "",
  verse,
});

const items = (...ids: string[]): QueueItem[] =>
  ids.map((id) => ({ id, passage: point(id) }));

describe("addItem", () => {
  it("appends at the end", () => {
    const queue = addItem(items("a"), point("b"), "2");
    expect(queue.map((i) => i.id)).toEqual(["a", "2"]);
  });

  it("ignores a slide that is already queued", () => {
    const queue = items("a");
    expect(addItem(queue, point("a"), "2")).toBe(queue);
  });

  it("queues the same reference again once its highlights differ", () => {
    const queue = addItem([], point("a", "x y"), "1");
    expect(addItem(queue, point("a", "⟦x⟧ y"), "2")).toHaveLength(2);
  });
});

describe("removeItem and moveItem", () => {
  it("removes one item", () => {
    expect(removeItem(items("a", "b"), "a").map((i) => i.id)).toEqual(["b"]);
  });

  it("moves an item up and down", () => {
    expect(moveItem(items("a", "b", "c"), "b", -1).map((i) => i.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(moveItem(items("a", "b", "c"), "b", 1).map((i) => i.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("leaves the ends where they are", () => {
    const queue = items("a", "b");
    expect(moveItem(queue, "a", -1)).toBe(queue);
    expect(moveItem(queue, "b", 1)).toBe(queue);
    expect(moveItem(queue, "zzz", 1)).toBe(queue);
  });
});

describe("snippet", () => {
  it("drops the highlight marks and collapses the spaces", () => {
    expect(snippet(point("t", "In ⟦the beginning⟧\n\nGod"))).toBe(
      "In the beginning God",
    );
  });

  it("joins the blocks of a split slide", () => {
    const split = {
      ...point("t"),
      passages: [
        { label: "x", verse: "one" },
        { label: "y", verse: "deux" },
      ],
    };
    expect(snippet(split)).toBe("one deux");
  });
});

describe("parseQueue", () => {
  it("gives an empty queue for nothing or garbage", () => {
    expect(parseQueue(null)).toEqual([]);
    expect(parseQueue("{oops")).toEqual([]);
    expect(parseQueue('{"a":1}')).toEqual([]);
  });

  it("keeps the usable items only", () => {
    const raw = JSON.stringify([
      { id: "1", passage: point("ok") },
      { id: 2, passage: point("bad id") },
      { id: "3" },
      null,
    ]);
    expect(parseQueue(raw).map((i) => i.id)).toEqual(["1"]);
  });
});
