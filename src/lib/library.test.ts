import { describe, expect, it } from "vitest";
import { dedupeLibrary, librarySongs, titleFromSlug } from "./library";

describe("titleFromSlug", () => {
  it("capitalises the words and keeps the small ones low in the middle", () => {
    expect(titleFromSlug("give-your-life-to-the-lord")).toBe(
      "Give Your Life to the Lord",
    );
    expect(titleFromSlug("rose-of-sharon")).toBe("Rose of Sharon");
  });

  it("capitalises a small word at the start or the end", () => {
    expect(titleFromSlug("the-way-in")).toBe("The Way In");
    expect(titleFromSlug("a-song")).toBe("A Song");
  });

  it("keeps numbers and copes with stray dashes", () => {
    expect(titleFromSlug("1234-jesus")).toBe("1234 Jesus");
    expect(titleFromSlug("--odd--slug--")).toBe("Odd Slug");
    expect(titleFromSlug("")).toBe("");
  });
});

describe("librarySongs", () => {
  const lines = (n: number) => Array.from({ length: n }, (_, i) => `l${i + 1}`);

  it("cuts the lines into slides of four", () => {
    const [song] = librarySongs({ "my-song": lines(9) });
    expect(song.lyrics).toBe("l1\nl2\nl3\nl4\n\nl5\nl6\nl7\nl8\n\nl9");
    expect(song.title).toBe("My Song");
    expect(song.id).toBe("library-my-song");
    expect(song.builtIn).toBe(true);
  });

  it("takes another slide size when asked", () => {
    const [song] = librarySongs({ s: lines(4) }, 2);
    expect(song.lyrics).toBe("l1\nl2\n\nl3\nl4");
  });

  it("cleans the lines: non-breaking spaces, padding, empty ones", () => {
    const [song] = librarySongs({
      s: ["  a b ", "", "   ", " ", "c"],
    });
    expect(song.lyrics).toBe("a b\nc");
  });

  it("skips what isn't a list of lines, and songs left with none", () => {
    expect(
      librarySongs({
        ok: ["x"],
        text: "not a list",
        empty: [],
        blanks: ["", " "],
        numbers: [1, 2],
      }).map((s) => s.id),
    ).toEqual(["library-ok"]);
  });

  it("returns nothing for data of the wrong shape", () => {
    expect(librarySongs(null)).toEqual([]);
    expect(librarySongs([["a"]])).toEqual([]);
    expect(librarySongs("x")).toEqual([]);
    expect(librarySongs(undefined)).toEqual([]);
  });
});

describe("librarySongs with titled songs", () => {
  it("keeps the title and the slides as written", () => {
    const [song] = librarySongs({
      "amazing-grace": {
        title: "Amazing  Grace",
        lyrics: "[Verse 1]\n  Amazing grace \nhow sweet\n\n\n\n[Chorus]\nla la",
      },
    });
    expect(song.title).toBe("Amazing Grace");
    expect(song.lyrics).toBe(
      "[Verse 1]\nAmazing grace\nhow sweet\n\n[Chorus]\nla la",
    );
    expect(song.id).toBe("library-song-amazing-grace");
    expect(song.structured).toBe(true);
    expect(song.builtIn).toBe(true);
  });

  it("takes both kinds of entry from one file", () => {
    const songs = librarySongs({
      plain: ["a", "b"],
      rich: { title: "Rich", lyrics: "x" },
    });
    expect(songs.map((s) => s.structured ?? false)).toEqual([false, true]);
  });

  it("skips a titled song with no title or no lyrics", () => {
    expect(
      librarySongs({
        a: { title: "", lyrics: "x" },
        b: { title: "B", lyrics: "  " },
        c: { title: "C" },
      }),
    ).toEqual([]);
  });
});

describe("dedupeLibrary", () => {
  const plain = (title: string) => ({
    id: `p-${title}`,
    title,
    lyrics: "l",
    builtIn: true,
  });
  const rich = (title: string, id = `r-${title}`) => ({
    id,
    title,
    lyrics: "l",
    builtIn: true,
    structured: true,
  });

  it("drops a loose song when a titled one has the same title", () => {
    const songs = dedupeLibrary([
      plain("Amazing Grace"),
      plain("Only Plain"),
      rich("amazing grace!"),
    ]);
    expect(songs.map((s) => s.id)).toEqual([
      "p-Only Plain",
      "r-amazing grace!",
    ]);
  });

  it("ignores accents and punctuation when comparing titles", () => {
    expect(
      dedupeLibrary([plain("Cest la vie"), rich("C'est la vie")]).map(
        (s) => s.id,
      ),
    ).toEqual(["r-C'est la vie"]);
  });

  it("keeps several titled songs that share a title", () => {
    const songs = dedupeLibrary([rich("Grace", "r1"), rich("Grace", "r2")]);
    expect(songs.map((s) => s.id)).toEqual(["r1", "r2"]);
  });
});
