import { describe, expect, it } from "vitest";
import {
  buildPassage,
  completeOnKey,
  completeOnSpace,
  findBook,
  formatReference,
  getVerses,
  highlightParts,
  normalize,
  parseLooseReference,
  parsePartial,
  parseReference,
  scriptureFor,
  searchVerses,
  type BibleText,
  type Translation,
} from "./bible";

const JOHN = 42;

describe("findBook", () => {
  it("knows names in both languages, with or without accents", () => {
    expect(findBook("John")).toBe(JOHN);
    expect(findBook("jean")).toBe(JOHN);
    expect(findBook("Genèse")).toBe(0);
    expect(findBook("genese")).toBe(0);
    expect(findBook("Ésaïe")).toBe(findBook("isaiah"));
  });

  it("accepts abbreviations and unambiguous prefixes", () => {
    expect(findBook("Jn")).toBe(JOHN);
    expect(findBook("Apoc")).toBe(65);
    expect(findBook("revel")).toBe(65);
  });

  it("tells numbered books apart", () => {
    expect(findBook("1 Jean")).toBe(61);
    expect(findBook("3 John")).toBe(63);
    expect(findBook("1cor")).toBe(45);
  });

  it("refuses an ambiguous or unknown name", () => {
    expect(findBook("jo")).toBeNull();
    expect(findBook("phi")).toBeNull();
    expect(findBook("xyz")).toBeNull();
    expect(findBook("")).toBeNull();
  });
});

describe("parseReference", () => {
  it("reads a single verse and a range", () => {
    expect(parseReference("John 3:16")).toEqual({
      book: JOHN,
      chapter: 3,
      from: 16,
      to: 16,
    });
    expect(parseReference("jean 3.16-18")).toEqual({
      book: JOHN,
      chapter: 3,
      from: 16,
      to: 18,
    });
  });

  it("reads numbered books, including roman numerals", () => {
    expect(parseReference("1 Cor 13:4")?.book).toBe(45);
    expect(parseReference("I John 4:8")?.book).toBe(61);
    expect(parseReference("2 Timothée 3:16")?.book).toBe(54);
  });

  it("refuses what it can't place", () => {
    expect(parseReference("John")).toBeNull();
    expect(parseReference("John 3")).toBeNull();
    expect(parseReference("Nothing 3:16")).toBeNull();
    expect(parseReference("John 3:18-16")).toBeNull();
    expect(parseReference("John 3:0")).toBeNull();
  });
});

describe("parsePartial", () => {
  const none = { book: null, chapter: null, from: null, to: null };

  it("follows the typing, one part at a time", () => {
    expect(parsePartial("")).toEqual(none);
    expect(parsePartial("Jean")).toEqual({ ...none, book: JOHN });
    expect(parsePartial("Jean 3")).toEqual({ ...none, book: JOHN, chapter: 3 });
    expect(parsePartial("Jean 3:")).toEqual({
      ...none,
      book: JOHN,
      chapter: 3,
    });
    expect(parsePartial("Jean 3:16")).toEqual({
      book: JOHN,
      chapter: 3,
      from: 16,
      to: null,
    });
    expect(parsePartial("Jean 3:16-18")).toEqual({
      book: JOHN,
      chapter: 3,
      from: 16,
      to: 18,
    });
  });

  it("keeps the number of a numbered book out of the chapter", () => {
    expect(parsePartial("1 Jean")).toEqual({ ...none, book: 61 });
    expect(parsePartial("1 Jean 4:8")).toEqual({
      book: 61,
      chapter: 4,
      from: 8,
      to: null,
    });
    expect(parsePartial("I John 4")).toEqual({ ...none, book: 61, chapter: 4 });
  });

  it("has no book while the name is unreadable or ambiguous", () => {
    expect(parsePartial("jo 3").book).toBeNull();
    expect(parsePartial("jo 3").chapter).toBe(3);
    expect(parsePartial("xyz").book).toBeNull();
  });
});

