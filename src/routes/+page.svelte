<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import ControlBar from "$lib/components/ControlBar.svelte";
  import ThumbnailList from "$lib/components/ThumbnailList.svelte";
  import VideoList from "$lib/components/VideoList.svelte";
  import PrayerEditor from "$lib/components/PrayerEditor.svelte";
  import BibleSearch from "$lib/components/BibleSearch.svelte";
  import DictionarySearch from "$lib/components/DictionarySearch.svelte";
  import LyricsPanel from "$lib/components/LyricsPanel.svelte";
  import { activeTab, type Tab } from "$lib/stores/videos";
  import ProjectionView from "$lib/components/ProjectionView.svelte";
  import KeyboardShortcuts from "$lib/components/KeyboardShortcuts.svelte";
  import ShortcutsHelp from "$lib/components/ShortcutsHelp.svelte";
  import MediaDrop from "$lib/components/MediaDrop.svelte";

  const isProjectionWindow = getCurrentWindow().label === "projection";

  // A tab is built the first time it is opened, then only hidden: switching back
  // is instant and keeps what was typed, selected or loaded, where rebuilding the
  // whole layout on every switch made the window flash.
  let opened = $state<Partial<Record<Tab, boolean>>>({});
  $effect.pre(() => {
    if (!opened[$activeTab]) opened[$activeTab] = true;
  });
</script>

{#if isProjectionWindow}
  <ProjectionView />
{:else}
  <main class="control">
    <ControlBar />
    {#if opened.slides || $activeTab === "slides"}
      <div class="tab" hidden={$activeTab !== "slides"}><ThumbnailList /></div>
    {/if}
    {#if opened.videos}
      <div class="tab" hidden={$activeTab !== "videos"}><VideoList /></div>
    {/if}
    {#if opened.prayer}
      <div class="tab" hidden={$activeTab !== "prayer"}><PrayerEditor /></div>
    {/if}
    {#if opened.bible}
      <div class="tab" hidden={$activeTab !== "bible"}><BibleSearch /></div>
    {/if}
    {#if opened.dictionary}
      <div class="tab" hidden={$activeTab !== "dictionary"}>
        <DictionarySearch />
      </div>
    {/if}
    {#if opened.lyrics}
      <div class="tab" hidden={$activeTab !== "lyrics"}><LyricsPanel /></div>
    {/if}
  </main>
  <KeyboardShortcuts />
  <ShortcutsHelp />
  <MediaDrop />
{/if}

<style>
  :global(:root) {
    --text: #f2f2f2;
    --muted: #a0a0a0;
    --line: #333;
    --surface: #262626;
    --accent: #4c9aff;
    /* A selected control: the dark gray with a light touch of blue, no strong outline. */
    --accent-line: color-mix(in srgb, var(--accent) 16%, var(--line));
    --accent-fill: color-mix(in srgb, var(--accent) 7%, var(--surface));
    /* Same idea for the other states: keyboard focus, a selected row, what is on air. */
    --accent-focus: color-mix(in srgb, var(--accent) 40%, var(--line));
    --accent-row: color-mix(in srgb, var(--accent) 14%, transparent);
    --accent-strong: color-mix(in srgb, var(--accent) 55%, var(--line));
    /* Native checkboxes and sliders: a muted blue instead of the full accent. */
    --accent-muted: color-mix(in srgb, var(--accent) 55%, #8a8a8a);
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

  .tab {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .tab[hidden] {
    display: none;
  }

  .control {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
</style>
