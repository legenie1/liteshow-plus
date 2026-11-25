/** What the projection window reports about the video it is playing. */
export interface VideoProgress {
  name: string;
  time: number;
  duration: number;
  paused: boolean;
}

/** A part of the video that plays again and again, in seconds. */
export interface VideoSection {
  start: number;
  end: number;
}

/** Shortest loop worth having: below this the video would only stutter. */
export const MIN_SECTION = 0.5;

/** The loop starts at `time`; its end stays where it was, else the video's end. */
export function markStart(
  section: VideoSection | null,
  time: number,
  duration: number,
): VideoSection | null {
  if (!(duration > time + MIN_SECTION)) return section;
  const end =
    section && section.end > time + MIN_SECTION ? section.end : duration;
  return { start: time, end };
}

/** The loop ends at `time`; its start stays where it was, else the video's start. */
export function markEnd(
  section: VideoSection | null,
  time: number,
): VideoSection | null {
  const start = section?.start ?? 0;
  if (time < start + MIN_SECTION) return section;
  return { start, end: time };
}

/** 83.4 -> "1:23", 3725 -> "1:02:05". Unknown values read as 0:00. */
export function formatTime(seconds: number): string {
  const total =
    Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** Target of a relative jump, kept inside the video. */
export function jumpTarget(
  time: number,
  delta: number,
  duration: number,
): number {
  const end = Number.isFinite(duration) && duration > 0 ? duration : Infinity;
  return Math.min(Math.max(time + delta, 0), end);
}

/** True when the local preview has drifted too far from the projected video. */
export function needsResync(local: number, remote: number, playing: boolean) {
  return Math.abs(local - remote) > (playing ? 0.8 : 0.1);
}
