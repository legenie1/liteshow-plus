/** What the projection window reports about the video it is playing. */
export interface VideoProgress {
  name: string;
  time: number;
  duration: number;
  paused: boolean;
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