describe("completeOnSpace", () => {
  it("completes the book, then adds the colon after the chapter", () => {
    expect(completeOnSpace("john", "en")).toBe("John ");
    expect(completeOnSpace("jea", "fr")).toBe("Jean ");
    expect(completeOnSpace("John 3", "en")).toBe("John 3:");
    expect(completeOnSpace("1 jn 4", "en")).toBe("1 jn 4:");
  });

  it("completes numbered books and accented names in the interface language", () => {
    expect(completeOnSpace("1 cor", "en")).toBe("1 Corinthians ");
    expect(completeOnSpace("genese", "fr")).toBe("Genèse ");
  });

  it("lets the space through when it can't tell what is meant", () => {
    expect(completeOnSpace("", "en")).toBeNull();
    expect(completeOnSpace("1", "en")).toBeNull();
    expect(completeOnSpace("jo", "en")).toBeNull();
    expect(completeOnSpace("John 3:16", "en")).toBeNull();
    expect(completeOnSpace("John 3:16-", "en")).toBeNull();
  });

  it("swallows a space typed right after the colon", () => {
    expect(completeOnSpace("John 3:", "en")).toBe("John 3:");
  });
});

const KJV: Translation = { id: "KJV", label: "KJV", language: "en" };
const DARBY: Translation = { id: "Darby", label: "Darby", language: "fr" };
const MSG: Translation = { id: "MSG", label: "MSG", language: "en" };
const EN = [KJV];
const FR = [DARBY];
const BOTH = [KJV, DARBY];

describe("searchVerses", () => {
  const texts = { KJV: [] as BibleText, Darby: [] as BibleText };
  texts.KJV[JOHN] = [
    [],
    [],
    ["God so loved the world", "one loves another", "Love one another"],
  ];
  texts.Darby[JOHN] = [
    [],
    [],
    ["Dieu a tant aimé le monde", "Aimez-vous les uns"],
  ];

  it("needs every word, ignoring case", () => {
    const { hits, total } = searchVerses(texts, EN, "WORLD loved");
    expect(total).toBe(1);
    expect(hits[0].ref).toEqual({ book: JOHN, chapter: 3, from: 1, to: 1 });
    expect(hits[0].text).toBe("God so loved the world");
  });

  it("ignores accents, in both directions", () => {
    expect(searchVerses(texts, FR, "aime").total).toBe(2);
    expect(searchVerses(texts, FR, "AIMÉ").total).toBe(2);
    expect(searchVerses(texts, FR, "tant aimé").total).toBe(1);
  });

  it("puts the exact phrase before looser matches", () => {
    // Verse 3 comes later in the Bible but holds the exact phrase "one another".
    const { hits } = searchVerses(texts, EN, "one another");
    expect(hits.map((h) => h.ref.from)).toEqual([3, 2]);
  });

  it("searches the chosen translations and labels each hit", () => {
    const both = searchVerses(texts, BOTH, "monde");
    expect(both.hits.map((h) => h.translation.id)).toEqual(["Darby"]);
    const worldOrMonde = searchVerses(texts, BOTH, "world");
    expect(worldOrMonde.hits.map((h) => h.translation.id)).toEqual(["KJV"]);
    expect(searchVerses(texts, EN, "monde").total).toBe(0);
  });

  it("skips a chosen translation that is not loaded yet", () => {
    const other: Translation = { id: "NKJV", label: "NKJV", language: "en" };
    expect(searchVerses(texts, [other, KJV], "world").total).toBe(1);
  });

  it("waits for three letters", () => {
    expect(searchVerses(texts, EN, "lo")).toEqual({ hits: [], total: 0 });
    expect(searchVerses(texts, EN, "  ")).toEqual({ hits: [], total: 0 });
  });

  it("keeps the first hundred and reports the real total", () => {
    const many = { KJV: [] as BibleText };
    many.KJV[0] = [Array.from({ length: 150 }, () => "grace")];
    const { hits, total } = searchVerses(many, EN, "grace");
    expect(hits).toHaveLength(100);
    expect(total).toBe(150);
  });
});

describe("highlightParts", () => {
  it("marks the searched words, ignoring case and accents", () => {
    expect(highlightParts("Dieu a aimé le monde", "AIME monde")).toEqual([
      { text: "Dieu a ", match: false },
      { text: "aimé", match: true },
      { text: " le ", match: false },
      { text: "monde", match: true },
    ]);
  });

  it("returns the text whole when nothing matches", () => {
    expect(highlightParts("abc", "xyz")).toEqual([
      { text: "abc", match: false },
    ]);
  });
});

