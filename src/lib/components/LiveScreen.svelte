<script lang="ts">
  import { fade } from "svelte/transition";
  import { fadeMs, slideKey } from "$lib/fade";
  import { slideSettings } from "$lib/stores/settings";
  import { board } from "$lib/stores/board";
  import {
    currentImage,
    currentPrayer,
    currentVideo,
    isBlackout,
  } from "$lib/stores/projection";
  import { t } from "$lib/i18n";
  import PrayerSlide from "$lib/components/PrayerSlide.svelte";

  // What the projector shows right now, drawn the way the projector draws it. A
  // picture or a video is not redrawn here: the box just says one is on screen.
  // Like the projector, it fades from one slide to the next.
  const key = $derived(
    $isBlackout
      ? "blackout"
      : $currentPrayer
        ? slideKey($currentPrayer)
        : $currentImage || $currentVideo
          ? "other"
          : "none",
  );
</script>

<div class="stack">
  {#key key}
    <div
      class="layer"
      in:fade|global={{ duration: fadeMs($slideSettings.fadeMs) }}
      out:fade|global={{ duration: fadeMs($slideSettings.fadeMs) }}
    >
      {#if $isBlackout}
        <!-- The same picture as the projector shows, with nothing on it. -->
        <div
          class="empty board"
          style:--board={$board.url ? `url(${$board.url})` : "none"}
          style:--veil={$board.veil}
        ></div>
      {:else if $currentPrayer}
        <PrayerSlide prayer={$currentPrayer} />
      {:else}
        <div class="empty">
          {$currentImage || $currentVideo ? $t("liveOther") : $t("liveNone")}
        </div>
      {/if}
    </div>
  {/key}
</div>

<style>
  /* The old layer and the new one share one cell, so they overlap while they fade. */
  .stack {
    display: grid;
  }

  .layer {
    grid-area: 1 / 1;
  }

  /* Nothing to draw on the projector: a black rectangle that says why. */
  .empty {
    display: grid;
    place-items: center;
    aspect-ratio: 16 / 9;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: #000;
    color: var(--muted);
    font-size: 0.8rem;
  }

  .board {
    background:
      linear-gradient(var(--veil), var(--veil)),
      #000 var(--board) center / cover no-repeat;
  }
</style>
