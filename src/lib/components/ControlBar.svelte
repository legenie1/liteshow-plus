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
  import type { ImageFile, MonitorInfo } from "$lib/types";

  let error = $state<string | null>(null);

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
    const name = monitor.name.replace(/^\\\\\.\\DISPLAY/, "Écran ");
    const primary = monitor.isPrimary ? " (principal)" : "";
    return `${name}${primary} · ${monitor.width}×${monitor.height}`;
  }

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
  <button onclick={chooseFolder}>Choisir un dossier</button>

  {#if $folderPath}
    <span class="folder" title={$folderPath}>
      {folderName($folderPath)}
      <span class="count">· {$images.length} images</span>
    </span>
  {/if}
  {#if error}
    <span class="error">{error}</span>
  {/if}

  <span class="spacer"></span>

  <select
    aria-label="Écran de projection"
    value={$selectedMonitorId ?? ""}
    onchange={onMonitorChange}
  >
    <option value="" disabled>Écran de projection…</option>
    {#each $monitors as monitor (monitor.id)}
      <option value={monitor.id}>{monitorLabel(monitor)}</option>
    {/each}
  </select>

  <button
    class="blackout-toggle"
    class:active={$isBlackout}
    onclick={toggleBlackout}
  >
    Écran noir <kbd>B</kbd>
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
