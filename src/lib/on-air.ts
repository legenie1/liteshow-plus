/** What the projection screen is doing. */
export type OnAir = "live" | "blackout" | "empty" | "noscreen";

export interface Output {
  /** A projection screen is chosen, so the projection window exists. */
  hasScreen: boolean;
  blackout: boolean;
  hasContent: boolean;
}

/**
 * Whether the audience sees something right now: green only when a screen is
 * chosen, something is selected and the blackout is off. Anything else is red,
 * and says why.
 */
export function onAir({ hasScreen, blackout, hasContent }: Output): OnAir {
  if (!hasScreen) return "noscreen";
  if (blackout) return "blackout";
  return hasContent ? "live" : "empty";
}
