<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import type { ProjectionState } from "$lib/types";

  let imagePath = $state<string | null>(null);
  let blackout = $state(false);
  let imageDataUri = $state<string | null>(null);
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

  $effect(() => {
    if (!imagePath) {
      imageDataUri = null;
      return;
    }
    const path = imagePath;
    invoke<string>("get_full_image", { path })
      .then((dataUri) => {
        if (path === imagePath) imageDataUri = dataUri;
      })
      .catch((err) => {
        if (path === imagePath) error = String(err);
      });
  });
</script>

<main class="projection">
  {#if error}
    <p class="error">{error}</p>
  {:else if !blackout && imageDataUri}
    <img src={imageDataUri} alt="" />
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
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .error {
    color: #ff6b6b;
    font-family: monospace;
    padding: 1rem;
    text-align: center;
  }
</style>
