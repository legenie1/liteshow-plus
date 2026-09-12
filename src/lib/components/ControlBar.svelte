<script lang="ts">
  import { onMount } from "svelte";
  import { open } from "@tauri-apps/plugin-dialog";
  import { invoke } from "@tauri-apps/api/core";
  import { folderPath, images } from "$lib/stores/images";
  import {
    monitors,
    selectedMonitorId,
    loadMonitors,
    selectMonitor,
    getRememberedMonitorId,
  } from "$lib/stores/monitors";
  import { isBlackout, toggleBlackout } from "$lib/stores/projection";
  import type { ImageFile } from "$lib/types";

  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      const found = await loadMonitors();
      const remembered = getRememberedMonitorId();
      if (remembered && found.some((m) => m.id === remembered)) {
        await selectMonitor(remembered);
      }
    } catch (err) {
      error = String(err);
    }
  });

  async function chooseFolder() {
    error = null;

    const selected = await open({ directory: true });
    if (!selected || Array.isArray(selected)) {
      return;
    }

    try {
      const found = await invoke<ImageFile[]>("list_images", {
        folder: selected,
      });
      folderPath.set(selected);
      images.set(found);
    } catch (err) {
      error = String(err);
    }
  }

  async function onMonitorChange(event: Event) {
    const id = (event.target as HTMLSelectElement).value;
    if (!id) return;
    try {
      await selectMonitor(id);
    } catch (err) {
      error = String(err);
    }
  }
</script>

<div class="control-bar">
  <button onclick={chooseFolder}>Choisir un dossier</button>

  <select value={$selectedMonitorId ?? ""} onchange={onMonitorChange}>
    <option value="" disabled>Écran de projection…</option>
    {#each $monitors as monitor (monitor.id)}
      <option value={monitor.id}>
        {monitor.name}{monitor.isPrimary ? " (principal)" : ""} — {monitor.width}×{monitor.height}
      </option>
    {/each}
  </select>

  <button
    class="blackout-toggle"
    class:active={$isBlackout}
    onclick={toggleBlackout}
  >
    Écran noir
  </button>

  {#if $folderPath}
    <span class="folder-path">{$folderPath}</span>
  {/if}
  {#if error}
    <span class="error">{error}</span>
  {/if}
</div>

<style>
  .control-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    flex-wrap: wrap;
  }

  .blackout-toggle.active {
    background-color: #ff6b6b;
    color: #1e1e1e;
  }

  .folder-path {
    opacity: 0.7;
    font-size: 0.85rem;
  }

  .error {
    color: #ff6b6b;
    font-size: 0.85rem;
  }
</style>
