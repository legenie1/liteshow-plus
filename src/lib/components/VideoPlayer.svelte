<script lang="ts">
  import { convertFileSrc } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import {
    clearSection,
    currentVideo,
    markSectionEnd,
    markSectionStart,
    seekVideo,
    toggleVideoPlayback,
    videoProgress,
    videoSection,
  } from "$lib/stores/projection";
  import { activeTab } from "$lib/stores/videos";
  import { formatTime, needsResync, type VideoProgress } from "$lib/video";
  import { t } from "$lib/i18n";

  // What the projector is playing: a muted copy that follows it (same position,
  // same play/pause), with the play button and the bar that drive the projector.
  let mirror = $state<HTMLVideoElement>();
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
  // The loop belongs to the projected video: hidden once another one is projected.
  const section = $derived($currentVideo ? $videoSection : null);
  const markLeft = $derived(
    section && duration > 0 ? (section.start / duration) * 100 : 0,
  );
  const markWidth = $derived(
    section && duration > 0
      ? ((section.end - section.start) / duration) * 100
      : 0,
  );

  $effect(() => {
    const unlisten = listen<VideoProgress>("video-progress", (event) => {
      videoProgress.set(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  });

  // The mirror is never the source of truth.
  $effect(() => {
    if (!mirror || !progress) return;
    // Hidden tab: no need to decode a copy nobody sees.
    if ($activeTab !== "videos") {
      mirror.pause();
      return;
    }
    const { time, paused } = progress;
    if (needsResync(mirror.currentTime, time, !paused)) {
      mirror.currentTime = time;
    }
    if (paused) mirror.pause();
    else void mirror.play().catch(() => {});
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

<section class="pane" aria-label={$t("videoPlayer")}>
  <div class="head">
    <span class="label">{$t("live")}</span>
  </div>

  <div class="screen">
    {#if $currentVideo}
      {#key $currentVideo}
        <video
          bind:this={mirror}
          src="{convertFileSrc($currentVideo, 'lsvideo')}#t=0.1"
          muted
          preload="auto"
          tabindex="-1"
        ></video>
      {/key}
    {:else}
      <span class="hint">{$t("videoPreviewEmpty")}</span>
    {/if}
  </div>

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
    <div class="barbox">
      {#if section}
        <span
          class="mark"
          style:left="{markLeft}%"
          style:width="{markWidth}%"
          aria-hidden="true"
        ></span>
      {/if}
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
    </div>
    <span class="time">{formatTime(duration)}</span>
  </div>

  <div class="loop">
    <button
      disabled={!progress}
      title="{$t('videoSectionStart')} (I)"
      onclick={(event) => {
        void markSectionStart();
        event.currentTarget.blur();
      }}>{$t("videoSectionStart")}</button
    >
    <button
      disabled={!progress}
      title="{$t('videoSectionEnd')} (O)"
      onclick={(event) => {
        void markSectionEnd();
        event.currentTarget.blur();
      }}>{$t("videoSectionEnd")}</button
    >
    <span class="range">
      {#if section}
        {formatTime(section.start)} – {formatTime(section.end)}
      {:else}
        {$t("videoSectionNone")}
      {/if}
    </span>
    <button
      disabled={!section}
      title="{$t('videoSectionClear')} (X)"
      onclick={(event) => {
        void clearSection();
        event.currentTarget.blur();
      }}>{$t("videoSectionClear")}</button
    >
  </div>

  <div class="name" title={$currentVideo ?? ""}>{$currentVideo ?? ""}</div>
</section>

<style>
  .pane {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .head {
    display: flex;
    align-items: center;
    height: 1.4rem;
  }

  .label {
    color: var(--muted);
    font-size: 0.8rem;
  }

  .screen {
    display: grid;
    place-items: center;
    aspect-ratio: 16 / 9;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: #000;
    overflow: hidden;
  }

  .screen video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .hint {
    padding: 0 1rem;
    color: var(--muted);
    font-size: 0.8rem;
    text-align: center;
  }

  .transport {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .play {
    flex: none;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--surface);
    color: var(--text);
    font-size: 0.8rem;
    cursor: pointer;
  }

  .play:hover:not(:disabled) {
    border-color: var(--accent-line);
    color: var(--accent);
  }

  .play:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .time {
    flex: none;
    min-width: 2.8rem;
    color: var(--muted);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .barbox {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
  }

  .bar {
    flex: 1;
    min-width: 0;
    accent-color: var(--accent-muted);
  }

  /* The looping part, drawn under the bar. */
  .mark {
    position: absolute;
    bottom: 0;
    height: 3px;
    border-radius: 2px;
    background: var(--accent-strong);
    pointer-events: none;
  }

  .loop {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 1.8rem;
  }

  .loop button {
    flex: none;
    padding: 0.2rem 0.55rem;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .loop button:hover:not(:disabled) {
    border-color: var(--accent-line);
    color: var(--accent);
  }

  .loop button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .range {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: var(--muted);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .name {
    overflow: hidden;
    min-height: 1.2em;
    font-size: 0.85rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