describe("completeOnKey", () => {
  it("does with Tab what it does with Space", () => {
    expect(completeOnKey("john", "Tab", "en")).toBe("John ");
    expect(completeOnKey("john", " ", "en")).toBe("John ");
    expect(completeOnKey("John 3", "Tab", "en")).toBe("John 3:");
  });

  it("lets Tab go on to the next field when there is nothing to complete", () => {
    expect(completeOnKey("John 3:16", "Tab", "en")).toBeNull();
    expect(completeOnKey("John ", "Tab", "en")).toBeNull();
    expect(completeOnKey("John 3:", "Tab", "en")).toBeNull();
    expect(completeOnKey("", "Tab", "en")).toBeNull();
    expect(completeOnKey("jo", "Tab", "en")).toBeNull();
  });

  it("still swallows a second Space, which Tab must not", () => {
    expect(completeOnKey("John 3:", " ", "en")).toBe("John 3:");
  });

  it("ignores every other key", () => {
    expect(completeOnKey("john", "a", "en")).toBeNull();
    expect(completeOnKey("john", "Enter", "en")).toBeNull();
  });
});

const text: BibleText = [];
text[JOHN] = [[], [], ["v1", "v2", "v3"]];

describe("getVerses", () => {
  it("returns the requested verses", () => {
    expect(getVerses(text, { book: JOHN, chapter: 3, from: 2, to: 3 })).toEqual(
      ["v2", "v3"],
    );
  });

  it("clamps a range running past the chapter", () => {
    expect(getVerses(text, { book: JOHN, chapter: 3, from: 3, to: 9 })).toEqual(
      ["v3"],
    );
  });

  it("returns null when the verse or chapter doesn't exist", () => {
    expect(
      getVerses(text, { book: JOHN, chapter: 3, from: 4, to: 4 }),
    ).toBeNull();
    expect(
      getVerses(text, { book: JOHN, chapter: 9, from: 1, to: 1 }),
    ).toBeNull();
    expect(getVerses(text, { book: 0, chapter: 1, from: 1, to: 1 })).toBeNull();
  });
});

describe("formatReference", () => {
  it("uses the book name of the language", () => {
    const ref = { book: JOHN, chapter: 3, from: 16, to: 18 };
    expect(formatReference(ref, "en")).toBe("John 3:16-18");
    expect(formatReference(ref, "fr")).toBe("Jean 3:16-18");
  });
});

describe("buildPassage", () => {
  const texts = { KJV: [] as BibleText, Darby: [] as BibleText };
  texts.KJV[JOHN] = [[], [], ["en1", "en2"]];
  texts.Darby[JOHN] = [[], [], ["fr1", "fr2"]];
  const ref = { book: JOHN, chapter: 3, from: 1, to: 1 };

  it("stacks the translations on one slide", () => {
    expect(buildPassage(ref, BOTH, texts)).toEqual({
      number: "",
      text: "John 3:1 · Jean 3:1",
      reference: "KJV · Darby",
      verse: "en1\n\nfr1",
      kind: "bible",
      passages: [],
    });
  });

  it("gives each translation its own block in the split template", () => {
    expect(buildPassage(ref, BOTH, texts, "split")?.passages).toEqual([
      { label: "John 3:1 (KJV)", verse: "en1" },
      { label: "Jean 3:1 (Darby)", verse: "fr1" },
    ]);
    expect(buildPassage(ref, EN, texts, "split")?.passages).toEqual([
      { label: "John 3:1 (KJV)", verse: "en1" },
    ]);
  });

  it("keeps one translation when asked", () => {
    expect(buildPassage(ref, FR, texts)?.verse).toBe("fr1");
    expect(buildPassage(ref, EN, texts)?.reference).toBe("KJV");
  });

  it("numbers the verses of a range", () => {
    const range = { ...ref, to: 2 };
    expect(buildPassage(range, EN, texts)?.verse).toBe("1 en1 2 en2");
  });

  it("shows the other translation alone when one lacks the verse", () => {
    texts.Darby[JOHN] = [[], [], ["fr1"]];
    const second = { ...ref, from: 2, to: 2 };
    expect(buildPassage(second, BOTH, texts)?.verse).toBe("en2");
    expect(buildPassage({ ...ref, from: 9, to: 9 }, BOTH, texts)).toBeNull();
  });

  it("doesn't repeat a heading that is the same in both languages", () => {
    const job = { book: 17, chapter: 1, from: 1, to: 1 };
    texts.KJV[17] = [["a"]];
    texts.Darby[17] = [["b"]];
    expect(buildPassage(job, BOTH, texts)?.text).toBe("Job 1:1");
  });

  it("takes any translation, in the order chosen", () => {
    const more = { ...texts, MSG: [] as BibleText };
    more.MSG[JOHN] = [[], [], ["msg1"]];
    const passage = buildPassage(ref, [MSG, KJV], more, "split");
    expect(passage?.text).toBe("John 3:1");
    expect(passage?.reference).toBe("MSG · KJV");
    expect(passage?.passages?.map((p) => p.label)).toEqual([
      "John 3:1 (MSG)",
      "John 3:1 (KJV)",
    ]);
  });

  it("leaves out a verse the translation skips, and has nothing for a skipped one", () => {
    const skipping = { MSG: [] as BibleText };
    skipping.MSG[JOHN] = [[], [], ["a", "", "c"]];
    const range = { ...ref, to: 3 };
    expect(buildPassage(range, [MSG], skipping)?.verse).toBe("1 a 3 c");
    expect(
      buildPassage({ ...ref, from: 2, to: 2 }, [MSG], skipping),
    ).toBeNull();
  });
});

