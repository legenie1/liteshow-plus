import { describe, expect, it } from "vitest";
import {
  applyMarks,
  markPassage,
  markRange,
  toggleWord,
  tokenize,
} from "./highlight";

describe("applyMarks", () => {
  it("leaves the text alone when nothing is marked", () => {
    expect(applyMarks("God is love", new Set())).toBe("God is love");
  });

  it("wraps a run of neighbouring words once", () => {
    expect(applyMarks("In the beginning God", new Set([1, 2]))).toBe(
      "In ⟦the beginning⟧ God",
    );
  });

  it("keeps separate runs apart", () => {
    expect(applyMarks("a b c d", new Set([0, 2]))).toBe("⟦a⟧ b ⟦c⟧ d");
  });

  it("handles the first and the last word", () => {
    expect(applyMarks("a b c", new Set([0, 2]))).toBe("⟦a⟧ b ⟦c⟧");
    expect(applyMarks("a b", new Set([0, 1]))).toBe("⟦a b⟧");
  });

  it("never lets a run cross a line break", () => {
    expect(applyMarks("a b\n\nc d", new Set([1, 2]))).toBe("a ⟦b⟧\n\n⟦c⟧ d");
  });

  it("keeps the stars of the French text", () => {
    expect(applyMarks("*Or le serpent", new Set([1]))).toBe("*Or ⟦le⟧ serpent");
  });
});

describe("tokenize", () => {
  it("numbers the words and flags the marked ones", () => {
    const tokens = tokenize("In ⟦the beginning⟧ God");
    const words = tokens.filter((t) => t.word !== null);
    expect(words.map((t) => [t.text, t.word, t.marked])).toEqual([
      ["In", 0, false],
      ["the", 1, true],
      ["beginning", 2, true],
      ["God", 3, false],
    ]);
  });

  it("numbers words the same before and after marking", () => {
    const text = "a b c d e";
    const marked = applyMarks(text, new Set([1, 3]));
    const plain = tokenize(text).map((t) => t.word);
    const after = tokenize(marked).map((t) => t.word);
    expect(after).toEqual(plain);
  });
});

describe("toggleWord and markRange", () => {
  it("toggles one word", () => {
    expect(toggleWord([], 2)).toEqual([2]);
    expect(toggleWord([1, 2], 2)).toEqual([1]);
  });

  it("marks everything between two words, in either order", () => {
    expect(markRange([], 1, 3)).toEqual([1, 2, 3]);
    expect(markRange([0], 3, 1)).toEqual([0, 1, 2, 3]);
  });
});

describe("markPassage", () => {
  const base = {
    number: "",
    text: "t",
    reference: "r",
    verse: "a b c",
  };

  it("marks the verse of a stacked passage", () => {
    expect(markPassage(base, [[1]])?.verse).toBe("a ⟦b⟧ c");
  });

  it("marks each block of a split passage on its own", () => {
    const split = {
      ...base,
      passages: [
        { label: "x", verse: "a b" },
        { label: "y", verse: "c d" },
      ],
    };
    const out = markPassage(split, [[0], [1]]);
    expect(out?.passages?.map((p) => p.verse)).toEqual(["⟦a⟧ b", "c ⟦d⟧"]);
  });

  it("passes null through", () => {
    expect(markPassage(null, [])).toBeNull();
  });
});
