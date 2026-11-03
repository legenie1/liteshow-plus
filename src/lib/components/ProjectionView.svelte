<script lang="ts">
  import { untrack } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import type { ProjectionState } from "$lib/types";

  let imagePath = $state<string | null>(null);
  let blackout = $state(false);
  let imageUrl = $state<string | null>(null);
  let error = $state<string | null>(null);

  function applyState(state: ProjectionState) {
    blackout = state.blackout;
    imagePath = state.image;
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

<main class="projection">
  {#if error}
    <p class="error">{error}</p>
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

  .projection img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .error {
    color: #ff6b6b;
    font-family: monospace;
    padding: 1rem;
    text-align: center;
  }
</style>