describe("parseLooseReference", () => {
  it("reads a reference followed by the translations' names", () => {
    const john316 = { book: JOHN, chapter: 3, from: 16, to: 16 };
    expect(parseLooseReference("John 3:16")).toEqual(john316);
    expect(parseLooseReference("John 3:16 (KJV)")).toEqual(john316);
    expect(parseLooseReference("John 3:16 (KJV) · Jean 3:16 (Darby)")).toEqual(
      john316,
    );
  });

  it("keeps refusing what isn't a reference", () => {
    expect(parseLooseReference("")).toBeNull();
    expect(parseLooseReference("John (KJV)")).toBeNull();
    expect(parseLooseReference("Nothing 3:16 (KJV)")).toBeNull();
  });
});

describe("scriptureFor", () => {
  const texts = { KJV: [] as BibleText, Darby: [] as BibleText };
  texts.KJV[JOHN] = [[], [], ["en1", "en2"]];
  texts.Darby[JOHN] = [[], [], ["fr1"]];
  const ref = { book: JOHN, chapter: 3, from: 1, to: 1 };

  it("gives the reference line and the verse of each language", () => {
    expect(scriptureFor(ref, EN, texts)).toEqual({
      reference: "John 3:1 (KJV)",
      verse: "en1",
    });
    expect(scriptureFor(ref, FR, texts)).toEqual({
      reference: "Jean 3:1 (Darby)",
      verse: "fr1",
    });
  });

  it("stacks both languages, English first", () => {
    expect(scriptureFor(ref, BOTH, texts)).toEqual({
      reference: "John 3:1 (KJV) · Jean 3:1 (Darby)",
      verse: "en1\n\nfr1",
    });
  });

  it("numbers the verses of a range", () => {
    expect(scriptureFor({ ...ref, to: 2 }, EN, texts)?.verse).toBe(
      "1 en1 2 en2",
    );
  });

  it("keeps the language that has the verse, and is null when none does", () => {
    const second = { ...ref, from: 2, to: 2 };
    expect(scriptureFor(second, BOTH, texts)).toEqual({
      reference: "John 3:2 (KJV)",
      verse: "en2",
    });
    expect(scriptureFor({ ...ref, from: 9, to: 9 }, BOTH, texts)).toBeNull();
    expect(scriptureFor(second, FR, texts)).toBeNull();
  });
});

describe("normalize", () => {
  it("drops accents, case, spaces and dots", () => {
    expect(normalize("1 Thessaloniciens.")).toBe("1thessaloniciens");
    expect(normalize("Ésaïe")).toBe("esaie");
  });
});
