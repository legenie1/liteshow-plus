import { describe, expect, it } from "vitest";
import { canProject, nextPrayer, splitFooter, stepNumber } from "./prayer";

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
        footer: "f",
      }),
    ).toEqual({ number: "3", text: "", reference: "", verse: "", footer: "f" });
  });
});

describe("canProject", () => {
  it("needs a text or a verse", () => {
    const empty = {
      number: "1",
      text: " ",
      reference: "Isa 2:2",
      verse: "",
      footer: "",
    };
    expect(canProject(empty)).toBe(false);
    expect(canProject({ ...empty, text: "Father" })).toBe(true);
    expect(canProject({ ...empty, verse: "And it shall" })).toBe(true);
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
