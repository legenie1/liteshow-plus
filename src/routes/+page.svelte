<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import ControlBar from "$lib/components/ControlBar.svelte";
  import ThumbnailList from "$lib/components/ThumbnailList.svelte";
  import ProjectionView from "$lib/components/ProjectionView.svelte";
  import KeyboardShortcuts from "$lib/components/KeyboardShortcuts.svelte";

  const isProjectionWindow = getCurrentWindow().label === "projection";
</script>

{#if isProjectionWindow}
  <ProjectionView />
{:else}
  <main class="control">
    <ControlBar />
    <ThumbnailList />
  </main>
  <KeyboardShortcuts />
{/if}

<style>
  :global(:root) {
    font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
    color: #f6f6f6;
    background-color: #1e1e1e;
  }

  .control {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
</style>
