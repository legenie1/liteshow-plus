#!/usr/bin/env python3
"""Converts the songs of an EasyWorship 7 database into a LiteShow library file.

    python scripts/ews-to-json.py "<...>/EasyWorship Database/v6.1" src/assets/songs

writes src/assets/songs/easyworship.json, which the Lyrics tab loads by itself the
next time it opens (restart the app). Run it again whenever the songs change: the
file is rewritten from scratch, so the library follows EasyWorship, one way.

The folder can be the one holding `Databases`, `Databases` itself, or `Data`.
EasyWorship keeps the songs in `Songs.db` and `SongWords.db`, and a copy of each
(`Songs-<computer>-<n>.db`) every time the database syncs. While EasyWorship is
open it locks the two main files, so the newest pair that can be read is used and
the script says which. Close EasyWorship first to read the main pair.

The files are only read, from a copy. The licence of the songs is yours to check:
keep the result inside the church.
"""
import json
import os
import re
import shutil
import sqlite3
import sys
import tempfile
import unicodedata
from datetime import datetime
from pathlib import Path

SKIP = {
    "fonttbl", "colortbl", "stylesheet", "info", "generator",
    "pn", "pnseclvl1", "pnseclvl2", "pnseclvl3", "pnseclvl4", "pnseclvl5",
    "pnseclvl6", "pnseclvl7", "pnseclvl8", "pnseclvl9",
}
SYMBOLS = {
    "emdash": "\u2014", "endash": "\u2013", "bullet": "\u2022",
    "lquote": "\u2018", "rquote": "\u2019", "ldblquote": "\u201c", "rdblquote": "\u201d",
}
NEWLINE = chr(10)
TOKEN = re.compile(r"\\([a-zA-Z]+)(-?\d+)? ?|\\'([0-9a-fA-F]{2})|\\([^a-zA-Z])|([{}])|([^\\{}]+)")
LABEL = re.compile(
    r"^(verse|chorus|pre-?chorus|bridge|tag|intro|outro|ending|interlude|refrain|vamp|"
    r"instrumental|coda|couplet|pont)\s*\d*$",
    re.IGNORECASE,
)


def rtf_to_text(rtf: str) -> str:
    """The text of an RTF document: paragraphs become lines, formatting is dropped."""
    out: list[str] = []
    groups: list[bool] = []   # was the enclosing group being skipped?
    skip = False
    unicode_skip = 1          # characters that follow a \\uN as a fallback
    to_drop = 0
    for match in TOKEN.finditer(rtf):
        word, number, hexa, symbol, brace, text = match.groups()
        if brace == "{":
            groups.append(skip)
        elif brace == "}":
            skip = groups.pop() if groups else False
        elif symbol is not None:
            if symbol == "*":
                skip = True       # an optional destination, not text
            elif not skip and symbol in "\\{}":
                out.append(symbol)
            elif not skip and symbol == "~":
                out.append(" ")
        elif word is not None:
            if word in SKIP:
                skip = True
            elif skip:
                continue
            elif word in ("par", "line"):
                out.append("\n")
            elif word == "tab":
                out.append(" ")
            elif word in SYMBOLS:
                out.append(SYMBOLS[word])
            elif word == "u" and number is not None:
                out.append(chr(int(number) % 65536))
                to_drop = unicode_skip
            elif word == "uc" and number is not None:
                unicode_skip = int(number)
        elif hexa is not None:
            if not skip:
                out.append(bytes.fromhex(hexa).decode("cp1252", errors="replace"))
        elif text is not None and not skip:
            if to_drop:
                cut = min(to_drop, len(text))
                text, to_drop = text[cut:], to_drop - cut
            out.append(text)
    # A character outside the basic plane comes as two \u halves: join them.
    return "".join(out).encode("utf-16", "surrogatepass").decode("utf-16", errors="replace")


