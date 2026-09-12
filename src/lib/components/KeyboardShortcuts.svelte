<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { images } from "$lib/stores/images";
  import {
    currentImage,
    selectImage,
    toggleBlackout,
  } from "$lib/stores/projection";
  import { stepImagePath } from "$lib/keyboard-nav";

  function step(delta: number) {
    const nextPath = stepImagePath(get(images), get(currentImage), delta);
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
    }
  }

  onMount(() => {
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  });
</script>
