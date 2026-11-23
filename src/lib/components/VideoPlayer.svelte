<script lang="ts">
  import { convertFileSrc } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import {
    currentVideo,
    seekVideo,
    toggleVideoPlayback,
    videoProgress,
  } from "$lib/stores/projection";
  import { formatTime, needsResync, type VideoProgress } from "$lib/video";
  import { t } from "$lib/i18n";

  let preview = $state<HTMLVideoElement>();
  let scrubbing = $state(false);
  let scrubTime = $state(0);

  // Progress of another video (the previous one, still in flight) is ignored.
  const progress = $derived(
    $videoProgress && $videoProgress.name === $currentVideo
      ? $videoProgress
      : null,
  );
  const duration = $derived(progress?.duration ?? 0);
  const shownTime = $derived(scrubbing ? scrubTime : (progress?.time ?? 0));
  const paused = $derived(progress?.paused ?? true);

  $effect(() => {
    const unlisten = listen<VideoProgress>("video-progress", (event) => {
      videoProgress.set(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  });

  // The preview is a muted copy that follows the projected video: same position,
  // same play/pause. It is never the source of truth.
  $effect(() => {
    if (!preview || !progress) return;
    const { time, paused } = progress;
    if (needsResync(preview.currentTime, time, !paused)) {
      preview.currentTime = time;
    }
    if (paused) preview.pause();
    else void preview.play().catch(() => {});
  });

  function startScrub(event: Event) {
    scrubbing = true;
    scrubTime = Number((event.currentTarget as HTMLInputElement).value);
  }

  function moveScrub(event: Event) {
    scrubTime = Number((event.currentTarget as HTMLInputElement).value);
    void seekVideo(scrubTime);
  }

  function endScrub() {
    scrubbing = false;
  }
</script>

<section class="player" aria-label={$t("videoPlayer")}>
  <div class="preview">
    {#if $currentVideo}
      {#key $currentVideo}
        <video
          bind:this={preview}
          src={convertFileSrc($currentVideo, "lsvideo")}
          muted
          preload="auto"
          tabindex="-1"
        ></video>
      {/key}
    {:else}
      <span class="hint">{$t("videoPreviewEmpty")}</span>
    {/if}
  </div>

  <div class="controls">
    <span class="name" title={$currentVideo ?? ""}>{$currentVideo ?? ""}</span>
    <div class="transport">
      <button
        class="play"
        disabled={!$currentVideo}
        title="{paused ? $t('videoPlay') : $t('videoPause')} (Space)"
        aria-label={paused ? $t("videoPlay") : $t("videoPause")}
        onclick={(event) => {
          void toggleVideoPlayback();
          // Space is the shortcut: a focused button would also react to it.
          event.currentTarget.blur();
        }}>{paused ? "▶" : "⏸"}</button
      >
      <span class="time">{formatTime(shownTime)}</span>
      <input
        class="bar"
        type="range"
        min="0"
        max={duration || 1}
        step="0.1"
        value={shownTime}
        disabled={!$currentVideo || duration === 0}
        aria-label={$t("videoProgress")}
        onpointerdown={startScrub}
        oninput={moveScrub}
        onpointerup={endScrub}
        onpointercancel={endScrub}
        onblur={endScrub}
      />
      <span class="time">{formatTime(duration)}</span>
    </div>
  </div>
</section>

<style>
  .player {
    flex: none;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-sizing: border-box;
    height: 8.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--line);
  }

  .preview {
    flex: none;
    display: grid;
    place-items: center;
    height: 100%;
    aspect-ratio: 16 / 9;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: #000;
    overflow: hidden;
  }

  .preview video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .hint {
    padding: 0 0.5rem;
    color: var(--muted);
    font-size: 0.75rem;
    text-align: center;
  }

  .controls {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9rem;
    /* Keeps the row's height when no video is chosen. */
    min-height: 1.2em;
  }

  .transport {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .play {
    flex: none;
    width: 2.25rem;
    height: 2.25rem;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--surface);
    color: var(--text);
    font-size: 0.9rem;
    cursor: pointer;
  }

  .play:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  .play:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .time {
    flex: none;
    min-width: 3.2rem;
    color: var(--muted);
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .bar {
    flex: 1;
    min-width: 0;
    accent-color: var(--accent);
  }
</style>