def to_lyrics(rtf: str) -> str:
    """The lyrics in LiteShow's stored form: slides apart on blank lines, each named
    by a first line like "[Verse 1]" when EasyWorship named it.

    In EasyWorship's text a single blank line only separates two lines of a slide;
    a slide ends at two blank lines in a row. A line like "Chorus 1" names the
    slide it opens."""
    lines = [re.sub(r"\s+", " ", line).strip() for line in rtf_to_text(rtf).split(NEWLINE)]
    groups: list[list[str]] = [[]]
    blanks = 0
    for line in lines:
        if not line:
            blanks += 1
            if blanks == 2 and groups[-1]:
                groups.append([])
            continue
        blanks = 0
        groups[-1].append(line)

    sections: list[tuple[str | None, list[str]]] = []
    for group in groups:
        sections.append((None, []))
        for line in group:
            if LABEL.match(line):
                sections.append((line, []))   # a name starts a slide of its own
            else:
                sections[-1][1].append(line)
    blocks = []
    for label, body in sections:
        if not body:
            continue   # an empty slide, or a name with nothing under it
        blocks.append(NEWLINE.join(([f"[{label}]"] if label else []) + body))
    return (NEWLINE * 2).join(blocks)


def slugify(title: str) -> str:
    plain = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", plain.lower()).strip("-") or "song"


def data_folder(path: Path) -> Path:
    for candidate in (path, path / "Data", path / "Databases" / "Data", path / "v6.1" / "Databases" / "Data"):
        if (candidate / "Songs.db").exists() or list(candidate.glob("Songs-*.db")):
            return candidate
    sys.exit(f"No EasyWorship songs found in {path}")


def readable(path: Path) -> bool:
    try:
        with open(path, "rb") as handle:
            return handle.read(15) == b"SQLite format 3"
    except OSError:
        return False


def candidate_pairs(data: Path) -> list[tuple[str, Path, Path]]:
    """Every songs file with the words file written with it, newest first."""
    pairs = []
    main = (data / "Songs.db", data / "SongWords.db")
    if all(p.exists() for p in main):
        pairs.append(("the main files", *main))
    for songs in data.glob("Songs-*.db"):
        words = data / songs.name.replace("Songs-", "SongWords-", 1)
        if words.exists():
            pairs.append((songs.name, songs, words))
    pairs.sort(key=lambda p: max(p[1].stat().st_mtime, p[2].stat().st_mtime), reverse=True)
    return pairs


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    data = data_folder(Path(sys.argv[1]))
    target_folder = Path(sys.argv[2])

    chosen = None
    for name, songs, words in candidate_pairs(data):
        if readable(songs) and readable(words):
            chosen = (name, songs, words)
            break
    if chosen is None:
        sys.exit("No songs file can be read: close EasyWorship, then run this again.")
    name, songs_path, words_path = chosen
    stamp = datetime.fromtimestamp(songs_path.stat().st_mtime).strftime("%Y-%m-%d %H:%M")

    # Work on a copy: the database lives in a synced folder and EasyWorship may open it.
    with tempfile.TemporaryDirectory() as temp:
        songs_copy, words_copy = Path(temp, "Songs.db"), Path(temp, "SongWords.db")
        shutil.copyfile(songs_path, songs_copy)
        shutil.copyfile(words_path, words_copy)
        songs_db = sqlite3.connect(f"file:{songs_copy.as_posix()}?mode=ro", uri=True)
        words_db = sqlite3.connect(f"file:{words_copy.as_posix()}?mode=ro", uri=True)
        rows = songs_db.execute("select rowid, title from song order by title collate nocase").fetchall()
        words = dict(words_db.execute("select song_id, words from word"))
        songs_db.close()
        words_db.close()

    library: dict[str, dict[str, str]] = {}
    without_words = empty = 0
    for rowid, title in rows:
        title = re.sub(r"\s+", " ", title or "").strip()
        rtf = words.get(rowid)
        if rtf is None:
            without_words += 1
            continue
        lyrics = to_lyrics(rtf if isinstance(rtf, str) else rtf.decode("cp1252", errors="replace"))
        if not title or not lyrics:
            empty += 1
            continue
        slug = base = slugify(title)
        count = 2
        while slug in library:
            slug, count = f"{base}-{count}", count + 1
        library[slug] = {"title": title, "lyrics": lyrics}

    target_folder.mkdir(parents=True, exist_ok=True)
    target = target_folder / "easyworship.json"
    target.write_text(json.dumps(library, ensure_ascii=False, indent=1), encoding="utf-8")
    labelled = sum(1 for song in library.values() if song["lyrics"].lstrip().startswith("["))
    print(f"Read {name} (written {stamp}).")
    print(f"{len(library)} songs ({labelled} with named sections), "
          f"{without_words} without words and {empty} empty left out -> {target}")


if __name__ == "__main__":
    if os.name == "nt":
        sys.stdout.reconfigure(encoding="utf-8")
    main()
