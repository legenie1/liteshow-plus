import { describe, expect, it } from "vitest";
import {
  addToHistory,
  canProject,
  nextPrayer,
  splitFooter,
  stepNumber,
} from "./prayer";

describe("stepNumber", () => {
  it("moves by the delta", () => {
    expect(stepNumber("3", 1)).toBe("4");
    expect(stepNumber(" 9 ", 1)).toBe("10");
    expect(stepNumber("3", -1)).toBe("2");
  });

  it("never goes below 1", () => {
    expect(stepNumber("1", -1)).toBe("1");
  });

  it("restarts at 1 when the number isn't a plain integer", () => {
    expect(stepNumber("", 1)).toBe("1");
    expect(stepNumber("3b", 1)).toBe("1");
  });
});

describe("nextPrayer", () => {
  it("bumps the number and empties the text fields", () => {
    expect(
      nextPrayer({
        number: "2",
        text: "a",
        reference: "b",
        verse: "c",
      }),
    ).toEqual({ number: "3", text: "", reference: "", verse: "" });
  });
});

describe("canProject", () => {
  it("needs a text or a verse", () => {
    const empty = {
      number: "1",
      text: " ",
      reference: "Isa 2:2",
      verse: "",
    };
    expect(canProject(empty)).toBe(false);
    expect(canProject({ ...empty, text: "Father" })).toBe(true);
    expect(canProject({ ...empty, verse: "And it shall" })).toBe(true);
  });
});

describe("addToHistory", () => {
  const point = (number: string, text: string) => ({
    number,
    text,
    reference: "",
    verse: "",
  });

  it("puts the newest first", () => {
    const history = addToHistory([point("1", "a")], point("2", "b"));
    expect(history.map((p) => p.number)).toEqual(["2", "1"]);
  });

  it("moves a re-projected point to the top instead of duplicating it", () => {
    const history = addToHistory(
      [point("2", "b"), point("1", "a")],
      point("1", "a"),
    );
    expect(history.map((p) => p.number)).toEqual(["1", "2"]);
  });

  it("replaces the entry with the same number, even when reworded", () => {
    const history = addToHistory([point("1", "a")], point("1", "a, edited"));
    expect(history).toHaveLength(1);
    expect(history[0].text).toBe("a, edited");
  });

  it("keeps only the most recent points", () => {
    let history: ReturnType<typeof point>[] = [];
    for (let n = 1; n <= 20; n++)
      history = addToHistory(history, point(`${n}`, "x"));
    expect(history).toHaveLength(12);
    expect(history[0].number).toBe("20");
  });
});

describe("splitFooter", () => {
  it("marks the text between stars as accent", () => {
    expect(splitFooter("My house *shall be called a* house of prayer")).toEqual(
      [
        { text: "My house ", accent: false },
        { text: "shall be called a", accent: true },
        { text: " house of prayer", accent: false },
      ],
    );
  });

  it("returns plain text without stars, and nothing when empty", () => {
    expect(splitFooter("Welcome")).toEqual([
      { text: "Welcome", accent: false },
    ]);
    expect(splitFooter("")).toEqual([]);
  });
});
