import { describe, expect, it } from "vitest";
import {
  activeFor,
  resolveChoice,
  sortTranslations,
  translationFromFile,
} from "./translations";
import type { Translation } from "./bible";

const t = (id: string, language: "en" | "fr"): Translation => ({
  id,
  label: id,
  language,
});

describe("translationFromFile", () => {
  it("reads the label and the language from the name", () => {
    expect(translationFromFile("../../assets/bible/MSG.en.json")).toEqual(
      t("MSG", "en"),
    );
    expect(translationFromFile("C:\\x\\Darby.fr.json")).toEqual(
      t("Darby", "fr"),
    );
  });

  it("ignores files that do not follow the pattern", () => {
    expect(translationFromFile("kjv.json")).toBeNull();
    expect(translationFromFile("NKJV.de.json")).toBeNull();
    expect(translationFromFile("MSG (3).ewb")).toBeNull();
  });
});

describe("sortTranslations", () => {
  it("puts English first and sorts by label", () => {
    const sorted = sortTranslations([
      t("Segond", "fr"),
      t("NKJV", "en"),
      t("Darby", "fr"),
      t("KJV", "en"),
    ]);
    expect(sorted.map((x) => x.id)).toEqual(["KJV", "NKJV", "Darby", "Segond"]);
  });
});

describe("resolveChoice", () => {
  const all = [
    t("AMP", "en"),
    t("KJV", "en"),
    t("Darby", "fr"),
    t("LSG", "fr"),
  ];

  it("keeps a stored choice that still exists", () => {
    expect(resolveChoice(all, { en: "AMP", fr: "LSG" })).toEqual({
      en: "AMP",
      fr: "LSG",
    });
  });

  it("starts from KJV and Darby when nothing is stored", () => {
    expect(resolveChoice(all, null)).toEqual({ en: "KJV", fr: "Darby" });
  });

  it("ignores a stored choice that is gone, or of the wrong language", () => {
    expect(resolveChoice(all, { en: "Gone", fr: "KJV" })).toEqual({
      en: "KJV",
      fr: "Darby",
    });
  });

  it("falls back on the first of the language, or on nothing", () => {
    const few = [t("AMP", "en"), t("LSG", "fr")];
    expect(resolveChoice(few, null)).toEqual({ en: "AMP", fr: "LSG" });
    expect(resolveChoice([t("AMP", "en")], null)).toEqual({
      en: "AMP",
      fr: null,
    });
  });
});

describe("activeFor", () => {
  const all = [t("KJV", "en"), t("Darby", "fr")];
  const choice = { en: "KJV", fr: "Darby" };

  it("gives the English one, the French one, or both with English first", () => {
    expect(activeFor("en", choice, all).map((x) => x.id)).toEqual(["KJV"]);
    expect(activeFor("fr", choice, all).map((x) => x.id)).toEqual(["Darby"]);
    expect(activeFor("both", choice, all).map((x) => x.id)).toEqual([
      "KJV",
      "Darby",
    ]);
  });

  it("leaves out a language that has no translation", () => {
    expect(activeFor("both", { en: "KJV", fr: null }, all)).toEqual([all[0]]);
    expect(activeFor("fr", { en: "KJV", fr: null }, all)).toEqual([]);
  });
});
