import { writable } from "svelte/store";
import type { Song } from "$lib/songs";

const SONGS_KEY = "liteshow.songs";

type StoredSong = Pick<Song, "id" | "title" | "lyrics">;

function isStoredSong(value: unknown): value is StoredSong {
  const song = value as Partial<StoredSong> | null;
  return (
    typeof song?.id === "string" &&
    typeof song.title === "string" &&
    typeof song.lyrics === "string"
  );
}

function readSongs(): Song[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SONGS_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isStoredSong)
      .map(({ id, title, lyrics }) => ({ id, title, lyrics, builtIn: false }));
  } catch {
    return [];
  }
}

/** The songs the operator added: kept on this computer, across restarts. */
export const userSongs = writable<Song[]>(readSongs());

userSongs.subscribe((songs) => {
  try {
    const stored: StoredSong[] = songs.map(({ id, title, lyrics }) => ({
      id,
      title,
      lyrics,
    }));
    localStorage.setItem(SONGS_KEY, JSON.stringify(stored));
  } catch {
    // Same acceptable degradation as the remembered monitor.
  }
});

// Kept across tab switches, like the prayer draft.
export const lyricsSongId = writable<string | null>(null);
export const lyricsSection = writable<number | null>(null);
