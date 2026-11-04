<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { images } from "$lib/stores/images";
  import {
    currentImage,
    resumeImage,
    selectImage,
    toggleBlackout,
  } from "$lib/stores/projection";
  import { showTheme } from "$lib/stores/theme";
  import { stepImagePath } from "$lib/keyboard-nav";

  function step(delta: number) {
    const from = get(resumeImage) ?? get(currentImage);
    const nextPath = stepImagePath(get(images), from, delta);
    if (nextPath) selectImage(nextPath);
  }

  function onKeydown(event: KeyboardEvent) {
    if (
      event.target instanceof HTMLInputElement ||
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

  onMount(() => {
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  });
</script>
