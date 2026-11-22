<script lang="ts">
  import {
    monitors,
    selectedMonitorId,
    selectMonitor,
  } from "$lib/stores/monitors";
  import { t } from "$lib/i18n";
  import type { MonitorInfo } from "$lib/types";

  interface Props {
    /** Told when the chosen screen could not be used. */
    onerror?: (message: string) => void;
  }

  const { onerror }: Props = $props();

  // The projection screen, behind a monitor icon: the long names only show in the
  // menu, so the bar stays short. A dot on the icon says no screen is chosen yet.
  let open = $state(false);
  let root = $state<HTMLDivElement>();

  const current = $derived(
    $monitors.find((monitor) => monitor.id === $selectedMonitorId) ?? null,
  );

  function label(monitor: MonitorInfo): string {
    const name = monitor.name.replace(/^\\\\\.\\DISPLAY/, `${$t("display")} `);
    const primary = monitor.isPrimary ? ` (${$t("primary")})` : "";
    return `${name}${primary} · ${monitor.width}×${monitor.height}`;
  }

  async function choose(id: string) {
    open = false;
    try {
      await selectMonitor(id);
    } catch (err) {
      onerror?.(String(err));
    }
  }

  function onWindowPointerDown(event: PointerEvent) {
    if (open && !root?.contains(event.target as Node)) open = false;
  }

  function onWindowKeydown(event: KeyboardEvent) {
    if (open && event.key === "Escape") open = false;
  }
</script>

<svelte:window
  onpointerdown={onWindowPointerDown}
  onkeydown={onWindowKeydown}
/>

<div class="display" bind:this={root}>
  <button
    class="icon"
    class:active={open}
    class:unset={current === null}
    aria-expanded={open}
    aria-label={$t("projectionDisplay")}
    title={current ? label(current) : $t("projectionDisplayPlaceholder")}
    onclick={() => (open = !open)}
  >
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <rect
        x="3"
        y="4"
        width="18"
        height="12"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
      />
      <path
        d="M9 20h6M12 16v4"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
  </button>

  {#if open}
    <div class="menu" role="menu" aria-label={$t("projectionDisplay")}>
      {#each $monitors as monitor (monitor.id)}
        {@const chosen = monitor.id === $selectedMonitorId}
        <button
          class="item"
          class:chosen
          role="menuitemradio"
          aria-checked={chosen}
          onclick={() => choose(monitor.id)}
        >
          <span class="mark" aria-hidden="true">{chosen ? "✓" : ""}</span>
          {label(monitor)}
        </button>
      {:else}
        <span class="none">{$t("projectionDisplayPlaceholder")}</span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .display {
    position: relative;
  }

  .icon {
    position: relative;
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
  }

  .icon:hover,
  .icon.active {
    border-color: var(--muted);
    color: var(--accent);
  }

  /* No screen chosen yet: a dot, so the operator notices before projecting. */
  .icon.unset::after {
    content: "";
    position: absolute;
    top: 3px;
    right: 3px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--danger);
  }

  .menu {
    position: absolute;
    top: calc(100% + 0.4rem);
    right: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 16rem;
    max-height: calc(100vh - 5rem);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #3d3d3d transparent;
    padding: 0.25rem;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #1c1c1c;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }

  .item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 2rem;
    padding: 0 0.6rem 0 0.4rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: 0.875rem;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }

  .item:hover {
    background: var(--surface);
  }

  .item.chosen {
    color: var(--accent);
  }

  .mark {
    flex: none;
    width: 1rem;
    text-align: center;
  }

  .none {
    padding: 0.4rem 0.6rem;
    color: var(--muted);
    font-size: 0.8rem;
  }
</style>
