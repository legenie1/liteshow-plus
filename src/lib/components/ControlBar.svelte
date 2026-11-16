<script lang="ts">
  import { onMount } from "svelte";
  import { open } from "@tauri-apps/plugin-dialog";
  import { invoke } from "@tauri-apps/api/core";
  import { folderPath, images } from "$lib/stores/images";
  import { activeTab, videoFolderPath, videos } from "$lib/stores/videos";
  import {
    monitors,
    selectedMonitorId,
    loadMonitors,
    selectMonitor,
    getRememberedMonitorId,
  } from "$lib/stores/monitors";
  import {
    currentImage,
    isBlackout,
    resumeImage,
    toggleBlackout,
  } from "$lib/stores/projection";
  import { loadTheme, showTheme, themeImage } from "$lib/stores/theme";
  import {
    language,
    languages,
    setLanguage,
    t,
    type Language,
  } from "$lib/i18n";
  import type { ImageFile, MonitorInfo, VideoFile } from "$lib/types";

  let error = $state<string | null>(null);

  const onVideos = $derived($activeTab === "videos");
  const onPrayer = $derived($activeTab === "prayer");
  const onBible = $derived($activeTab === "bible");
  const onDictionary = $derived($activeTab === "dictionary");
  const onLyrics = $derived($activeTab === "lyrics");
  const hasFolder = $derived(
    !onPrayer && !onBible && !onDictionary && !onLyrics,
  );
  const shownFolder = $derived(onVideos ? $videoFolderPath : $folderPath);
  const shownCount = $derived(
    onVideos
      ? $t($videos.length === 1 ? "videosOne" : "videosMany", {
          n: $videos.length,
        })
      : $t($images.length === 1 ? "imagesOne" : "imagesMany", {
          n: $images.length,
        }),
  );

  const themeOnScreen = $derived(
    $themeImage !== null && $currentImage === $themeImage && !$isBlackout,
  );

  onMount(async () => {
    try {
      const found = await loadMonitors();
      const remembered = getRememberedMonitorId();
      const initial =
        found.find((m) => m.id === remembered) ??
        found.find((m) => !m.isPrimary);
      if (initial) {
        await selectMonitor(initial.id);
      }
    } catch (err) {
      error = String(err);
    }
  });

  function folderName(path: string): string {
    return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
  }

  function monitorLabel(monitor: MonitorInfo): string {
    const name = monitor.name.replace(/^\\\\\.\\DISPLAY/, `${$t("display")} `);
    const primary = monitor.isPrimary ? ` (${$t("primary")})` : "";
    return `${name}${primary} · ${monitor.width}×${monitor.height}`;
  }

  async function chooseFolder() {
    error = null;

    const selected = await open({ directory: true });
    if (!selected || Array.isArray(selected)) {
      return;
    }

    try {
      if (onVideos) {
        const found = await invoke<VideoFile[]>("list_videos", {
          folder: selected,
        });
        videoFolderPath.set(selected);
        videos.set(found);
      } else {
        const found = await invoke<ImageFile[]>("list_images", {
          folder: selected,
        });
        folderPath.set(selected);
        images.set(found);
        loadTheme(selected, found);
      }
    } catch (err) {
      error = String(err);
    }
  }

  function onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    setLanguage(select.value as Language);
    select.blur();
  }

  async function onMonitorChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const id = select.value;
    // A focused select would turn the next arrow key into a screen change.
    select.blur();
    if (!id) return;
    try {
      await selectMonitor(id);
    } catch (err) {
      error = String(err);
    }
  }
</script>

<header class="control-bar">
  <div class="tabs" role="tablist">
    <button
      role="tab"
      aria-selected={hasFolder && !onVideos}
      class:active={hasFolder && !onVideos}
      onclick={() => activeTab.set("slides")}>{$t("tabSlides")}</button
    >
    <button
      role="tab"
      aria-selected={onVideos}
      class:active={onVideos}
      onclick={() => activeTab.set("videos")}>{$t("tabVideos")}</button
    >
    <button
      role="tab"
      aria-selected={onPrayer}
      class:active={onPrayer}
      onclick={() => activeTab.set("prayer")}>{$t("tabPrayer")}</button
    >
    <button
      role="tab"
      aria-selected={onBible}
      class:active={onBible}
      onclick={() => activeTab.set("bible")}>{$t("tabBible")}</button
    >
    <button
      role="tab"
      aria-selected={onDictionary}
      class:active={onDictionary}
      onclick={() => activeTab.set("dictionary")}>{$t("tabDictionary")}</button
    >
    <button
      role="tab"
      aria-selected={onLyrics}
      class:active={onLyrics}
      onclick={() => activeTab.set("lyrics")}>{$t("tabLyrics")}</button
    >
  </div>

  {#if hasFolder}
    <button onclick={chooseFolder}>{$t("chooseFolder")}</button>
  {/if}

  {#if shownFolder && hasFolder}
    <span class="folder" title={shownFolder}>
      {folderName(shownFolder)}
      <span class="count">· {shownCount}</span>
    </span>
  {/if}
  {#if error}
    <span class="error">{error}</span>
  {/if}

  <span class="spacer"></span>

  <select
    aria-label={$t("language")}
    value={$language}
    onchange={onLanguageChange}
  >
    {#each languages as code (code)}
      <option value={code}>{code.toUpperCase()}</option>
    {/each}
  </select>

  <select
    aria-label={$t("projectionDisplay")}
    value={$selectedMonitorId ?? ""}
    onchange={onMonitorChange}
  >
    <option value="" disabled>{$t("projectionDisplayPlaceholder")}</option>
    {#each $monitors as monitor (monitor.id)}
      <option value={monitor.id}>{monitorLabel(monitor)}</option>
    {/each}
  </select>

  <button
    class="theme-button"
    class:active={themeOnScreen}
    disabled={!$themeImage}
    title={$themeImage ? $t("themeShow") : $t("themeHint")}
    onclick={showTheme}
  >
    ★ {themeOnScreen && $resumeImage ? $t("themeBack") : $t("theme")}
    <kbd>T</kbd>
  </button>

  <button
    class="blackout-toggle"
    class:active={$isBlackout}
    onclick={toggleBlackout}
  >
    {$t("blackout")} <kbd>B</kbd>
  </button>
</header>

<style>
  .control-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 1rem;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--line);
    font-size: 0.875rem;
  }

  button,
  select {
    height: 2rem;
    padding: 0 0.75rem;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
    cursor: pointer;
  }

  button:hover,
  select:hover {
    border-color: var(--muted);
  }

  kbd {
    margin-left: 0.25rem;
    color: var(--muted);
    font: inherit;
    font-size: 0.75rem;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:disabled:hover {
    border-color: var(--line);
  }

  .tabs {
    display: flex;
  }

  .tabs button {
    border-radius: 0;
  }

  .tabs button:first-child {
    border-radius: 6px 0 0 6px;
  }

  .tabs button:not(:first-child) {
    margin-left: -1px;
  }

  .tabs button:last-child {
    border-radius: 0 6px 6px 0;
  }

  .tabs button.active {
    position: relative;
    border-color: var(--accent);
    color: var(--accent);
  }

  .theme-button.active {
    border-color: var(--theme);
    color: var(--theme);
  }

  .blackout-toggle.active {
    border-color: var(--danger);
    background: var(--danger);
    color: #fff;
  }

  .blackout-toggle.active kbd {
    color: inherit;
  }

  .folder {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    color: var(--muted);
  }

  .spacer {
    flex: 1;
  }

  .error {
    color: var(--danger);
  }
</style>
