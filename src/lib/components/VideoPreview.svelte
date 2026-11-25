<script lang="ts">
  import { convertFileSrc } from "@tauri-apps/api/core";
  import { currentVideo, selectVideo } from "$lib/stores/projection";
  import { activeTab, previewVideo } from "$lib/stores/videos";
  import { formatTime } from "$lib/video";
  import { t } from "$lib/i18n";

  // The operator's own look at a video, before it goes to the projector: muted,
  // paused on the first frame, with its own play button and bar. Nothing here
  // reaches the audience until "Project" (or a double-click on the tile).
  let el = $state<HTMLVideoElement>();
  let time = $state(0);
  let duration = $state(0);
  let paused = $state(true);
  let scrubbing = $state(false);

  const onAir = $derived(
    $previewVideo !== null && $previewVideo === $currentVideo,
  );

  // A new video starts again from the top.
  $effect(() => {
    void $previewVideo;
    time = 0;
    duration = 0;
    paused = true;
  });

  // The tab stays mounted while hidden: a video must not keep playing behind it.
  $effect(() => {
    if ($activeTab !== "videos") el?.pause();
  });

  function sync() {
    if (!el) return;
    if (!scrubbing) time = el.currentTime;
    duration = Number.isFinite(el.duration) ? el.duration : 0;
    paused = el.paused;
  }

  function toggle() {
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  }

  function scrub(event: Event) {
    time = Number((event.currentTarget as HTMLInputElement).value);
    if (el) el.currentTime = time;
  }

  function project() {
    if (!$previewVideo) return;
    el?.pause();
    void selectVideo($previewVideo);
  }
</script>

<section class="pane" aria-label={$t("prayerPreview")}>
  <div class="head">
    <span class="label">{$t("prayerPreview")}</span>
    {#if onAir}<span class="badge">{$t("videoOnAir")}</span>{/if}
  </div>

  <div class="screen">
    {#if $previewVideo}
      {#key $previewVideo}
        <video
          bind:this={el}
          src="{convertFileSrc($previewVideo, 'lsvideo')}#t=0.1"
          muted
          preload="auto"
          tabindex="-1"
          onloadedmetadata={sync}
          ontimeupdate={sync}
          onplay={sync}
          onpause={sync}
          onended={sync}
        ></video>
      {/key}
    {:else}
      <span class="hint">{$t("videoPickHint")}</span>
    {/if}
  </div>

  <div class="transport">
    <button
      class="play"
      disabled={!$previewVideo}
      aria-label={paused ? $t("videoPlay") : $t("videoPause")}
      title={paused ? $t("videoPlay") : $t("videoPause")}
      onclick={(event) => {
        toggle();
        // Space drives the projector: a focused button would also react to it.
        event.currentTarget.blur();
      }}>{paused ? "▶" : "⏸"}</button
    >
    <span class="time">{formatTime(time)}</span>
    <input
      class="bar"
      type="range"
      min="0"
      max={duration || 1}
      step="0.1"
      value={time}
      disabled={!$previewVideo || duration === 0}
      aria-label={$t("videoProgress")}
      onpointerdown={() => (scrubbing = true)}
      oninput={scrub}
      onpointerup={() => (scrubbing = false)}
      onpointercancel={() => (scrubbing = false)}
      onblur={() => (scrubbing = false)}
    />
    <span class="time">{formatTime(duration)}</span>
  </div>

  <div class="name" title={$previewVideo ?? ""}>{$previewVideo ?? ""}</div>

  <button
    class="project"
    disabled={!$previewVideo}
    onclick={(event) => {
      project();
      event.currentTarget.blur();
    }}
  >
    {$t("videoProject")}
    <kbd>Enter</kbd>
  </button>
</section>

<style>
  .pane {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* Fixed height: the badge appearing must not move what is under it. */
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 1.4rem;
  }

  .label {
    color: var(--muted);
    font-size: 0.8rem;
  }

  .badge {
    padding: 0.05rem 0.5rem;
    border: 1px solid var(--accent-line);
    border-radius: 999px;
    background: var(--accent-fill);
    color: var(--accent);
    font-size: 0.7rem;
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

  .play:disabled,
  .project:disabled {
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

  .bar {
    flex: 1;
    min-width: 0;
    accent-color: var(--accent-muted);
  }

  .name {
    overflow: hidden;
    min-height: 1.2em;
    font-size: 0.85rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .project {
    height: 2rem;
    border: 1px solid var(--accent-line);
    border-radius: 6px;
    background: var(--accent-fill);
    color: var(--accent);
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .project kbd {
    margin-left: 0.35rem;
    color: var(--muted);
    font: inherit;
    font-size: 0.75rem;
  }
</style>
