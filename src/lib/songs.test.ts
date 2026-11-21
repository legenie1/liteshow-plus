import { describe, expect, it } from "vitest";
import {
  isValidSong,
  lyricsToRows,
  matchesLyrics,
  matchesTitle,
  newSongId,
  parseLyrics,
  rowsToLyrics,
  sectionKind,
  sectionPassage,
  sortSongs,
  type Song,
} from "./songs";

const song = (title: string): Song => ({
  id: title,
  title,
  lyrics: "",
  builtIn: false,
});

describe("parseLyrics", () => {
  it("splits slides on blank lines; an unnamed slide has an empty label", () => {
    expect(parseLyrics("la la\nlo lo\n\nli li\n\nlu lu")).toEqual([
      { label: "", text: "la la\nlo lo", kind: "other" },
      { label: "", text: "li li", kind: "other" },
      { label: "", text: "lu lu", kind: "other" },
    ]);
  });

  it("takes a [Label] first line as the slide's name and reads its kind", () => {
    expect(
      parseLyrics("one\n\n[Chorus]\nsing\nalong\n\n[Verse 2]\ntwo"),
    ).toEqual([
      { label: "", text: "one", kind: "other" },
      { label: "Chorus", text: "sing\nalong", kind: "chorus" },
      { label: "Verse 2", text: "two", kind: "verse" },
    ]);
  });

  it("copes with Windows line breaks, spaces on blank lines and edge blanks", () => {
    expect(parseLyrics("\r\n a \r\n b\r\n \r\n\r\n c \r\n\r\n")).toEqual([
      { label: "", text: "a\nb", kind: "other" },
      { label: "", text: "c", kind: "other" },
    ]);
  });

  it("ignores a label with no lyrics under it, and empty input", () => {
    expect(parseLyrics("[Chorus]\n\nreal")).toEqual([
      { label: "", text: "real", kind: "other" },
    ]);
    expect(parseLyrics("")).toEqual([]);
    expect(parseLyrics(" \n \n ")).toEqual([]);
  });
});

describe("lyricsToRows and rowsToLyrics", () => {
  it("turns stored lyrics into rows, leaving unnamed slides without a label", () => {
    expect(lyricsToRows("la\nlo\n\n[Chorus]\nsing")).toEqual([
      { label: "", text: "la\nlo" },
      { label: "Chorus", text: "sing" },
    ]);
    expect(lyricsToRows("")).toEqual([]);
  });

  it("writes rows back so they read as the same slides", () => {
    const rows = [
      { label: "", text: "la\nlo" },
      { label: " Chorus ", text: "sing\n\n  along " },
      { label: "Verse 2", text: "x" },
    ];
    const lyrics = rowsToLyrics(rows);
    expect(lyrics).toBe("la\nlo\n\n[Chorus]\nsing\nalong\n\n[Verse 2]\nx");
    expect(lyricsToRows(lyrics)).toEqual([
      { label: "", text: "la\nlo" },
      { label: "Chorus", text: "sing\nalong" },
      { label: "Verse 2", text: "x" },
    ]);
  });

  it("drops empty rows and strips brackets from a label", () => {
    expect(
      rowsToLyrics([
        { label: "Chorus", text: "  " },
        { label: "[Bridge]", text: "go" },
      ]),
    ).toBe("[Bridge]\ngo");
    expect(rowsToLyrics([])).toBe("");
  });
});

describe("sectionKind", () => {
  it("reads English and French names, with numbers and any case", () => {
    expect(sectionKind("Chorus 2")).toBe("chorus");
    expect(sectionKind("REFRAIN")).toBe("chorus");
    expect(sectionKind("Bridge")).toBe("bridge");
    expect(sectionKind("Pont")).toBe("bridge");
    expect(sectionKind("Verse 3")).toBe("verse");
    expect(sectionKind("Couplet 1")).toBe("verse");
    expect(sectionKind("Outro")).toBe("other");
  });
});

describe("sectionPassage", () => {
  it("shows only the song's title when the slide has no label", () => {
    expect(
      sectionPassage(song("Test Song"), {
        label: "",
        text: "la",
        kind: "other",
      }).reference,
    ).toBe("Test Song");
  });

  it("puts the lyrics in the title and the song and section in the yellow line", () => {
    expect(
      sectionPassage(
        { ...song("Test Song"), lyrics: "x" },
        { label: "Chorus", text: "la\nlo", kind: "chorus" },
      ),
    ).toEqual({
      number: "",
      text: "la\nlo",
      reference: "Test Song · Chorus",
      verse: "",
      kind: "lyrics",
    });
  });
});

describe("matchesTitle", () => {
  it("needs every typed word, ignoring case and accents", () => {
    expect(matchesTitle(song("Grâce Infinie"), "grace inf")).toBe(true);
    expect(matchesTitle(song("Grâce Infinie"), "infinie grace")).toBe(true);
    expect(matchesTitle(song("Grâce Infinie"), "grace xyz")).toBe(false);
  });

  it("matches everything when the filter is empty", () => {
    expect(matchesTitle(song("Anything"), "  ")).toBe(true);
  });
});

describe("matchesLyrics", () => {
  const withLyrics = (lyrics: string): Song => ({ ...song("T"), lyrics });

  it("finds words anywhere in the lyrics, ignoring case and accents", () => {
    const s = withLyrics("Grâce infinie\n\nLe Seigneur règne");
    expect(matchesLyrics(s, "GRACE")).toBe(true);
    expect(matchesLyrics(s, "seigneur regne")).toBe(true);
    expect(matchesLyrics(s, "seigneur absent")).toBe(false);
  });

  it("matches everything when the filter is empty", () => {
    expect(matchesLyrics(withLyrics("x"), " ")).toBe(true);
  });
});

describe("sortSongs", () => {
  it("sorts by title without mutating and ignoring accents and case", () => {
    const input = [song("zeta"), song("Éclair"), song("alpha")];
    expect(sortSongs(input).map((s) => s.title)).toEqual([
      "alpha",
      "Éclair",
      "zeta",
    ]);
    expect(input[0].title).toBe("zeta");
  });
});

describe("isValidSong", () => {
  it("needs a title and at least one slide of lyrics", () => {
    expect(isValidSong("T", "la")).toBe(true);
    expect(isValidSong("  ", "la")).toBe(false);
    expect(isValidSong("T", "  ")).toBe(false);
    expect(isValidSong("T", "[Chorus]")).toBe(false);
  });
});

describe("newSongId", () => {
  it("makes distinct ids", () => {
    expect(newSongId()).not.toBe(newSongId());
  });
});
