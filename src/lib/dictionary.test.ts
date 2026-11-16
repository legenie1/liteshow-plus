import { describe, expect, it, vi } from "vitest";
import {
  buildDefinitionPassage,
  lookupWord,
  normalizeWord,
  parseLookup,
} from "./dictionary";

const GRACE = [
  {
    word: "grace",
    phonetics: [{}, { text: "/ɡɹeɪs/" }],
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          { definition: "Elegance of movement." },
          { definition: "Unmerited favour." },
        ],
      },
      {
        partOfSpeech: "verb",
        definitions: [{ definition: "To honour." }],
      },
    ],
  },
];

describe("normalizeWord", () => {
  it("trims, lowercases and collapses spaces", () => {
    expect(normalizeWord("  Born   AGAIN ")).toBe("born again");
    expect(normalizeWord("   ")).toBe("");
  });
});

describe("parseLookup", () => {
  it("flattens the meanings in the API's order", () => {
    const lookup = parseLookup(GRACE);
    expect(lookup?.word).toBe("grace");
    expect(lookup?.definitions).toEqual([
      { id: "0", partOfSpeech: "noun", text: "Elegance of movement." },
      { id: "1", partOfSpeech: "noun", text: "Unmerited favour." },
      { id: "2", partOfSpeech: "verb", text: "To honour." },
    ]);
  });

  it("finds the pronunciation in the phonetics when the entry has none", () => {
    expect(parseLookup(GRACE)?.phonetic).toBe("/ɡɹeɪs/");
    expect(parseLookup([{ ...GRACE[0], phonetic: "/x/" }])?.phonetic).toBe(
      "/x/",
    );
  });

  it("merges homograph entries and drops repeated definitions", () => {
    const lookup = parseLookup([GRACE[0], GRACE[0]]);
    expect(lookup?.definitions).toHaveLength(3);
  });

  it("returns null for anything without a definition", () => {
    expect(parseLookup(null)).toBeNull();
    expect(parseLookup([])).toBeNull();
    expect(parseLookup({ title: "No Definitions Found" })).toBeNull();
    expect(parseLookup([{ word: "x", meanings: [] }])).toBeNull();
    expect(
      parseLookup([
        { word: "x", meanings: [{ definitions: [{ definition: "  " }] }] },
      ]),
    ).toBeNull();
  });
});

describe("lookupWord", () => {
  const answer = (status: number, body: unknown) =>
    vi.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      json: () => Promise.resolve(body),
    }) as unknown as typeof fetch;

  it("asks for the encoded word and returns the definitions", async () => {
    const fetchFn = answer(200, GRACE);
    const result = await lookupWord("born again", undefined, fetchFn);
    expect(result.status).toBe("found");
    expect(vi.mocked(fetchFn).mock.calls[0][0]).toBe(
      "https://api.dictionaryapi.dev/api/v2/entries/en/born%20again",
    );
  });

  it("treats a 404 as an unknown word, not as an error", async () => {
    const result = await lookupWord("zzqxj", undefined, answer(404, {}));
    expect(result).toEqual({ status: "notfound" });
  });

  it("treats an empty answer as an unknown word", async () => {
    expect(await lookupWord("x", undefined, answer(200, []))).toEqual({
      status: "notfound",
    });
  });

  it("throws on a server error or a network failure", async () => {
    await expect(lookupWord("x", undefined, answer(500, {}))).rejects.toThrow();
    const offline = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(
      lookupWord("x", undefined, offline as unknown as typeof fetch),
    ).rejects.toThrow();
  });
});

describe("buildDefinitionPassage", () => {
  const lookup = parseLookup(GRACE)!;

  it("puts the word in the title and the chosen definitions in the body", () => {
    expect(
      buildDefinitionPassage(
        lookup,
        [lookup.definitions[1], lookup.definitions[2]],
        "f",
      ),
    ).toEqual({
      number: "",
      text: "Grace",
      reference: "/ɡɹeɪs/",
      verse: "(noun) Unmerited favour.\n\n(verb) To honour.",
      footer: "f",
    });
  });

  it("leaves out the part of speech when the dictionary gives none", () => {
    const bare = { id: "0", partOfSpeech: "", text: "Plain." };
    expect(buildDefinitionPassage(lookup, [bare], "")?.verse).toBe("Plain.");
  });

  it("has nothing to project without a chosen definition", () => {
    expect(buildDefinitionPassage(lookup, [], "")).toBeNull();
  });
});
