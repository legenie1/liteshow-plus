<script lang="ts">
  import { untrack } from "svelte";
  import { fade } from "svelte/transition";
  import { convertFileSrc, invoke } from "@tauri-apps/api/core";
  import { emit, listen } from "@tauri-apps/api/event";
  import { fadeMs, slideKey } from "$lib/fade";
  import { board } from "$lib/stores/board";
  import { slideSettings } from "$lib/stores/settings";
  import { t } from "$lib/i18n";
  import PrayerSlide from "$lib/components/PrayerSlide.svelte";
  import type { PrayerPoint, ProjectionState } from "$lib/types";
  import type { VideoProgress, VideoSection } from "$lib/video";

  let imagePath = $state<string | null>(null);
  let blackout = $state(false);
  let imageUrl = $state<string | null>(null);
  let videoName = $state<string | null>(null);
  let videoSerial = $state(0);
  let videoLoop = $state(false);
  let videoMuted = $state(false);
  // A part of the video that plays again and again, set from the control window.
  let section = $state<VideoSection | null>(null);
  let prayer = $state<PrayerPoint | null>(null);
  let videoEl = $state<HTMLVideoElement>();
  let error = $state<string | null>(null);
  let videoError = $state(false);

  function applyState(state: ProjectionState) {
    // Another video, or the same one started over: the loop does not carry over.
    if (state.video !== videoName || state.videoSerial !== videoSerial) {
      section = null;
    }
    blackout = state.blackout;
    imagePath = state.image;
    videoName = state.video;
    videoSerial = state.videoSerial;
    videoLoop = state.videoLoop;
    videoMuted = state.videoMuted;
    prayer = state.prayer;
    videoError = false;
  }

  $effect(() => {
    let cancelled = false;

    invoke<ProjectionState>("get_projection_state")
      .then((state) => {
        if (!cancelled) applyState(state);
      })
      .catch((err) => {
        if (!cancelled) error = String(err);
      });

    const unlisten = listen<ProjectionState>("projection-changed", (event) => {
      applyState(event.payload);
    }).catch((err) => {
      if (!cancelled) error = String(err);
      return () => {};
    });

    return () => {
      cancelled = true;
      unlisten.then((fn) => fn());
    };
  });

  $effect(() => {
    const unlisten = listen<string>("video-control", () => {
      if (!videoEl) return;
      if (videoEl.paused) void videoEl.play().catch(() => {});
      else videoEl.pause();
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  });

  $effect(() => {
    const unlisten = listen<number>("video-seek", (event) => {
      if (videoEl) videoEl.currentTime = event.payload;
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  });

  $effect(() => {
    const unlisten = listen<VideoSection | null>("video-section", (event) => {
      section = event.payload;
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  });

  function loopSection() {
    if (!videoEl || !section || videoEl.paused) return;
    if (videoEl.currentTime >= section.end) videoEl.currentTime = section.start;
  }

  // `timeupdate` only fires four times a second: checked every frame instead, so the
  // jump back lands within a frame of the end marker.
  $effect(() => {
    if (!section || !videoEl) return;
    let frame = requestAnimationFrame(function tick() {
      loopSection();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  });

  // A loop that runs to the very end of the video has no frame left to catch.
  function onEnded() {
    if (!videoEl || !section) return;
    videoEl.currentTime = section.start;
    void videoEl.play().catch(() => {});
  }

  // Tells the control window where the video is: it draws the preview and the
  // progress bar from this. `timeupdate` fires about four times a second.
  function reportProgress() {
    if (!videoEl || !videoName) return;
    const progress: VideoProgress = {
      name: videoName,
      time: videoEl.currentTime,
      duration: Number.isFinite(videoEl.duration) ? videoEl.duration : 0,
      paused: videoEl.paused,
    };
    void emit("video-progress", progress);
  }

  // The sound would keep going behind the blackout.
  $effect(() => {
    if (blackout) videoEl?.pause();
  });

  function showImage(url: string | null) {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = url;
  }

  async function loadImage(path: string): Promise<string> {
    const bytes = await invoke<ArrayBuffer>("get_full_image", { path });
    const url = URL.createObjectURL(new Blob([bytes]));
    // Decode before swapping, so the previous slide stays up until this one is ready.
    const preload = new Image();
    preload.src = url;
    await preload.decode();
    return url;
  }

  $effect(() => {
    if (!imagePath) {
      untrack(() => showImage(null));
      return;
    }
    let cancelled = false;

    loadImage(imagePath)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        error = null;
        showImage(url);
      })
      .catch((err) => {
        if (!cancelled) error = String(err);
      });

    return () => {
      cancelled = true;
    };
  });
</script>

<!-- The blackout shows the background of the section the operator is on, with
     nothing written on it. -->
<main
  class="projection"
  class:blackout
  style:--board={$board.url ? `url(${$board.url})` : "none"}
  style:--veil={$board.veil}
>
  {#if error}
    <p class="error">{error}</p>
  {:else if videoName && videoError}
    <p class="error">{$t("videoError")}</p>
  {:else if videoName}
    <!-- Re-created on every selection, so the same video starts over. -->
    {#key videoSerial}
      <video
        bind:this={videoEl}
        class:hidden={blackout}
        src={convertFileSrc(videoName, "lsvideo")}
        autoplay
        loop={videoLoop}
        muted={videoMuted}
        onerror={() => (videoError = true)}
        ontimeupdate={reportProgress}
        onplay={reportProgress}
        onpause={reportProgress}
        onended={onEnded}
        onseeked={reportProgress}
        onloadedmetadata={reportProgress}
      ></video>
    {/key}
  {:else if prayer && !blackout}
    <!-- A new slide fades in over the old one, which fades out under it. -->
    {#key slideKey(prayer)}
      <div
        class="prayer-frame"
        in:fade|global={{ duration: fadeMs($slideSettings.fadeMs) }}
        out:fade|global={{ duration: fadeMs($slideSettings.fadeMs) }}
      >
        <PrayerSlide {prayer} />
      </div>
    {/key}
  {:else if !blackout && imageUrl}
    <img src={imageUrl} alt="" />
  {/if}
</main>

<style>
  .projection {
    position: fixed;
    inset: 0;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .projection.blackout {
    background:
      linear-gradient(var(--veil), var(--veil)),
      #000 var(--board) center / cover no-repeat;
  }

  .projection img,
  .projection video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* The slide is 16:9: letterboxed on any other screen shape. */
  .prayer-frame {
    /* Centred on its own, so the slide fading out and the one fading in overlap
       instead of sitting side by side. */
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: min(100vw, calc(100vh * 16 / 9));
  }

  .projection video.hidden {
    visibility: hidden;
  }

  .error {
    color: #ff6b6b;
    font-family: monospace;
    padding: 1rem;
    text-align: center;
  }
</style>
