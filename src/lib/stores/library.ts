import { writable } from "svelte/store";
import { librarySongs } from "$lib/library";
import type { Song } from "$lib/songs";

// Every JSON file dropped in src/assets/songs/ is a library: `{ slug: [lines] }`.
// With no file there, the glob is simply empty and the tab works as before.
const files = import.meta.glob("../../assets/songs/*.json", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** Songs from the library files, loaded the first time the Lyrics tab opens. */
export const librarySongList = writable<Song[]>([]);
/** True when a library file could not be read. */
export const libraryFailed = writable(false);

let loading: Promise<void> | null = null;

async function loadFile(url: string): Promise<Song[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Library answered ${response.status}`);
  return librarySongs(await response.json());
}

export function loadLibrary(): Promise<void> {
  loading ??= Promise.allSettled(Object.values(files).map(loadFile)).then(
    (results) => {
      const songs: Song[] = [];
      let failed = false;
      for (const result of results) {
        if (result.status === "fulfilled") songs.push(...result.value);
        else failed = true;
      }
      librarySongList.set(songs);
      libraryFailed.set(failed);
    },
  );
  return loading;
}
