<script lang="ts">
  import {
    monitors,
    selectedMonitorId,
    selectMonitor,
  } from "$lib/stores/monitors";
  import { displayNumber, monitorMap } from "$lib/monitor-map";
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

  // The screens as they sit on the desk, so the right one can be told at a glance;
  // hovering a screen lights up its row and the other way round.
  const map = $derived(monitorMap($monitors));
  let hovered = $state<string | null>(null);

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
      {#if map}
        <!-- A mouse shortcut: the list below does the same for the keyboard. -->
        <div class="map-wrap" aria-hidden="true">
          <div
            class="map"
            style:aspect-ratio={map.aspect}
            style:width={`min(100%, ${(map.aspect * 6).toFixed(2)}rem)`}
          >
            {#each map.rects as rect (rect.id)}
              <button
                class="screen"
                class:chosen={rect.id === $selectedMonitorId}
                class:hover={rect.id === hovered}
                tabindex="-1"
                style:left={`${rect.left}%`}
                style:top={`${rect.top}%`}
                style:width={`${rect.width}%`}
                style:height={`${rect.height}%`}
                onclick={() => choose(rect.id)}
                onmouseenter={() => (hovered = rect.id)}
                onmouseleave={() => (hovered = null)}
              >
                <span class="face">{rect.number}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
      {#each $monitors as monitor, index (monitor.id)}
        {@const chosen = monitor.id === $selectedMonitorId}
        <button
          class="item"
          class:chosen
          class:hover={monitor.id === hovered}
          role="menuitemradio"
          aria-checked={chosen}
          onclick={() => choose(monitor.id)}
          onmouseenter={() => (hovered = monitor.id)}
          onmouseleave={() => (hovered = null)}
        >
          <span class="mark" aria-hidden="true">{chosen ? "✓" : ""}</span>
          {label(monitor)}
          <span class="number" aria-hidden="true"
            >{displayNumber(monitor.name, index)}</span
          >
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
    /* Centred under the icon. */
    left: 50%;
    transform: translateX(-50%);
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

  .item:hover,
  .item.hover {
    background: var(--surface);
  }

  .item.chosen {
    color: var(--accent);
  }

  .number {
    margin-left: auto;
    color: var(--muted);
    font-size: 0.75rem;
  }

  .map-wrap {
    display: flex;
    justify-content: center;
    padding: 0.4rem 0.4rem 0.5rem;
  }

  .map {
    position: relative;
  }

  /* One rectangle per screen, to scale; the padding leaves a gap between neighbours. */
  .screen {
    position: absolute;
    box-sizing: border-box;
    padding: 2px;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  .face {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    border: 1px solid var(--line);
    border-radius: 3px;
    background: #262626;
    color: var(--muted);
    font-size: 0.95rem;
    font-weight: 700;
  }

  .screen.hover .face {
    border-color: var(--muted);
    color: var(--text);
  }

  .screen.chosen .face {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 30%, #262626);
    color: #fff;
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
