<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { images } from "$lib/stores/images";
  import { activeTab, videos } from "$lib/stores/videos";
  import {
    currentImage,
    currentVideo,
    resumeImage,
    seekVideo,
    selectImage,
    selectVideo,
    toggleBlackout,
    toggleVideoLoop,
    toggleVideoMute,
    toggleVideoPlayback,
    videoProgress,
  } from "$lib/stores/projection";
  import { showTheme } from "$lib/stores/theme";
  import { stepImagePath, stepVideoName } from "$lib/keyboard-nav";
  import { jumpTarget } from "$lib/video";
  import { shortcutsOpen } from "$lib/stores/shortcuts";
  import type { Tab } from "$lib/stores/videos";

  function step(delta: number) {
    if (["prayer", "bible", "dictionary", "lyrics"].includes(get(activeTab)))
      return;
    if (get(activeTab) === "videos") {
      const nextName = stepVideoName(get(videos), get(currentVideo), delta);
      if (nextName) selectVideo(nextName);
      return;
    }
    const from = get(resumeImage) ?? get(currentImage);
    const nextPath = stepImagePath(get(images), from, delta);
    if (nextPath) selectImage(nextPath);
  }

  const TABS: Tab[] = [
    "slides",
    "videos",
    "prayer",
    "bible",
    "dictionary",
    "lyrics",
  ];

  function seekBy(delta: number) {
    const progress = get(videoProgress);
    if (!progress || progress.name !== get(currentVideo)) return;
    void seekVideo(jumpTarget(progress.time, delta, progress.duration));
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && get(shortcutsOpen)) {
      event.preventDefault();
      shortcutsOpen.set(false);
      return;
    }

    // Ctrl+1…6 switches tab, even from a text field.
    if (event.ctrlKey && !event.altKey && /^[1-6]$/.test(event.key)) {
      event.preventDefault();
      activeTab.set(TABS[Number(event.key) - 1]);
      return;
    }

    if (event.key === "F1") {
      event.preventDefault();
      shortcutsOpen.update((open) => !open);
      return;
    }

    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.shiftKey && get(activeTab) === "videos") {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        seekBy(event.key === "ArrowLeft" ? -5 : 5);
        return;
      }
    }

    switch (event.key) {
      case "?":
        event.preventDefault();
        shortcutsOpen.update((open) => !open);
        break;
      case "0":
      case "Home":
        if (get(activeTab) !== "videos") break;
        event.preventDefault();
        void seekVideo(0);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        step(-1);
        break;
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        step(1);
        break;
      case " ":
        event.preventDefault();
        if (get(activeTab) === "videos") toggleVideoPlayback();
        break;
      case "l":
      case "L":
        event.preventDefault();
        if (get(activeTab) === "videos") toggleVideoLoop();
        break;
      case "m":
      case "M":
        event.preventDefault();
        if (get(activeTab) === "videos") toggleVideoMute();
        break;
      case "b":
      case "B":
        event.preventDefault();
        toggleBlackout();
        break;
      case "t":
      case "T":
        event.preventDefault();
        showTheme();
        break;
    }
  }

  // A button fires its click on Space release: keep that from re-selecting a video.
  function onKeyup(event: KeyboardEvent) {
    if (event.key === " ") event.preventDefault();
  }

  onMount(() => {
    window.addEventListener("keydown", onKeydown);
    window.addEventListener("keyup", onKeyup);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener("keyup", onKeyup);
    };
  });
</script>
