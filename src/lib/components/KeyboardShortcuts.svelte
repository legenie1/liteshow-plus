<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { images } from "$lib/stores/images";
  import { activeTab, videos } from "$lib/stores/videos";
  import {
    currentImage,
    currentVideo,
    resumeImage,
    selectImage,
    selectVideo,
    toggleBlackout,
    toggleVideoLoop,
    toggleVideoMute,
    toggleVideoPlayback,
  } from "$lib/stores/projection";
  import { showTheme } from "$lib/stores/theme";
  import { stepImagePath, stepVideoName } from "$lib/keyboard-nav";

  function step(delta: number) {
    if (get(activeTab) === "prayer" || get(activeTab) === "bible") return;
    if (get(activeTab) === "videos") {
      const nextName = stepVideoName(get(videos), get(currentVideo), delta);
      if (nextName) selectVideo(nextName);
      return;
    }
    const from = get(resumeImage) ?? get(currentImage);
    const nextPath = stepImagePath(get(images), from, delta);
    if (nextPath) selectImage(nextPath);
  }

  function onKeydown(event: KeyboardEvent) {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    switch (event.key) {
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
