<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import ControlBar from "$lib/components/ControlBar.svelte";
  import ThumbnailList from "$lib/components/ThumbnailList.svelte";
  import VideoList from "$lib/components/VideoList.svelte";
  import PrayerEditor from "$lib/components/PrayerEditor.svelte";
  import BibleSearch from "$lib/components/BibleSearch.svelte";
  import DictionarySearch from "$lib/components/DictionarySearch.svelte";
  import { activeTab } from "$lib/stores/videos";
  import ProjectionView from "$lib/components/ProjectionView.svelte";
  import KeyboardShortcuts from "$lib/components/KeyboardShortcuts.svelte";

  const isProjectionWindow = getCurrentWindow().label === "projection";
</script>

{#if isProjectionWindow}
  <ProjectionView />
{:else}
  <main class="control">
    <ControlBar />
    {#if $activeTab === "videos"}
      <VideoList />
    {:else if $activeTab === "prayer"}
      <PrayerEditor />
    {:else if $activeTab === "bible"}
      <BibleSearch />
    {:else if $activeTab === "dictionary"}
      <DictionarySearch />
    {:else}
      <ThumbnailList />
    {/if}
  </main>
  <KeyboardShortcuts />
{/if}

<style>
  :global(:root) {
    --text: #f2f2f2;
    --muted: #a0a0a0;
    --line: #333;
    --surface: #262626;
    --accent: #4c9aff;
    --danger: #e5484d;
    --theme: #f5b301;
    color-scheme: dark;
    font-family: "Segoe UI", Inter, Helvetica, Arial, sans-serif;
    color: var(--text);
    background-color: #171717;
  }

  :global(body) {
    margin: 0;
    overflow: hidden;
  }

  .control {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
</style>
