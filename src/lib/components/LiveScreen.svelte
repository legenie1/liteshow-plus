<script lang="ts">
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
</script>

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

<style>
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
