import type { BackgroundId } from "$lib/settings";
import green from "../assets/background.jpg";
import chalkboard from "../assets/scripture_bg.png";
import lyrics from "../assets/lyrics_bg.jpg";

interface Background {
  /** `null` = plain black. */
  url: string | null;
  /** Darkening laid over the picture so white text stays readable. */
  veil: string;
}

export const BACKGROUND_INFO: Record<BackgroundId, Background> = {
  // The bright rays need a light veil.
  green: { url: green, veil: "rgba(0, 12, 6, 0.32)" },
  // Already dark. Its logo sits in the top-right corner.
  chalkboard: { url: chalkboard, veil: "transparent" },
  // Deep red, with the church icons in the two bottom corners: no veil needed.
  lyrics: { url: lyrics, veil: "transparent" },
  black: { url: null, veil: "transparent" },
};
