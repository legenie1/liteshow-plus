<script lang="ts">
  import { selectedMonitorId } from "$lib/stores/monitors";
  import {
    currentImage,
    currentPrayer,
    currentVideo,
    heldOutput,
    isBlackout,
    toggleOutput,
  } from "$lib/stores/projection";
  import { onAir } from "$lib/on-air";
  import { t } from "$lib/i18n";

  // The on-air light: a round indicator that is green while the audience sees
  // something and red when they don't, and a switch: a click takes what is on the
  // screen off (red), the next click shows it again (green). With nothing selected
  // and nothing held there is nothing to switch.
  const hasContent = $derived(
    Boolean($currentImage || $currentVideo || $currentPrayer),
  );
  const canSwitch = $derived(hasContent || $heldOutput !== null);
  const air = $derived(
    onAir({
      hasScreen: $selectedMonitorId !== null,
      blackout: $isBlackout,
      hasContent,
    }),
  );
  const hint = $derived($t(hasContent ? "liveClear" : "liveRestore"));
  const text = $derived(
    {
      live: $t("live"),
      blackout: $t("blackout"),
      empty: $t("liveNone"),
      noscreen: $t("projectionDisplayPlaceholder"),
    }[air],
  );
</script>

<button
  class="light"
  class:live={air === "live"}
  disabled={!canSwitch}
  aria-label={canSwitch ? `${text}. ${hint}` : text}
  title={canSwitch ? `${text} · ${hint}` : text}
  onclick={toggleOutput}
>
  <span class="dot"></span>
</button>

<style>
  .light {
    --c: var(--danger);
    display: grid;
    flex: none;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
    border-radius: 50%;
    background: color-mix(in srgb, var(--c) 14%, var(--surface));
    color: inherit;
    font: inherit;
    padding: 0;
    cursor: pointer;
  }

  .light:hover:not(:disabled) {
    border-color: var(--c);
  }

  /* Nothing to switch: it stays plainly visible, only the pointer says so. */
  .light:disabled {
    opacity: 1;
    cursor: default;
  }

  .light.live {
    --c: #2fbf71;
  }

  .dot {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: var(--c);
  }

  /* A soft glow while on air, so it reads at a glance from across the room. */
  .live .dot {
    box-shadow: 0 0 0.6rem var(--c);
  }
</style>
