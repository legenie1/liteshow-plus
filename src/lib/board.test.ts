import { describe, expect, it } from "vitest";
import { boardKindForTab, parseBoardKind } from "./board";

describe("boardKindForTab", () => {
  it("gives the section for the tabs that have a background", () => {
    expect(boardKindForTab("bible")).toBe("bible");
    expect(boardKindForTab("lyrics")).toBe("lyrics");
    expect(boardKindForTab("prayer")).toBe("prayer");
    expect(boardKindForTab("dictionary")).toBe("dictionary");
  });

  it("gives none for slides and videos", () => {
    expect(boardKindForTab("slides")).toBeNull();
    expect(boardKindForTab("videos")).toBeNull();
  });
});

describe("parseBoardKind", () => {
  it("keeps a known section and drops anything else", () => {
    expect(parseBoardKind("lyrics")).toBe("lyrics");
    expect(parseBoardKind("")).toBeNull();
    expect(parseBoardKind(null)).toBeNull();
    expect(parseBoardKind("nope")).toBeNull();
  });
});
