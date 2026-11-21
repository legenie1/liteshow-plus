#!/usr/bin/env python3
"""Converts an EasyWorship Bible (.ewb) into a LiteShow translation file.

    python scripts/ewb-to-json.py "MSG (3).ewb" src/assets/bible

writes src/assets/bible/<Abbreviation>.<language>.json, e.g. MSG.en.json. The app
finds every `<Label>.<en|fr>.json` in that folder by itself.

An .ewb is a SQLite database: one zlib-compressed text per book (`streams`), and
for each verse a record (`books.verse_info`) giving where it starts in that text.
The licence of the translation is yours to check: keep the result inside the church.
"""
import json
import re
import sqlite3
import struct
import sys
import zlib
from pathlib import Path

BOOKS = 66
CONTROL = re.compile(r"[\x00-\x1f]")
SPACES = re.compile(r"\s+")


def read_book(stream: bytes, verse_info: bytes, name: str) -> list[list[str]]:
    """The verses of one book, grouped by chapter (a skipped verse stays empty)."""
    text = zlib.decompress(stream).decode("utf-8", errors="replace")
    count = len(verse_info) // 8
    # Each record is two 32-bit numbers. The first is (offset << 10 | length) with
    # flag bits above the 19 bits of offset. The second is the verse's key: the
    # verse number in bits 2-9 and the chapter number in bits 10-17.
    records = [struct.unpack_from("<II", verse_info, i * 8) for i in range(count)]
    starts = [(first >> 10) & 0x7FFFF for first, _ in records]
    if starts != sorted(starts):
        raise ValueError(f"{name}: verse offsets are not in order")

    keys = [((key >> 10) & 0xFF, (key >> 2) & 0xFF) for _, key in records]
    if any(chapter == 0 or verse == 0 for chapter, verse in keys):
        raise ValueError(f"{name}: a verse has no chapter or no number")
    # Records follow the text, which may put a verse out of order (22 after 23), so
    # each verse is placed by its key. A key used twice is either a stray one (2
    # Chronicles 36:1 stored as 35:1: the next record tells what it should be) or an
    # alternate text with nothing after it (CEV's short ending of Mark, stored as
    # 16:9 again): that one is left out.
    seen: set[tuple[int, int]] = set()
    for i, key in enumerate(keys):
        if key in seen:
            following = keys[i + 1] if i + 1 < count else None
            if following is None or following[1] < 2:
                print(f"  {name}: {key[0]}:{key[1]} appears twice, the second text is left out")
                keys[i] = None  # type: ignore[call-overload]
                continue
            keys[i] = (following[0], following[1] - 1)
            print(f"  {name}: {key[0]}:{key[1]} appears twice, read as {keys[i][0]}:{keys[i][1]}")
        seen.add(keys[i])

    chapters: list[list[str]] = []
    for i, key in enumerate(keys):
        if key is None:
            continue
        chapter, verse = key
        # The length field is too small for a long verse, so a verse runs up to the
        # start of the next one. The text starts one character after the offset (the
        # stream opens with 2 control characters the offsets don't count).
        begin = 0 if i == 0 else starts[i] + 1
        end = starts[i + 1] + 1 if i + 1 < count else len(text)
        body = SPACES.sub(" ", CONTROL.sub("", text[begin:end])).strip()

        while len(chapters) < chapter:
            chapters.append([])
        verses = chapters[chapter - 1]
        while len(verses) < verse:
            verses.append("")
        verses[verse - 1] = body
    return chapters


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    source, folder = Path(sys.argv[1]), Path(sys.argv[2])
    # Read-only: the original file is never touched.
    db = sqlite3.connect(f"file:{source.as_posix()}?mode=ro", uri=True)
    header = db.execute("select name, abbrev_name, lang_code from header").fetchone()
    if header is None:
        sys.exit("Not an EasyWorship Bible: no header.")
    name, abbreviation, language = header
    language = language.lower()[:2]
    if language not in ("en", "fr"):
        sys.exit(f"Language '{language}' is not supported yet (en and fr are).")

    rows = db.execute("select rowid, name, verse_info from books order by rowid").fetchall()
    streams = dict(db.execute("select rowid, stream from streams"))
    if len(rows) != BOOKS:
        sys.exit(f"Expected {BOOKS} books, found {len(rows)}.")

    bible = [read_book(streams[rid], info, book) for rid, book, info in rows]
    total = sum(1 for b in bible for c in b for v in c if v)
    skipped = sum(1 for b in bible for c in b for v in c if not v)

    label = re.sub(r"[^A-Za-z0-9]", "", abbreviation) or "Bible"
    target = folder / f"{label}.{language}.json"
    target.write_text(json.dumps(bible, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{name} ({label}, {language}): {total} verses, {skipped} skipped by the translation -> {target}")


if __name__ == "__main__":
    main()
